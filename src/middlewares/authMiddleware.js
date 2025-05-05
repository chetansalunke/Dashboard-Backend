import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

const protect = (...roles) => {
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

      const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
        decoded.id,
      ]);

      if (users.length === 0) {
        return res
          .status(401)
          .json({ message: "User no longer exists in database." });
      }

      const user = users[0];
      req.user = user;

      console.log("Authenticated role:", user.role);

      // Check if user's role is in allowed roles
      if (roles.length && !roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient privileges." });
      }

      next();
    } catch (err) {
      console.error("Auth error:", err);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Access token expired." });
      }

      return res.status(401).json({ message: "Invalid token." });
    }
  };
};

export default protect;
