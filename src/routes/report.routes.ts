import { Router } from 'express';
import { uploadReportImage } from '../middleware/uploadMiddleware';
import { ReportController } from '../controllers/report.controller';

const router = Router();

// Routes for reports
router.get('/', ReportController.getAll);
router.get('/:id', ReportController.getById);

// Upload image and get AI analysis draft
router.post('/upload-analyze', uploadReportImage.single('image'), ReportController.uploadAndAnalyze);

// Create report after user confirms draft
router.post('/', ReportController.create);

// Update/Delete reports
router.patch('/:id', ReportController.update);
router.delete('/:id', ReportController.delete);

export default router;
