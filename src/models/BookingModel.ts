import { Schema, model } from "mongoose";

const SlotSchema = new Schema(
  {
    therapist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slot: { type: Schema.Types.ObjectId, ref: "Slots", required: true },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceType: { type: Schema.Types.String, required: true },
    forKid: { type: Schema.Types.ObjectId, ref: "Kid" },
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

const SlotModel = model("Slots", SlotSchema);

export default SlotModel;
