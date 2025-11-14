import mongoose, { model, Schema } from "mongoose";

const videoSchema = new mongoose.Schema({
  type: {
    type: Schema.Types.String,
    enum: ["frontView", "fullView", "sideView"],
    required: true,
  },
  title: { type: Schema.Types.String, required: true },
  description: { type: Schema.Types.String },
  url: { type: Schema.Types.String, required: true },
});

const alphabetSchema = new mongoose.Schema({
  letter: { type: Schema.Types.String, required: true }, // e.g., "N", "M", "H"
  acquisitionAge: { type: Schema.Types.Number, required: true }, // e.g., 3, 4, 5
  videos: [videoSchema], // 3 video entries (front, full, side)
});

const resourceSchema = new mongoose.Schema(
  {
    title: { type: Schema.Types.String, required: true }, // e.g., "Consonants"
    description: { type: Schema.Types.String },
    totalTasks: { type: Schema.Types.Number, default: 0 },
    alphabets: [alphabetSchema], // Nested alphabets
  },
  { timestamps: true }
);

const ResourceModel = model("Resources", resourceSchema);

export default ResourceModel;
