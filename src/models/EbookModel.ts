import { Schema, model } from "mongoose";

const EbookSchema = new Schema(
  {
    picture: { type: Schema.Types.String, required: true },
    title: { type: Schema.Types.String, required: true },
    description: { type: Schema.Types.String, required: true },
    url: { type: Schema.Types.String, required: true },
    authorDetails: {
      name: {
        type: Schema.Types.String,
      },
      picture: { type: Schema.Types.String },
    },
  },
  {
    timestamps: true,
  }
);

const EbookModel = model("Ebooks", EbookSchema);

export default EbookModel;
