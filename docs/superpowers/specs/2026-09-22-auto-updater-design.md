# ShowcaseOS Auto-Updater Design Document

**Date:** 2026-09-22  
**Status:** Approved  
**Target Package:** `electron-updater` integration into ShowcaseOS  

---

## 1. Overview & Goal

The goal is to implement automated software updates (Option A: Auto-Updater) in **ShowcaseOS** so that whenever feature updates, bug fixes, or UI enhancements are released, client laptops automatically detect, download, and prompt the user to restart and update the application without losing local SQLite data (`dev.db`), media assets, or configuration settings.

---

## 2. Architecture & Components

```
+-----------------------------------------------------------------------------------+
|                                  ELECTRON MAIN                                    |
|                                                                                   |
|  +---------------------------+        +----------------------------------------+  |
|  |  AutoUpdaterManager       |        |  electron-updater                      |  |
|  |  (ipc/handlers/updater.ts)|<------>|  (AutoUpdater instance)                |  |
|  +-------------+-------------+        +-------------------+--------------------+  |
|                |                                          |                       |
|                | IPC Handlers                             | HTTP Manifest & .exe  |
|                v                                          v                       |
|  +-----------------------------------+     +-----------------------------------+  |
|  |      Preload Context Bridge       |     |   VPS Server / Update Provider    |  |
|  |      (window.api.updater)         |     |   (https://showcase.salesstudio.in/   |  |
|  +---------------+-------------------+     |    updates/latest.yml)            |  |
|                  |                         +-----------------------------------+  |
|                  v                                                                |
+------------------|----------------------------------------------------------------+
                   | window.api.updater.onStatusChange()
                   v
+-----------------------------------------------------------------------------------+
|                                ELECTRON RENDERER                                  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | UpdateNotificationBanner / UpdateSettings (Toast, Progress Bar, Restart Btn) |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Main Process Components
1. **`electron-updater`**: Handles update server polling, differential/full release downloads, signature/checksum verification, and NSIS installation on quit.
2. **`UpdaterHandlers` (`src/main/ipc/handlers/updater.ts`)**:
   - Listens to `autoUpdater` lifecycle events (`checking-for-update`, `update-available`, `update-not-available`, `download-progress`, `update-downloaded`, `error`).
   - Maintains current `UpdaterState` in memory.
   - Exposes IPC channels:
     - `updater:check` (manually trigger update check)
     - `updater:quitAndInstall` (restart app and install update)
     - `updater:getStatus` (get state snapshot)
   - Broadcasts status changes to all open `BrowserWindow` instances (`kioskWin`, `presenterWin`).

### Preload & Security Bridge (`src/preload/index.ts`)
- Safely exposes `window.api.updater` methods (`check()`, `quitAndInstall()`, `getStatus()`, `onStatusChange()`, `onDownloadProgress()`).

### Renderer Components (`src/renderer/src/...`)
- **`UpdateBanner` / `UpdateNotification`**: Floating notification / status banner when an update is available or downloaded.
- **Admin Settings Update Status Tab**: Shows current app version (`0.0.1`), last checked timestamp, and manual "Check for Updates" button.

---

## 3. IPC Communication Protocol

| Channel Name | Direction | Payload / Parameters | Description |
| :--- | :--- | :--- | :--- |
| `updater:check` | Renderer $\rightarrow$ Main | None | Triggers an immediate update check |
| `updater:quitAndInstall` | Renderer $\rightarrow$ Main | None | Quits app and executes the downloaded installer |
| `updater:getStatus` | Renderer $\rightarrow$ Main | None | Returns `{ status, currentVersion, updateInfo, error }` |
| `updater:statusChanged` | Main $\rightarrow$ Renderer | `{ state: UpdaterState, info?: UpdateInfo, error?: string }` | Broadcasted when update state transitions |
| `updater:downloadProgress` | Main $\rightarrow$ Renderer | `{ percent, bytesPerSecond, transferred, total }` | Broadcasted during active update download |

### `UpdaterState` Enum
- `IDLE`: Initial state
- `CHECKING`: Currently checking update manifest
- `AVAILABLE`: Update found, initiating download
- `NOT_AVAILABLE`: Already on latest version
- `DOWNLOADING`: Download in progress
- `DOWNLOADED`: Ready to install
- `ERROR`: Network or manifest error during check/download

---

## 4. Build Configuration (`package.json`)

`electron-builder` NSIS publish configuration:

```json
"build": {
    "appId": "com.salesstudio.app",
    "productName": "SalesStudio",
    "publish": [
        {
            "provider": "generic",
            "url": "https://showcase.salesstudio.in/updates/"
        }
    ]
}
```

---

## 5. Verification Plan

1. **Unit & IPC Handler Tests**: Vitest unit tests for `UpdaterHandlers` testing state transitions and event emission.
2. **Build Verification**: Run `npm run build` and ensure TypeScript and Vite compile cleanly.
3. **Packaging Test**: Verify `electron-builder` accepts `publish` configuration cleanly during `npm run package`.
