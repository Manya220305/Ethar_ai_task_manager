import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask
} from '../controllers/tasks';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all task routes
router.use(authenticate);

// Get tasks for a project
router.get('/project/:projectId', getTasksByProject);

// Create task in a project (Admin only)
router.post(
  '/project/:projectId',
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('status').optional().isIn(['To Do', 'In Progress', 'Review', 'Completed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('due_date').optional().trim(),
    body('assignee_id').optional().custom((val) => val === null || typeof val === 'number').withMessage('Assignee ID must be a number or null'),
  ],
  createTask
);

// Update task details (Admin can update everything; Member can update status only)
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty'),
    body('description').optional().trim(),
    body('status').optional().isIn(['To Do', 'In Progress', 'Review', 'Completed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('due_date').optional().trim(),
    body('assignee_id').optional().custom((val) => val === null || typeof val === 'number').withMessage('Assignee ID must be a number or null'),
  ],
  updateTask
);

// Delete task (Admin only)
router.delete('/:id', requireAdmin, deleteTask);

export default router;
