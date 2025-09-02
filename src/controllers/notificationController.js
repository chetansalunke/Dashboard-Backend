import {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
} from "../models/notificationModel.js";

// Get notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    const notifications = await getNotificationsForUser(user_id);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Mark a notification as read
export const readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await markNotificationAsRead(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
