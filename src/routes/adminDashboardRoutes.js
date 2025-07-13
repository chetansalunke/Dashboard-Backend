// src/routes/adminDashboardRoutes.js
import express from "express";
import {
  getDashboardStats,
  getRecentActivities,
  getUsersOverview,
  getProjectsOverview,
  getTasksOverview,
  getSystemAnalytics,
  updateUserStatus,
  getDeliverablesOverview,
  getAdminDashboard,
} from "../controllers/adminDashboardController.js";
import { ROLE } from "../constants/role.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply admin authentication to all routes
router.use(protect(ROLE.ADMIN));

// Dashboard overview routes
router.get("/stats", getDashboardStats);
router.get("/recent-activities", getRecentActivities);
router.get("/analytics", getSystemAnalytics);

// Management overview routes
router.get("/users", getUsersOverview);
router.get("/projects", getProjectsOverview);
router.get("/tasks", getTasksOverview);
router.get("/deliverables", getDeliverablesOverview);

// User management routes
router.put("/users/:userId/status", updateUserStatus);
router.get("/adminDashboard", protect(ROLE.ADMIN), getAdminDashboard);

export default router;
