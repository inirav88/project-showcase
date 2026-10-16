-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'EXTERIOR',
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sizeBytes" REAL NOT NULL DEFAULT 0,
    "durationSecs" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Media" ("category", "createdAt", "durationSecs", "filePath", "id", "originalName", "projectId", "sizeBytes", "sortOrder", "tags", "thumbnailPath") SELECT "category", "createdAt", "durationSecs", "filePath", "id", "originalName", "projectId", "sizeBytes", "sortOrder", "tags", "thumbnailPath" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
CREATE INDEX "Media_projectId_category_idx" ON "Media"("projectId", "category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
