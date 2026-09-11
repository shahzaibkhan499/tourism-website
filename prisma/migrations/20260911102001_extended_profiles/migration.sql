-- AlterTable
ALTER TABLE "rishta_profiles" ADD COLUMN     "marriageForm" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "cast" TEXT,
ADD COLUMN     "cnic" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "extendedProfile" JSONB,
ADD COLUMN     "maritalStatus" TEXT DEFAULT 'SINGLE',
ADD COLUMN     "nameTitle" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "privacy" JSONB;

-- CreateTable
CREATE TABLE "occupation_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employmentStatus" TEXT DEFAULT 'EMPLOYED',
    "jobType" TEXT DEFAULT 'FULL_TIME',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupation_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "occupation_profiles_userId_key" ON "occupation_profiles"("userId");

-- CreateIndex
CREATE INDEX "occupation_profiles_userId_idx" ON "occupation_profiles"("userId");

-- AddForeignKey
ALTER TABLE "occupation_profiles" ADD CONSTRAINT "occupation_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
