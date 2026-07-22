/*
  Warnings:

  - Added the required column `updatedAt` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CHURNED');

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_leadId_fkey";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "contractValue" DECIMAL(14,2),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "ownerId" UUID,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "leadId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
