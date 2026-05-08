/*
  Warnings:

  - You are about to drop the column `city_id` on the `reports` table. All the data in the column will be lost.
  - Made the column `description` on table `reports` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_city_id_fkey";

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "city_id",
ALTER COLUMN "description" SET NOT NULL;
