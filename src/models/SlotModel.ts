import { Schema, model } from "mongoose";

const SlotSchema = new Schema(
  {
    therapist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: Schema.Types.String, required: true },
    times: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SlotModel = model("Slots", SlotSchema);

export default SlotModel;
