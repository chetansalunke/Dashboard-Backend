// src/controllers/projectsController.js
import pool from "../config/db.js";

// create project
export const createProject = async (req, res) => {
  try {
    const {
      projectName,
      site_address,
      description,
      duration,
      startDate,
      completionDate,
      projectSize,
      pendingForm,
      userId,
      projectId,
      clientId,
      consultantId,
      assignTo,
    } = req.body;

    const documentPaths = req.files
      ? req.files.map((file) => file.path).join(",")
      : null;

    const creation_date = new Date();
    const status = "Pending";

    if (!userId || !clientId || !consultantId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: "Valid User ID is required" });
    }

    const [result] = await pool.query(
      `INSERT INTO gigfactorydb.projects
        (projectName, description, duration, projectSize, document_upload, assignTo, status, pendingForm, creationDate, userId, client_id, consultant_id, site_address, project_start_date, project_completion_date, project_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectName || null,
        description || null,
        duration || null,
        projectSize || null,
        documentPaths,
        assignTo || null,
        status,
        pendingForm || null,
        creation_date,
        parseInt(userId),
        clientId || null,
        consultantId || null,
        site_address || null,
        startDate || null,
        completionDate || null,
        projectId || null,
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

export const createDrawingList = async (req, res) => {
  try {
    const {
      drawingNumber,
      drawingName,
      startDate,
      endDate,
      assignTo,
      projectId,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO gigfactorydb.drawing_list
        (drawing_number, drawing_name, start_date, end_date,assign_to, project_id)
        VALUES (?,?,?,?,?,?)`,
      [
        drawingNumber || null,
        drawingName || null,
        startDate || null,
        endDate || null,
        assignTo || null,
        projectId || null,
      ]
    );

    res.status(201).json({
      message: "Drawing List created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Database error" });
  }
};
// assign task controller
export const assignTask = async (req, res) => {
  try {
    const {
      taskName,
      priority,
      startDate,
      dueDate,
      checklist,
      assignTo,
      projectId,
    } = req.body;

    // Handle uploaded files (e.g., from multer)
    const documentPaths = req.files
      ? req.files.map((file) => file.path).join(",")
      : null;

    // Convert checklist to JSON string
    const checklistJson = JSON.stringify(checklist || []);

    const [result] = await pool.query(
      `INSERT INTO gigfactorydb.assign_task
        (task_name, priority, start_date, due_date, assign_to, checklist, project_id, assign_task_document)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskName || null,
        priority || "Medium",
        startDate || null,
        dueDate || null,
        assignTo || null,
        checklistJson,
        projectId || null,
        documentPaths,
      ]
    );

    res.status(201).json({
      message: "Task assigned successfully",
      taskId: result.insertId,
    });
  } catch (error) {
    console.error("Error assigning task:", error);
    res.status(500).json({ error: "Database error" });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { projectId, userId, email, designation, status } = req.body;

    const [result] = await pool.query(
      `INSERT INTO gigfactorydb.teams
        (project_id, user_id, email, designation, status)
        VALUES (?, ?, ?, ?, ?)`,
      [
        projectId || null,
        userId || null,
        email || null,
        designation || null,
        status || "internal stakeholder",
      ]
    );

    res.status(201).json({
      message: "Team created successfully",
      teamId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating team:", error);
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

// Get all projects
export const getAllProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, projectName, description, duration, projectSize, document_upload, assignTo, status, pendingForm, submissionDate, userId FROM projects`
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No projects found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    // Map through projects to format document paths properly
    const projects = rows.map((project) => ({
      ...project,
      documents: project.document_upload
        ? project.document_upload
            .split(",")
            .map((doc) => `${baseUrl}${doc.trim()}`)
        : [],
    }));

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Server error" });
  }
};
