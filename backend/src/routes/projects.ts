import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember
} from '../controllers/projects';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all project routes
router.use(authenticate);

// Get user's projects
router.get('/', getProjects);

// Create project (Admin only)
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
    body('memberIds').optional().isArray().withMessage('Member IDs must be an array of numbers'),
  ],
  createProject
);

// Update project metadata (Admin only)
router.put(
  '/:id',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  updateProject
);

// Delete project (Admin only)
router.delete('/:id', requireAdmin, deleteProject);

// Project member management routes
router.get('/:projectId/members', getProjectMembers);
router.post('/:projectId/members', requireAdmin, addProjectMember);
router.delete('/:projectId/members/:userId', requireAdmin, removeProjectMember);

export default router;
