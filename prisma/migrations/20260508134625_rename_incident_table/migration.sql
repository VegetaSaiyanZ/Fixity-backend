/*
  Warnings:

  - You are about to drop the `incident` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_incident_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_incident_id_fkey";

-- DropTable
DROP TABLE "incident";

-- CreateTable
CREATE TABLE "incidents" (
    "incident_id" SERIAL NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "priority_score" DECIMAL(5,2) DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("incident_id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("incident_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("incident_id") ON DELETE RESTRICT ON UPDATE CASCADE;
