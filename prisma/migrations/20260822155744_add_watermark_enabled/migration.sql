-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "firmName" TEXT NOT NULL DEFAULT '',
    "firmLogoPath" TEXT NOT NULL DEFAULT '',
    "firmContactPhone" TEXT NOT NULL DEFAULT '',
    "firmContactEmail" TEXT NOT NULL DEFAULT '',
    "firmWebsite" TEXT NOT NULL DEFAULT '',
    "disclaimerText" TEXT NOT NULL DEFAULT '',
    "themeAccentColor" TEXT NOT NULL DEFAULT '#1A73E8',
    "adminPinHash" TEXT NOT NULL DEFAULT '',
    "exchangeRateUsd" REAL NOT NULL DEFAULT 83.5,
    "exchangeRateGbp" REAL NOT NULL DEFAULT 106.0,
    "exchangeRateAed" REAL NOT NULL DEFAULT 22.7,
    "idleTimeoutSeconds" INTEGER NOT NULL DEFAULT 300,
    "lastBackupAt" DATETIME,
    "lastSyncedAt" DATETIME,
    "contentVersion" TEXT NOT NULL DEFAULT '0',
    "vpsBaseUrl" TEXT NOT NULL DEFAULT '',
    "vpsApiKey" TEXT NOT NULL DEFAULT '',
    "narrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Settings" ("adminPinHash", "contentVersion", "disclaimerText", "exchangeRateAed", "exchangeRateGbp", "exchangeRateUsd", "firmContactEmail", "firmContactPhone", "firmLogoPath", "firmName", "firmWebsite", "id", "idleTimeoutSeconds", "lastBackupAt", "lastSyncedAt", "narrationEnabled", "themeAccentColor", "vpsApiKey", "vpsBaseUrl") SELECT "adminPinHash", "contentVersion", "disclaimerText", "exchangeRateAed", "exchangeRateGbp", "exchangeRateUsd", "firmContactEmail", "firmContactPhone", "firmLogoPath", "firmName", "firmWebsite", "id", "idleTimeoutSeconds", "lastBackupAt", "lastSyncedAt", "narrationEnabled", "themeAccentColor", "vpsApiKey", "vpsBaseUrl" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
