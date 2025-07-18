// src/routes/projects.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ROLE } from "../constants/role.js";
import {
  getClientInfoByProjectId,
  updateCompletedTaskDocuments,
  getDrawingsForExpert,
  getOnlyDesigerDrawing,
  getDrawingsForClient,
  getAllDrawings,
  getMySubmissions,
  createProject,
  getDrawingHistory,
  createDeliverableList,
  assignTask,
  createTeam,
  getAllTaskByProjectId,
  getTeamDetailsByProjectId,
  getProjectById,
  getDeliverablesByProjectId,
  getAssignedTaskByProject,
  getAllDrawingsByProjectId,
  createDesignDrawing,
  getAssignedProjects,
  getDeliverableListByUserId,
  getAssignedTaskByUser,
  getProjectsByClientId,
  getDrawingsSentToUser,
  updateTaskStatus,
  getProjectDocuments,
  getAllProjects,
  uploadDrawingVersion,
  expertReview,
  submitToClient,
  clientReview,
  getDesignDrawings,
  updateProject,
  getDeliverableByProjectId,
  getAllDeliverable,
  updateDeliverableStatusIfAllTasksCompleted
} from "../controllers/projectsController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Define base paths relative to project root
const BASE_UPLOAD_PATH = process.env.UPLOAD_PATH || "uploads";
const DESIGN_DRAWING_FOLDER = "design_drawing";

// Utility to ensure directory exists
function ensureUploadDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Setup upload directories
const uploadsPath = path.join(process.cwd(), BASE_UPLOAD_PATH);
const designDrawingPath = path.join(uploadsPath, DESIGN_DRAWING_FOLDER);
// Ensure directories exist on application startup
ensureUploadDir(uploadsPath);
ensureUploadDir(designDrawingPath);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 mb
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Multer storage configuration for design drawings
const designDrawingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, designDrawingPath);
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 mb
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Create multer instances with modified file handling to store relative paths
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
}).array("documents", 10);

// Middleware to convert absolute paths to relative paths
const processUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return next(err);

    // Convert absolute paths to relative paths
    if (req.files && req.files.length > 0) {
      req.files = req.files.map((file) => {
        // Store relative path instead of absolute path
        file.relativePath = path.join(BASE_UPLOAD_PATH, file.filename);
        return file;
      });
    }
    next();
  });
};
// Similar middleware for design drawings
const designDrawingUpload = multer({ storage: designDrawingStorage }).array(
  "design_documents",
  10
);
const processDesignUpload = (req, res, next) => {
  designDrawingUpload(req, res, (err) => {
    if (err) return next(err);

    // Convert absolute paths to relative paths
    if (req.files && req.files.length > 0) {
      req.files = req.files.map((file) => {
        // Store relative path instead of absolute path
        file.relativePath = path.join(
          BASE_UPLOAD_PATH,
          DESIGN_DRAWING_FOLDER,
          file.filename
        );
        return file;
      });
    }
    next();
  });
};

// Project management
router.post("/add", protect(), processUpload, createProject);
router.post("/drawingList/add", protect(), createDeliverableList);
router.post("/assignTask", protect(), processUpload, assignTask);
router.put("/assignTask/:taskId/status", updateTaskStatus);
router.get("/assigned-tasks/:userId", getAssignedTaskByUser);
router.post("/createTeam", protect(), createTeam);
router.get("/:projectId/documents", getProjectDocuments);
router.get("/client/:clientId", getProjectsByClientId);
router.get("/assigned-projects/:userId", getAssignedProjects);
router.get(
  "/client-info/:projectId",
  protect(ROLE.ADMIN, ROLE.DESIGNER, ROLE.EXPERT),
  getClientInfoByProjectId
);
// Project listing
router.get("/alll", protect(ROLE.ADMIN), getAllProjects); // Admin-only
router.get("/all", getAllProjects);
router.get("/:projectId", getProjectById);

// Task-related
router.get(
  "/:projectId/assignTasks",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getAssignedTaskByProject
);
router.put(
  "/assignTask/:taskId/complete-documents",
  protect(ROLE.DESIGNER),
  processUpload,
  updateCompletedTaskDocuments
);
router.get(
  "/:projectId/all-tasks",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getAllTaskByProjectId
);

// Team
router.get(
  "/:projectId/teams",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getTeamDetailsByProjectId
);

// Drawing list routes
router.get(
  "/drawingList/:projectId",
  protect(ROLE.ADMIN, ROLE.DESIGNER, ROLE.EXPERT),
  getDeliverablesByProjectId
);
router.get(
  "/drawing-list/:userId",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER, ROLE.CLIENT),
  getDeliverableListByUserId
);

// Design Drawing create + upload versions
router.post(
  "/drawings/create",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  processDesignUpload,
  createDesignDrawing
);
router.post(
  "/drawings/:id/upload",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  processDesignUpload,
  uploadDrawingVersion
);

// Expert Review + Client Submit + Client Review
router.post(
  "/drawings/:id/reviewExpert",
  protect(ROLE.ADMIN, ROLE.EXPERT),
  expertReview
);
router.post("/drawings/:id/submitClient", submitToClient);
router.put("/drawings/:id/reviewClient", clientReview);

router.get(
  "/drawings/sent-to/:userId",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER, ROLE.CLIENT),
  getDrawingsSentToUser
);

// Drawings by projectId
router.get(
  "/:projectId/drawings",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getAllDrawingsByProjectId
);

// Drawing history
router.get(
  "/drawings/:id/history",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER, ROLE.CLIENT),
  getDrawingHistory
);

// GET drawing by Designer id
router.get("/drawings/designer", protect(ROLE.DESIGNER), getOnlyDesigerDrawing);
router.get(
  "/drawings/expert",
  protect(ROLE.EXPERT, ROLE.ADMIN),
  getDrawingsForExpert
);

// Only for authenticated client (uses req.user.id)
router.get("/drawings/client", protect(ROLE.CLIENT), getDrawingsForClient);

// For admin/designer to fetch drawings submitted to a specific client
router.get(
  "/client/:clientId/drawings",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER, ROLE.CLIENT),
  getDrawingsForClient
);

router.get("/drawings/all", protect(ROLE.DESIGNER), getAllDrawings);

// Submission history
router.get("/drawings/submissions/history", protect(), getMySubmissions);
// GET drawing (optionally by ID)
router.get(
  "/drawings/:id?",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getDesignDrawings
);

// router.put("/update/:id", protect(), processUpload, updateProject);
router.put("/update/:id", protect(ROLE.ADMIN), processUpload, updateProject);

// Route to get deliverables by project ID
router.get(
  "/deliverables/:projectId",
  protect(ROLE.ADMIN, ROLE.DESIGNER, ROLE.EXPERT),
  getDeliverableByProjectId
);

// Route to get deliverables by user ID
router.get(
  "/deliverables-users/:userId",
  protect(ROLE.ADMIN, ROLE.DESIGNER, ROLE.EXPERT),
  getAllDeliverable
);

// router.patch('/:projectId/update-deliverable-statuses',protect(ROLE.ADMIN, ROLE.DESIGNER, ROLE.EXPERT), updateDeliverableStatusIfAllTasksCompleted);

router.patch('/deliverable/:deliverableId/update-status',protect(ROLE.ADMIN, ROLE.DESIGNER, ROLE.EXPERT), updateDeliverableStatusIfAllTasksCompleted);
export default router;
