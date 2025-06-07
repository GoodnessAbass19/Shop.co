/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `OtpToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OtpToken_email_key" ON "OtpToken"("email");
