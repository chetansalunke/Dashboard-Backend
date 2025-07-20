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
  getCompletedTasksTodayCount,
  getProjectDaysRemaining,
  getProjectRfiAverageTat,
  getProjectPendingRfis,
  getProjectChangeOrderCounts,
  getProjectProgress,
  getProjectDrawingApprovalRate,
  getOverdueDeliverablesByProject,
  getUpcomingDeliverablesByProject,
  getRecentProjectActivities,
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
router.get("/users", getUsersOverview); //error
router.get("/projects", getProjectsOverview);
router.get("/tasks", getTasksOverview); //error
router.get("/deliverables", getDeliverablesOverview);

// User management routes
router.put("/users/:userId/status", updateUserStatus);
router.get("/adminDashboard", protect(ROLE.ADMIN), getAdminDashboard);

// Project-specific routes
router.get("/:projectId/task-completed-today", getCompletedTasksTodayCount);
router.get("/:projectId/days-remaining", getProjectDaysRemaining);
router.get("/:projectId/rfi-average-tat", getProjectRfiAverageTat);
router.get("/:projectId/pending-rfis", getProjectPendingRfis);
router.get("/:projectId/change-order-counts", getProjectChangeOrderCounts);
router.get("/:projectId/progress", getProjectProgress);
router.get("/:projectId/drawing-approval-rate", getProjectDrawingApprovalRate);
router.get("/:projectId/overdue-deliverables", getOverdueDeliverablesByProject);
router.get(
  "/:projectId/upcoming-deliverables",
  getUpcomingDeliverablesByProject
);

router.get(
  "/:projectId/recent-project-activities",
  getRecentProjectActivities
);
export default router;
