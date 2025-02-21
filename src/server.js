import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = 3000;
const app = express();

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(PORT, (error) => {
  if (error) {
    console.log(`Server error: ${error}`);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});
