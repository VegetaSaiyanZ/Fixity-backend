import { Router, Request, Response } from 'express';
import * as ReportController from '../controllers/report.controller';
import { uploadReportImage } from '../middleware/uploadMiddleware';

const router = Router();

// POST upload a report image
router.post('/upload', uploadReportImage.single('image'), (req: Request, res: Response): void => {
  // Multer handles the upload. If successful, req.file exists.
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded or invalid file format.' });
    return;
  }

  // Generate the public URL where the image can be viewed
  // E.g: You would save this `imageUrl` variable to your PostgreSQL db when creating a Report!
  const imageUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    message: 'Image uploaded successfully!',
    imageUrl
  });
});

// Standard CRUD endpoints mapped to Controller
router.post('/', ReportController.createReport);
router.get('/', ReportController.getReports);
router.get('/:id', ReportController.getReportById);
router.put('/:id', ReportController.updateReport);
router.delete('/:id', ReportController.deleteReport);
router.post('/:id/support', ReportController.supportReport);
router.delete('/:id/support', ReportController.unsupportReport);

export default router;
