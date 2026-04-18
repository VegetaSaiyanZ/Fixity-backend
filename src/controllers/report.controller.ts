import { Request, Response } from 'express';
import * as ReportService from '../services/report.service';

export const createReport = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const report = await ReportService.createReport(data);
    res.status(201).json(report);
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await ReportService.getReports();
    res.status(200).json(reports);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const report = await ReportService.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.status(200).json(report);
  } catch (error: any) {
    console.error(`Error fetching report ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateReport = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const data = req.body;
    const report = await ReportService.updateReport(id, data);
    res.status(200).json(report);
  } catch (error: any) {
    // If Prisma throws a "RecordNotFound" error we could handle that specifically
    if (error.code === 'P2025') {
       return res.status(404).json({ error: 'Report not found' });
    }
    console.error(`Error updating report ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    await ReportService.deleteReport(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
       return res.status(404).json({ error: 'Report not found' });
    }
    console.error(`Error deleting report ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const supportReport = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    // Assuming user_id comes from req.body for now until auth is added
    const userId = req.body.user_id;

    if (isNaN(reportId) || !userId) {
      return res.status(400).json({ error: 'Invalid report ID or missing user_id' });
    }

    const support = await ReportService.supportReport(reportId, userId);
    res.status(201).json(support);
  } catch (error: any) {
    console.error(`Error supporting report ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const unsupportReport = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    // Assuming user_id comes from req.body (or query) for now until auth is added
    const userId = req.body.user_id;

    if (isNaN(reportId) || !userId) {
      return res.status(400).json({ error: 'Invalid report ID or missing user_id' });
    }

    const removed = await ReportService.unsupportReport(reportId, userId);
    if (!removed) {
      return res.status(404).json({ error: 'Support not found' });
    }
    res.status(204).send();
  } catch (error: any) {
    console.error(`Error unsupporting report ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
