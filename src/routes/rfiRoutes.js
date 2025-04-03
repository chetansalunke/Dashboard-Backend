import express from "express";

import multer from "multer";
import protect from "../middlewares/authMiddleware.js";
const router = express.Router();
import { createRfi, getAllRfis } from "../controllers/rfiController.js";
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

router.post("/creatRfi", protect(), upload.array("documents", 10), createRfi);
router.get("/getAllRfi", protect(), getAllRfis);
export default router;
