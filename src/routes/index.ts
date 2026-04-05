import { Router } from 'express';
import reportRoutes from './report.routes';

const router = Router();

// Register all routes
router.use('/reports', reportRoutes);

export default router;
