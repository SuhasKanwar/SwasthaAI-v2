/*
  Warnings:

  - You are about to drop the `vault_reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "vault_reports" DROP CONSTRAINT "vault_reports_user_id_fkey";

-- DropTable
DROP TABLE "vault_reports";
