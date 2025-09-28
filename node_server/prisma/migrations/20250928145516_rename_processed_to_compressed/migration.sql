/*
  Warnings:

  - You are about to drop the column `isProcessed` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `processedDateTime` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" RENAME COLUMN "isProcessed" TO "isCompressed";
ALTER TABLE "Document" RENAME COLUMN "processedDateTime" TO "compressedDateTime";

