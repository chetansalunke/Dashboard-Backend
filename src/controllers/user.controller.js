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
  const { id } = req.params; // assuming you're passing user ID in the URL path

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
