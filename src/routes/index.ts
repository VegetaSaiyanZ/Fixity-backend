import { Router } from 'express';
import exampleRoutes from './example.routes';

const router = Router();

// Register all routes
router.use('/example', exampleRoutes);

export default router;
