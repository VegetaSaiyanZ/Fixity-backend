import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadReportImage } from '../middleware/uploadMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET all reports from the database
router.get('/', async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        // Example of fetching related data (Joins)
        category: true,
        city: true
      }
    });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

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

export default router;
