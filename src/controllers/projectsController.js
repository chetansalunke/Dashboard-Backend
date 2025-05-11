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

    // ✅ Validate required fields
    if (!drawingNumber || !drawingName || !projectId) {
      return res.status(400).json({
        error:
          "Missing required fields: drawingNumber, drawingName, or projectId",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO gigfactorydb.drawing_list
        (drawing_number, drawing_name, start_date, end_date, assign_to, project_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [
        drawingNumber,
        drawingName,
        startDate || null,
        endDate || null,
        assignTo || null,
        projectId,
      ]
    );

    res.status(201).json({
      message: "Drawing List created successfully",
      drawingId: result.insertId,
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
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : null;

    console.log(documentPaths);

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

export const getDrawingListByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM gigfactorydb.drawing_list WHERE assign_to = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No drawing list items assigned to this user." });
    }

    res.status(200).json({ drawingList: rows });
  } catch (error) {
    console.error("Error fetching drawing list by user ID:", error);
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

// export const createDesignDrawing = async (req, res) => {
//   const {
//     project_id,
//     name,
//     remark,
//     discipline,
//     status,
//     sent_by,
//     previous_versions,
//     uploaded_by,
//   } = req.body;

//   console.log(req.body);
//   console.log(req.files);

//   // 1. Basic Validation
//   if (!project_id || !name || !discipline || !sent_by || !uploaded_by) {
//     return res.status(400).json({ message: "Required fields are missing." });
//   }

//   // 2. File Upload Validation
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({ message: "No files uploaded." });
//   }

//   const documentPaths = req.files.map((file) => file.path); // All uploaded files
//   const final_latest_version_path = documentPaths[0]; // First file as latest version
//   const previous_versions_data = previous_versions || [];

//   const conn = await pool.getConnection();

//   try {
//     await conn.beginTransaction();

//     // 3. Insert into design_drawing_list
//     const [drawingResult] = await conn.query(
//       `
//       INSERT INTO design_drawing_list (
//         project_id, name, remark, discipline,
//         status, sent_by
//       ) VALUES (?, ?, ?, ?, ?, ?)
//       `,
//       [
//         project_id,
//         name,
//         remark || null,
//         discipline,
//         status || "Under Review",
//         sent_by,
//       ]
//     );

//     const drawing_id = drawingResult.insertId;

//     // 4. Insert each file as a version in drawing_versions
//     let version = 1;
//     for (const path of documentPaths) {
//       await conn.query(
//         `
//         INSERT INTO drawing_versions (
//           drawing_id, version_number, document_path, uploaded_by, is_latest
//         ) VALUES (?, ?, ?, ?, ?)
//         `,
//         [
//           drawing_id,
//           version,
//           path,
//           uploaded_by,
//           version === 1 ? true : false, // only the first one is marked latest
//         ]
//       );
//       version++;
//     }

//     await conn.commit();

//     res.status(201).json({
//       message: "Design drawing created successfully with initial version(s)",
//       insertId: drawing_id,
//     });
//   } catch (error) {
//     await conn.rollback();
//     console.error("Error inserting design drawing:", error);

//     res.status(500).json({
//       message: "Error inserting design drawing",
//       error,
//     });
//   } finally {
//     conn.release();
//   }
// };
// export const uploadNewDrawingVersion = async (req, res) => {
//   const { drawing_id } = req.params;
//   const { uploaded_by } = req.body;

//   console.log(req.params);
//   console.log(req.body);
//   console.log(req.files);

//   if (!drawing_id || !uploaded_by || !req.file) {
//     return res
//       .status(400)
//       .json({ message: "Missing required fields or file." });
//   }

//   const filePath = req.file.path;

//   const conn = await pool.getConnection();

//   try {
//     await conn.beginTransaction();

//     // 1. Get latest version number
//     const [[lastVersionRow]] = await conn.query(
//       `SELECT MAX(version_number) AS lastVersion FROM drawing_versions WHERE drawing_id = ?`,
//       [drawing_id]
//     );

//     const version_number = (lastVersionRow?.lastVersion || 0) + 1;

//     // 2. Mark all previous versions as not latest
//     await conn.query(
//       `UPDATE drawing_versions SET is_latest = FALSE WHERE drawing_id = ?`,
//       [drawing_id]
//     );

//     // 3. Insert new version
//     await conn.query(
//       `INSERT INTO drawing_versions (drawing_id, version_number, document_path, uploaded_by, is_latest)
//        VALUES (?, ?, ?, ?, TRUE)`,
//       [drawing_id, version_number, filePath, uploaded_by]
//     );

//     await conn.commit();

//     res.status(201).json({
//       message: "New version uploaded successfully",
//       version: version_number,
//       document_path: filePath,
//     });
//   } catch (error) {
//     await conn.rollback();
//     console.error("Error uploading new drawing version:", error);
//     res.status(500).json({ message: "Failed to upload new version", error });
//   } finally {
//     conn.release();
//   }
// };
// // GET all design drawings
// export const getAllDesignDrawings = async (req, res) => {
//   const { project_id } = req.params; // use 'project_id' to match the route

//   if (!project_id) {
//     return res
//       .status(400)
//       .json({ message: "Project ID is required in the URL parameters." });
//   }

//   try {
//     const [rows] = await pool.query(
//       `SELECT * FROM design_drawing_list WHERE project_id = ?`,
//       [project_id]
//     );

//     res.status(200).json({ designDrawings: rows });
//   } catch (error) {
//     console.error("Error fetching design drawings:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

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

// sentTo api

export const sendDrawingToUser = async (req, res) => {
  const { drawingId } = req.params;
  const { sentTo, sentBy } = req.body;

  try {
    const [existing] = await pool.query(
      "SELECT * FROM design_drawing_list WHERE id = ?",
      [drawingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Drawing not found" });
    }

    await pool.query(
      "UPDATE design_drawing_list SET sent_to = ?, sent_by = ?, status = 'Sent' WHERE id = ?",
      [sentTo, sentBy, drawingId]
    );

    res.status(200).json({ message: "Drawing sent successfully" });
  } catch (error) {
    console.error("Error sending drawing:", error);
    res.status(500).json({ error: "Server error" });
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

// Create Drawing List

export const createDesignDrawing = async (req, res) => {
  try {
    const { project_id, name, remark, discipline, sent_by, sent_to } = req.body;

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

    // Step 1: Insert into design_drawing_list
    const [drawingResult] = await pool.query(
      `INSERT INTO design_drawing_list 
      (project_id, name, remark, discipline, status, sent_by, sent_to) 
      VALUES (?, ?, ?, ?, 'Under Review', ?, ?)`,
      [project_id, name, remark || "", discipline, sent_by, sent_to]
    );

    const drawingId = drawingResult.insertId;

    // Step 2: Insert initial version into drawing_versions
    const [versionResult] = await pool.query(
      `INSERT INTO drawing_versions 
       (drawing_id, version_number, document_path, uploaded_by, is_latest) 
       VALUES (?, ?, ?, ?, 1)`,
      [drawingId, 1, documentPaths, sent_by]
    );

    const latestVersionId = versionResult.insertId;

    // Step 3: Update design_drawing_list with latest_version_id
    await pool.query(
      `UPDATE design_drawing_list SET latest_version_id = ? WHERE id = ?`,
      [latestVersionId, drawingId]
    );

    return res.status(201).json({
      drawing_id: drawingId,
      latest_version_id: latestVersionId,
      message: "Drawing created with version tracking.",
    });
  } catch (err) {
    console.error("Upload/Create Error:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to create drawing with version." });
  }
};
export const uploadDrawingVersion = async (req, res) => {
  try {
    const drawing_id = req.params.id;
    const { uploaded_by, comment } = req.body;
    const documentPaths = req.files
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : null;

    // 1. Get current drawing status
    const [[drawing]] = await pool.query(
      `SELECT status FROM design_drawing_list WHERE id = ?`,
      [drawing_id]
    );

    if (!drawing || drawing.status !== "Revision Required") {
      return res.status(400).json({
        error: "Drawing is not in 'Revision Required' state.",
      });
    }

    // 2. Get latest version
    const [current] = await pool.query(
      `SELECT id, version_number FROM drawing_versions WHERE drawing_id = ? AND is_latest = 1`,
      [drawing_id]
    );
    const currentVersion = current[0];
    const next_version = (currentVersion?.version_number || 0) + 1;

    // 3. Mark previous as not latest
    if (currentVersion) {
      await pool.query(
        `UPDATE drawing_versions SET is_latest = 0 WHERE id = ?`,
        [currentVersion.id]
      );
    }

    // 4. Insert new version
    const [newVersion] = await pool.query(
      `INSERT INTO drawing_versions 
       (drawing_id, version_number, document_path, uploaded_by, comment, is_latest) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [drawing_id, next_version, documentPaths, uploaded_by, comment || ""]
    );

    const newVersionId = newVersion.insertId;

    // 5. Update master table
    await pool.query(
      `UPDATE design_drawing_list 
       SET latest_version_id = ?, previous_version_id = ?, status = 'Under Review' 
       WHERE id = ?`,
      [newVersionId, currentVersion?.id || null, drawing_id]
    );

    return res.status(200).json({
      message: "New version uploaded and sent for review.",
      version_id: newVersionId,
    });
  } catch (err) {
    console.error("Upload Version Error:", err.message);
    return res.status(500).json({ error: "Failed to upload version." });
  }
};

// REVIEW Drawing by Expert
export const reviewDrawing = async (req, res) => {
  try {
    const drawing_id = req.params.id;
    const { status, comment } = req.body;

    // Basic field validation
    if (!drawing_id || !status) {
      return res.status(400).json({
        error: "Missing drawing ID or status.",
      });
    }

    // ✅ Explicit status validation
    const allowedStatuses = ["Approved", "Revision Required"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    // Process based on status
    if (status === "Approved") {
      await pool.query(
        `UPDATE design_drawing_list SET status = 'Approved' WHERE id = ?`,
        [drawing_id]
      );
    } else if (status === "Revision Required") {
      await pool.query(
        `UPDATE design_drawing_list SET status = ? WHERE id = ?`,
        [status, drawing_id]
      );
      await pool.query(
        `UPDATE drawing_versions SET comment = ? WHERE drawing_id = ? AND is_latest = 1`,
        [comment || "", drawing_id]
      );
    }

    return res.status(200).json({
      message: `Drawing marked as ${status}.`,
    });
  } catch (err) {
    console.error("Review Error:", err);
    return res.status(500).json({
      error: "Failed to review drawing.",
    });
  }
};

// SUBMIT Drawing to Client
export const submitToClient = async (req, res) => {
  try {
    const drawing_id = req.params.id;
    const { submitted_by, submitted_to } = req.body;

    if (!drawing_id || !submitted_by || !submitted_to) {
      return sendResponse(res, 400, { error: "Missing required fields." });
    }

    const sql = `
      INSERT INTO submission (drawing_id, submitted_by, submitted_to, status) 
      VALUES (?, ?, ?, 'Under Review')
    `;

    const [result] = await pool.query(sql, [
      drawing_id,
      submitted_by,
      submitted_to,
    ]);

    return sendResponse(res, 201, {
      message: "Drawing submitted to client.",
      submission_id: result.insertId,
    });
  } catch (err) {
    console.error("Submit Error:", err);
    return sendResponse(res, 500, {
      error: "Failed to submit drawing to client.",
    });
  }
};

// CLIENT Reviews Drawing
export const clientReview = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!id || !status) {
      return sendResponse(res, 400, {
        error: "Missing submission ID or status.",
      });
    }

    await pool.query(`UPDATE submission SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);

    if (status === "Approved") {
      await pool.query(
        `UPDATE design_drawing_list 
         SET status = 'Approved' 
         WHERE id = (SELECT drawing_id FROM submission WHERE id = ?)`,
        [id]
      );
    }

    return sendResponse(res, 200, { message: "Client review recorded." });
  } catch (err) {
    console.error("Client Review Error:", err);
    return sendResponse(res, 500, { error: "Failed to update client review." });
  }
};
// get the drawings
export const getDesignDrawings = async (req, res) => {
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

    baseQuery += ` ORDER BY created_at DESC`;

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
      const [countResult] = await pool.query(countQuery, params.slice(0, -2)); // exclude limit/offset
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
    console.error("Get Drawing Error:", err);
    return res.status(500).json({
      error:
        "An error occurred while fetching the drawings. Please try again later.",
    });
  }
};

// get drawing history
export const getDrawingHistory = async (req, res) => {
  try {
    const drawing_id = req.params.id;

    const [versions] = await pool.query(
      `SELECT version_number, document_path, uploaded_by, comment, is_latest, uploaded_at 
       FROM drawing_versions 
       WHERE drawing_id = ? 
       ORDER BY version_number ASC`,
      [drawing_id]
    );

    return res.status(200).json({ versions });
  } catch (err) {
    console.error("History Fetch Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch version history." });
  }
};

export const getAllDrawingsWithVersions = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Optional: check if project exists
    const [projectCheck] = await pool.query(
      "SELECT id FROM projects WHERE id = ?",
      [projectId]
    );
    if (projectCheck.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const [results] = await pool.query(
      `
      SELECT 
        ddl.id AS drawing_id,
        ddl.name AS drawing_name,
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
