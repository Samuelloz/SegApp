/*
  Warnings:

  - Added the required column `hiredAt` to the `Guard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guard" ADD COLUMN     "hiredAt" DATE NOT NULL;
