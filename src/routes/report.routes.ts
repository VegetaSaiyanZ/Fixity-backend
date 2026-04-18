import { Router } from 'express';
import * as ReportController from '../controllers/report.controller';

const router = Router();

router.post('/', ReportController.createReport);
router.get('/', ReportController.getReports);
router.get('/:id', ReportController.getReportById);
router.put('/:id', ReportController.updateReport);
router.delete('/:id', ReportController.deleteReport);
router.post('/:id/support', ReportController.supportReport);
router.delete('/:id/support', ReportController.unsupportReport);

export default router;
