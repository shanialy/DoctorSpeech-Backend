import { Request, Response } from "express";
import UserModel from "../models/UserModel";
import { sendEmail } from "../utils/SendEmail";
import { purchasedTemplate } from "../utils/SendEmail/templates";

export const handleRevenueCatWebhook = async (req: Request, res: Response) => {
  try {
    const json = JSON.parse(req.body.toString());
    console.log("RevenueCat Webhook received:", json);
    const { event }: any = json;
    let userId;
    if (event.type === "TRANSFER") {
      userId = event.transferred_to?.[1] || null;
    } else {
      userId = event.app_user_id || event.original_app_user_id;
    }

    const user: any = await UserModel.findById(userId);

    if (!user) return res.status(404).send("User not found");

    if (
      event.type === "INITIAL_PURCHASE" ||
      event.type === "RENEWAL" ||
      event.type === "TRANSFER"
    ) {
      user.type = "PREMIUM";
    } else if (
      event.type === "CANCELLATION" ||
      event.type === "DID_FAIL_TO_RENEW"
    ) {
      user.type = "FREEMIUM";
    }

    await user.save();
    if (event.type == "INITIAL_PURCHASE") {
      const template = purchasedTemplate(
        user.firstName ? user?.firstName : "Someone"
      );

      await sendEmail(
        "xhanialee@gmail.com",
        "Subscription purchased",
        template
      );
    }
    res.send("OK");
  } catch (err) {
    console.error("Error handling webhook event:", err);
    res.status(500).send();
  }
};
