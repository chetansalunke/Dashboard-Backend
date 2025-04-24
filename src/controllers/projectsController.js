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
    // Check for duplicate entry error
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "This user is already added to the project team.",
      });
    }
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
    const [rows] = await pool.query(`SELECT * FROM projects`);

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

export const getProjectById = async (req, res) => {
  const { projectId } = req.params;

  try {
    const [rows] = await pool.query(`SELECT * FROM projects WHERE id = ?`, [
      projectId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = rows[0];
    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const formattedProject = {
      ...project,
      documents: project.document_upload
        ? project.document_upload
            .split(",")
            .map((doc) => `${baseUrl}${doc.trim()}`)
        : [],
    };

    res.status(200).json({ project: formattedProject });
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    res.status(500).json({ error: "Server error" });
  }
};
export const getDrawingsByProjectId = async (req, res) => {
  const { projectId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM drawing_list WHERE project_id = ?`,
      [projectId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No drawings found for this project" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const drawings = rows.map((drawing) => ({
      ...drawing,
      file_url: drawing.file_path
        ? `${baseUrl}${drawing.file_path.trim()}`
        : null,
    }));

    res.status(200).json({ drawings });
  } catch (error) {
    console.error("Error fetching drawings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// get all assign task by project id
export const getAllTaskByProjectId = async (req, res) => {
  const { projectId } = req.params;
  console.log(projectId);

  try {
    const [rows] = await pool.query(
      `SELECT 
	users.username,assign_task.checklist, assign_task.assign_task_document,
  assign_task.task_name, 
  assign_task.priority, 
  projects.projectName 
FROM 
  assign_task 
JOIN 
  projects 
ON 
  assign_task.project_id = projects.id 
  join users on assign_task.assign_to = users.id
WHERE 
  assign_task.project_id = ?`,
      [projectId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No tasks found for this project." });
    }

    console.log("Fetched Tasks:", rows);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error in getAllTaskByProjectId:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAssignedTaskByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM assign_task WHERE project_id = ?`,
      [projectId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No assigned tasks found for this project." });
    }

    return res.status(200).json({ tasks: rows });
  } catch (error) {
    console.error("Error in getAssignedTaskByProject:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTeamDetailsByProjectId = async (req, res) => {
  const { projectId } = req.params;

  try {
    const [rows] = await pool.query(
      `select users.username,users.role,users.email,users.phone_number,users.status,projects.projectName from teams join projects on teams.project_id = projects.id join users on teams.user_id=users.id where teams.project_id = ?
`,
      [projectId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Team Details not found" });
    }

    console.log("Team Details:", rows);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching Team Details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createDesignDrawing = async (req, res) => {
  try {
    const {
      project_id,
      name,
      remark,
      discipline,
      status,
      sent_by,
      previous_versions,
      latest_version_path,
    } = req.body;

    // Ensure required fields exist
    if (!project_id || !name || !discipline || !sent_by) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    // Handle uploaded document file (ensure it's present)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const documentPaths = req.files.map((file) => file.path); // Retrieve all document paths
    if (documentPaths.length === 0) {
      return res.status(400).json({ message: "No valid document uploaded." });
    }

    // If no latest_version_path is provided, set it to the first document uploaded (if any)
    const final_latest_version_path = latest_version_path || documentPaths[0];

    // Handle previous_versions as text from the body (it will already be a string)
    const previous_versions_data = previous_versions ? previous_versions : [];

    // Insert into database
    const [result] = await pool.query(
      `INSERT INTO design_drawing_list (
        project_id, name, remark, discipline, document_path,
        previous_versions, latest_version_path, status, sent_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id,
        name,
        remark || null,
        discipline,
        JSON.stringify(documentPaths), // Store all document paths as JSON array
        JSON.stringify(previous_versions_data), // Ensure previous_versions is stored as JSON
        final_latest_version_path,
        status || "Submitted",
        sent_by,
      ]
    );

    res.status(201).json({
      message: "Design drawing created successfully",
      insertId: result.insertId,
    });
  } catch (error) {
    console.error("Error inserting design drawing:", error);

    // Check for MySQL duplicate entry error
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "A design drawing with the same name or document already exists.",
        error,
      });
    }

    res.status(500).json({
      message: "Error inserting design drawing",
      error,
    });
  }
};

// GET all design drawings
export const getAllDesignDrawings = async (req, res) => {
  const { project_id } = req.params;

  if (!project_id) {
    return res.status(400).json({ message: "project_id is required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM design_drawing_list WHERE project_id = 9 ",
      [project_id]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching design drawings", error });
  }
};
// getAssignTaskByuerID
export const getAssignedProjects = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT p.id, p.projectName
       FROM projects p
       JOIN assign_task at ON p.id = at.project_id
       WHERE at.assign_to = ?`,
      [userId]
    );

    res.status(200).json({ projects: rows });
  } catch (error) {
    console.error("Error fetching assigned projects:", error);
    res.status(500).json({ error: "Server error" });
  }
};
