// src/controllers/adminDashboardController.js
import pool from "../config/db.js";

// Get dashboard overview statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get total projects count
    const [projectsCount] = await pool.query(
      `SELECT COUNT(*) as total FROM projects`
    );

    // Get total users count
    const [usersCount] = await pool.query(
      `SELECT COUNT(*) as total FROM users`
    );

    // Get total tasks count
    const [tasksCount] = await pool.query(
      `SELECT COUNT(*) as total FROM assign_task`
    );

    // Get total deliverables count
    const [deliverablesCount] = await pool.query(
      `SELECT COUNT(*) as total FROM deliverable_list`
    );

    // Get pending tasks count
    const [pendingTasksCount] = await pool.query(
      `SELECT COUNT(*) as total FROM assign_task WHERE status = 'Pending'`
    );

    // Get completed tasks count
    const [completedTasksCount] = await pool.query(
      `SELECT COUNT(*) as total FROM assign_task WHERE status = 'Completed'`
    );

    // Get projects by status
    const [projectsByStatus] = await pool.query(
      `SELECT status, COUNT(*) as count FROM projects GROUP BY status`
    );

    res.status(200).json({
      stats: {
        totalProjects: projectsCount[0].total,
        totalUsers: usersCount[0].total,
        totalTasks: tasksCount[0].total,
        totalDeliverables: deliverablesCount[0].total,
        pendingTasks: pendingTasksCount[0].total,
        completedTasks: completedTasksCount[0].total,
        projectsByStatus: projectsByStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent projects
    const [recentProjects] = await pool.query(
      `SELECT id, projectName, status, creationDate, userId 
       FROM projects 
       ORDER BY creationDate DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    // Get recent tasks
    const [recentTasks] = await pool.query(
      `SELECT at.id, at.task_name, at.status, at.created_at, at.assign_to, p.projectName
       FROM assign_task at
       JOIN projects p ON at.project_id = p.id
       ORDER BY at.created_at DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    // Get recent deliverables
    const [recentDeliverables] = await pool.query(
      `SELECT dl.id, dl.drawing_name, dl.start_date, dl.end_date, dl.assign_to, p.projectName
       FROM deliverable_list dl
       JOIN projects p ON dl.project_id = p.id
       ORDER BY dl.id DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.status(200).json({
      recentActivities: {
        projects: recentProjects,
        tasks: recentTasks,
        deliverables: recentDeliverables,
      },
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get user management data
export const getUsersOverview = async (req, res) => {
  try {
    // Get all users with their project counts
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.status, u.phone_number, u.created_at,
              COUNT(DISTINCT p.id) as project_count,
              COUNT(DISTINCT at.id) as task_count
       FROM users u
       LEFT JOIN projects p ON u.id = p.userId
       LEFT JOIN assign_task at ON u.id = at.assign_to
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    // Get users by role
    const [usersByRole] = await pool.query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );

    // Get active/inactive users
    const [usersByStatus] = await pool.query(
      `SELECT status, COUNT(*) as count FROM users GROUP BY status`
    );

    res.status(200).json({
      users: users,
      usersByRole: usersByRole,
      usersByStatus: usersByStatus,
    });
  } catch (error) {
    console.error("Error fetching users overview:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get projects overview for admin
export const getProjectsOverview = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT p.*, 
             u.username as creator_name,
             c.username as client_name,
             con.username as consultant_name,
             COUNT(DISTINCT at.id) as task_count,
             COUNT(DISTINCT dl.id) as deliverable_count
      FROM projects p
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users con ON p.consultant_id = con.id
      LEFT JOIN assign_task at ON p.id = at.project_id
      LEFT JOIN deliverable_list dl ON p.id = dl.project_id
    `;

    const params = [];

    if (status) {
      query += ` WHERE p.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY p.id ORDER BY p.creationDate DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [projects] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM projects`;
    if (status) {
      countQuery += ` WHERE status = ?`;
      const [totalCount] = await pool.query(countQuery, [status]);
      const total = totalCount[0].total;

      res.status(200).json({
        projects: projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } else {
      const [totalCount] = await pool.query(countQuery);
      const total = totalCount[0].total;

      res.status(200).json({
        projects: projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching projects overview:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get tasks overview for admin
export const getTasksOverview = async (req, res) => {
  try {
    const { status, priority, projectId, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT at.*, 
             p.projectName,
             u.username as assigned_user,
             creator.username as created_by_user
      FROM assign_task at
      JOIN projects p ON at.project_id = p.id
      LEFT JOIN users u ON at.assign_to = u.id
      LEFT JOIN users creator ON at.created_by = creator.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ` AND at.status = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND at.priority = ?`;
      params.push(priority);
    }

    if (projectId) {
      query += ` AND at.project_id = ?`;
      params.push(projectId);
    }

    query += ` ORDER BY at.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [tasks] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM assign_task WHERE 1=1`;
    const countParams = [];

    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    if (priority) {
      countQuery += ` AND priority = ?`;
      countParams.push(priority);
    }
    if (projectId) {
      countQuery += ` AND project_id = ?`;
      countParams.push(projectId);
    }

    const [totalCount] = await pool.query(countQuery, countParams);
    const total = totalCount[0].total;

    res.status(200).json({
      tasks: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks overview:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get system analytics
export const getSystemAnalytics = async (req, res) => {
  try {
    // Projects created over time (last 6 months)
    const [projectsOverTime] = await pool.query(`
      SELECT 
        DATE_FORMAT(creationDate, '%Y-%m') as month,
        COUNT(*) as count
      FROM projects 
      WHERE creationDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(creationDate, '%Y-%m')
      ORDER BY month ASC
    `);

    // Tasks completion rate
    const [taskStats] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM assign_task)), 2) as percentage
      FROM assign_task 
      GROUP BY status
    `);

    // User activity by role
    const [userActivity] = await pool.query(`
      SELECT 
        u.role,
        COUNT(DISTINCT at.id) as tasks_assigned,
        COUNT(DISTINCT p.id) as projects_created
      FROM users u
      LEFT JOIN assign_task at ON u.id = at.assign_to
      LEFT JOIN projects p ON u.id = p.userId
      GROUP BY u.role
    `);

    res.status(200).json({
      analytics: {
        projectsOverTime: projectsOverTime,
        taskStats: taskStats,
        userActivity: userActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching system analytics:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be 'active' or 'inactive'" });
    }

    const [result] = await pool.query(
      `UPDATE users SET status = ? WHERE id = ?`,
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: `User status updated to ${status}` });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get deliverables overview
export const getDeliverablesOverview = async (req, res) => {
  try {
    const { projectId, discipline, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT dl.*, 
             p.projectName,
             u.username as assigned_user
      FROM deliverable_list dl
      JOIN projects p ON dl.project_id = p.id
      LEFT JOIN users u ON dl.assign_to = u.id
      WHERE 1=1
    `;

    const params = [];

    if (projectId) {
      query += ` AND dl.project_id = ?`;
      params.push(projectId);
    }

    if (discipline) {
      query += ` AND dl.discipline = ?`;
      params.push(discipline);
    }

    query += ` ORDER BY dl.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [deliverables] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM deliverable_list WHERE 1=1`;
    const countParams = [];

    if (projectId) {
      countQuery += ` AND project_id = ?`;
      countParams.push(projectId);
    }
    if (discipline) {
      countQuery += ` AND discipline = ?`;
      countParams.push(discipline);
    }

    const [totalCount] = await pool.query(countQuery, countParams);
    const total = totalCount[0].total;

    res.status(200).json({
      deliverables: deliverables,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching deliverables overview:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    // 1. Tasks completed today
    const [tasksToday] = await pool.query(`
      SELECT 
        at.id,
        at.task_name,
        at.project_id,
        p.projectName,
        at.updated_at
      FROM assign_task at
      JOIN projects p ON p.id = at.project_id
      WHERE DATE(at.updated_at) = CURDATE()
        AND at.status = 'Completed'
    `);

    // 2. Project progress
    const [projectProgress] = await pool.query(`
      SELECT 
        p.id AS project_id,
        p.projectName,
        COUNT(at.id) AS total_tasks,
        SUM(CASE WHEN at.status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks,
        ROUND(
          (SUM(CASE WHEN at.status = 'Completed' THEN 1 ELSE 0 END) / COUNT(at.id)) * 100,
          2
        ) AS progress_percent
      FROM projects p
      LEFT JOIN assign_task at ON at.project_id = p.id
      GROUP BY p.id
    `);

    // 3. Time remaining for project completion
    const [projectTimeRemaining] = await pool.query(`
      SELECT 
        id AS project_id,
        projectName,
        project_completion_date,
        DATEDIFF(project_completion_date, CURDATE()) AS days_remaining
      FROM projects
      WHERE project_completion_date IS NOT NULL
    `);

    // 4. Pending RFIs
    const [pendingRFIs] = await pool.query(`
      SELECT 
        r.id,
        r.title,
        r.project_id,
        p.projectName,
        r.status
      FROM rfi r
      JOIN projects p ON p.id = r.project_id
      WHERE r.status IN ('Pending', 'Sent to Client', 'Pending Client Response')
    `);

    // 5. Change Orders Summary
    const [changeOrders] = await pool.query(`
      SELECT 
        c.id,
        c.change_request_number,
        c.project_id,
        p.projectName,
        c.status,
        c.date,
        c.resolved_at
      FROM change_orders c
      JOIN projects p ON p.id = c.project_id
      ORDER BY c.date DESC
    `);

    // Send the aggregated result
    res.json({
      tasksToday,
      projectProgress,
      projectTimeRemaining,
      pendingRFIs,
      changeOrders,
    });
  } catch (error) {
    console.error("Error in Admin Dashboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
