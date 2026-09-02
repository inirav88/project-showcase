-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StaffProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "pinHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_StaffProfile" ("createdAt", "id", "isActive", "name", "pinHash") SELECT "createdAt", "id", "isActive", "name", "pinHash" FROM "StaffProfile";
DROP TABLE "StaffProfile";
ALTER TABLE "new_StaffProfile" RENAME TO "StaffProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
