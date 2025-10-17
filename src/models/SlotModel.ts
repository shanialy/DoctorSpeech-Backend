import { Schema, model } from "mongoose";

const SlotSchema = new Schema(
  {
    therapist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Schema.Types.Date, required: true },
    startTime: { type: Schema.Types.String, required: true },
    endTime: { type: Schema.Types.String, required: true },
  },
  {
    timestamps: true,
  }
);

const SlotModel = model("Slots", SlotSchema);

export default SlotModel;
