import { Schema, model } from "mongoose";

const BookingSchema = new Schema(
  {
    therapist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slot: { type: Schema.Types.ObjectId, ref: "Slots", required: true },
    date: { type: Schema.Types.Date, required: true },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceType: { type: Schema.Types.String, required: true },
    forKid: { type: Schema.Types.ObjectId, ref: "Kid" },
    timeId: { type: Schema.Types.ObjectId, required: true },
    cancelBy: { type: Schema.Types.ObjectId, ref: "User" },
    isPaid: { type: Schema.Types.Boolean, default: false },
    cancelReason: { type: Schema.Types.String },
    status: {
      type: Schema.Types.String,
      enum: ["Pending", "Rejected", "Completed", "Accepted"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const BookingModel = model("Booking", BookingSchema);

export default BookingModel;
