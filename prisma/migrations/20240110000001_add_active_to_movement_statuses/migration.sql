-- AlterTable
ALTER TABLE "movement_statuses" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
