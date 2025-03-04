import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
import projects from "./routes/projects.js";
dotenv.config();

const PORT = 3000;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://65.0.178.244",
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

// Your routes
app.get("/api/test", (req, res) => res.json({ message: "CORS works!" }));
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
