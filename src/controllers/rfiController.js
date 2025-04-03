import pool from "../config/db.js";

export const createRfi = async (req, res) => {
  const { title, details, priority, project_id, status, created_by } = req.body;

  const documentPath = req.files ? req.files.map((file) => file.path) : [];

  const created_at = new Date();

  const documentPathsString = documentPath.join(",");

  // Insert query with document paths as a string
  const [result] = await pool.query(
    `INSERT INTO rfi (title, details, document_upload, priority, status, project_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title || null,
      details || null,
      documentPathsString,
      priority,
      status,
      project_id,
      created_by,
      created_at,
    ]
  );

  // Send the response with 'documents' as an array
  res.status(201).json({
    message: "Rfi Created Successfully",
    rfi_id: result.insertId,
    documents: documentPath, // Respond with the array of file paths
  });
};

export const getAllRfis = async (req, res) => {
  // Build the base SQL query
  let query = "SELECT * FROM rfi"; // Base query
  try {
    // Execute the query with the parameters
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching RFIs." });
  }
};
