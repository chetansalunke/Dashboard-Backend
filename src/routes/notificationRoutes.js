import express from "express";
import {
  getUserNotifications,
  readNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getUserNotifications);
router.patch("/:id/read", readNotification);

export default router;
