-- CreateTable
CREATE TABLE "movement_statuses" (
    "movement_status_id" SERIAL NOT NULL,
    "status_name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "status_category_id" INTEGER NOT NULL,
    "movement_type_id" INTEGER NOT NULL,
    "is_final" BOOLEAN DEFAULT false,
    "display_order" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "movement_statuses_pkey" PRIMARY KEY ("movement_status_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movement_statuses_status_type_unique" ON "movement_statuses"("status_name", "movement_type_id");

-- AddForeignKey
ALTER TABLE "movement_statuses" ADD CONSTRAINT "movement_statuses_movement_type_id_fkey" FOREIGN KEY ("movement_type_id") REFERENCES "movement_types"("movement_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movement_statuses" ADD CONSTRAINT "movement_statuses_status_category_id_fkey" FOREIGN KEY ("status_category_id") REFERENCES "movement_status_categories"("status_category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
