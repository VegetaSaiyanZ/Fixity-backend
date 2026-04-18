import { Router } from 'express';
import exampleRoutes from './example.routes';
import reportRoutes from './report.routes';

const router = Router();

// Register all routes
router.use('/example', exampleRoutes);
router.use('/reports', reportRoutes);

export default router;
