export const getProjectAverageTaskDelay = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { designerId, groupBy } = req.query; // NEW

    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    let query = `
      SELECT 
        at.id,
        at.task_name,
        at.due_date,
        at.updated_at,
        at.assign_to,
        u.username,
        DATEDIFF(at.updated_at, at.due_date) AS delay_days
      FROM assign_task at
      JOIN users u ON u.id = at.assign_to
      WHERE at.project_id = ?
        AND at.status = 'Completed'
        AND at.due_date IS NOT NULL
        AND at.updated_at IS NOT NULL
    `;

    const params = [projectId];
    if (designerId) {
      query += ` AND at.assign_to = ?`;
      params.push(designerId);
    }

    const [tasks] = await pool.query(query, params);

    if (!tasks.length) {
      return res.status(200).json({
        average_delay: 0,
        delays: [],
        total_tasks: 0,
      });
    }

    // Handle grouping
    const delays = [];
    if (groupBy === "user") {
      const grouped = {};
      tasks.forEach((task) => {
        if (!grouped[task.username]) grouped[task.username] = [];
        grouped[task.username].push(task.delay_days);
      });

      for (const user in grouped) {
        const avg = grouped[user].reduce((a, b) => a + b, 0) / grouped[user].length;
        delays.push({ group: user, delay: parseFloat(avg.toFixed(2)) });
      }
    } else if (groupBy === "week") {
      const grouped = {};
      tasks.forEach((task) => {
        const week = `W${getWeekNumber(new Date(task.updated_at))}`;
        if (!grouped[week]) grouped[week] = [];
        grouped[week].push(task.delay_days);
      });

      for (const week in grouped) {
        const avg = grouped[week].reduce((a, b) => a + b, 0) / grouped[week].length;
        delays.push({ group: week, delay: parseFloat(avg.toFixed(2)) });
      }
    } else {
      // default - each task
      tasks.forEach((task) => {
        delays.push({
          task_id: `T${task.id.toString().padStart(3, "0")}`,
          task_name: task.task_name,
          delay: task.delay_days,
          updated_at: task.updated_at,
          due_date: task.due_date,
          designer: task.username,
        });
      });
    }

    const flatDelays = groupBy ? delays.map((d) => d.delay) : delays.map((d) => d.delay);
    const totalDelay = flatDelays.reduce((a, b) => a + b, 0);
    const avgDelay = totalDelay / flatDelays.length;

    res.status(200).json({
      average_delay: parseFloat(avgDelay.toFixed(2)),
      delays,
      total_tasks: flatDelays.length,
    });
  } catch (error) {
    console.error("Error fetching task delays:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Helper: Get ISO week number
function getWeekNumber(date) {
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + days) / 7);
}

// Get week-wise task completion rate for a project
export const getProjectWeeklyTaskCompletionRate = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    // Get project start and end date
    const [projectData] = await pool.query(
      `SELECT project_start_date AS start_date, project_completion_date AS end_date 
       FROM projects 
       WHERE id = ?`,
      [projectId]
    );

    if (projectData.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { start_date, end_date } = projectData[0];
    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Project start and end dates are required" });
    }

    // Generate week ranges
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const weeks = [];

    let current = new Date(startDate);
    while (current <= endDate) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6); // 7-day week

      if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());

      weeks.push({
        start: weekStart.toISOString().split("T")[0],
        end: weekEnd.toISOString().split("T")[0],
      });

      current.setDate(current.getDate() + 7);
    }

    const results = [];

    for (let i = 0; i < weeks.length; i++) {
      const { start, end } = weeks[i];

      const [taskStats] = await pool.query(
        `SELECT 
           COUNT(*) AS total_tasks,
           SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
         FROM assign_task
         WHERE project_id = ?
           AND DATE(created_at) BETWEEN ? AND ?`,
        [projectId, start, end]
      );

      const total = taskStats[0].total_tasks;
      const completed = taskStats[0].completed_tasks || 0;
      const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

      results.push({
        week: `Week ${i + 1}`,
        start_date: start,
        end_date: end,
        total_tasks: total,
        completed_tasks: completed,
        completion_rate: completionRate,
      });
    }

    const avgCompletion =
      results.reduce((sum, r) => sum + r.completion_rate, 0) / results.length;

    res.status(200).json({
      project_id: projectId,
      weekly_completion: results,
      average_completion_rate: Math.round(avgCompletion),
    });
  } catch (error) {
    console.error("Error fetching weekly task completion rate:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// Get recent activities for RFI, change order, and drawing
export const getRecentProjectActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const { projectId } = req.params;
    const params = [];
    let projectFilter = "";
    if (projectId) {
      projectFilter = "WHERE project_id = ?";
      params.push(projectId);
    }

    // Recent RFIs
    const [recentRfis] = await pool.query(
      `SELECT id, title, status, created_at, resolved_at
       FROM rfi
       ${projectFilter}
       ORDER BY resolved_at DESC, created_at DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );

    // Recent Change Orders
    const [recentChangeOrders] = await pool.query(
      `SELECT id, change_request_number, status, date, resolved_at
       FROM change_orders
       ${projectFilter}
       ORDER BY date DESC, resolved_at DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );

    // Recent Drawings
    const [recentDrawings] = await pool.query(
      `SELECT id, project_id, name, remark, discipline, sent_by, sent_to, created_date, document_path, latest_version_id, previous_version_id, status, expert_status, client_status, created_by, task_id
       FROM design_drawing_list
       ${projectFilter}
       ORDER BY created_date DESC, id DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );

    res.status(200).json({
      recentRfis,
      recentChangeOrders,
      recentDrawings,
    });
  } catch (error) {
    console.error("Error fetching recent project activities:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Get overdue deliverables for a specific project
export const getOverdueDeliverablesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }
    // Only include deliverables that have at least one associated task
    const [overdueDeliverables] = await pool.query(
      `SELECT d.id, d.drawing_name, d.end_date, d.status
       FROM deliverable_list d
       WHERE d.project_id = ?
         AND d.end_date IS NOT NULL
         AND d.end_date < CURDATE()
         AND (d.status IS NULL OR d.status != 'Completed')
         AND EXISTS (
           SELECT 1 FROM assign_task t WHERE t.deliverable_id = d.id
         )`,
      [projectId]
    );

    res.status(200).json({
      project_id: projectId,
      overdue_count: overdueDeliverables.length,
      overdue_deliverables: overdueDeliverables,
    });
  } catch (error) {
    console.error("Error fetching overdue deliverables:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Get upcoming deliverables for a specific project (end date within next 3 days)
export const getUpcomingDeliverablesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }
    // Only include deliverables that have at least one associated task
    const [upcomingDeliverables] = await pool.query(
      `SELECT d.id, d.drawing_name, d.end_date, d.status
   FROM deliverable_list d
   WHERE d.project_id = ?
     AND d.end_date IS NOT NULL
     AND DATE(d.end_date) >= CURDATE()
     AND DATE(d.end_date) < DATE_ADD(CURDATE(), INTERVAL 4 DAY)
     AND (d.status IS NULL OR TRIM(LOWER(d.status)) != 'completed')
     AND EXISTS (
       SELECT 1 FROM assign_task t WHERE t.deliverable_id = d.id
     )`,
      [projectId]
    );

    res.status(200).json({
      project_id: projectId,
      upcoming_count: upcomingDeliverables.length,
      upcoming_deliverables: upcomingDeliverables,
    });
  } catch (error) {
    console.error("Error fetching upcoming deliverables:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Get approval rate for design drawings for a specific project
export const getProjectDrawingApprovalRate = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }
    // Count drawings sent for approval (Sent to Client for approval OR Approved by Client)
    const [sentResult] = await pool.query(
      `SELECT COUNT(*) as sent_count FROM design_drawing_list WHERE project_id = ? AND (status = 'Sent to Client' OR status = 'Approved by Client')`,
      [projectId]
    );
    // Count drawings approved by client
    const [approvedResult] = await pool.query(
      `SELECT COUNT(*) as approved_count FROM design_drawing_list WHERE project_id = ? AND status = 'Approved by Client'`,
      [projectId]
    );
    const sent_count = sentResult[0].sent_count;
    const approved_count = approvedResult[0].approved_count;
    let approval_rate = 0;
    if (sent_count > 0) {
      approval_rate = (approved_count / sent_count) * 100;
    }
    res.status(200).json({
      project_id: projectId,
      sent_for_approval: sent_count,
      approved_by_client: approved_count,
      approval_rate: Math.round(approval_rate * 100) / 100, // rounded to 2 decimals
    });
  } catch (error) {
    console.error("Error fetching drawing approval rate:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Get progress for a specific project
export const getProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }
    // Get project completion date
    const [projectRows] = await pool.query(
      `SELECT project_completion_date FROM projects WHERE id = ?`,
      [projectId]
    );
    if (projectRows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    const project_completion_date = projectRows[0].project_completion_date;
    const today = new Date();
    // Get all deliverables for the project, including status
    const [deliverables] = await pool.query(
      `SELECT id, drawing_name, end_date, status FROM deliverable_list WHERE project_id = ?`,
      [projectId]
    );
    const total_deliverables = deliverables.length;
    if (total_deliverables === 0) {
      return res.status(200).json({
        project_id: projectId,
        total_deliverables: 0,
        completed_deliverables: 0,
        progress_percent: 0,
        status: "in progress",
        deliverables: [],
      });
    }
    let completed_deliverables = 0;
    const deliverableDetails = [];
    // For each deliverable, get its tasks and completion status
    for (const d of deliverables) {
      const [tasks] = await pool.query(
        `SELECT id, task_name, status, due_date FROM assign_task WHERE deliverable_id = ?`,
        [d.id]
      );
      // If all tasks are completed, update deliverable status if not already
      const allCompleted =
        tasks.length > 0 && tasks.every((t) => t.status === "Completed");
      if (allCompleted && d.status !== "Completed") {
        await pool.query(
          `UPDATE deliverable_list SET status = 'Completed', completed_at = NOW() WHERE id = ?`,
          [d.id]
        );
        d.status = "Completed";
      } else if (!allCompleted && d.status === "Completed") {
        await pool.query(
          `UPDATE deliverable_list SET status = 'In Progress', completed_at = NULL WHERE id = ?`,
          [d.id]
        );
        d.status = "In Progress";
      }
      if (d.status === "Completed") completed_deliverables++;
      deliverableDetails.push({
        deliverable_id: d.id,
        drawing_name: d.drawing_name,
        end_date: d.end_date,
        status: d.status,
        all_tasks_completed: allCompleted,
        tasks: tasks,
      });
    }
    const progress_percent = Math.round(
      (completed_deliverables / total_deliverables) * 100
    );
    // Determine project status
    let status = "in progress";
    const allDeliverablesCompleted =
      completed_deliverables === total_deliverables;
    const projectDate = project_completion_date
      ? new Date(project_completion_date)
      : null;
    if (allDeliverablesCompleted && projectDate) {
      if (today < projectDate) {
        status = "before time";
      } else if (
        today.getFullYear() === projectDate.getFullYear() &&
        today.getMonth() === projectDate.getMonth() &&
        today.getDate() === projectDate.getDate()
      ) {
        status = "on time";
      } else if (today > projectDate) {
        status = "delay";
      }
    } else if (
      !allDeliverablesCompleted &&
      projectDate &&
      today > projectDate
    ) {
      status = "delay";
    }
    res.status(200).json({
      project_id: projectId,
      total_deliverables,
      completed_deliverables,
      progress_percent,
      status,
      project_completion_date,
      deliverables: deliverableDetails,
    });
  } catch (error) {
    console.error("Error fetching project progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Get pending and resolved change order counts for a specific project
export const getProjectChangeOrderCounts = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }
    // Pending: status 'Pending' or 'Sent to Client'
    const [pendingResult] = await pool.query(
      `SELECT COUNT(*) as pending_count FROM change_orders WHERE project_id = ? AND (status = 'Pending' OR status = 'Sent to Client')`,
      [projectId]
    );
    // Resolved: status 'Resolved'
    const [resolvedResult] = await pool.query(
      `SELECT COUNT(*) as resolved_count FROM change_orders WHERE project_id = ? AND status = 'Resolved'`,
      [projectId]
    );
    res.status(200).json({
      pending_count: pendingResult[0].pending_count,
      resolved_count: resolvedResult[0].resolved_count,
    });
  } catch (error) {
    console.error("Error fetching change order counts:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Get pending RFIs (title, created_at) and count for a specific project
export const getProjectPendingRfis = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }
    // Get pending RFIs (Pending or Sent to Client)
    const [pendingRfis] = await pool.query(
      `SELECT title, created_at FROM rfi WHERE project_id = ? AND (status = 'Pending' OR status = 'Sent to Client')`,
      [projectId]
    );
    // Get count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as pending_count FROM rfi WHERE project_id = ? AND (status = 'Pending' OR status = 'Sent to Client')`,
      [projectId]
    );
    res.status(200).json({
      pendingRfis,
      pending_count: countResult[0].pending_count,
    });
  } catch (error) {
    console.error("Error fetching pending RFIs:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Get average TAT (Turnaround Time) in days for resolved RFIs for a specific project
export const getProjectRfiAverageTat = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }
    // Calculate TAT for each resolved RFI and then average
    const [result] = await pool.query(
      `SELECT AVG(DATEDIFF(resolved_at, created_at)) AS average_tat_days
       FROM rfi
       WHERE project_id = ? AND resolved_at IS NOT NULL AND created_at IS NOT NULL`,
      [projectId]
    );
    res.status(200).json({ average_tat_days: result[0].average_tat_days });
  } catch (error) {
    console.error("Error fetching RFI average TAT:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Get days remaining for project completion for a specific project
export const getProjectDaysRemaining = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }
    const [result] = await pool.query(
      `SELECT project_completion_date, DATEDIFF(project_completion_date, CURDATE()) AS days_remaining FROM projects WHERE id = ?`,
      [projectId]
    );
    if (result.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json({
      project_completion_date: result[0].project_completion_date,
      days_remaining: result[0].days_remaining,
    });
  } catch (error) {
    console.error("Error fetching project days remaining:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get count of tasks completed today
export const getCompletedTasksTodayCount = async (req, res) => {
  try {
    const { projectId } = req.params;
    let query = `
      SELECT COUNT(*) as completedToday
      FROM assign_task
      WHERE status = 'Completed' AND DATE(updated_at) = CURDATE()`;
    const params = [];
    if (projectId) {
      query += " AND project_id = ?";
      params.push(projectId);
    }
    const [result] = await pool.query(query, params);
    res.status(200).json({ completedToday: result[0].completedToday });
  } catch (error) {
    console.error("Error fetching completed tasks today count:", error);
    res.status(500).json({ error: "Server error" });
  }
};
















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
