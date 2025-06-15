import express from "express";
import { ROLE } from "../constants/role.js";
import multer from "multer";
import protect from "../middlewares/authMiddleware.js";
const router = express.Router();
import {
  forwardToClient,
  createRfi,
  getAllRfis,
  resolveRfi,
  getRfisSentToUser,
  clientResolveRfi,
  getRfisSentToClient,
  createChangeOrder,
  getAllChangeOrders,
  resolveChangeOrder,
  forwardChangeOrderToClient,
  getChangeOrdersSentToUser,
  getChangeOrdersByProjectAndUser,
} from "../controllers/rfiController.js";

const storage = multer.diskStorage({
  // destination where the file store
  destination: (req, file, cb) => {
    cb(null, "rfi/");
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 mb
  // file name of the doccument
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const storageCo = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "change_order/");
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 mb

  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const uploadCo = multer({ storage: storageCo });

router.post("/createRfi", protect(), upload.array("documents", 10), createRfi);
router.put(
  "/resolve-client/:rfi_id",
  protect(ROLE.ADMIN, ROLE.CLIENT),
  upload.array("files"),
  clientResolveRfi
);
router.get(
  "/sent-to-client/:user_id",
  protect(ROLE.CLIENT),
  getRfisSentToClient
);
router.post(
  "/sendToClient",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  upload.array("documents", 10),
  forwardToClient
);
router.get("/getAllRfi", protect(), getAllRfis);
router.put(
  "/resolveRfi/:rfi_id",
  protect(),
  upload.array("documents", 10),
  resolveRfi
);
router.get("/getRfiForUser/:user_id", protect(), getRfisSentToUser);

// change order controller
router.post(
  "/co/create",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.DESIGNER),
  uploadCo.array("documents", 10),
  createChangeOrder
); // frontend field name "documents"
router.get("/co/all", getAllChangeOrders);
router.put(
  "/co/resolve/:id",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.CLIENT),
  uploadCo.array("files", 10), // assuming 'files' is the field name in frontend
  resolveChangeOrder
);
router.post(
  "/co/forward-to-client",
  protect(ROLE.ADMIN, ROLE.EXPERT),
  forwardChangeOrderToClient
);
router.get("/co/sent-to/:user_id", getChangeOrdersSentToUser);
router.get(
  "/co/project/:project_id/user/:user_id",
  protect(ROLE.ADMIN, ROLE.EXPERT, ROLE.CLIENT), // This ensures req.user is populated
  getChangeOrdersByProjectAndUser
);

export default router;
