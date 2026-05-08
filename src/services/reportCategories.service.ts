import prisma from "@/prisma/client";

export class ReportCategoryService {
  static async getAll() {
    return await prisma.reportCategory.findMany();
  }
}
