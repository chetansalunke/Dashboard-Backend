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
          .json({ message: "Not authorized. Token missing or malformed." });
      }

      const token = authHeader.split(" ")[1];

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      } catch (err) {
        console.error("JWT verify error:", err);
        return res.status(401).json({
          message:
            err.name === "TokenExpiredError"
              ? "Token expired"
              : "Invalid token",
        });
      }

      // Fetch user from DB
      const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
        decoded.id,
      ]);

      if (users.length === 0) {
        return res.status(401).json({ message: "User not found." });
      }

      const user = users[0];
      req.user = user;

      console.log("Authenticated role:", user.role);

      // Check role authorization
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient privileges." });
      }

      next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      return res
        .status(500)
        .json({ message: "Server error during authentication." });
    }
  };
};

export default protect;
