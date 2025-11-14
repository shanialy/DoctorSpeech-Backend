import { Router } from "express";
import { createEbook, createResource } from "../controllers/resourceController";
import { handleMediaFilesS3Resource } from "../middleware/handleMediaFilesS3Resource";

const router = Router();

router.post(
  "/",
  handleMediaFilesS3Resource([
    { name: "frontView", maxCount: 1 },
    { name: "fullView", maxCount: 1 },
    { name: "sideView", maxCount: 1 },
  ]),
  createResource
);

router.post(
  "/ebook",
  handleMediaFilesS3Resource([
    { name: "bookImage", maxCount: 1 },
    { name: "authorImage", maxCount: 1 },
    { name: "ebook", maxCount: 1 },
  ]),
  createEbook
);

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
