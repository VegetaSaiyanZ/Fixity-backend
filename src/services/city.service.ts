import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";

interface GetAllOptions {
  filter?: string;
  page?: number;
  limit?: number;
}

export class CityService {
  static async getAll({ filter, page = 1, limit = 20 }: GetAllOptions) {
    const where: Prisma.CityWhereInput = filter
      ? {
          name: {
            contains: filter,
            mode: "insensitive",
          },
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.city.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.city.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
