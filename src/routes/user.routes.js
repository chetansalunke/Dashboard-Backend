import express from "express";

import protect from "../middlewares/authMiddleware.js";
import { getUserByRole } from "../controllers/user.controller.js";
const router = express.Router();

router.get("/role", protect(), getUserByRole);

export default router;
