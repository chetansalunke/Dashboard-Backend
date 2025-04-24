import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/genrateTokens.js";
import dotenv from "dotenv";
dotenv.config();

export const register = async (req, res) => {
  const { username, email, password, role, phone_number, status } = req.body;

  console.log("Incoming data:", req.body);

  if (!username || !email || !password || !role || !phone_number || !status) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, role, phone_number, status) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, password, role, phone_number, status]
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Database error during registration." });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT id, username, email, role, status ,phone_number 
      FROM users 
      WHERE status IN ("internal_stakeholder", "external_stakeholder")
      `
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }
    res.status(200).json({ users: rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};
export const getUserByRole = async (req, res) => {
  const { role } = req.query;

  if (!role) {
    return res
      .status(400)
      .json({ error: "Role is required as a query parameter" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, username, email, role,phone_number ,status FROM users WHERE role = ?`,
      [role]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: `No users found with role '${role}'` });
    }

    res.status(200).json({ users: rows });
  } catch (error) {
    console.error("Error fetching users by role:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ? and password= ?",
      [email, password]
    );
    if (users.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid credentials. User not found." });
    }

    const user = users[0];

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)",
      [user.id, refreshToken]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      accessToken,
      user: { id: user.id, username: user.username, role: user.role },
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "Refresh Token missing login again " });
  }

  try {
    const user = jwt.verify(refreshToken, process.env.REFRESS_TOKEN_SECRET);

    const [tokens] = await pool.query(
      "Select * from refresh_tokens where user_id = ? and token = ? ",
      [user.id, refreshToken]
    );

    if (tokens.length === 0)
      return res.status(403).json({ message: "Invalid Refresh Token" });
    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(403).json({ message: "Invalid or expired refresh token." });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204);
  try {
    await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [
      refreshToken,
    ]);
    res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout." });
  }
};
