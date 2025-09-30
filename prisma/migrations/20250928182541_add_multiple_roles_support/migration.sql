/*
  Warnings:
-- Archivo eliminado por reinicio de migraciones
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "public"."user_roles"("userId", "role");

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing roles to new table
INSERT INTO "public"."user_roles" ("id", "userId", "role", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    "id", 
    "role", 
    NOW(), 
    NOW()
FROM "public"."users" 
WHERE "role" IS NOT NULL;

-- AlterTable - Drop the role column after migrating data
ALTER TABLE "public"."users" DROP COLUMN "role";
