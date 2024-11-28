/*
  Warnings:

  - You are about to drop the column `collaborators` on the `Requirement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Requirement" DROP COLUMN "collaborators",
ADD COLUMN     "invite" TEXT[];
