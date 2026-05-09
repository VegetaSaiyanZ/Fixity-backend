import prisma from "@/prisma/client";
import { ReportStatus } from "@prisma/client";
import { CreateIncidentDTO } from "@/validations/incident.validation";
import { CustomError } from "@/middleware/error.middleware";

export class IncidentService {
  static async create(data: CreateIncidentDTO, userCityId: number) {
    // 1. Fetch all reports to validate them
    const reports = await prisma.report.findMany({
      where: {
        reportId: { in: data.reportIds },
      },
    });

    if (reports.length !== data.reportIds.length) {
      throw new CustomError("One or more reports were not found", 404);
    }

    let totalLat = 0;
    let totalLng = 0;

    for (const report of reports) {
      if (report.cityId !== userCityId) {
        throw new CustomError(
          `Report ID ${report.reportId} does not belong to your city`,
          403,
        );
      }
      if (report.incidentId) {
        throw new CustomError(
          `Report ID ${report.reportId} is already assigned to an incident`,
          400,
        );
      }

      totalLat += Number(report.latitude);
      totalLng += Number(report.longitude);
    }

    const avgLat = totalLat / reports.length;
    const avgLng = totalLng / reports.length;

    // 2. Create the Incident
    const incident = await prisma.$transaction(async (tx) => {
      const newIncident = await tx.incident.create({
        data: {
          cityId: userCityId,
          description:
            data.description || "Incident automatically generated from reports",
          latitude: avgLat,
          longitude: avgLng,
        },
      });

      // 3. Link reports to this incident and set status to Assigned
      await tx.report.updateMany({
        where: { reportId: { in: data.reportIds } },
        data: {
          incidentId: newIncident.incidentId,
          status: ReportStatus.Assigned,
        },
      });

      return newIncident;
    });

    return incident;
  }

  static async getAllByCity(userCityId: number) {
    return await prisma.incident.findMany({
      where: { cityId: userCityId },
      include: {
        reports: true,
        tasks: {
          include: {
            assignedWorker: {
              select: { firstName: true, lastName: true },
            },
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async update(
    id: number,
    userCityId: number,
    data: { description?: string },
  ) {
    const incident = await prisma.incident.findUnique({
      where: { incidentId: id },
    });
    if (!incident) throw new CustomError("Incident not found", 404);
    if (incident.cityId !== userCityId) {
      throw new CustomError("You can only edit incidents in your city", 403);
    }
    return await prisma.incident.update({
      where: { incidentId: id },
      data: { description: data.description },
    });
  }

  static async delete(id: number, userCityId: number) {
    const incident = await prisma.incident.findUnique({
      where: { incidentId: id },
    });
    if (!incident) throw new CustomError("Incident not found", 404);
    if (incident.cityId !== userCityId) {
      throw new CustomError("You can only delete incidents in your city", 403);
    }
    // Unlink all reports from this incident first
    await prisma.report.updateMany({
      where: { incidentId: id },
      data: { incidentId: null, status: ReportStatus.Open },
    });
    await prisma.task.deleteMany({ where: { incidentId: id } });
    await prisma.incident.delete({ where: { incidentId: id } });
    return { message: "Incident deleted successfully" };
  }

  static async addReports(incidentId: number, reportIds: number[], userCityId: number) {
    const incident = await prisma.incident.findUnique({ where: { incidentId } });
    if (!incident) throw new CustomError("Incident not found", 404);
    if (userCityId && incident.cityId !== userCityId) {
      throw new CustomError("You can only modify incidents in your city", 403);
    }

    const reports = await prisma.report.findMany({
      where: { reportId: { in: reportIds } },
    });

    if (reports.length !== reportIds.length) {
      throw new CustomError("One or more reports were not found", 404);
    }

    for (const report of reports) {
      if (report.cityId !== incident.cityId) {
        throw new CustomError(`Report #${report.reportId} belongs to a different city`, 403);
      }
      if (report.incidentId) {
        throw new CustomError(`Report #${report.reportId} is already assigned to an incident`, 400);
      }
    }

    await prisma.report.updateMany({
      where: { reportId: { in: reportIds } },
      data: {
        incidentId: incident.incidentId,
        status: ReportStatus.Assigned,
      },
    });

    return { message: `${reportIds.length} reports added to incident` };
  }

  static async removeReport(incidentId: number, reportId: number, userCityId: number) {
    const incident = await prisma.incident.findUnique({ where: { incidentId } });
    if (!incident) throw new CustomError("Incident not found", 404);
    if (userCityId && incident.cityId !== userCityId) {
      throw new CustomError("You can only modify incidents in your city", 403);
    }

    const report = await prisma.report.findFirst({
      where: { reportId, incidentId },
    });

    if (!report) throw new CustomError("Report not found in this incident", 404);

    await prisma.report.update({
      where: { reportId },
      data: {
        incidentId: null,
        status: ReportStatus.Open,
      },
    });

    return { message: "Report removed from incident" };
  }
}
