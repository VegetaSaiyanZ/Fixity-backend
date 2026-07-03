-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'HR';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3);
