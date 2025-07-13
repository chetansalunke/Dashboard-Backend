// src/controllers/projectsController.js
import pool from "../config/db.js";
import path from "path";
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
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : null;

    console.log(documentPaths);
    const creation_date = new Date();
    const status = "Pending";

    const parsedConsultantId =
      consultantId === null ||
      consultantId === undefined ||
      consultantId === "null"
        ? null
        : parseInt(consultantId);
    if (!userId || !clientId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: "Valid User ID is required" });
    }

    if (!userId || !clientId || isNaN(parseInt(userId))) {
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
        parsedConsultantId,
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

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Valid Project ID is required" });
    }

    const {
      projectName,
      site_address,
      description,
      duration,
      startDate,
      completionDate,
      projectSize,
      pendingForm,
      clientId,
      consultantId,
      assignTo,
      status,
    } = req.body;

    const newDocumentPaths = req.files
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : null;

    // Fetch existing document paths
    const [existingDocuments] = await pool.query(
      `SELECT document_upload FROM projects WHERE id = ?`,
      [id]
    );

    const existingDocumentPaths = existingDocuments[0]?.document_upload || "";

    // Combine new and existing document paths
    const combinedDocumentPaths = [existingDocumentPaths, newDocumentPaths]
      .filter(Boolean)
      .join(",");

    const [result] = await pool.query(
      `UPDATE projects SET 
        projectName = ?,
        site_address = ?,
        description = ?,
        duration = ?,
        project_start_date = ?,
        project_completion_date = ?,
        projectSize = ?,
        pendingForm = ?,
        client_id = ?,
        consultant_id = ?,
        assignTo = ?,
        status = ?,
        document_upload = ?
      WHERE id = ?`,
      [
        projectName || null,
        site_address || null,
        description || null,
        duration || null,
        startDate || null,
        completionDate || null,
        projectSize || null,
        pendingForm || null,
        clientId || null,
        consultantId === "null" || consultantId === null
          ? null
          : parseInt(consultantId),
        assignTo || null,
        status || null,
        combinedDocumentPaths,
        id,
      ]
    );

    res.status(200).json({
      message: "Project updated successfully",
      updatedFields: {
        projectName,
        site_address,
        description,
        duration,
        startDate,
        completionDate,
        projectSize,
        pendingForm,
        clientId,
        consultantId,
        assignTo,
        status,
        documentPaths: combinedDocumentPaths,
      },
    });
  } catch (error) {
    console.error("Error updating project:", error);

    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ error: "Invalid field in request" });
    } else if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Foreign key constraint failed" });
    } else {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

// Updated table name from drawing_list to deliverable_list
export const createDeliverableList = async (req, res) => {
  try {
    const {
      drawingNumber,
      drawingName,
      startDate,
      endDate,
      assignTo,
      projectId,
      discipline,
    } = req.body;

    // Validate required fields
    if (!drawingNumber || !drawingName || !projectId || !discipline) {
      return res.status(400).json({
        error:
          "Missing required fields: drawingNumber, drawingName, or projectId or discipline",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO gigfactorydb.deliverable_list
        (drawing_number, drawing_name, start_date, end_date, assign_to, project_id, discipline)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        drawingNumber,
        drawingName,
        startDate || null,
        endDate || null,
        assignTo || null,
        projectId,
        discipline || null, // Added discipline field
      ]
    );

    res.status(201).json({
      message: "Deliverable List created successfully",
      drawingId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating deliverable list:", error);
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
      deliverableId, // Added deliverableId field
      is_drawing,
    } = req.body;

    // Handle uploaded files (e.g., from multer)
    const documentPaths = req.files
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : null;

    console.log(documentPaths);

    // Convert checklist to JSON string
    const checklistJson = JSON.stringify(checklist || []);

    const [result] = await pool.query(
      `INSERT INTO gigfactorydb.assign_task
        (task_name, priority, start_date, due_date, assign_to, checklist, project_id, assign_task_document, deliverable_id,is_drawing)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskName || null,
        priority || "Medium",
        startDate || null,
        dueDate || null,
        assignTo || null,
        checklistJson,
        projectId || null,
        documentPaths,
        deliverableId || null, // Added deliverableId to query
        is_drawing,
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

export const updateCompletedTaskDocuments = async (req, res) => {
  const { taskId } = req.params;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No documents uploaded." });
    }

    const filePaths = req.files.map((file) => file.relativePath);

    // Update the JSON column with uploaded file paths
    await pool.query(
      `UPDATE assign_task SET completed_task_documents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(filePaths), taskId]
    );

    return res.status(200).json({
      message: "Completed task documents updated successfully.",
      files: filePaths,
    });
  } catch (error) {
    console.error("Error updating completed documents:", error);
    return res.status(500).json({
      error: "Failed to update completed task documents. Try again later.",
    });
  }
};

// update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // 1. Check the current status of the task
    const [existing] = await pool.query(
      `SELECT status FROM gigfactorydb.assign_task WHERE id = ?`,
      [taskId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (existing[0].status === "Completed") {
      return res.status(400).json({
        error: "Task is already completed and cannot be updated again",
      });
    }

    // 2. Proceed to update status
    const [result] = await pool.query(
      `UPDATE gigfactorydb.assign_task SET status = ? WHERE id = ?`,
      [status, taskId]
    );

    res.status(200).json({ message: "Task status updated successfully" });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Database error" });
  }
};

export const getDeliverableListByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM gigfactorydb.deliverable_list WHERE assign_to = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No deliverable list items assigned to this user." });
    }

    res.status(200).json({ deliverableList: rows });
  } catch (error) {
    console.error("Error fetching deliverable list by user ID:", error);
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
export const getDeliverablesByProjectId = async (req, res) => {
  const { projectId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM deliverable_list WHERE project_id = ?`,
      [projectId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No deliverables found for this project" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const deliverables = rows.map((deliverable) => ({
      ...deliverable,
      file_url: deliverable.file_path
        ? `${baseUrl}${deliverable.file_path.trim()}`
        : null,
    }));

    res.status(200).json({ deliverables });
  } catch (error) {
    console.error("Error fetching deliverables:", error);
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
      return res.status(200).json(rows);
    }

    return res.status(200).json({ tasks: rows });
  } catch (error) {
    console.error("Error in getAssignedTaskByProject:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
// getAssignTaskByUserID
export const getAssignedTaskByUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT 
  assign_task.*, 
  projects.projectName 
FROM 
  assign_task 
JOIN 
  projects 
ON 
  assign_task.project_id = projects.id 
WHERE 
  assign_task.assign_to = ?
`,
      [userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No assigned tasks found for this user." });
    }

    return res.status(200).json({ tasks: rows });
  } catch (error) {
    console.error("Error in getAssignedTaskByUser:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTeamDetailsByProjectId = async (req, res) => {
  const { projectId } = req.params;

  try {
    const [rows] = await pool.query(
      `select users.id ,users.username,users.role,users.email,users.phone_number,users.status,projects.projectName from teams join projects on teams.project_id = projects.id join users on teams.user_id=users.id where teams.project_id = ?
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

// getAssignedProjects
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

// getProjectsByClientId (client api)
export const getProjectsByClientId = async (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ error: "clientId is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM projects WHERE client_id = ?`,
      [clientId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No projects found for this client." });
    }

    res.status(200).json({ projects: rows });
  } catch (error) {
    console.error("Error fetching client projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getDrawingsSentToUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT d.*, p.projectName, u.username as sentByName
       FROM design_drawing_list d
       JOIN projects p ON d.project_id = p.id
       JOIN users u ON d.sent_by = u.id
       WHERE d.sent_to = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No drawings sent to this user." });
    }

    res.status(200).json({ drawings: rows });
  } catch (error) {
    console.error("Error fetching drawings for user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// DESIGNER Create Design Drawing
export const createDesignDrawing = async (req, res) => {
  try {
    const { project_id, name, remark, discipline, sent_by, sent_to, task_id } =
      req.body;

    if (!project_id || !name || !discipline || !sent_by || !sent_to) {
      return res.status(400).json({
        error:
          "Missing required fields: project_id, name, discipline, sent_by, sent_to",
      });
    }

    const documentPaths = req.files
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : null;

    // 1. Insert into design_drawing_list
    const [drawingResult] = await pool.query(
      `INSERT INTO design_drawing_list 
        (project_id, name, remark, discipline, status, sent_by, sent_to, created_by, task_id) 
       VALUES (?, ?, ?, ?, 'Sent to Expert', ?, ?, ?, ?)`,
      [
        project_id,
        name,
        remark || "",
        discipline,
        sent_by,
        sent_to,
        sent_by,
        task_id,
      ]
    );

    const drawingId = drawingResult.insertId;

    // 2. Insert into drawing_versions including remark
    const [versionResult] = await pool.query(
      `INSERT INTO drawing_versions 
        (drawing_id, version_number, document_path, uploaded_by, is_latest, remark) 
       VALUES (?, 1, ?, ?, 1, ?)`,
      [drawingId, documentPaths, sent_by, remark || ""]
    );

    const latestVersionId = versionResult.insertId;

    // 3. Update latest_version_id in design_drawing_list
    await pool.query(
      `UPDATE design_drawing_list SET latest_version_id = ? WHERE id = ?`,
      [latestVersionId, drawingId]
    );

    // 4. Update task status if task_id exists
    if (task_id) {
      await pool.query(
        `UPDATE assign_task SET status = 'In Progress' WHERE id = ?`,
        [task_id]
      );
    }

    return res.status(201).json({
      drawing_id: drawingId,
      latest_version_id: latestVersionId,
      message: "Drawing created and sent to expert for review.",
    });
  } catch (err) {
    console.error("Create Drawing Error:", err.message);
    return res.status(500).json({ error: "Failed to create drawing." });
  }
};

// DESIGNER update drawing version when designer upload new revisioin Drawing
export const uploadDrawingVersion = async (req, res) => {
  try {
    const drawing_id = req.params.id;
    const { uploaded_by, comment } = req.body;

    const documentPaths = req.files
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : null;

    const [[drawing]] = await pool.query(
      `SELECT status FROM design_drawing_list WHERE id = ?`,
      [drawing_id]
    );

    const allowedStatuses = [
      "Revision Required by Expert",
      "Revision Required by Client",
    ];
    if (!drawing || !allowedStatuses.includes(drawing.status)) {
      return res
        .status(400)
        .json({ error: "Drawing is not in a revision-required state." });
    }

    const [current] = await pool.query(
      `SELECT id, version_number FROM drawing_versions WHERE drawing_id = ? AND is_latest = 1`,
      [drawing_id]
    );
    const currentVersion = current[0];
    const next_version = (currentVersion?.version_number || 0) + 1;

    if (currentVersion) {
      await pool.query(
        `UPDATE drawing_versions SET is_latest = 0 WHERE id = ?`,
        [currentVersion.id]
      );
    }

    const [newVersion] = await pool.query(
      `INSERT INTO drawing_versions 
        (drawing_id, version_number, document_path, uploaded_by, is_latest) 
        VALUES (?, ?, ?, ?, 1)`,
      [drawing_id, next_version, documentPaths, uploaded_by]
    );

    const newVersionId = newVersion.insertId;

    await pool.query(
      `UPDATE design_drawing_list 
       SET latest_version_id = ?, previous_version_id = ?, status = 'Sent to Expert' 
       WHERE id = ?`,
      [newVersionId, currentVersion?.id || null, drawing_id]
    );

    if (comment) {
      await pool.query(
        `INSERT INTO drawing_version_comments 
         (drawing_version_id, commenter_id, commenter_role, comment) 
         VALUES (?, ?, 'Designer', ?)`,
        [newVersionId, uploaded_by, comment]
      );
    }

    return res.status(200).json({
      message: "New version uploaded. Sent to expert for review.",
      version_id: newVersionId,
    });
  } catch (err) {
    console.error("Upload Version Error:", err.message);
    return res.status(500).json({ error: "Failed to upload version." });
  }
};

// REVIEW Drawing by Expert
export const expertReview = async (req, res) => {
  console.log("reviewDrawing by expert api call");
  try {
    const drawing_id = req.params.id;
    const { status, comment, reviewer_id } = req.body;

    if (!drawing_id || !status || !reviewer_id) {
      return res
        .status(400)
        .json({ error: "Missing drawing ID, status, or reviewer ID." });
    }

    // ✅ Allow only certain expert-level statuses
    const allowedStatuses = [
      "Approved by Expert",
      "Revision Required by Expert",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    // ✅ Map to DB-allowed ENUM values for expert_status
    let dbStatus;
    if (status === "Approved by Client") dbStatus = "Approved";
    else if (
      status === "Revision Required by Client" ||
      status === "Rejected by Client"
    )
      dbStatus = "Rejected";
    else dbStatus = "Pending"; // Fallback

    // ✅ Update expert_status with dbStatus
    await pool.query(
      `UPDATE design_drawing_list SET expert_status = ? WHERE id = ?`,
      [dbStatus, drawing_id]
    );

    // ✅ Also update the general drawing status to full status text
    await pool.query(`UPDATE design_drawing_list SET status = ? WHERE id = ?`, [
      status,
      drawing_id,
    ]);

    // ✅ Get latest version
    const [latest] = await pool.query(
      `SELECT id FROM drawing_versions WHERE drawing_id = ? AND is_latest = 1`,
      [drawing_id]
    );

    const latest_version_id = latest[0]?.id;

    // ✅ If there's a comment, save it
    if (comment && latest_version_id) {
      await pool.query(
        `INSERT INTO drawing_version_comments 
         (drawing_version_id, commenter_id, commenter_role, comment) 
         VALUES (?, ?, 'Expert', ?)`,
        [latest_version_id, reviewer_id, comment]
      );
    }

    return res.status(200).json({
      message: `Drawing marked as '${status}' by expert.`,
    });
  } catch (err) {
    console.log("Review Error:", err);
    return res.status(500).json({ error: err });
  }
};

// SUBMIT Drawing to Client
// SUBMIT Drawing to Client
export const submitToClient = async (req, res) => {
  try {
    const drawing_id = req.params.id;
    const { submitted_by, submitted_to, comment } = req.body;

    if (!drawing_id || !submitted_by || !submitted_to) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Optional: Only allow submission if approved by expert
    const [[drawing]] = await pool.query(
      `SELECT status FROM design_drawing_list WHERE id = ?`,
      [drawing_id]
    );

    if (!drawing || drawing.status !== "Approved by Expert") {
      return res.status(400).json({
        error: "Drawing must be 'Approved by Expert' before sending to client.",
      });
    }

    // ✅ Insert into submissions table
    const [result] = await pool.query(
      `INSERT INTO drawing_submissions 
        (drawing_id, submitted_by, submitted_to, status) 
       VALUES (?, ?, ?, 'Pending')`,
      [drawing_id, submitted_by, submitted_to]
    );

    const submission_id = result.insertId;

    // ✅ Update drawing status
    await pool.query(
      `UPDATE design_drawing_list 
       SET status = 'Sent to Client', 
           expert_status = 'Approved', 
           client_status = 'Pending' 
       WHERE id = ?`,
      [drawing_id]
    );

    // ✅ Fetch latest version of the drawing
    const [latest] = await pool.query(
      `SELECT id FROM drawing_versions WHERE drawing_id = ? AND is_latest = 1`,
      [drawing_id]
    );
    const latest_version_id = latest[0]?.id;

    // ✅ If there's a comment, insert it
    if (comment && latest_version_id) {
      await pool.query(
        `INSERT INTO drawing_version_comments 
         (drawing_version_id, commenter_id, commenter_role, comment) 
         VALUES (?, ?, 'Expert', ?)`,
        [latest_version_id, submitted_by, comment]
      );
    }

    return res.status(201).json({
      message: "Drawing submitted to client.",
      submission_id,
    });
  } catch (err) {
    console.error("Submit Error:", err);
    return res.status(500).json({ error: "Failed to submit drawing." });
  }
};

// CLIENT Reviews Drawing
export const clientReview = async (req, res) => {
  try {
    const drawing_id = req.params.id;
    const { status, client_id, comment } = req.body;

    if (!drawing_id || !status || !client_id) {
      return res.status(400).json({
        error: "Missing required fields: drawing ID, status, or client ID.",
      });
    }

    const allowedStatuses = [
      "Approved by Client",
      "Revision Required by Client",
      "Rejected by Client",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    // Map to DB-allowed ENUM values
    let dbStatus;
    if (status === "Approved by Client") dbStatus = "Approved";
    else if (
      status === "Revision Required by Client" ||
      status === "Rejected by Client"
    )
      dbStatus = "Rejected";
    else dbStatus = "Pending"; // Fallback

    // 1. Find latest submission for the drawing
    const [[submission]] = await pool.query(
      `SELECT id FROM drawing_submissions 
       WHERE drawing_id = ? 
       ORDER BY submitted_at DESC 
       LIMIT 1`,
      [drawing_id]
    );

    if (!submission) {
      return res
        .status(404)
        .json({ error: "No submission found for this drawing." });
    }

    const submission_id = submission.id;

    // 2. Get latest version
    const [[drawing]] = await pool.query(
      `SELECT latest_version_id FROM design_drawing_list WHERE id = ?`,
      [drawing_id]
    );

    let version_id = drawing?.latest_version_id;

    if (!version_id) {
      const [[latestVersion]] = await pool.query(
        `SELECT id FROM drawing_versions 
         WHERE drawing_id = ? 
         ORDER BY version_number DESC 
         LIMIT 1`,
        [drawing_id]
      );
      if (!latestVersion) {
        return res.status(404).json({
          error: "No drawing version found for this drawing.",
        });
      }
      version_id = latestVersion.id;
    }

    // 3. Update drawing submission with mapped status
    await pool.query(`UPDATE drawing_submissions SET status = ? WHERE id = ?`, [
      dbStatus,
      submission_id,
    ]);

    // 4. Update design_drawing_list status (you can still keep full status here)
    await pool.query(
      `UPDATE design_drawing_list SET status = ?, client_status = ? WHERE id = ?`,
      [status, dbStatus, drawing_id]
    );

    if (status === "Approved by Client") {
      // ✅ Get task_id from the drawing
      const [[drawingRow]] = await pool.query(
        `SELECT task_id FROM design_drawing_list WHERE id = ?`,
        [drawing_id]
      );

      const taskId = drawingRow?.task_id;

      if (taskId) {
        await pool.query(
          `UPDATE assign_task SET status = 'Completed' WHERE id = ?`,
          [taskId]
        );
      }
    }

    // 5. Optional: Insert comment
    if (comment) {
      await pool.query(
        `INSERT INTO drawing_version_comments (
          drawing_version_id, commenter_id, commenter_role, comment
        ) VALUES (?, ?, 'Client', ?)`,
        [version_id, client_id, comment]
      );
    }

    return res.status(200).json({
      message: `Client review submitted. Drawing marked as "${status}".`,
    });
  } catch (err) {
    console.error("Client Review Error:", err);
    return res.status(500).json({ error: "Failed to process client review." });
  }
};

// EXPERT DESIGNER CLIENT get all drawing BY projectId
export const getAllDrawingsByProjectId = async (req, res) => {
  console.log("get all drawing api ");
  try {
    const { projectId } = req.params;

    // Check if project exists
    const [[projectCheck]] = await pool.query(
      "SELECT id FROM projects WHERE id = ?",
      [projectId]
    );

    if (!projectCheck) {
      return res.status(404).json({ error: "Project not found." });
    }

    const [results] = await pool.query(
      `
      SELECT 
        ddl.id AS drawing_id,
        ddl.name AS drawing_name,
        ddl.remark ,
        ddl.discipline,
        ddl.status,
        ddl.created_date AS last_updated,
        lv.id AS latest_version_id,
        lv.document_path AS latest_document_path,
        lv.version_number AS latest_version_number,
        pv.version_number AS previous_version_number,
        pv.document_path AS previous_document_path,
        u.username AS sent_by_name
      FROM design_drawing_list ddl
      LEFT JOIN drawing_versions lv ON ddl.latest_version_id = lv.id
      LEFT JOIN drawing_versions pv ON ddl.previous_version_id = pv.id
      LEFT JOIN users u ON ddl.sent_by = u.id
      WHERE ddl.project_id = ?
      ORDER BY ddl.created_date DESC
    `,
      [projectId]
    );

    return res.status(200).json({ drawings: results });
  } catch (err) {
    console.error("Fetch Drawings Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch drawing data." });
  }
};

// EXPRT DESIGNER CLIENT get vsersion drawing history  API all expert , designer , client
export const getDrawingHistory = async (req, res) => {
  console.log("History API call");
  try {
    const { id: drawing_id } = req.params;

    // 1. Fetch all versions including remark
    const [versions] = await pool.query(
      `
      SELECT 
        dv.id AS version_id,
        dv.version_number,
        dv.document_path,
        dv.uploaded_by,
        u.username AS uploaded_by_name,
        dv.is_latest,
        dv.uploaded_at,
        dv.remark
      FROM drawing_versions dv
      LEFT JOIN users u ON dv.uploaded_by = u.id
      WHERE dv.drawing_id = ?
      ORDER BY dv.version_number ASC
      `,
      [drawing_id]
    );

    if (!versions.length) {
      return res.status(200).json({
        message: "No versions found for this drawing.",
        count: 0,
        versions: [],
      });
    }

    const versionIds = versions.map((v) => v.version_id);

    // 2. Fetch all comments for the versions
    const [commentRows] = await pool.query(
      `
      SELECT 
        c.drawing_version_id,
        c.commenter_role,
        c.comment,
        c.created_at,
        u.username AS commenter_name
      FROM drawing_version_comments c
      JOIN users u ON c.commenter_id = u.id
      WHERE c.drawing_version_id IN (?)
      ORDER BY c.created_at ASC
      `,
      [versionIds]
    );

    // 3. Combine each version with its comments and remark
    const versionHistory = versions.map((version) => {
      const versionComments = commentRows
        .filter((c) => c.drawing_version_id === version.version_id)
        .map((c) => ({
          commenter_role: c.commenter_role,
          commenter_name: c.commenter_name,
          comment: c.comment,
          created_at: c.created_at,
        }));

      return {
        version_id: version.version_id,
        version_number: version.version_number,
        document_path: version.document_path,
        uploaded_by: version.uploaded_by,
        uploaded_by_name: version.uploaded_by_name,
        is_latest: version.is_latest,
        uploaded_at: version.uploaded_at,
        remark: version.remark || null,
        comments: versionComments,
      };
    });

    // 4. Send final result
    return res.status(200).json({
      message: "Drawing version history retrieved successfully.",
      count: versionHistory.length,
      versions: versionHistory,
    });
  } catch (err) {
    console.error("History Fetch Error:", err);
    return res.status(500).json({
      error: "Failed to fetch drawing version history.",
    });
  }
};

// get Drawings Created by Specific Designer
export const getOnlyDesigerDrawing = async (req, res) => {
  console.log("INSIDE getOnlyDesigerDrawing");
  const designerId = req.user.id; // Assumes protect() middleware sets req.user
  console.log(designerId);

  try {
    const [rows] = await pool.query(
      `SELECT * FROM design_drawing_list WHERE sent_by = ? ORDER BY created_date DESC`,
      [designerId]
    );

    return res.status(200).json({ drawings: rows });
  } catch (err) {
    console.error("Designer Drawings Error:", err);
    return res.status(500).json({ error: "Failed to fetch drawings." });
  }
};

// get  Expert Dashboard (Drawings sent to expert)
export const getDrawingsForExpert = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.username AS designer_name 
       FROM design_drawing_list d 
       JOIN users u ON d.sent_by = u.id
       WHERE d.status = 'Sent to Expert' OR d.expert_status = 'Pending'
       ORDER BY d.created_date DESC`
    );

    return res.status(200).json({ drawings: rows });
  } catch (err) {
    console.error("Expert Dashboard Error:", err);
    return res.status(500).json({ error: "Failed to fetch expert drawings." });
  }
};

//  get Drawing For client
export const getDrawingsForClient = async (req, res) => {
  const authenticatedClientId = req.user.id;
  const clientId = req.params.clientId || authenticatedClientId;

  try {
    const [rows] = await pool.query(
      `
  SELECT 
    ds.id AS submission_id,
    ds.status AS submission_status,
    ds.client_comment,
    ds.submitted_at,

    ddl.id AS drawing_id,
    ddl.name AS drawing_name,
    ddl.discipline,
    ddl.remark,
    ddl.status AS drawing_status,
    ddl.created_date,

    lv.id AS latest_version_id,
    lv.version_number AS latest_version,
    lv.document_path AS latest_document_path,
    lv.uploaded_at AS latest_uploaded_at,

    (
      SELECT dvc.comment
      FROM drawing_version_comments dvc
      WHERE dvc.drawing_version_id = lv.id
      ORDER BY dvc.id DESC
      LIMIT 1
    ) AS latest_version_comment,

    expert.username AS expert_name,
    client.username AS client_name,

    p.projectName AS project_name

  FROM drawing_submissions ds
  INNER JOIN design_drawing_list ddl ON ds.drawing_id = ddl.id
  LEFT JOIN drawing_versions lv ON ddl.latest_version_id = lv.id
  LEFT JOIN users expert ON ds.submitted_by = expert.id
  LEFT JOIN users client ON ds.submitted_to = client.id
  LEFT JOIN projects p ON ddl.project_id = p.id  
  WHERE ds.submitted_to = ?
  ORDER BY ds.submitted_at DESC
  `,
      [clientId]
    );

    return res.status(200).json({ submissions: rows });
  } catch (err) {
    console.error("Client Dashboard Error:", err);
    return res.status(500).json({ error: err });
  }
};

// get Generic Drawing List (any user)
export const getAllDrawings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ddl.*, u.username AS designer_name, p.name AS project_name 
       FROM design_drawing_list ddl
       JOIN users u ON ddl.sent_by = u.id
       JOIN projects p ON ddl.project_id = p.id
       ORDER BY ddl.created_date DESC`
    );

    return res.status(200).json({ drawings: rows });
  } catch (err) {
    console.error("Generic Drawings Error:", err);
    return res.status(500).json({ error: "Failed to fetch drawings." });
  }
};

// Submissions History for a User
export const getMySubmissions = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT ds.*, ddl.name AS drawing_name, ddl.discipline, ddl.status AS drawing_status
       FROM drawing_submissions ds
       JOIN design_drawing_list ddl ON ds.drawing_id = ddl.id
       WHERE ds.submitted_by = ? OR ds.submitted_to = ?
       ORDER BY ds.submitted_at DESC`,
      [userId, userId]
    );

    return res.status(200).json({ submissions: rows });
  } catch (err) {
    console.error("Submission History Error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch submission history." });
  }
};

// get  filtered and paginated lists of drawings using multiple query parameters.
export const getDesignDrawings = async (req, res) => {
  console.log("Inside getDesignDrawings");
  try {
    const { id } = req.params;
    const {
      project_id,
      discipline,
      status,
      sent_by,
      sent_to,
      includeVersions,
      page = 1,
      limit = 20,
    } = req.query;

    const filters = [];
    const params = [];

    let baseQuery = `SELECT * FROM design_drawing_list`;
    let countQuery = `SELECT COUNT(*) as total FROM design_drawing_list`;

    if (id) {
      filters.push("id = ?");
      params.push(id);
    } else {
      if (project_id) {
        filters.push("project_id = ?");
        params.push(project_id);
      }
      if (discipline) {
        filters.push("discipline = ?");
        params.push(discipline);
      }
      if (status) {
        filters.push("status = ?");
        params.push(status);
      }
      if (sent_by) {
        filters.push("sent_by = ?");
        params.push(sent_by);
      }
      if (sent_to) {
        filters.push("sent_to = ?");
        params.push(sent_to);
      }
    }

    if (filters.length > 0) {
      const whereClause = ` WHERE ` + filters.join(" AND ");
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    baseQuery += ` ORDER BY created_date DESC`;

    if (!id) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      baseQuery += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), offset);
    }

    const [drawings] = await pool.query(baseQuery, params);

    if (id && drawings.length === 0) {
      return res.status(404).json({ error: "Drawing not found." });
    }

    if (id && includeVersions === "true") {
      const [versions] = await pool.query(
        `SELECT * FROM drawing_versions WHERE drawing_id = ? ORDER BY version_number DESC`,
        [id]
      );
      drawings[0].versions = versions;
    }

    let total = drawings.length;
    if (!id) {
      const [countResult] = await pool.query(
        countQuery,
        params.slice(0, -2) // Remove LIMIT & OFFSET
      );
      total = countResult[0]?.total || 0;
    }

    return res.status(200).json({
      message: "Drawings retrieved successfully.",
      count: drawings.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: id ? drawings[0] : drawings,
    });
  } catch (err) {
    console.log("Get Drawing Error:", err);
    return res.status(500).json({
      error:
        "An error occurred while fetching the drawings. Please try again later.",
    });
  }
};

export const getClientInfoByProjectId = async (req, res) => {
  const { projectId } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        users.id,
        users.username,
        users.email,
        users.phone_number,
        users.role
      FROM projects
      JOIN users ON projects.client_id = users.id
      WHERE projects.id = ?
      `,
      [projectId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Client not found for this project." });
    }

    res.status(200).json(rows[0]); // Return single client info
  } catch (err) {
    console.error("Error fetching client info by project ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// New API to fetch deliverables for a specific project ID
export const getDeliverableByProjectId = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM deliverable_list WHERE project_id = ?`,
      [projectId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No deliverables found for this project" });
    }

    res.status(200).json({ deliverables: rows });
  } catch (error) {
    console.error("Error fetching deliverables by project ID:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// New API to fetch deliverables for a specific project ID
export const getAllDeliverable = async (req, res) => {
  const { userId } = req.params;

  // if (!userId) {
  //   return res.status(400).json({ error: "User ID is required" });
  // }

  try {
    const [rows] = await pool.query(`SELECT * FROM deliverable_list`);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No deliverables found for this user" });
    }

    res.status(200).json({ deliverables: rows });
  } catch (error) {
    console.error("Error fetching deliverables by user ID:", error);
    res.status(500).json({ error: "Server error" });
  }
};
