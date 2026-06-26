-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "base_severity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_picture_url" VARCHAR(255);
