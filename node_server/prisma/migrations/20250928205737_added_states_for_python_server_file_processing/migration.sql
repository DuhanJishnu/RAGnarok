-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retriesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "public"."DocumentStatus" NOT NULL DEFAULT 'PENDING';
