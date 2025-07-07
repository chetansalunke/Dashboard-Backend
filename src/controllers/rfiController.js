import pool from "../config/db.js";
import path from "path";
export const createRfi = async (req, res) => {
  try {
    const {
      title,
      details,
      priority,
      project_id,
      status,
      created_by,
      send_to,
    } = req.body;

    // Validate required fields
    if (!project_id || !created_by) {
      return res
        .status(400)
        .json({ message: "Missing required fields: project_id or created_by" });
    }

    // Validate priority - assume it should be 'LOW', 'MEDIUM', or 'HIGH'
    const allowedPriorities = ["Low", "Medium", "High"];
    const validatedPriority = allowedPriorities.includes(priority)
      ? priority
      : null;

    if (!validatedPriority) {
      return res.status(400).json({
        message: "Invalid or missing priority. Allowed: LOW, MEDIUM, HIGH",
      });
    }

    const documentPath = req.files
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : "";

    const created_at = new Date();

    const [result] = await pool.query(
      `INSERT INTO rfi (title, details, document_upload, priority, status, project_id, created_by, created_at, send_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title || null,
        details || null,
        documentPath,
        validatedPriority,
        status || "Pending",
        project_id,
        created_by,
        created_at,
        send_to || null,
      ]
    );

    res.status(201).json({
      message: "RFI Created Successfully",
      rfi_id: result.insertId,
      documents: documentPath,
    });
  } catch (error) {
    console.error("Error creating RFI:", error);
    res.status(500).json({
      message: "Failed to create RFI",
      error: error.message,
    });
  }
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
  const user = req.user;
  console.log("From get rfi send to client");
  console.log(user.id);

  try {
    const [results] = await pool.query(
      "SELECT * FROM rfi WHERE send_to = ? or sent_to_client=?",
      [user_id, user_id]
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching user RFIs:", error);
    res.status(500).json({ message: "Error fetching RFIs for user" });
  }
};
// change order controller

export const createChangeOrder = async (req, res) => {
  try {
    const {
      change_request_number,
      project_id,
      date,
      requester,
      mode_of_communication,
      description_of_change,
      details_of_change,
      location_of_change,
      change_component,
      area,
      reason_for_change,
      proof_of_instruction,
      document_option,
      send_to,
    } = req.body;

    if (!project_id || !requester) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const documentPath = req.files
      ? req.files
          .map((file) => path.relative(process.cwd(), file.path))
          .join(",")
      : "";

    const created_at = new Date();

    const [result] = await pool.query(
      `INSERT INTO change_orders 
      (change_request_number, project_id, date, requester, mode_of_communication, 
       description_of_change, details_of_change, location_of_change, change_component, 
       area, reason_for_change, proof_of_instruction, document_option, document_upload, 
       status, send_to, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        change_request_number,
        project_id,
        date,
        requester,
        mode_of_communication,
        description_of_change,
        details_of_change,
        location_of_change,
        change_component,
        area,
        reason_for_change,
        proof_of_instruction,
        document_option,
        documentPath,
        "Pending",
        send_to,
        created_at,
      ]
    );

    res.status(201).json({
      message: "Change Order Created",
      id: result.insertId,
      documents: documentPath,
    });
  } catch (error) {
    console.error("Error creating Change Order:", error);
    res.status(500).json({ message: "Creation failed", error: error.message });
  }
};

// 2. Get All Change Orders
export const getAllChangeOrders = async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM change_orders");
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch change orders" });
  }
};

// 3. Resolve Change Order (Expert/Admin/Client)
export const resolveChangeOrder = async (req, res) => {
  const { id } = req.params;
  const { resolution_details, resolved_by, status } = req.body;

  try {
    // Ensure change order exists
    const [existingRows] = await pool.query(
      `SELECT * FROM change_orders WHERE id = ?`,
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Change order not found" });
    }
    const changeOrder = existingRows[0];

    // Process uploaded resolution documents
    const resolutionDocs =
      req.files?.map((file) =>
        path.relative(process.cwd(), file.path).replace(/\\/g, "/")
      ) || [];
    const resolutionDocsString = resolutionDocs.join(",");
    const resolved_at = new Date();

    // Update change order
    await pool.query(
      `UPDATE change_orders
       SET resolution_details = ?, resolved_by = ?, resolved_at = ?, status = ?, resolution_documents = ?
       WHERE id = ?`,
      [
        resolution_details,
        resolved_by,
        resolved_at,
        status || "Resolved",
        resolutionDocsString,
        id,
      ]
    );

    // Insert into deliverable_list
    await pool.query(
      `INSERT INTO deliverable_list 
        (drawing_number, drawing_name, start_date, end_date, assign_to, project_id, created_at, updated_at, drawing_document, change_order_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        changeOrder.change_request_number, // Or generate drawing number
        changeOrder.description_of_change, // As drawing name
        changeOrder.date, // Use change order date as start_date
        changeOrder.date, // Same for end_date if not available
        changeOrder.resolved_by, // assign_to
        changeOrder.project_id,
        new Date(),
        new Date(),
        resolutionDocsString, // drawing_document
        changeOrder.id,
      ]
    );

    res.status(200).json({
      message: "Change order resolved and deliverable created successfully",
      resolution_documents: resolutionDocs,
    });
  } catch (error) {
    console.error("Failed to resolve change order:", error);
    res.status(500).json({ message: "Failed to resolve change order" });
  }
};

// 4. Forward to Client
export const forwardChangeOrderToClient = async (req, res) => {
  const { clientId, orderId } = req.body;
  const user = req.user;

  if (!["admin", "expert"].includes(user.role)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    await pool.query(
      `UPDATE change_orders SET sent_to_client=?, status='Sent to Client' WHERE id=?`,
      [clientId, orderId]
    );

    res
      .status(200)
      .json({ message: `Change order sent to client ${clientId}` });
  } catch (error) {
    console.error("Forward error:", error);
    res.status(500).json({ message: "Forwarding failed" });
  }
};

// 5. Get Orders Sent to a User
export const getChangeOrdersSentToUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const [results] = await pool.query(
      "SELECT * FROM change_orders WHERE send_to=? OR sent_to_client=?",
      [user_id, user_id]
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to retrieve change orders" });
  }
};
export const getChangeOrdersByProjectId = async (req, res) => {
  const { project_id } = req.params;

  try {
    const query = `SELECT * FROM change_orders WHERE project_id = ?`;
    const [results] = await pool.query(query, [project_id]);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching change orders by project:", error);
    res.status(500).json({ message: "Failed to fetch change orders" });
  }
};
export const getChangeOrdersSentToClient = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT * FROM change_orders 
      WHERE sent_to_client = ? OR send_to = ?
    `;
    const [results] = await pool.query(query, [user_id, user_id]);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching change orders sent to client:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch change orders for client" });
  }
};
