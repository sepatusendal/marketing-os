-- CreateEnum
CREATE TYPE "LeadLostReason" AS ENUM ('BUDGET', 'TIMING', 'COMPETITOR', 'NO_RESPONSE', 'NOT_A_FIT', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'PROPOSAL_SENT';
ALTER TYPE "LeadStatus" ADD VALUE 'INTERNAL_REVIEW';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "lostReason" "LeadLostReason",
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);
