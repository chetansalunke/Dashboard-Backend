import pool from "../config/db.js";

export const getUserByRole = async (req, res) => {
  const { role } = req.query;
  console.log("query paramerter Data");
  console.log(role);

  if (!role) {
    return res
      .status(400)
      .json({ error: "Role is required as a query parameter" });
  }

  try {
    const [rows] = await pool.query(`select * from users where role = ?`, [
      role,
    ]);

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

export const getUserById = async (req, res) => {
  const { id } = req.params; 

  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: `No user found with ID '${id}'` });
    }

    res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const patchUser = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "User ID is required for update" });
  }

  const allowedFields = ["username", "email", "role", "phone_number", "status"];
  const fieldsToUpdate = [];
  const values = [];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fieldsToUpdate.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update" });
  }

  values.push(id); // Add user ID at the end for WHERE clause

  const query = `UPDATE users SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;

  try {
    await pool.query(query, values);
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error("User patch error:", err);
    res.status(500).json({ error: "Database error during user update" });
  }
};

