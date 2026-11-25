import mongoose from "mongoose";

const LatestOtpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "latestuser",
  },
  otp: {
    type: mongoose.Schema.Types.String,
  },
  expiry: {
    type: mongoose.Schema.Types.Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
  },
});
export const LatestOtpModel = mongoose.model("latestotp", LatestOtpSchema);
