import { Response } from "express";
import ResponseUtil from "../utils/Response/responseUtils";
import { AUTH_CONSTANTS } from "../constants/messages";
import { STATUS_CODES } from "../constants/statusCodes";
import { CustomRequest } from "../interfaces/auth";
import UserModel from "../models/UserModel";
import BookingModel from "../models/BookingModel";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-10-29.clover",
});

export const createPaymentIntent = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const user: any = await UserModel.findById(req.userId);

    if (!user) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        AUTH_CONSTANTS.NOT_FOUND
      );
    }

    const { bookingId } = req.body;

    const booking: any = await BookingModel.findById(bookingId)
      .populate("bookedBy")
      .populate("therapist");

    if (!booking) {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        "Booking not found"
      );
    }

    if (booking.status != "Pending") {
      return ResponseUtil.errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        "Payment already processed"
      );
    }

    let stripeCustomerId = user.stripeId;
    const therapist = booking.therapist;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName || "Unnamed User",
      });

      stripeCustomerId = customer.id;
      user.stripe_id = stripeCustomerId;
      await user.save();
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(therapist.sessionCharges * 100),
      currency: "usd",
      customer: stripeCustomerId,
      metadata: {
        bookingId: booking._id.toString(),
        bookedBy: user._id.toString(),
        therapist: therapist._id.toString(),
        payedAmount: therapist.sessionCharges,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return ResponseUtil.successResponse(
      res,
      STATUS_CODES.SUCCESS,
      {
        clientSecret: paymentIntent.client_secret,
        amount: therapist.sessionCharges,
      },
      AUTH_CONSTANTS.FETCHED
    );
  } catch (err) {
    return ResponseUtil.handleError(res, err);
  }
};
