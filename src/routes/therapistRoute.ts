import { Router } from "express";
import { checkAuth } from "../middleware/checkAuth";
import {
  home,
  updateLocation,
  bookingDetail,
  cancelBooking,
  earnings,
  myBookings,
  respondBooking,
  reviewUser,
} from "../controllers/therapistController";

const router = Router();

router.get("/home", checkAuth, home);
router.put("/updateLocation", checkAuth, updateLocation);
router.put("/bookingDetail/:bookingId", checkAuth, bookingDetail);
router.put("/cancelBooking/:bookingId", checkAuth, cancelBooking);
router.put("/respondBooking/:bookingId", checkAuth, respondBooking);
router.get("/myBookings", checkAuth, myBookings);
router.post("/reviewUser", checkAuth, reviewUser);
router.get("/listEarnings", checkAuth, earnings);

export default router;

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login to the application
 *     tags: [Authentication Flow]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 */
