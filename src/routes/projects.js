// src/routes/projects.js
import express from "express";
import multer from "multer";
import { ROLE } from ".././constants/role.js";
import {
  createProject,
  createDrawingList,
  assignTask,
  createTeam,
  getAllTaskByProjectId,
  getTeamDetailsByProjectId,
  getProjectById,
  getDrawingsByProjectId,
  getAssignedTaskByProject,
  createDesignDrawing,
  getAllDesignDrawings,
  getAssignedProjects,
  getDrawingListByUserId,
  getAssignedTaskByUser,
  getProjectsByClientId,
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
const design_drawingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/design_drawing");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const design_drawing_list = multer({ storage: design_drawingStorage }).array(
  "design_documents",
  10
);

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
// show all project to the admin only
router.get("/alll", protect([ROLE.ADMIN]), getAllProjects);
router.get("/all", getAllProjects);
// get project details by projectid
router.get("/:projectId", protect([ROLE.ADMIN], [ROLE.EXPERT]), getProjectById);
router.get(
  "/:projectId/assignTask",
  protect([ROLE.ADMIN], [ROLE.EXPERT]),
  getAssignedTaskByProject
);
// get drawing list by projectId
router.get(
  "/drawingList/:projectId",
  protect([ROLE.ADMIN], [ROLE.EXPERT]),
  getDrawingsByProjectId
);
// get assigntask by project id
router.get(
  "/:projectId/assignTask",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getAllTaskByProjectId
);
// get team details by project id
router.get(
  "/:projectId/teams",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  getTeamDetailsByProjectId
);
// add the design_drawing
router.post("/design_drawing", design_drawing_list, createDesignDrawing);
router.get("/design_drawing/:project_id", getAllDesignDrawings);

// getAssignTaskByuerID
router.get("/assigned-projects/:userId", getAssignedProjects);

router.get("/assigned-tasks/:userId", getAssignedTaskByUser);
// getDrawingListByUserId
router.get("/drawing-list/:userId", getDrawingListByUserId);
router.get("/client/:clientId", getProjectsByClientId);

export default router;
