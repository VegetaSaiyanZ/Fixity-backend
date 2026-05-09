import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import prisma from "@/prisma/client";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { type: "Task" },
    select: { categoryId: true, name: true },
    orderBy: { name: "asc" },
  });
  res.status(200).json(categories);
}));

export default router;
