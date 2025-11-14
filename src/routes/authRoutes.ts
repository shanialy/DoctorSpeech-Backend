import { Router } from "express";
import {
  changePassword,
  createProfile,
  deleteAccount,
  getProfile,
  getUserById,
  login,
  logout,
  resetPassword,
  sendOtp,
  signup,
  // socialLogin,
  updateProfile,
  verifyOtp,
} from "../controllers/authController";
import { checkAuth } from "../middleware/checkAuth";
import { handleMediaFilesS3 } from "../middleware/handleMediaFilesS3";
import { updateAvailability } from "../controllers/therapistController";

const router = Router();

router.post("/signup", signup);
router.post(
  "/create-profile",
  checkAuth,
  handleMediaFilesS3([
    { name: "profilePicture", maxCount: 1 },
    { name: "certificationMedia", maxCount: 5 },
  ]),
  createProfile
);
router.put(
  "/update-profile",
  checkAuth,
  handleMediaFilesS3([{ name: "profilePicture", maxCount: 1 }], {
    optional: true,
  }),
  updateProfile
);
router.post("/login", login);
// router.post("/social-login", socialLogin);
router.post("/verify-otp", verifyOtp);
router.post("/send-otp", sendOtp);
router.get("/profile", checkAuth, getProfile);
router.post("/update-availability", checkAuth, updateAvailability);
router.post("/change-password", checkAuth, changePassword);
router.post("/reset-password", checkAuth, resetPassword);
router.get("/profile/:userId", checkAuth, getUserById);
router.post("/logout", checkAuth, logout);
router.delete("/delete-account", checkAuth, deleteAccount);

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
