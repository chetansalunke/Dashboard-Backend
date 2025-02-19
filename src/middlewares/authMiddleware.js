import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

const protect = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Not authorized, token missing." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      console.log("Decoded Token:", decoded);

      // Match DB field with token payload (id/userId as per your token)
      const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
        decoded.id, // Change this if your payload uses a different key
      ]);

      if (users.length === 0) {
        return res.status(401).json({ message: "User no longer exists." });
      }

      // ⚡ Role-based access validation
      if (roles.length && !roles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient privileges." });
      }

      req.user = users[0];
      next();
    } catch (err) {
      console.error("Auth error:", err);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "⚠️ Access token expired." });
      }
      res.status(401).json({ message: "Invalid token." });
    }
  };
};

export default protect;
