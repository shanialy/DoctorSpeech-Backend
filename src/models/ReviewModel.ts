import { Schema, model } from "mongoose";

const ReviewSchema = new Schema(
  {
    therapist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Schema.Types.Number },
    message: { type: Schema.Types.String },
  },
  {
    timestamps: true,
  }
);

const ReviewModel = model("Reviews", ReviewSchema);

export default ReviewModel;
