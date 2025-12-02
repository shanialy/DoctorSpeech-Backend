import { Router } from "express";
import { checkAuth, optionalAuth } from "../middleware/checkAuth";
import {
  home,
  addKid,
  bookSession,
  bookingDetails,
  cancelBooking,
  deleteKid,
  detailResource,
  getTherapistDetails,
  listKid,
  myBookings,
  resources,
  reviewTherapist,
  updateLocation,
  getAvailableSlots,
  filterTherapist,
  markAsCompleted,
  ebooks,
} from "../controllers/userController";

const router = Router();

router.get("/home", checkAuth, home);
router.get("/filter-therapist", checkAuth, filterTherapist);
router.put("/updateLocation", checkAuth, updateLocation);
router.get("/therapistDetails/:therapistId", checkAuth, getTherapistDetails);
router.get("/therapistSlots/:therapistId", checkAuth, getAvailableSlots);
router.post("/session", checkAuth, bookSession);
router.get("/session", checkAuth, myBookings);
router.get("/session/:id", checkAuth, bookingDetails);
router.put("/session/:id", checkAuth, markAsCompleted);
router.post("/reviewTherapist", checkAuth, reviewTherapist);
router.post("/cancelBooking/:id", checkAuth, cancelBooking);
router.get("/resources", optionalAuth, resources);
router.get("/ebooks", checkAuth, ebooks);
router.get("/detailResource/:id", optionalAuth, detailResource);
router.get("/kid", checkAuth, listKid);
router.post("/kid", checkAuth, addKid);
router.delete("/kid/:id", checkAuth, deleteKid);

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
