-- AlterEnum
ALTER TYPE "MembershipRole" ADD VALUE 'SALES';
ALTER TYPE "MembershipRole" ADD VALUE 'CONTRACT_MANAGER';
ALTER TYPE "MembershipRole" ADD VALUE 'GUARD_MANAGER';

-- RenameColumn
ALTER TABLE "CompanyMembership"
    RENAME COLUMN "role" TO "roles";

-- AlterColumn
ALTER TABLE "CompanyMembership"
ALTER COLUMN "roles" TYPE "MembershipRole"[]
USING ARRAY["roles"]::"MembershipRole"[];

ALTER TABLE "CompanyMembership"
    ALTER COLUMN "roles"
        SET DEFAULT ARRAY['VIEWER']::"MembershipRole"[];

-- RenameColumn
ALTER TABLE "Invitation"
    RENAME COLUMN "role" TO "roles";

-- AlterColumn
ALTER TABLE "Invitation"
ALTER COLUMN "roles" TYPE "MembershipRole"[]
USING ARRAY["roles"]::"MembershipRole"[];