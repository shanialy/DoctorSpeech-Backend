import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import morganBody from "morgan-body";
import { connectDB } from "./config/db";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import therapistRoutes from "./routes/therapistRoute";
import swaggerOptions from "./config/swagger";
import express, { Request, Response } from "express";
import { API_PREFIX } from "./config/environment";

dotenv.config();

const app = express();

connectDB();
app.get("/", (req: Request, res: Response) => {
  return res.json({ message: "Welcome to Doctor Speech APIs" });
});

const swaggerSpec = swaggerJSDoc(swaggerOptions);
// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use("/src/public/uploads", express.static("./src/public/uploads"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

morganBody(app, {
  prettify: true,
  logReqUserAgent: true,
  logReqDateTime: true,
});

// Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/user`, userRoutes);
app.use(`${API_PREFIX}/therapist`, therapistRoutes);
// app.use(`${API_PREFIX}/news-feed`, newsFeedRoutes);
// app.use(`${API_PREFIX}/user`, userRoutes);
// app.use(`${API_PREFIX}/admin`, adminRoutes);
// app.use(`${API_PREFIX}/friends`, friendsRoutes);
// app.use(`${API_PREFIX}/double-date`, doubleDateRoutes);
// app.use(`${API_PREFIX}/subscribed-double-date`, subscribedDoubleDatesRoute);
// app.use(`${API_PREFIX}/date-planner`, ideaPlannerRoutes);
// app.use(`${API_PREFIX}/notifications`, notificationRoutes);
// app.use(`${API_PREFIX}/conversation`, conversationRoute);

export default app;
