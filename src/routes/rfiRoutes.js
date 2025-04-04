import express from "express";

import multer from "multer";
import protect from "../middlewares/authMiddleware.js";
const router = express.Router();
import {
  createRfi,
  getAllRfis,
  resolveRfi,
  getRfisSentToUser,
} from "../controllers/rfiController.js";
const storage = multer.diskStorage({
  // destination where the file store
  destination: (req, file, cb) => {
    cb(null, "rfi/");
  },
  // file name of the doccument
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/createRfi", protect(), upload.array("documents", 10), createRfi);
router.get("/getAllRfi", protect(), getAllRfis);
router.put(
  "/resolveRfi/:rfi_id",
  protect(),
  upload.array("documents", 10),
  resolveRfi
);
router.get("/getRfiForUser/:user_id", protect(), getRfisSentToUser);
export default router;
