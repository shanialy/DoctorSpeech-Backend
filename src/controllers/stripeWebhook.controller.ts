import { Request, Response } from "express";
import Stripe from "stripe";
import BookingModel from "../models/BookingModel";
import TransactionModel from "../models/TransactionModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-10-29.clover",
});

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message);
    return res.status(400).send(`Webhook Error: ${err?.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata || {};

      const { bookingId, bookedBy, therapist, payedAmount } = metadata;

      const existingTx = await TransactionModel.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (existingTx) {
        console.log("PaymentIntent already processed:", paymentIntent.id);
        return res.status(200).json({ received: true });
      }

      const booking = await BookingModel.findByIdAndUpdate(
        bookingId,
        { isPaid: true },
        { new: true }
      );

      if (!booking) {
        console.error("Booking not found for webhook:", bookingId);
        return res.status(200).json({ received: true });
      }

      await TransactionModel.create({
        payer: bookedBy,
        receiver: therapist,
        bookingId,
        amount: Number(payedAmount), // fallback
        stripePaymentIntentId: paymentIntent.id,
        status: "Succeeded",
      });

      console.log(
        "Payment processed, booking updated and transaction created."
      );
    }

    // Respond 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error handling webhook event:", err);
    res.status(500).send();
  }
};
