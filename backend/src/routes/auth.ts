import { Router } from 'express';
import { body } from 'express-validator';
import { signup, login, me, getUsers } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member'),
  ],
  signup
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Get current user
router.get('/me', authenticate, me);

// Get all users (dropdown lists)
router.get('/users', authenticate, getUsers);

export default router;
