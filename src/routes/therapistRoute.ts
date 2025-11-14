import { Router } from "express";
import { checkAuth } from "../middleware/checkAuth";
import {
  home,
  updateLocation,
  requestDetail,
  respondSessionRequest,
  markAsCompleted,
  myBookings,
  bookingDetail,
  transactions,
} from "../controllers/therapistController";

const router = Router();

router.get("/home", checkAuth, home);
router.put("/updateLocation", checkAuth, updateLocation);
router.put("/respond-session/:id", checkAuth, respondSessionRequest);
router.get("/request-detail/:id", checkAuth, requestDetail);
router.get("/session", checkAuth, myBookings);
router.put("/session/:id", checkAuth, markAsCompleted);
router.get("/session/:id", checkAuth, bookingDetail);
router.get("/transactions", checkAuth, transactions);
// router.post("/reviewUser", checkAuth, reviewUser);
// router.get("/listEarnings", checkAuth, earnings);

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
