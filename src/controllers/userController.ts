import { Response } from "express";
import UserModel from "../models/UserModel";
import ResponseUtil from "../utils/Response/responseUtils";
import { AUTH_CONSTANTS } from "../constants/messages";
import { STATUS_CODES } from "../constants/statusCodes";
import { CustomRequest } from "../interfaces/auth";
import CertificationModel from "../models/CertificationModel";
import SlotModel from "../models/SlotModel";
import ReviewModel from "../models/ReviewModel";
import BookingModel from "../models/BookingModel";
import KidModel from "../models/KidModel";
import ResourceModel from "../models/ResourceModel";
import EbookModel from "../models/EbookModel";
import mongoose from "mongoose";

export const home = async (req: CustomRequest, res: Response) => {
  try {
    const currentUser: any = await UserModel.findById(req.userId).select(
      "location"
    );
    const hasLocation =
      currentUser?.location?.coordinates &&
      currentUser.location.coordinates.length === 2;

    const userCoordinates = hasLocation
      ? currentUser.location.coordinates
      : null;
    const maxDistanceInMeters = 50000;

    const featuredPipeline: any = [
      {
        $match: {
          userType: "Therapist",
          isProfileCompleted: true,
          isSelectSlots: true,
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "therapist",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$reviews" }, 0] },
              then: { $avg: "$reviews.rating" },
              else: 0,
            },
          },
        },
      },
      { $sort: { sessionCharges: 1 } },
      { $sample: { size: 2 } },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          sessionCharges: 1,
          profilePicture: 1,
          speciality: "$speciality.text",
          about: 1,
          averageRating: { $round: ["$averageRating", 1] },
        },
      },
    ];

    const nearbyPipeline: any = hasLocation
      ? [
          {
            $geoNear: {
              near: { type: "Point", coordinates: userCoordinates },
              distanceField: "distance",
              maxDistance: maxDistanceInMeters,
              spherical: true,
              query: {
                userType: "Therapist",
                isProfileCompleted: true,
                isSelectSlots: true,
              },
            },
          },
          { $match: { _id: { $ne: currentUser._id } } },
          {
            $lookup: {
              from: "reviews",
              localField: "_id",
              foreignField: "therapist",
              as: "reviews",
            },
          },
          {
            $addFields: {
              averageRating: {
                $cond: {
                  if: { $gt: [{ $size: "$reviews" }, 0] },
                  then: { $avg: "$reviews.rating" },
                  else: 0,
                },
              },
            },
          },
          { $limit: 2 },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              distance: 1,
              profilePicture: 1,
              speciality: "$speciality.text",
              sessionCharges: 1,
              about: 1,
              averageRating: { $round: ["$averageRating", 1] },
            },
          },
        ]
      : [];

    const [featured, nearby] = await Promise.all([
      UserModel.aggregate(featuredPipeline),
      hasLocation ? UserModel.aggregate(nearbyPipeline) : [],
    ]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAccepted = await BookingModel.aggregate([
      {
        $match: {
          bookedBy: new mongoose.Types.ObjectId(req.userId),
          status: "Accepted",
          date: { $gte: today },
        },
      },
      {
        $lookup: {
          from: "slots",
          localField: "slot",
          foreignField: "_id",
          as: "slotData",
        },
      },
      { $unwind: "$slotData" },
      {
        $addFields: {
          selectedTime: {
            $first: {
              $filter: {
                input: "$slotData.times",
                as: "time",
                cond: { $eq: ["$$time._id", "$timeId"] },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "therapist",
          foreignField: "_id",
          as: "therapistUser",
        },
      },
      { $unwind: "$therapistUser" },
      { $sort: { "selectedTime.startTime": 1 } },
      { $limit: 1 },
      {
        $project: {
          therapist: 1,
          date: 1,
          status: 1,
          "selectedTime.startTime": 1,
          "selectedTime.endTime": 1,
          "therapistUser.firstName": 1,
          "therapistUser.lastName": 1,
          "therapistUser.profilePicture": 1,
        },
      },
    ]);

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { featured, nearby, todayNextAccepted: todayAccepted[0] || {} },
      AUTH_CONSTANTS.FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const updateLocation = async (req: CustomRequest, res: Response) => {
  try {
    const { coordinates, address } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Coordinates [longitude, latitude] are required"
      );
    }

    await UserModel.findByIdAndUpdate(
      req.userId,
      {
        location: {
          type: "Point",
          coordinates,
          address: address || "",
        },
      },
      { new: true }
    );
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      "Location updated successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const getTherapistDetails = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { therapistId } = req.params;
    const therapist = await UserModel.findById(therapistId).select(
      "-password -certifications -slots -devices"
    );

    if (!therapist) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        "Therapist not found"
      );
    }

    const [certifications, slots, reviewsData] = await Promise.all([
      CertificationModel.find({
        user: therapistId,
      }),
      SlotModel.find({
        therapist: therapistId,
      }),
      ReviewModel.find({ therapist: therapistId })
        .populate("user", "firstName lastName profilePicture")
        .sort({ createdAt: -1 }),
    ]);

    const totalReviews = reviewsData.length;
    const avgRating =
      totalReviews > 0
        ? reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) /
          totalReviews
        : 0;

    const therapistDetails = {
      ...therapist.toObject(),
      certifications,
      workingSlots: slots,
      reviews: {
        total: totalReviews,
        averageRating: Number(avgRating.toFixed(1)),
        listData: reviewsData,
      },
    };
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { therapistDetails },
      "Therapist Fetched successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const getAvailableSlots = async (req: CustomRequest, res: Response) => {
  try {
    const { therapistId } = req.params;
    const { date } = req.query;

    const dateString =
      (date as string) || new Date().toISOString().split("T")[0];

    const givenDate = new Date(dateString);
    const dayOfWeek = givenDate.toLocaleString("en-US", { weekday: "short" });

    const slot = await SlotModel.findOne({
      therapist: therapistId,
      day: dayOfWeek,
    }).lean();

    if (!slot) {
      return ResponseUtil.successResponse(
        res,
        STATUS_CODES.SUCCESS,
        { date, day: dayOfWeek, availableTimes: [] },
        "Available slots fetched successfully"
      );
    }

    const bookedSlots = await BookingModel.find({
      therapist: therapistId,
      date: new Date(dateString as string),
      status: { $in: ["Pending", "Accepted"] },
    }).lean();

    const bookedTimeIds = bookedSlots.map((b) => String(b.timeId));
    const availableTimes = slot.times.filter(
      (t: any) => !bookedTimeIds.includes(String(t._id))
    );

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { date, day: dayOfWeek, availableTimes },
      "Available slots fetched successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const bookSession = async (req: CustomRequest, res: Response) => {
  try {
    const { therapistId, sessionFor, serviceType, sessionDate, sessionSlot } =
      req.body;

    const therapist = await UserModel.findById(therapistId);
    if (!therapist || therapist.userType !== "Therapist") {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        "Therapist not found"
      );
    }

    const slot = await SlotModel.findOne({
      therapist: therapistId,
      "times._id": sessionSlot,
    });
    if (!slot || String(slot.therapist) !== String(therapistId)) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Invalid slot selected"
      );
    }
    const selectedTime = slot.times.find(
      (t) => String(t._id) === String(sessionSlot)
    );
    if (!selectedTime) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Slot time not found"
      );
    }

    const parentSlot = await SlotModel.findOne({
      therapist: therapistId,
      "times._id": sessionSlot,
    });

    if (!parentSlot) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Invalid slot"
      );
    }

    const existingBooking = await BookingModel.findOne({
      therapist: therapistId,
      slot: parentSlot._id,
      timeId: sessionSlot,
      date: new Date(sessionDate),
      status: { $in: ["Pending", "Accepted"] },
    });
    if (existingBooking) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        `This slot is already booked. Try another slot.`
      );
    }

    const booking = await BookingModel.create({
      therapist: therapistId,
      slot: parentSlot._id,
      timeId: sessionSlot,
      date: new Date(sessionDate),
      bookedBy: req.userId,
      serviceType,
      forKid: sessionFor || null,
      status: "Pending",
    });
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { booking },
      "Booked Successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const myBookings = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;

    const bookings = await BookingModel.find({ bookedBy: userId })
      .populate("therapist", "firstName lastName profilePicture about")
      .populate("slot", "day times")
      .sort({ date: -1 });

    const now = new Date();

    const formattedBookings: any = bookings.map((b: any) => {
      const selectedTime = b.slot?.times?.find(
        (t: any) => String(t._id) === String(b.timeId)
      );

      return {
        _id: b._id,
        therapist: b.therapist
          ? {
              id: b.therapist._id,
              name: `${b.therapist.firstName} ${b.therapist.lastName}`,
              profilePicture: b.therapist.profilePicture,
              about: b.therapist.about,
            }
          : null,
        serviceType: b.serviceType,
        date: b.date,
        day: b.slot?.day || "",
        startTime: selectedTime?.startTime || "",
        endTime: selectedTime?.endTime || "",
        status: b.status,
        isPaid: b.isPaid,
      };
    });

    const upcoming = formattedBookings.filter(
      (b: any) => new Date(b.date) >= now && b.status === "Accepted"
    );

    const completed = formattedBookings.filter(
      (b: any) => b.status === "Completed"
    );

    const pending = formattedBookings.filter(
      (b: any) => b.status === "Pending"
    );

    const canceled = formattedBookings.filter(
      (b: any) => b.status === "Rejected"
    );

    const summary = {
      total: formattedBookings.length,
      upcoming: upcoming.length,
      completed: completed.length,
      pending: pending.length,
      canceled: canceled.length,
    };

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { summary, upcoming, completed, pending, canceled },
      "Bookings fetched successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const bookingDetails = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const booking: any = await BookingModel.findById(id)
      .populate(
        "therapist",
        "firstName lastName profilePicture sessionCharges gender email phoneNumber about"
      )
      .populate("slot", "day times")
      .populate(
        "bookedBy",
        "firstName lastName profilePicture countyCode phoneNumber email"
      )
      .populate("forKid", "name age")
      .lean();

    if (!booking) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        "Booking not found"
      );
    }

    const selectedTime: any = booking.slot?.times?.find(
      (t: any) => String(t._id) === String(booking.timeId)
    );

    const formattedBooking = {
      _id: booking._id,
      therapist: booking.therapist
        ? {
            id: booking.therapist._id,
            name: `${booking.therapist.firstName} ${booking.therapist.lastName}`,
            profilePicture: booking.therapist.profilePicture,
            email: booking.therapist.email,
            gender: booking.therapist.gender,
            sessionCharges: booking.therapist.sessionCharges,
            phoneNumber: booking.therapist?.phoneNumber,
            about: booking.therapist?.about,
          }
        : null,
      bookedBy: booking.bookedBy
        ? {
            id: booking.bookedBy._id,
            name: `${booking.bookedBy.firstName} ${booking.bookedBy.lastName}`,
            profilePicture: booking.bookedBy.profilePicture,
            countryCode: booking.bookedBy?.countryCode,
            phoneNumber: booking.bookedBy?.phoneNumber,
            email: booking.bookedBy?.email,
          }
        : null,
      kid: booking.forKid
        ? {
            name: booking.forKid.name,
            age: booking.forKid.age,
          }
        : null,
      serviceType: booking.serviceType,
      date: booking.date,
      day: booking.slot?.day || "",
      startTime: selectedTime?.startTime || "",
      endTime: selectedTime?.endTime || "",
      status: booking.status,
      isPaid: booking.isPaid,
      cancelReason: booking.cancelReason || "",
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      formattedBooking,
      "Booking details fetched successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const reviewTherapist = async (req: CustomRequest, res: Response) => {
  try {
    const { therapistId, rating, message } = req.body;

    if (!therapistId || !rating) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Therapist ID and rating are required"
      );
    }

    const therapist = await UserModel.findById(therapistId);
    if (!therapist || therapist.userType !== "Therapist") {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        "Therapist not found"
      );
    }

    const review = await ReviewModel.create({
      therapist: therapistId,
      user: req.userId,
      message: message || "",
      rating,
    });

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { review },
      "Review submitted successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const cancelBooking = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    await BookingModel.findByIdAndDelete(id);
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      "Booking cancel successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const markAsCompleted = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    await BookingModel.findByIdAndUpdate(id, {
      status: "Completed",
    });
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      "Marked successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const resources = async (req: CustomRequest, res: Response) => {
  try {
    const resources = await ResourceModel.find().select(
      "title description totalTasks"
    );

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { resources },
      AUTH_CONSTANTS.FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const ebooks = async (req: CustomRequest, res: Response) => {
  try {
    let userType: any = "FREEMIUM";
    if (req.userId) {
      userType = await UserModel.findById(req.userId).select("type");
    }
    let ebooks = await EbookModel.find().lean();

    ebooks = ebooks.map((item) => ({
      ...item,
      is_locked: userType === "FREEMIUM" ? true : false,
    }));

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { ebooks },
      AUTH_CONSTANTS.FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const detailResource = async (req: CustomRequest, res: Response) => {
  try {
    let userCategory: any = "FREEMIUM";
    if (req.userId) {
      const user: any = await UserModel.findById(req.userId).select("type");
      userCategory = user.type;
    }
    let updatedResource: any = {};
    const resource: any = await ResourceModel.findById(req.params.id).lean();
    const groupedByAcquisitionAge = resource?.alphabets.reduce(
      (acc: any, alphabet: any) => {
        const age = alphabet.acquisitionAge;
        if (!acc[age]) acc[age] = [];
        acc[age].push(alphabet);
        return acc;
      },
      {}
    );
    const allAlphabets = resource.alphabets;
    const SPECIAL_ID = "69051b397df4f2efa0a10494";

    if (userCategory == "FREEMIUM") {
      if (req.params.id === SPECIAL_ID) {
        for (const age in groupedByAcquisitionAge) {
          groupedByAcquisitionAge[age] = groupedByAcquisitionAge[age].map(
            (alpha: any) => ({
              ...alpha,
              is_locked: true,
            })
          );
        }
      } else {
        const unlockedIds = new Set(
          allAlphabets.slice(0, 1).map((a: any) => a._id?.toString())
        );

        for (const age in groupedByAcquisitionAge) {
          groupedByAcquisitionAge[age] = groupedByAcquisitionAge[age].map(
            (alpha: any) => ({
              ...alpha,
              is_locked: unlockedIds.has(alpha._id?.toString()) ? false : true,
            })
          );
        }
      }
      updatedResource = {
        ...resource,
        alphabets: groupedByAcquisitionAge,
      };
    } else {
      for (const age in groupedByAcquisitionAge) {
        groupedByAcquisitionAge[age] = groupedByAcquisitionAge[age].map(
          (alpha: any) => ({
            ...alpha,
            is_locked: false,
          })
        );
      }

      updatedResource = {
        ...resource,
        alphabets: groupedByAcquisitionAge,
      };
    }

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { resource: updatedResource },
      AUTH_CONSTANTS.FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const listKid = async (req: CustomRequest, res: Response) => {
  try {
    const kids = await KidModel.find({
      user: req.userId,
    });
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { kids },
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const addKid = async (req: CustomRequest, res: Response) => {
  try {
    await KidModel.create({
      user: req.userId,
      age: req.body.age,
      name: req.body.name,
      disorder: req.body.disorder,
      summary: req.body.summary,
    });
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.CREATED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const deleteKid = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    await KidModel.findByIdAndDelete(id);
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.DELETED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const filterTherapist = async (req: CustomRequest, res: Response) => {
  try {
    const { name, radius, speciality, lat, lng } = req.query;

    const matchFilters: any = {
      userType: "Therapist",
      isProfileCompleted: true,
      isSelectSlots: true,
    };

    if (name) {
      matchFilters.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }

    if (speciality) {
      matchFilters["speciality.text"] = { $regex: speciality, $options: "i" };
    }

    let pipeline: any[] = [];

    if (lat && lng) {
      const radiusInMeters = Number(radius || 10) * 1000;
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng as string), parseFloat(lat as string)],
          },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true,
        },
      });
    }

    pipeline.push(
      { $match: matchFilters },

      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "therapist",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$reviews" }, 0] },
              then: { $avg: "$reviews.rating" },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          profilePicture: 1,
          sessionCharges: 1,
          about: 1,
          averageRating: { $round: ["$averageRating", 1] },
          _id: 1,
        },
      },
      { $sort: { distance: 1, sessionCharges: 1, averageRating: -1 } },
      { $limit: 50 }
    );

    const therapists = await UserModel.aggregate(pipeline);

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      therapists,
      "Therapists fetched successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
