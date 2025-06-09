import pool from "../config/db.js";
import path from "path";
export const createRfi = async (req, res) => {
  const { title, details, priority, project_id, status, created_by, send_to } =
    req.body;

  const documentPath = req.files
    ? req.files.map((file) => path.relative(process.cwd(), file.path)).join(",")
    : null;

  const created_at = new Date();

  const [result] = await pool.query(
    `INSERT INTO rfi (title, details, document_upload, priority, status, project_id, created_by, created_at,send_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)`,
    [
      title || null,
      details || null,
      documentPath,
      priority,
      status,
      project_id,
      created_by,
      created_at,
      send_to,
    ]
  );

  res.status(201).json({
    message: "Rfi Created Successfully",
    rfi_id: result.insertId,
    documents: documentPath,
  });
};

export const getAllRfis = async (req, res) => {
  let query = "SELECT * FROM rfi";
  try {
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching RFIs." });
  }
};

export const resolveRfi = async (req, res) => {
  const { rfi_id } = req.params;
  const { resolution_details, resolved_by, status } = req.body;

  const resolutionDocuments = req.files
    ? req.files.map((file) => file.path)
    : [];
  const resolutionDocsString = resolutionDocuments.join(",");

  const resolved_at = new Date();

  try {
    const [existing] = await pool.query(`SELECT * FROM rfi WHERE id = ?`, [
      rfi_id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "RFI not found" });
    }

    await pool.query(
      `UPDATE rfi 
       SET resolution_details = ?, 
           resolved_by = ?, 
           status = ?, 
           resolved_at = ?, 
           resolution_documents = ?
       WHERE id = ?`,
      [
        resolution_details || null,
        resolved_by,
        status || "Resolved",
        resolved_at,
        resolutionDocsString,
        rfi_id,
      ]
    );

    res.status(200).json({
      message: "RFI resolved successfully",
      rfi_id,
      resolution_documents: resolutionDocuments,
    });
  } catch (error) {
    console.error("Error resolving RFI:", error);
    res.status(500).json({ message: "Failed to resolve RFI" });
  }
};
export const getRfisSentToUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const [results] = await pool.query(
      `SELECT * FROM gigfactorydb.rfi where send_to=?`,
      [user_id]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching RFIs sent to user:", error);
    res.status(500).json({ message: "Failed to fetch RFIs." });
  }
};

export const forwardToClient = async (req, res) => {
  const { clientId, rfiId } = req.body;
  const user = req.user;

  try {
    const allowedRoles = ["admin", "expert"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const [existing] = await pool.query(`SELECT * FROM rfi WHERE id = ?`, [
      rfiId,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "RFI not found." });
    }

    await pool.query(
      "UPDATE rfi SET sent_to_client = ?, status = 'Sent to Client' WHERE id = ?",
      [clientId, rfiId]
    );

    res.status(200).json({
      message: `RFI ${rfiId} forwarded to client ${clientId} with status 'Sent to Client'`,
    });
  } catch (error) {
    console.error("Error forwarding RFI:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const clientResolveRfi = async (req, res) => {
  const { rfi_id } = req.params;
  const { resolution_details, status } = req.body;
  const user = req.user;

  const resolutionDocuments = req.files
    ? req.files.map((file) => file.path)
    : [];
  const resolutionDocsString = resolutionDocuments.join(",");

  const resolved_at = new Date();

  try {
    const [existing] = await pool.query(`SELECT * FROM rfi WHERE id = ?`, [
      rfi_id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "RFI not found" });
    }

    const rfi = existing[0];

    // Only the assigned client or admin can resolve
    if (user.role === "client" && rfi.sent_to_client !== user.id) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this RFI." });
    }

    await pool.query(
      `UPDATE rfi 
        SET resolution_details = ?, 
            resolved_by = ?, 
            status = ?, 
            resolved_at = ?, 
            resolution_documents = ?
        WHERE id = ?`,
      [
        resolution_details || null,
        user.id,
        status || "Resolved",
        resolved_at,
        resolutionDocsString,
        rfi_id,
      ]
    );

    res.status(200).json({
      message: "RFI resolved successfully",
      rfi_id,
      resolution_documents: resolutionDocuments,
    });
  } catch (error) {
    console.error("Error resolving RFI:", error);
    res.status(500).json({ message: "Failed to resolve RFI" });
  }
};

export const getRfisSentToClient = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [results] = await pool.query(
      "SELECT * FROM rfi WHERE send_to = ? OR sent_to_client = ?",
      [user_id, user_id]
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching user RFIs:", error);
    res.status(500).json({ message: "Error fetching RFIs for user" });
  }
};
