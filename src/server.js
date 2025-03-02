import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
import projects from "./routes/projects.js";
dotenv.config();

const PORT = 3000;
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from your frontend
    credentials: true, // Allow sending cookies and headers
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed methods
    allowedHeaders: "Content-Type,Authorization", // Allowed headers
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/projects", projects);

app.get("/", (req, res) => {
  res.json({ message: "Wellcome Api" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, (error) => {
  if (error) {
    console.log(`Server error: ${error}`);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});
