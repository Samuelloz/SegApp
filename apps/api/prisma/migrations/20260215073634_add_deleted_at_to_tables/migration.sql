-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "deletedAt" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "Guard" ADD COLUMN     "deletedAt" TIMESTAMP(6);
