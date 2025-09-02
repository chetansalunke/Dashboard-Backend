import pool from "../config/db.js";

export async function createNotification({
  user_id,
  type,
  message,
  related_id = null,
}) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, related_id) VALUES (?, ?, ?, ?)`,
    [user_id, type, message, related_id]
  );
}

export async function getNotificationsForUser(user_id) {
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
    [user_id]
  );
  return rows;
}

export async function markNotificationAsRead(id) {
  await pool.query(`UPDATE notifications SET is_read = TRUE WHERE id = ?`, [
    id,
  ]);
}
