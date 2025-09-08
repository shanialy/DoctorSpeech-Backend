import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import morganBody from "morgan-body";
import express, { Request, Response } from "express";
dotenv.config();

const app = express();

app.get("/", (req: Request, res: Response) => {
  return res.json({ message: "Welcome to DoctoSpeech Backend" });
});

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));

morganBody(app, {
  prettify: true,
  logReqUserAgent: true,
  logReqDateTime: true,
});

export default app;
