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

      const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
        decoded.id,
      ]);

      if (users.length === 0) {
        return res
          .status(401)
          .json({ message: "User no longer exists in database." });
      }
      console.log("Role ");
      console.log(users[0].role);
      if (roles.length && !roles.includes(users[0].role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient privileges." });
      }

      req.user = users[0];
      console.log(users[0]);
      next();
    } catch (err) {
      console.error("Auth error:", err);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Access token expired." });
      }
      res.status(401).json({ message: "Invalid token." });
    }
  };
};

export default protect;
