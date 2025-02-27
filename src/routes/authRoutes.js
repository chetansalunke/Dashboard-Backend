// src/routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/authController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/refresh", refreshToken);
router.post("/logout", logout);

// Protected route: user must be authenticated to access this route
router.get("/profile", protect, (req, res) => {
  res.status(200).json({ message: "Profile accessed", user: req.user });
});

export default router;
