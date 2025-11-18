import { Request, Response } from "express";
import UserModel from "../models/UserModel";
import mongoose from "mongoose";

export const handleRevenueCatWebhook = async (req: Request, res: Response) => {
  try {
    const json = JSON.parse(req.body.toString());
    console.log("RevenueCat Webhook received:", json);
    const { event } = json;
    const userId = event.app_user_id || event.original_app_user_id;
    console.log("USERID", userId)
    const convertedId = new mongoose.Types.ObjectId(userId)
    const eventType = event.type
    console.log("EVENT TYPE",eventType)

    const user: any = await UserModel.findById(convertedId);
    if (!user) return res.status(404).send("User not found");

    if (eventType === "INITIAL_PURCHASE" || eventType === "RENEWAL") {
      user.type = "PREMIUM";
    } else if (
      eventType === "CANCELLATION" ||
      eventType === "DID_FAIL_TO_RENEW"
    ) {
      user.type = "FREEMIUM";
    }

    await user.save();

    res.send("OK");
  } catch (err) {
    console.error("Error handling webhook event:", err);
    res.status(500).send();
  }
};
