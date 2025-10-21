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

export const home = async (req: CustomRequest, res: Response) => {
  try {
    const currentUser = await UserModel.findById(req.userId).select("location");
    if (!currentUser || !currentUser.location?.coordinates?.length) {
      return ResponseUtil.handleError(
        res,
        "User location not found. Please update your location first."
      );
    }

    const userCoordinates: any = currentUser.location.coordinates;
    const maxDistanceInMeters = 5000;

    const [featured, nearby] = await Promise.all([
      UserModel.aggregate([
        {
          $match: {
            userType: "Therapist",
            // sessionCharges: { $exists: true, $ne: null },
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
            speciality: 1,
          },
        },
      ]),

      UserModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: userCoordinates },
            distanceField: "distance",
            maxDistance: maxDistanceInMeters,
            spherical: true,
            query: { userType: "Therapist" },
          },
        },
        { $match: { _id: { $ne: currentUser._id } } },
        { $limit: 2 },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            distance: 1,
            profilePicture: 1,
            speciality: 1,
            sessionCharges: 1,
          },
        },
      ]),
    ]);
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { featured, nearby },
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
      "-password -certifications -slots"
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
        list: reviewsData,
      },
    };
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { therapistDetails },
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const getAvailableSlots = async (req: CustomRequest, res: Response) => {
  try {
    const { therapistId } = req.params;
    const { date } = req.query; // e.g., "2025-10-22"

    if (!date) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Date is required"
      );
    }

    // 1️⃣ Get weekday from date
    const givenDate = new Date(date as string);
    const dayOfWeek = givenDate.toLocaleString("en-US", { weekday: "short" }); // e.g. "Monday"

    // 2️⃣ Find slots of therapist for that day
    const slot = await SlotModel.findOne({
      therapist: therapistId,
      day: dayOfWeek,
    }).lean();
    if (!slot) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        "No slots found for this day"
      );
    }

    // 3️⃣ Find already booked slots on that date
    const bookedSlots = await BookingModel.find({
      therapist: therapistId,
      date: new Date(date as string),
      status: { $in: ["Pending", "Accepted"] },
    }).lean();

    // Extract booked start/end times
    const bookedTimes: any = bookedSlots.map((b: any) => ({
      startTime: b.startTime,
      endTime: b.endTime,
    }));

    // 4️⃣ Filter available times
    const availableTimes = slot.times.filter((time) => {
      return !bookedTimes.some(
        (b: any) => b.startTime === time.startTime && b.endTime === time.endTime
      );
    });

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
      slot: parentSlot._id, // ✅ check against Slot document
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

    await BookingModel.create({
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
      {},
      "Booked Successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const myBookings = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Fetch all user bookings with therapist & slot populated
    const bookings = await BookingModel.find({ bookedBy: userId })
      .populate("therapist", "firstName lastName profilePicture sessionCharges")
      .populate("slot", "day times")
      .sort({ date: -1 });

    const now = new Date();

    // Format and categorize
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
              sessionCharges: b.therapist.sessionCharges,
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

    // Separate by type
    const upcoming = formattedBookings.filter(
      (b: any) =>
        new Date(b.date) >= now &&
        (b.status === "Pending" || b.status === "Accepted")
    );

    const completed = formattedBookings.filter(
      (b: any) => b.status === "Completed"
    );

    const pending = formattedBookings.filter(
      (b: any) => b.status === "Pending"
    );

    // Counts
    const summary = {
      total: formattedBookings.length,
      upcoming: upcoming.length,
      completed: completed.length,
      pending: pending.length,
    };

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { summary, upcoming, completed, pending },
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
        "firstName lastName profilePicture sessionCharges gender"
      )
      .populate("slot", "day times")
      .populate("bookedBy", "firstName lastName profilePicture") // optional, if user wants to see who booked
      .lean();

    if (!booking) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        "Booking not found"
      );
    }

    // Extract the exact time object
    const selectedTime: any = booking.slot?.times?.find(
      (t: any) => String(t._id) === String(booking.timeId)
    );

    // Structure response cleanly
    const formattedBooking = {
      _id: booking._id,
      therapist: booking.therapist
        ? {
            id: booking.therapist._id,
            name: `${booking.therapist.firstName} ${booking.therapist.lastName}`,
            profilePicture: booking.therapist.profilePicture,
            gender: booking.therapist.gender,
            sessionCharges: booking.therapist.sessionCharges,
          }
        : null,
      bookedBy: booking.bookedBy
        ? {
            id: booking.bookedBy._id,
            name: `${booking.bookedBy.firstName} ${booking.bookedBy.lastName}`,
            profilePicture: booking.bookedBy.profilePicture,
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
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const resources = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const detailResource = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const listKid = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const addKid = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const deleteKid = async (req: CustomRequest, res: Response) => {
  try {
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
