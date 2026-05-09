import { Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { TaskService } from "@/services/task.service";
import { CustomError } from "@/middleware/error.middleware";

export class TaskController {
  static async getAllByCity(req: AuthRequest, res: Response) {
    const userCityId = req.user?.cityId || null;
    const tasks = await TaskService.getAllByCity(userCityId);
    res.status(200).json(tasks);
  }

  static async create(req: AuthRequest, res: Response) {
    const userCityId = req.user?.cityId || null;
    const newTask = await TaskService.create(req.body, userCityId);
    res.status(201).json({ message: "Task created successfully", task: newTask });
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError("Invalid task ID", 400);

    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) throw new CustomError("Unauthorized", 401);

    const updatedTask = await TaskService.updateStatus(id, userId, userRole, req.body);
    res.status(200).json({ message: "Task status updated successfully", task: updatedTask });
  }

  static async assignWorker(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError("Invalid task ID", 400);

    const userId = req.user?.userId;
    if (!userId) throw new CustomError("Unauthorized", 401);

    const updatedTask = await TaskService.assignWorker(id, userId);
    res.status(200).json({ message: "Task assigned successfully", task: updatedTask });
  }

  static async linkToIncident(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError("Invalid task ID", 400);

    const updatedTask = await TaskService.linkToIncident(id, req.body);
    res.status(200).json({ message: "Task linked to incident successfully", task: updatedTask });
  }

  static async uploadImage(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError("Invalid task ID", 400);

    if (!req.file) {
      throw new CustomError("No image file provided", 400);
    }

    const userId = req.user?.userId;
    if (!userId) throw new CustomError("Unauthorized", 401);

    const updatedTask = await TaskService.updateImage(id, userId, req.file);
    res.status(200).json({ message: "Task image updated successfully", task: updatedTask });
  }

  static async update(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError("Invalid task ID", 400);
    const updatedTask = await TaskService.update(id, req.body);
    res.status(200).json({ message: "Task updated successfully", task: updatedTask });
  }

  static async delete(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError("Invalid task ID", 400);
    const result = await TaskService.delete(id);
    res.status(200).json(result);
  }
}
