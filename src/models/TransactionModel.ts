import { Schema, model } from "mongoose";

const TranactionSchema = new Schema(
  {
    payer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    amount: { type: Number, required: true },
    stripePaymentIntentId: { type: String, required: true },
    status: {
      type: String,
      enum: ["Succeeded", "Failed", "Pending"],
      default: "Succeeded",
    },
  },
  {
    timestamps: true,
  }
);

const TransactionModel = model("Transaction", TranactionSchema);

export default TransactionModel;
