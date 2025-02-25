// src/controllers/projectsController.js
import pool from "../config/db.js";

export const createProject = async (req, res) => {
  try {
    const {
      projectName,
      description,
      duration,
      projectSize,
      assignTo,
      pendingForm,
      userId,
    } = req.body;

    // ✅ Handle multiple files: map file paths into an array and join into a string
    const documentPaths = req.files
      ? req.files.map((file) => file.path).join(",")
      : null;

    const submissionDate = new Date(); // Use current date as submission date
    const status = "Pending"; // Default status

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: "Valid User ID is required" });
    }

    // Insert into projects table
    const [result] = await pool.query(
      `INSERT INTO projects
        (projectName, description, duration, projectSize, document_upload, assignTo, status, pendingForm, submissionDate, userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectName || null,
        description || null,
        duration || null,
        projectSize || null,
        documentPaths, // ✅ Store comma-separated file paths
        assignTo || null,
        status,
        pendingForm || null,
        submissionDate,
        parseInt(userId), // Ensure userId is an integer
      ]
    );

    res.status(201).json({
      message: "Project created successfully",
      projectId: result.insertId,
      documents: documentPaths,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// Get project documents by ID
export const getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;

    const [rows] = await pool.query(
      `SELECT document_upload FROM projects WHERE id = ?`,
      [projectId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/`;
    const documentPaths = rows[0].document_upload
      ? rows[0].document_upload
          .split(",")
          .map((doc) => `${baseUrl}${doc.trim()}`)
      : [];

    res.status(200).json({
      projectId,
      documents: documentPaths,
    });
  } catch (error) {
    console.error("Error fetching project documents:", error);
    res.status(500).json({ error: "Server error" });
  }
};
