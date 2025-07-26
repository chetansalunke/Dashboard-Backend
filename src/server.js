import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
// Import routes
import authRoutes from "./routes/authRoutes.js";
import projects from "./routes/projects.js";
import rfiRoutes from "./routes/rfiRoutes.js";
import userRoutes from "./routes/user.routes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Define base upload directories
const BASE_UPLOAD_PATH = process.env.UPLOAD_PATH || "uploads";
const BASE_RFI_PATH = process.env.RFI_PATH || "rfi";
const DESIGN_DRAWING_FOLDER = "design_drawing";
const CHANGE_ORDER_FOLDER = "change_order";

// Define upload directories with absolute paths for internal server use
const uploadsDir = path.join(process.cwd(), BASE_UPLOAD_PATH);
const rfiDir = path.join(process.cwd(), BASE_RFI_PATH);
const designDrawingDir = path.join(uploadsDir, DESIGN_DRAWING_FOLDER);
const changeOrderDir = path.join(process.cwd(), CHANGE_ORDER_FOLDER);

// Ensure directories exist
[uploadsDir, rfiDir, designDrawingDir, changeOrderDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://52.66.253.170",
  "http://52.66.253.170:3000",
  "http://52.66.253.170:5173",
  "http://52.66.241.204",
  "http://52.66.241.204:3000",
  "http://52.66.241.204:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Static file serving (important to define BEFORE API routes)
// These will be accessible via URL paths like /uploads/filename.ext
app.use(
  `/${BASE_UPLOAD_PATH}`,
  express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
app.use(`/${BASE_RFI_PATH}`, express.static(rfiDir));
app.use(`/${CHANGE_ORDER_FOLDER}`, express.static(changeOrderDir));

// Add file download endpoint with proper path resolution
app.get("/download/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;

  // Basic security check to prevent directory traversal
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    folder.includes("..") ||
    folder.includes("/")
  ) {
    return res.status(400).send("Invalid filename or folder");
  }

  let filePath;
  if (folder === BASE_UPLOAD_PATH) {
    filePath = path.join(uploadsDir, filename);
  } else if (folder === BASE_RFI_PATH) {
    filePath = path.join(rfiDir, filename);
  } else if (folder === DESIGN_DRAWING_FOLDER) {
    filePath = path.join(designDrawingDir, filename);
  } else if (folder === CHANGE_ORDER_FOLDER) {
    filePath = path.join(changeOrderDir, filename);
  } else {
    return res.status(400).send("Invalid folder");
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  // Set headers for download
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.sendFile(filePath);
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projects);
app.use("/api", rfiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminDashboardRoutes);

// Test route
app.get("/api/test", (req, res) => res.json({ message: "CORS works!" }));
// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
app.listen(PORT, (error) => {
  if (error) {
    console.log(`Server error: ${error}`);
  } else {
    console.log(`Server running on port ${PORT}`);
    console.log(`File uploads available at: /${BASE_UPLOAD_PATH}`);
    console.log(`RFI files available at: /${BASE_RFI_PATH}`);
    console.log(`Change order files available at: /${CHANGE_ORDER_FOLDER}`);
  }
});
