/*
  Warnings:

  - The values [InProgress] on the enum `ReportStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportStatus_new" AS ENUM ('Open', 'Assigned', 'Closed');
ALTER TABLE "public"."reports" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reports" ALTER COLUMN "status" TYPE "ReportStatus_new" USING ("status"::text::"ReportStatus_new");
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "ReportStatus_new" USING ("status"::text::"ReportStatus_new");
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";
ALTER TYPE "ReportStatus_new" RENAME TO "ReportStatus";
DROP TYPE "public"."ReportStatus_old";
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'Open';
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'Open';
COMMIT;

-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'Open';
