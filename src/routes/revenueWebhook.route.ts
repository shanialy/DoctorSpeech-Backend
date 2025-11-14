import express from "express";
import { handleRevenueCatWebhook } from "../controllers/revenueCatWebhook.controller";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleRevenueCatWebhook
);

export default router;
