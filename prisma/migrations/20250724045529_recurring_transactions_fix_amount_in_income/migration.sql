/*
  Warnings:

  - Changed the type of `amount` on the `RecurringIncome` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "RecurringExpense" ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "RecurringIncome" DROP COLUMN "amount",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT true;
