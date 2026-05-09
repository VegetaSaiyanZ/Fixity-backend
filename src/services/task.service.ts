import prisma from "@/prisma/client";
import {
  CreateTaskDTO,
  UpdateTaskStatusDTO,
  LinkTaskDTO,
} from "@/validations/task.validation";
import { CustomError } from "@/middleware/error.middleware";
import { UserRole } from "@prisma/client";
import { PriorityUtils } from "@/utils/priority.util";

export class TaskService {
  static async getAllByCity(userCityId: number | null) {
    if (!userCityId) {
      throw new CustomError("User does not have a city assigned", 400);
    }

    const tasks = await prisma.task.findMany({
      where: {
        incident: {
          cityId: userCityId,
        },
      },
      include: {
        incident: {
          select: {
            incidentId: true,
            description: true,
            priorityScore: true,
            latitude: true,
            longitude: true,
            createdAt: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return tasks
      .map((task) => ({
        ...task,
        incident: {
          ...task.incident,
          priorityScore: PriorityUtils.getDynamicScore(
            task.incident.priorityScore ? Number(task.incident.priorityScore) : 0,
            task.incident.createdAt,
          ),
        },
      }))
      .sort((a, b) => (b.incident.priorityScore as number) - (a.incident.priorityScore as number));
  }

  static async create(data: CreateTaskDTO, userCityId: number) {
    // Validate that the incident belongs to the user's city
    const incident = await prisma.incident.findUnique({
      where: { incidentId: data.incidentId },
    });

    if (!incident) {
      throw new CustomError("Incident not found", 404);
    }

    if (incident.cityId !== userCityId) {
      throw new CustomError(
        "You can only create tasks for incidents in your city",
        403,
      );
    }

    const newTask = await prisma.task.create({
      data: {
        incidentId: data.incidentId,
        categoryId: data.categoryId,
        workerNotes: data.workerNotes,
      },
    });

    return newTask;
  }

  static async updateStatus(
    id: number,
    userId: number,
    userRole: UserRole,
    data: UpdateTaskStatusDTO,
  ) {
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
        workerNotes: data.cityResponse,
        resolvedAt,
      },
    });

    // If task is closed, check if incident should also be closed
    if (data.status === "Closed") {
      const remainingTasks = await prisma.task.findMany({
        where: {
          incidentId: task.incidentId,
          status: { not: "Closed" },
        },
      });

      if (remainingTasks.length === 0) {
        // All tasks closed -> close incident and reports
        await prisma.incident.update({
          where: { incidentId: task.incidentId },
          data: { status: "Closed", resolvedAt: new Date() },
        });

        await prisma.report.updateMany({
          where: { incidentId: task.incidentId },
          data: { status: "Closed" },
        });
      }
    }

    return updatedTask;
  }

  static async assignWorker(id: number, userId: number) {
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
        status: "Assigned", // Auto-update status when assigned
      },
    });

    // Also update incident status to Assigned
    await prisma.incident.update({
      where: { incidentId: task.incidentId },
      data: { status: "Assigned" },
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

  static async updateImage(
    id: number,
    userId: number,
    file: Express.Multer.File,
  ) {
    const task = await prisma.task.findUnique({
      where: { taskId: id },
    });

    if (!task) {
      throw new CustomError("Task not found", 404);
    }

    if (task.assignedWorkerId !== userId) {
      throw new CustomError(
        "You can only upload images for tasks assigned to you",
        403,
      );
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

  static async update(id: number, data: { workerNotes?: string; categoryId?: number }) {
    const task = await prisma.task.findUnique({ where: { taskId: id } });
    if (!task) throw new CustomError("Task not found", 404);
    return await prisma.task.update({
      where: { taskId: id },
      data: {
        workerNotes: data.workerNotes,
        categoryId: data.categoryId,
      },
      include: { category: true },
    });
  }

  static async delete(id: number) {
    const task = await prisma.task.findUnique({ where: { taskId: id } });
    if (!task) throw new CustomError("Task not found", 404);
    await prisma.task.delete({ where: { taskId: id } });
    return { message: "Task deleted successfully" };
  }
}
