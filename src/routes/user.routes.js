import express from "express";

import protect from "../middlewares/authMiddleware.js";
import { getUserByRole, getUserById } from "../controllers/user.controller.js";
const router = express.Router();

router.get("/role", protect(), getUserByRole);
router.get("/:id", protect(), getUserById);
export default router;
