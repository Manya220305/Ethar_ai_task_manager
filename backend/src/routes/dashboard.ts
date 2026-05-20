import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get dashboard summary (applies to both Admins and Members, scoped appropriately)
router.get('/summary', authenticate, getDashboardSummary);

export default router;
