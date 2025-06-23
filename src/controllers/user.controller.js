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
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required for update" });
    }

    const { username, email, role, phone_number, status } = req.body;

    const [result] = await pool.query(
      `UPDATE users SET 
        username = ?,
        email = ?,
        role = ?,
        phone_number = ?,
        status = ?
      WHERE id = ?`,
      [
        username || null,
        email || null,
        role || null,
        phone_number || null,
        status || null,
        id,
      ]
    );

    res.status(200).json({
      message: "User updated successfully",
      updatedFields: {
        username,
        email,
        role,
        phone_number,
        status,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ error: "Invalid field in request" });
    } else if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Foreign key constraint failed" });
    } else {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};
