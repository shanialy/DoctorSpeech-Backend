import { Response } from "express";
import ResponseUtil from "../utils/Response/responseUtils";
import { AUTH_CONSTANTS } from "../constants/messages";
import { STATUS_CODES } from "../constants/statusCodes";
import { CustomRequest } from "../interfaces/auth";
import UserModel from "../models/UserModel";
import BookingModel from "../models/BookingModel";
import mongoose from "mongoose";
import SlotModel from "../models/SlotModel";
import TransactionModel from "../models/TransactionModel";

export const home = async (req: CustomRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = await BookingModel.aggregate([
      {
        $match: {
          therapist: new mongoose.Types.ObjectId(req.userId),
          status: "Pending",
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
          localField: "bookedBy",
          foreignField: "_id",
          as: "bookedByUser",
        },
      },
      { $unwind: "$bookedByUser" },
      { $sort: { date: 1, "selectedTime.startTime": 1 } },
      // { $limit: 2 },
      {
        $project: {
          _id: 1,
          therapist: 1,
          date: 1,
          status: 1,
          serviceType: 1,
          "selectedTime.startTime": 1,
          "selectedTime.endTime": 1,
          "bookedByUser.firstName": 1,
          "bookedByUser.lastName": 1,
          "bookedByUser.profilePicture": 1,
          "bookedByUser.email": 1,
        },
      },
    ]);

    const todayAccepted = await BookingModel.aggregate([
      {
        $match: {
          therapist: new mongoose.Types.ObjectId(req.userId),
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
          localField: "bookedBy",
          foreignField: "_id",
          as: "bookedByUser",
        },
      },
      { $unwind: "$bookedByUser" },
      { $sort: { "selectedTime.startTime": 1 } },
      { $limit: 1 },
      {
        $project: {
          therapist: 1,
          date: 1,
          status: 1,
          "selectedTime.startTime": 1,
          "selectedTime.endTime": 1,
          "bookedByUser.firstName": 1,
          "bookedByUser.lastName": 1,
          "bookedByUser.profilePicture": 1,
        },
      },
    ]);

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {
        bookings,
        todayNextAccepted: todayAccepted[0] || {},
      },
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
export const updateAvailability = async (req: CustomRequest, res: Response) => {
  try {
    const { slots } = req.body;
    if (!slots || slots.length >= 0) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Slots are required"
      );
    }

    const slotDocs = req.body.slots
      .filter((slot: any) => Array.isArray(slot.times) && slot.times.length > 0)
      .map((slot: any) => ({
        therapist: req.userId,
        day: slot.day,
        times: slot.times.map((time: any) => ({
          startTime: time.startTime,
          endTime: time.endTime,
        })),
      }));

    if (slotDocs.length > 0) {
      await SlotModel.deleteMany({
        therapist: req.userId,
      });
      await SlotModel.insertMany(slotDocs);
    }

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      "Slots updated successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const bookingDetail = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const booking: any = await BookingModel.findById(id)
      .populate("bookedBy", "firstName lastName profilePicture gender")
      .populate("slot", "day times")
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
      bookedBy: booking.bookedBy
        ? {
            id: booking.bookedBy._id,
            name: `${booking.bookedBy.firstName} ${booking.bookedBy.lastName}`,
            profilePicture: booking.bookedBy.profilePicture,
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

export const respondSessionRequest = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    let dataToUpdate: any = { status: action };

    if (action == "Rejected" && reason) {
      dataToUpdate["cancelReason"] = reason;
      dataToUpdate["cancelBy"] = req.userId;
    }

    await BookingModel.findByIdAndUpdate(id, { ...dataToUpdate });
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      "Respond successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
export const requestDetail = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const bookingDetail = await BookingModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      // 🟢 Lookup slot to get times
      {
        $lookup: {
          from: "slots",
          localField: "slot",
          foreignField: "_id",
          as: "slotData",
        },
      },
      { $unwind: { path: "$slotData", preserveNullAndEmptyArrays: true } },

      // 🟢 Extract selected time
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

      // 🟢 Populate bookedBy (user)
      {
        $lookup: {
          from: "users",
          localField: "bookedBy",
          foreignField: "_id",
          as: "bookedByUser",
        },
      },
      { $unwind: { path: "$bookedByUser", preserveNullAndEmptyArrays: true } },

      // 🟢 Populate kid details if exists
      {
        $lookup: {
          from: "kids",
          localField: "kid",
          foreignField: "_id",
          as: "kidData",
        },
      },
      { $unwind: { path: "$kidData", preserveNullAndEmptyArrays: true } },

      // 🟢 Select required fields
      {
        $project: {
          _id: 1,
          date: 1,
          status: 1,
          description: 1,
          serviceType: 1,
          bookedFor: 1,
          createdAt: 1,
          updatedAt: 1,
          "selectedTime.startTime": 1,
          "selectedTime.endTime": 1,

          "bookedByUser._id": 1,
          "bookedByUser.firstName": 1,
          "bookedByUser.lastName": 1,
          "bookedByUser.profilePicture": 1,
          "bookedByUser.countryCode": 1,
          "bookedByUser.phoneNumber": 1,
          "bookedByUser.about": 1,
          "bookedByUser.email": 1,

          "kidData.name": 1,
          "kidData.age": 1,
          "kidData.gender": 1,
        },
      },
    ]);

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { bookingDetail: bookingDetail[0] || null },
      AUTH_CONSTANTS.FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const myBookings = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;

    const bookings = await BookingModel.find({ therapist: userId })
      .populate("bookedBy", "firstName lastName profilePicture sessionCharges")
      .populate("slot", "day times")
      .sort({ date: -1 });

    const now = new Date();

    const formattedBookings: any = bookings.map((b: any) => {
      const selectedTime = b.slot?.times?.find(
        (t: any) => String(t._id) === String(b.timeId)
      );

      return {
        _id: b._id,
        bookedBy: b.bookedBy
          ? {
              id: b.bookedBy._id,
              name: `${b.bookedBy.firstName} ${b.bookedBy.lastName}`,
              profilePicture: b.bookedBy.profilePicture,
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

export const markAsCompleted = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    await BookingModel.findByIdAndUpdate(id, { status: "Completed" });
    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {},
      "Marked as completed successfully"
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};

export const earnings = async (req: CustomRequest, res: Response) => {
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

export const transactions = async (req: CustomRequest, res: Response) => {
  try {
    const transaction = await TransactionModel.find({
      receiver: req.userId,
    }).populate("payer", "firstName lastName");

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      { transaction },
      AUTH_CONSTANTS.USER_FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
