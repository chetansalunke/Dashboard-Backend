// src/routes/projects.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ROLE } from "../constants/role.js";
import {
  createProject,
  getDrawingHistory,
  createDrawingList,
  assignTask,
  createTeam,
  getAllTaskByProjectId,
  getTeamDetailsByProjectId,
  getProjectById,
  getDrawingsByProjectId,
  getAssignedTaskByProject,
  getAllDrawingsWithVersions,
  createDesignDrawing,
  // createDesignDrawing,
  // getAllDesignDrawings,
  getAssignedProjects,
  getDrawingListByUserId,
  getAssignedTaskByUser,
  getProjectsByClientId,
  sendDrawingToUser,
  getDrawingsSentToUser,
  // uploadNewDrawingVersion,
  updateTaskStatus,
  getProjectDocuments,
  getAllProjects,
  uploadDrawingVersion,
  reviewDrawing,
  submitToClient,
  clientReview,
  getDesignDrawings,
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
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Multer storage configuration for design drawings
const designDrawingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, designDrawingPath);
  },
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

// --- Routes ---

// Project management routes
router.post("/add", protect(), processUpload, createProject);
router.post("/drawingList/add", protect(), createDrawingList);
router.post("/assignTask", protect(), processUpload, assignTask);
router.post("/createTeam", protect(), createTeam);
router.get("/:projectId/documents", getProjectDocuments);

// Project listing routes
router.get("/alll", protect(ROLE.ADMIN), getAllProjects); // Admin-only route
router.get("/all", getAllProjects);
router.get("/:projectId", getProjectById);

// Task management routes
router.get(
  "/:projectId/assignTask",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getAssignedTaskByProject
);
router.put("/assignTask/:taskId/status", updateTaskStatus);
router.get(
  "/:projectId/assignTask",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getAllTaskByProjectId
);
router.get("/assigned-tasks/:userId", getAssignedTaskByUser);

// Drawing routes
router.get(
  "/drawingList/:projectId",
  protect(ROLE.ADMIN, ROLE.DESIGNER, ROLE.EXPERT),
  getDrawingsByProjectId
);
// router.post("/design_drawing", processDesignUpload, createDesignDrawing);
// router.post(
//   "/:drawing_id/version",
//   processDesignUpload,
//   uploadNewDrawingVersion
// );
// router.get("/design_drawing/:project_id", getAllDesignDrawings);
router.get(
  "/drawing-list/:userId",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER, ROLE.CLIENT),
  getDrawingListByUserId
);
router.put(
  "/drawings/send/:drawingId",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER, ROLE.CLIENT),
  sendDrawingToUser
);
router.get(
  "/drawings/sent-to/:userId",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER, ROLE.CLIENT),
  getDrawingsSentToUser
);

// Team and User routes
router.get(
  "/:projectId/teams",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getTeamDetailsByProjectId
);
router.get("/assigned-projects/:userId", getAssignedProjects);
router.get("/client/:clientId", getProjectsByClientId);

// DesignDrawing New Api
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

// REVIEW by expert (approve or request revision)
router.post(
  "/drawings/:id/review",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  reviewDrawing
);

// SUBMIT to client
router.post("drawings/:id/submit", submitToClient);

// CLIENT review of submitted drawing
router.post(
  "/submissions/:id/review",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  clientReview
);
// get drawings
router.get(
  "/drawings/:id?",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getDesignDrawings
);
router.get(
  "/drawings/:id/history",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getDrawingHistory
);
router.get(
  "/:projectId/drawings",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getAllDrawingsWithVersions
);

export default router;
