import { Router } from "express";
import { checkAuth } from "../middleware/checkAuth";
import { createPaymentIntent } from "../controllers/paymentController";

const router = Router();

router.post("/intent", checkAuth, createPaymentIntent);

export default router;
