import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/genrateTokens.js";
import dotenv from "dotenv";
dotenv.config();
export const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, password, role]
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Database error during registration." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // 🔍 Input validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    // 🛢️ Fetch user without password match (security best practice)
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

    // 🔒 Compare hashed password

    // 🎫 Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 🗄️ Store refresh token in DB
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)",
      [user.id, refreshToken]
    );

    // 🍪 Set HttpOnly cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 🎉 Successful login response
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
    const user = jwt.verify(refreshToken, process.env.REFRESS_TOKEN_SECRETE);

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
  if (!refreshToken) return res.sendStatus(204); // No content

  try {
    // 🗑️ Remove token from DB
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
