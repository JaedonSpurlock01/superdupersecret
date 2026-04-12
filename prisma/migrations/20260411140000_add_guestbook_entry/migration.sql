-- CreateTable
CREATE TABLE "GuestbookEntry" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "dotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestbookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestbookEntry_deviceId_key" ON "GuestbookEntry"("deviceId");

-- CreateIndex
CREATE INDEX "GuestbookEntry_dotId_idx" ON "GuestbookEntry"("dotId");
