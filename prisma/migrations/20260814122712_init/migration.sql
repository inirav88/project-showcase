-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "developer" TEXT NOT NULL,
    "reraNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "possessionStatus" TEXT NOT NULL DEFAULT 'UNDER_CONSTRUCTION',
    "possessionDate" TEXT NOT NULL DEFAULT '',
    "priceRangeMin" REAL NOT NULL DEFAULT 0,
    "priceRangeMax" REAL NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "themeAccentColor" TEXT NOT NULL DEFAULT '#1A73E8',
    "themeFontPairing" TEXT NOT NULL DEFAULT 'Inter',
    "introVideoMediaId" TEXT,
    "ambientAudioMediaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL,
    "config" TEXT NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectModule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HighlightCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "shortText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "HighlightCard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'EXTERIOR',
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "durationSecs" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tower" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Tower_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "towerId" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "configuration" TEXT NOT NULL,
    "carpetArea" REAL NOT NULL,
    "builtUpArea" REAL NOT NULL,
    "superBuiltUpArea" REAL NOT NULL DEFAULT 0,
    "facing" TEXT NOT NULL DEFAULT '',
    "price" REAL NOT NULL,
    "priceLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "floorPlanMediaId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Unit_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '',
    "photoMediaId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Amenity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "staffId" TEXT,
    "personaMode" TEXT,
    "sectionsViewed" TEXT NOT NULL DEFAULT '[]',
    "unitsShortlisted" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "SessionLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interestedProjectId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "budgetMin" REAL,
    "budgetMax" REAL,
    "notes" TEXT NOT NULL DEFAULT '',
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Lead_interestedProjectId_fkey" FOREIGN KEY ("interestedProjectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppointmentSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Settings" (
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
    "vpsApiKey" TEXT NOT NULL DEFAULT ''
);

-- CreateIndex
CREATE INDEX "ProjectModule_projectId_sortOrder_idx" ON "ProjectModule"("projectId", "sortOrder");

-- CreateIndex
CREATE INDEX "HighlightCard_projectId_idx" ON "HighlightCard"("projectId");

-- CreateIndex
CREATE INDEX "Media_projectId_category_idx" ON "Media"("projectId", "category");

-- CreateIndex
CREATE INDEX "Tower_projectId_idx" ON "Tower"("projectId");

-- CreateIndex
CREATE INDEX "Unit_towerId_floor_idx" ON "Unit"("towerId", "floor");

-- CreateIndex
CREATE INDEX "Amenity_projectId_idx" ON "Amenity"("projectId");

-- CreateIndex
CREATE INDEX "SessionLog_projectId_idx" ON "SessionLog"("projectId");

-- CreateIndex
CREATE INDEX "SessionLog_staffId_idx" ON "SessionLog"("staffId");
