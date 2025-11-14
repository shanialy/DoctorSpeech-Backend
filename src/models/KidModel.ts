import { Schema, model } from "mongoose";

const KidSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: Schema.Types.String, required: true },
    age: { type: Schema.Types.String, required: true },
    summary: { type: Schema.Types.String, required: true },
    disorder: { type: Schema.Types.String, required: true },
  },
  {
    timestamps: true,
  }
);

const KidModel = model("Kid", KidSchema);

export default KidModel;
