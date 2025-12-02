import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: Schema.Types.String, requried: true, unique: true },
    password: { type: Schema.Types.String, default: "" },
    firstName: { type: Schema.Types.String, default: "" },
    lastName: { type: Schema.Types.String, default: "" },
    phoneNumber: { type: Schema.Types.String, default: "" },
    countryCode: { type: Schema.Types.String, default: "" },
    sessionCharges: { type: Schema.Types.Number, default: 0 },
    userType: {
      type: Schema.Types.String,
      enum: ["User", "Therapist"],
      default: "User",
    },
    provider: {
      type: Schema.Types.String,
      enum: ["Google", "Apple", "Email"],
      default: "Email",
    },
    gender: {
      type: Schema.Types.String,
      default: "",
    },
    age: {
      type: Schema.Types.String,
      default: "",
    },
    profilePicture: {
      type: Schema.Types.String,
      default: "",
    },
    stripeId: {
      type: Schema.Types.String,
      default: "",
    },
    about: {
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
        default: "Point",
      },
      coordinates: {
        type: [Schema.Types.Number],
        default: [0, 0],
      },
      address: { type: Schema.Types.String, default: "" },
    },
    speciality: {
      text: [{ type: Schema.Types.String }],
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ location: "2dsphere" });
const UserModel = model("User", UserSchema);

export default UserModel;
