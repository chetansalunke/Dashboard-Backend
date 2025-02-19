import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/authController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Register a new user
router.post("/register", register);

// Login user
router.post("/login", login);

// Refresh access token
router.get("/refresh", refreshToken);

// Logout user
router.post("/logout", logout);

// Example protected route (accessible by any authenticated user)
router.get("/profile", protect(), (req, res) => {
  res.status(200).json({ message: "🛡️ Profile accessed", user: req.user });
});

export default router;
