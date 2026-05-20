import { Response } from 'express';
import { validationResult } from 'express-validator';
import { getDb } from '../config/db';
import { AuthRequest } from '../middleware/auth';

// List all projects a user has access to
export async function getProjects(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = await getDb();
    let projects;

    if (req.user.role === 'Admin') {
      // Admins see all projects
      projects = await db.all(`
        SELECT p.*, u.name as creator_name, 
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        JOIN users u ON p.creator_id = u.id
        ORDER BY p.created_at DESC
      `);
    } else {
      // Members see only projects they are assigned to
      projects = await db.all(`
        SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        JOIN users u ON p.creator_id = u.id
        WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
        ORDER BY p.created_at DESC
      `, [req.user.id]);
    }

    return res.status(200).json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ error: 'Internal server error retrieving projects' });
  }
}

// Create a new project (Admin only)
export async function createProject(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, memberIds } = req.body;

  try {
    const db = await getDb();
    
    // Insert project
    const result = await db.run(
      'INSERT INTO projects (name, description, creator_id) VALUES (?, ?, ?)',
      [name, description || '', req.user.id]
    );
    const projectId = result.lastID;

    // Automatically add creator to project members
    await db.run(
      'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
      [projectId, req.user.id]
    );

    // Add other members if specified
    if (memberIds && Array.isArray(memberIds)) {
      for (const memberId of memberIds) {
        if (memberId !== req.user.id) { // Avoid duplicate insertion
          await db.run(
            'INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)',
            [projectId, memberId]
          );
        }
      }
    }

    // Retrieve full project details
    const newProject = await db.get(`
      SELECT p.*, u.name as creator_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      WHERE p.id = ?
    `, [projectId]);

    return res.status(201).json(newProject);
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Internal server error creating project' });
  }
}

// Update project metadata (Admin only)
export async function updateProject(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const db = await getDb();

    // Check if project exists
    const project = await db.get('SELECT id FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.run(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description || '', id]
    );

    const updatedProject = await db.get(`
      SELECT p.*, u.name as creator_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      WHERE p.id = ?
    `, [id]);

    return res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Internal server error updating project' });
  }
}

// Delete project (Admin only)
export async function deleteProject(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    const db = await getDb();

    // Check if project exists
    const project = await db.get('SELECT id FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // SQLite cascade delete will remove tasks and project members automatically if configured
    // However, let's delete project members and tasks manually to guarantee cleanup if foreign key support was delayed
    await db.run('DELETE FROM project_members WHERE project_id = ?', [id]);
    await db.run('DELETE FROM tasks WHERE project_id = ?', [id]);
    await db.run('DELETE FROM projects WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Internal server error deleting project' });
  }
}

// Get members of a specific project
export async function getProjectMembers(req: AuthRequest, res: Response) {
  const { projectId } = req.params;

  try {
    const db = await getDb();
    
    // Check access: member must belong to project, or be Admin
    if (req.user?.role !== 'Admin') {
      const isMember = await db.get(
        'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, req.user?.id]
      );
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to project details' });
      }
    }

    const members = await db.all(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = ?
      ORDER BY u.name ASC
    `, [projectId]);

    return res.status(200).json(members);
  } catch (error) {
    console.error('Get project members error:', error);
    return res.status(500).json({ error: 'Internal server error retrieving project members' });
  }
}

// Add a member to a project (Admin only)
export async function addProjectMember(req: AuthRequest, res: Response) {
  const { projectId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const db = await getDb();

    // Verify project exists
    const project = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify user exists
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add to project members
    await db.run(
      'INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)',
      [projectId, userId]
    );

    return res.status(200).json({
      message: 'Member added successfully',
      member: user
    });
  } catch (error) {
    console.error('Add project member error:', error);
    return res.status(500).json({ error: 'Internal server error adding project member' });
  }
}

// Remove a member from a project (Admin only)
export async function removeProjectMember(req: AuthRequest, res: Response) {
  const { projectId, userId } = req.params;

  try {
    const db = await getDb();

    // Verify project exists
    const project = await db.get('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove member
    await db.run(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    // Also set assignee_id to NULL for any tasks in this project assigned to this user
    await db.run(
      'UPDATE tasks SET assignee_id = NULL WHERE project_id = ? AND assignee_id = ?',
      [projectId, userId]
    );

    return res.status(200).json({ message: 'Member removed successfully from project' });
  } catch (error) {
    console.error('Remove project member error:', error);
    return res.status(500).json({ error: 'Internal server error removing project member' });
  }
}
