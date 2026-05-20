import { Response } from 'express';
import { getDb } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const userId = req.user.id;
  const isAdmin = req.user.role === 'Admin';

  try {
    const db = await getDb();
    
    // 1. Get projects list to filter tasks if user is not Admin
    let tasksQuery = `
      SELECT t.*, p.name as project_name, u.name as assignee_name 
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
    `;
    let queryParams: any[] = [];

    if (!isAdmin) {
      tasksQuery += ` WHERE t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)`;
      queryParams.push(userId);
    }

    const tasks = await db.all(tasksQuery, queryParams);

    // 2. Compute stats in JS for reliability and flexibility
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let totalTasks = tasks.length;
    let toDoCount = 0;
    let inProgressCount = 0;
    let reviewCount = 0;
    let completedCount = 0;
    let overdueCount = 0;
    let highPriorityCount = 0;
    let assignedToMeCount = 0;
    let assignedToMeOverdueCount = 0;

    const upcomingTasks: any[] = [];

    for (const task of tasks) {
      // Status counting
      if (task.status === 'To Do') toDoCount++;
      else if (task.status === 'In Progress') inProgressCount++;
      else if (task.status === 'Review') reviewCount++;
      else if (task.status === 'Completed') completedCount++;

      // Priority
      if (task.priority === 'High') highPriorityCount++;

      // Assigned to me
      const isAssignedToMe = task.assignee_id === userId;
      if (isAssignedToMe) {
        assignedToMeCount++;
      }

      // Overdue calculation (if not completed and due date is in the past)
      let isOverdue = false;
      if (task.due_date && task.status !== 'Completed') {
        const taskDueDateOnly = task.due_date.split('T')[0]; // Format comparison
        if (taskDueDateOnly < todayStr) {
          overdueCount++;
          isOverdue = true;
          if (isAssignedToMe) {
            assignedToMeOverdueCount++;
          }
        }
      }

      // Collect upcoming (due in future or today, and not completed)
      if (task.due_date && task.status !== 'Completed') {
        const taskDueDateOnly = task.due_date.split('T')[0];
        if (taskDueDateOnly >= todayStr) {
          upcomingTasks.push({
            id: task.id,
            title: task.title,
            project_name: task.project_name,
            due_date: task.due_date,
            priority: task.priority,
            status: task.status,
            assignee_name: task.assignee_name
          });
        }
      }
    }

    // Sort upcoming tasks by due date ascending, and take top 5
    upcomingTasks.sort((a, b) => a.due_date.localeCompare(b.due_date));
    const limitedUpcomingTasks = upcomingTasks.slice(0, 5);

    // Get project-specific summary (list of projects with tasks stats)
    let projectsQuery = `
      SELECT p.id, p.name, p.description, u.name as creator_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Completed') as completed_tasks
      FROM projects p
      JOIN users u ON p.creator_id = u.id
    `;
    let projectParams: any[] = [];
    if (!isAdmin) {
      projectsQuery += ` WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)`;
      projectParams.push(userId);
    }
    const projectsSummary = await db.all(projectsQuery, projectParams);

    return res.status(200).json({
      summary: {
        totalTasks,
        toDo: toDoCount,
        inProgress: inProgressCount,
        review: reviewCount,
        completed: completedCount,
        overdue: overdueCount,
        highPriority: highPriorityCount,
        assignedToMe: assignedToMeCount,
        assignedToMeOverdue: assignedToMeOverdueCount
      },
      upcomingTasks: limitedUpcomingTasks,
      projects: projectsSummary
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return res.status(500).json({ error: 'Internal server error retrieving dashboard stats' });
  }
}
