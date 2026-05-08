import prisma from "@/prisma/client";
import { CreateTaskDTO, UpdateTaskStatusDTO, LinkTaskDTO } from "@/validations/task.validation";
import { CustomError } from "@/middleware/error.middleware";
import { UserRole } from "@prisma/client";

export class TaskService {
  static async getAllByCity(userCityId: number | null) {
    if (!userCityId) {
      throw new CustomError("User does not have a city assigned", 400);
    }

    return await prisma.task.findMany({
      where: {
        incident: {
          cityId: userCityId,
        },
      },
      include: {
        incident: true,
        category: true,
        assignedWorker: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  static async create(data: CreateTaskDTO, userCityId: number | null) {
    // Validate that the incident belongs to the user's city
    const incident = await prisma.incident.findUnique({
      where: { incidentId: data.incidentId },
    });

    if (!incident) {
      throw new CustomError("Incident not found", 404);
    }

    if (userCityId && incident.cityId !== userCityId) {
      throw new CustomError("You can only create tasks for incidents in your city", 403);
    }

    const newTask = await prisma.task.create({
      data: {
        incidentId: data.incidentId,
        categoryId: data.categoryId,
        workerNotes: data.workerNotes,
        afterImageUrl: data.afterImageUrl,
      },
    });

    return newTask;
  }

  static async updateStatus(
    id: number,
    userId: number,
    userRole: UserRole,
    data: UpdateTaskStatusDTO
  ) {
    if (userRole !== UserRole.Worker && userRole !== UserRole.Manager) {
      throw new CustomError("Only Workers and Managers can update task status", 403);
    }

    const task = await prisma.task.findUnique({
      where: { taskId: id },
    });

    if (!task) {
      throw new CustomError("Task not found", 404);
    }

    // If Worker, ensure they are assigned to this task
    if (userRole === UserRole.Worker && task.assignedWorkerId !== userId) {
      throw new CustomError("You can only update tasks assigned to you", 403);
    }

    // Auto-fill resolvedAt if status changes to Closed
    let resolvedAt = task.resolvedAt;
    if (data.status === "Closed" && task.status !== "Closed") {
      resolvedAt = new Date();
    } else if (data.status !== "Closed") {
      resolvedAt = null;
    }

    const updatedTask = await prisma.task.update({
      where: { taskId: id },
      data: {
        status: data.status,
        resolvedAt,
      },
    });

    return updatedTask;
  }

  static async assignWorker(id: number, userId: number, userRole: UserRole) {
    if (userRole !== UserRole.Worker) {
      throw new CustomError("Only Workers can be assigned to tasks via this endpoint", 403);
    }

    const task = await prisma.task.findUnique({
      where: { taskId: id },
    });

    if (!task) {
      throw new CustomError("Task not found", 404);
    }

    if (task.assignedWorkerId !== null) {
      throw new CustomError("This task is already assigned to a worker", 409);
    }

    const updatedTask = await prisma.task.update({
      where: { taskId: id },
      data: {
        assignedWorkerId: userId,
        status: "InProgress", // Auto-update status when assigned
      },
    });

    return updatedTask;
  }

  static async linkToIncident(id: number, data: LinkTaskDTO) {
    const task = await prisma.task.findUnique({
      where: { taskId: id },
    });

    if (!task) {
      throw new CustomError("Task not found", 404);
    }

    const newIncident = await prisma.incident.findUnique({
      where: { incidentId: data.incidentId },
    });

    if (!newIncident) {
      throw new CustomError("Target incident not found", 404);
    }

    const updatedTask = await prisma.task.update({
      where: { taskId: id },
      data: {
        incidentId: data.incidentId,
      },
    });

    return updatedTask;
  }

  static async updateImage(id: number, userId: number, userRole: UserRole, file: Express.Multer.File) {
    if (userRole !== UserRole.Worker) {
      throw new CustomError("Only Workers can update task images", 403);
    }

    const task = await prisma.task.findUnique({
      where: { taskId: id },
    });

    if (!task) {
      throw new CustomError("Task not found", 404);
    }

    if (task.assignedWorkerId !== userId) {
      throw new CustomError("You can only upload images for tasks assigned to you", 403);
    }

    const imageUrl = `/uploads/${file.filename}`;

    const updatedTask = await prisma.task.update({
      where: { taskId: id },
      data: {
        afterImageUrl: imageUrl,
      },
    });

    return updatedTask;
  }
}
