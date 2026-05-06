import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AiService } from '../services/ai.service';
import fs from 'fs';

const prisma = new PrismaClient();

export class ReportController {
  
  static async uploadAndAnalyze(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image uploaded' });
        return;
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      const filePath = req.file.path;
      
      // Read file into buffer for the AI service
      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = req.file.mimetype;

      const aiDraft = await AiService.analyzeImage(fileBuffer, mimeType);

      res.status(200).json({
        message: 'Image uploaded and analyzed successfully',
        imageUrl,
        aiDraft
      });
    } catch (error) {
      console.error('Error in uploadAndAnalyze:', error);
      res.status(500).json({ error: 'Failed to upload and analyze image' });
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const reports = await prisma.report.findMany({
        include: {
          category: true,
          city: true,
          requester: {
            select: { firstName: true, lastName: true }
          }
        }
      });
      res.status(200).json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await prisma.report.findUnique({
        where: { reportId: Number(id) },
        include: {
          category: true,
          city: true,
          requester: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.status(200).json(report);
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { requesterId, categoryId, cityId, description, latitude, longitude, beforeImageUrl } = req.body;
      
      const newReport = await prisma.report.create({
        data: {
          requesterId: Number(requesterId),
          categoryId: Number(categoryId),
          cityId: Number(cityId),
          description,
          latitude,
          longitude,
          beforeImageUrl
        }
      });

      res.status(201).json({ message: 'Report created successfully', report: newReport });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const updatedReport = await prisma.report.update({
        where: { reportId: Number(id) },
        data
      });

      res.status(200).json({ message: 'Report updated successfully', report: updatedReport });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await prisma.report.delete({
        where: { reportId: Number(id) }
      });

      res.status(200).json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
}
