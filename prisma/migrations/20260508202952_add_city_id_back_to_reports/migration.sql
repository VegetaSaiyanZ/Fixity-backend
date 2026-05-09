/*
  Warnings:

  - Added the required column `city_id` to the `incidents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city_id` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "city_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "city_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("city_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("city_id") ON DELETE RESTRICT ON UPDATE CASCADE;
