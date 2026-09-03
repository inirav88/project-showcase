# Design Specification: Configurable Application Startup Security Provision

## Overview
This document specifies the design for adding configurable application startup security controls to Showcase OS (`showcaseos`). Administrators can choose among three startup security modes in the Admin Panel: Disabled (Direct launch), Staff Profile PIN Login, or Master Kiosk Lock. When enabled, launching the application presents the appropriate authentication screen before allowing access to the presentation catalog.

---

## 1. Database Schema & Startup Migrations

### 1.1 Prisma Schema (`prisma/schema.prisma`)
Update the `Settings` model to include `startupSecurityMode`:
```prisma
model Settings {
  // ... existing fields ...
  startupSecurityMode String @default("DISABLED") // "DISABLED" | "STAFF_PIN" | "MASTER_PIN"
}
```

### 1.2 Database Client Auto-Migration (`src/main/db/client.ts`)
Add safe column migration statements on main process startup:
```typescript
libsql.execute(`ALTER TABLE Settings ADD COLUMN startupSecurityMode TEXT NOT NULL DEFAULT 'DISABLED'`).catch(() => {})
```

---

## 2. Startup Security Modes & Logic

### 2.1 Modes Definition
1. **`DISABLED` (Default)**:
   - Application launches directly into `ProjectLauncher` without any PIN prompt.
2. **`STAFF_PIN` (Staff Profile PIN Login)**:
   - Application displays a full-screen User Profile selection dropdown populated with active staff profiles (`IPC_CHANNELS.STAFF_LIST`).
   - The user selects their profile and inputs their 4-digit PIN verified via `IPC_CHANNELS.STAFF_VERIFY_PIN`.
   - On successful verification, the active staff profile is stored in session context and the kiosk unlocks.
3. **`MASTER_PIN` (Master Kiosk Lock)**:
   - Application displays a 4-digit Master Admin PIN keypad.
   - Verified via `IPC_CHANNELS.SETTINGS_VERIFY_PIN`.
   - On successful verification, the kiosk unlocks.

---

## 3. UI Architecture & Startup Lock Gate

### 3.1 Startup Lock Gate Component (`StartupLockGate.tsx`)
Create a reusable wrapper component `StartupLockGate.tsx` in `src/renderer/src/components/kiosk/`:
- Checks `sessionStorage.getItem('showcaseos_unlocked') === 'true'`.
- If already unlocked during the current session, renders `children` directly.
- If locked:
  - Fetches settings via `IPC_CHANNELS.SETTINGS_GET`.
  - If `startupSecurityMode === 'STAFF_PIN'`, renders `<StaffLoginModal />`.
  - If `startupSecurityMode === 'MASTER_PIN'`, renders `<MasterUnlockModal />`.
  - If `startupSecurityMode === 'DISABLED'`, sets unlocked state immediately.

### 3.2 Kiosk Route Integration (`App.tsx` / `main.tsx`)
Wrap kiosk pages (`ProjectLauncher` & `ProjectShowcase`) with `<StartupLockGate>`:
```tsx
<StartupLockGate>
  <ProjectLauncher />
</StartupLockGate>
```

---

## 4. Admin Panel Settings Controls

### 4.1 Admin Settings Form (`AdminRoute.tsx`)
Under **Kiosk Features Configuration**, add an **App Startup Security Mode** card with radio button selectors:
- **`DISABLED`**: *Disabled (Direct Kiosk Launch)*
- **`STAFF_PIN`**: *Staff Profile PIN Login (Agent Selection + PIN)*
- **`MASTER_PIN`**: *Master Kiosk Lock (4-Digit Admin PIN)*

---

## 5. Verification & Testing Strategy
1. Verify database auto-migration runs cleanly on startup.
2. Test setting mode to `STAFF_PIN`: closing and opening app displays staff profile login screen, rejects invalid PIN, and unlocks kiosk on correct staff PIN.
3. Test setting mode to `MASTER_PIN`: closing and opening app displays Master PIN keypad, rejects invalid PIN, and unlocks kiosk on correct Admin PIN.
4. Test setting mode to `DISABLED`: app opens directly to `ProjectLauncher` with zero prompts.
5. Verify TypeScript compiler passes cleanly with 0 errors.
