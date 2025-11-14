import { Schema, model } from "mongoose";

const DeviceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  deviceToken: { type: Schema.Types.String, default: "" },
  deviceType: {
    type: Schema.Types.String,
    enum: ["Android", "IOS", "Postman"],
    default: "Postman",
  },
});

const DeviceModel = model("Device", DeviceSchema);

export default DeviceModel;
