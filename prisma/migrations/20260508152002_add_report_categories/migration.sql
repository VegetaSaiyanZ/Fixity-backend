-- CreateTable
CREATE TABLE "report_categories" (
    "report_category_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "report_categories_pkey" PRIMARY KEY ("report_category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_categories_name_key" ON "report_categories"("name");
