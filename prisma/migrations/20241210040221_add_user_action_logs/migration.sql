-- CreateEnum
CREATE TYPE "UserActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "UserActionLog" (
    "id" TEXT NOT NULL,
    "actionType" "UserActionType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "targetUser" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserActionLog" ADD CONSTRAINT "UserActionLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActionLog" ADD CONSTRAINT "UserActionLog_targetUser_fkey" FOREIGN KEY ("targetUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
