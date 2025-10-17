import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: Schema.Types.String, requried: true, unique: true },
    password: { type: Schema.Types.String },
    firstName: { type: Schema.Types.String },
    lastName: { type: Schema.Types.String },
    phoneNumber: { type: Schema.Types.String },
    countryCode: { type: Schema.Types.String },
    sessionCharges: { type: Schema.Types.Number },
    userType: {
      type: Schema.Types.String,
      enum: ["User", "Therapist"],
    },
    provider: {
      type: Schema.Types.String,
      enum: ["Google", "Apple", "Email"],
    },
    gender: {
      type: Schema.Types.String,
    },
    age: {
      type: Schema.Types.String,
    },
    profilePicture: {
      type: Schema.Types.String,
      default: "",
    },
    devices: [
      {
        type: Schema.Types.ObjectId,
        ref: "Devices",
      },
    ],
    certifications: [
      {
        type: Schema.Types.ObjectId,
        ref: "Certifications",
      },
    ],
    workingSlots: [
      {
        type: Schema.Types.ObjectId,
        ref: "Slots",
      },
    ],
    isVerified: {
      type: Schema.Types.Boolean,
      default: false,
    },
    isDocumentsVerified: {
      type: Schema.Types.Boolean,
      default: false,
    },
    isSelectSlots: {
      type: Schema.Types.Boolean,
      default: false,
    },
    isProfileCompleted: {
      type: Schema.Types.Boolean,
      default: false,
    },
    isNotificationEnabled: {
      type: Schema.Types.Boolean,
      default: false,
    },
    type: {
      type: Schema.Types.String,
      enum: ["FREEMIUM", "PREMIUM"],
      default: "FREEMIUM",
    },
    location: {
      type: {
        type: Schema.Types.String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Schema.Types.Number],
      },
      address: { type: Schema.Types.String },
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = model("User", UserSchema);

export default UserModel;
