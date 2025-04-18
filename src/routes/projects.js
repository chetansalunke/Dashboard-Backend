// src/routes/projects.js
import express from "express";
import multer from "multer";
import {
  createProject,
  createDrawingList,
  assignTask,
  createTeam,
} from "../controllers/projectsController.js";
import {
  getProjectDocuments,
  getAllProjects,
} from "../controllers/projectsController.js";
import protect from "../middlewares/authMiddleware.js";
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/add", protect(), upload.array("documents", 10), createProject);
router.post("/drawingList/add", protect(), createDrawingList);
router.post(
  "/assignTask",
  protect(),
  upload.array("documents", 10),
  assignTask
);
router.post("/createTeam", protect(), createTeam);
router.get("/:projectId/documents", protect(), getProjectDocuments);
router.get("/all", getAllProjects);

export default router;
