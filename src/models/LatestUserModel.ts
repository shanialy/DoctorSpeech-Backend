import { Schema, model } from "mongoose";

const LatestUserSchema = new Schema(
  {
    email: { type: Schema.Types.String, requried: true, unique: true },
  },
  {
    timestamps: true,
  },
);

const LatestUserModel = model("Latestuser", LatestUserSchema);

export default LatestUserModel;
