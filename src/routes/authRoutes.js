// src/routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getAllUsers,
} from "../controllers/authController.js";
import protect from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/refresh", refreshToken);
router.post("/logout", logout);

router.get("/profile", protect, (req, res) => {
  res.status(200).json({ message: "Profile accessed", user: req.user });
});
router.get("/all", getAllUsers);
export default router;
