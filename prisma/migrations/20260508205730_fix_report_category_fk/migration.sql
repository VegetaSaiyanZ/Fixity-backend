-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_category_id_fkey";

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "report_categories"("report_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
