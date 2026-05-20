import { Response } from 'express';
import { validationResult } from 'express-validator';
import { getDb } from '../config/db';
import { AuthRequest } from '../middleware/auth';

// Get all tasks for a project
export async function getTasksByProject(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { projectId } = req.params;

  try {
    const db = await getDb();

    // Check project authorization (User must be Admin, or a member of the project)
    if (req.user.role !== 'Admin') {
      const isMember = await db.get(
        'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, req.user.id]
      );
      if (!isMember) {
        return res.status(403).json({ error: 'Forbidden. You are not a member of this project.' });
      }
    }

    const tasks = await db.all(`
      SELECT t.*, 
             u_assignee.name as assignee_name, u_assignee.email as assignee_email,
             u_creator.name as creator_name
      FROM tasks t
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      JOIN users u_creator ON t.creator_id = u_creator.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `, [projectId]);

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ error: 'Internal server error retrieving tasks' });
  }
}

// Create a task (Admin only)
export async function createTask(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { projectId } = req.params;
  const { title, description, status, priority, due_date, assignee_id } = req.body;

  try {
    const db = await getDb();

    // Verify project exists
    const project = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify assignee is a member of the project if assignee_id is provided
    if (assignee_id) {
      const isMember = await db.get(
        'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, assignee_id]
      );
      if (!isMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    // Insert task
    const result = await db.run(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        title,
        description || '',
        status || 'To Do',
        priority || 'Medium',
        due_date || null,
        assignee_id || null,
        req.user.id
      ]
    );

    const taskId = result.lastID;

    const newTask = await db.get(`
      SELECT t.*, 
             u_assignee.name as assignee_name, u_assignee.email as assignee_email,
             u_creator.name as creator_name
      FROM tasks t
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      JOIN users u_creator ON t.creator_id = u_creator.id
      WHERE t.id = ?
    `, [taskId]);

    return res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Internal server error creating task' });
  }
}

// Update task status and/or details
export async function updateTask(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { title, description, status, priority, due_date, assignee_id } = req.body;

  try {
    const db = await getDb();

    // Verify task exists
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check project membership (User must be Admin, or a member of the project)
    const isMember = await db.get(
      'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
      [task.project_id, req.user.id]
    );

    if (req.user.role !== 'Admin' && !isMember) {
      return res.status(403).json({ error: 'Forbidden. You do not have access to this project.' });
    }

    if (req.user.role === 'Admin') {
      // Admins can update everything
      // Verify assignee is member of project if changing assignee_id
      if (assignee_id && assignee_id !== task.assignee_id) {
        const isAssigneeMember = await db.get(
          'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
          [task.project_id, assignee_id]
        );
        if (!isAssigneeMember) {
          return res.status(400).json({ error: 'Assignee must be a member of the project' });
        }
      }

      await db.run(
        `UPDATE tasks 
         SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, assignee_id = ?
         WHERE id = ?`,
        [
          title !== undefined ? title : task.title,
          description !== undefined ? description : task.description,
          status !== undefined ? status : task.status,
          priority !== undefined ? priority : task.priority,
          due_date !== undefined ? due_date : task.due_date,
          assignee_id !== undefined ? assignee_id : task.assignee_id,
          id
        ]
      );
    } else {
      // Members can only update the STATUS of the task (and only if they belong to the project)
      // They cannot change description, title, priority, due_date, or assignees.
      if (title !== undefined || description !== undefined || priority !== undefined || due_date !== undefined || assignee_id !== undefined) {
        return res.status(403).json({ error: 'Forbidden. Only Admins can modify task details. Members can only update task status.' });
      }

      if (status !== undefined) {
        await db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
      }
    }

    const updatedTask = await db.get(`
      SELECT t.*, 
             u_assignee.name as assignee_name, u_assignee.email as assignee_email,
             u_creator.name as creator_name
      FROM tasks t
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      JOIN users u_creator ON t.creator_id = u_creator.id
      WHERE t.id = ?
    `, [id]);

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Internal server error updating task' });
  }
}

// Delete task (Admin only)
export async function deleteTask(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    const db = await getDb();

    // Verify task exists
    const task = await db.get('SELECT id FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Internal server error deleting task' });
  }
}
