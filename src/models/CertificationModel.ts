import { Schema, model } from "mongoose";

const CertificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    degreeName: { type: Schema.Types.String },
    instituteName: { type: Schema.Types.String },
    completionYear: { type: Schema.Types.String },
    media: {
      mediaType: { type: Schema.Types.String },
      url: {
        type: Schema.Types.String,
      },
    },
  },
  {
    timestamps: true,
  }
);

const CertificationModel = model("Certifications", CertificationSchema);

export default CertificationModel;
