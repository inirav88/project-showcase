# Design Specification: Configurable Window Exit Provision

## Overview
This document specifies the design for adding configurable application window exit controls to Showcase OS (`showcaseos`). The solution provides a sleek, non-intrusive Exit button in the kiosk header while giving administrators full control via the Admin Panel to toggle button visibility and choose between direct confirmation or 4-digit PIN authentication before closing the application.

---

## 1. Database Schema & Startup Migrations

### 1.1 Prisma Schema (`prisma/schema.prisma`)
Update the `Settings` model to include two new fields:
```prisma
model Settings {
  // ... existing fields ...
  showExitButton   Boolean  @default(true)
  exitRequiresPin Boolean  @default(false)
}
```

### 1.2 Database Client Auto-Migration (`src/main/db/client.ts`)
Add safe column migration statements on startup to support existing SQLite database instances:
```typescript
libsql.execute(`ALTER TABLE Settings ADD COLUMN showExitButton BOOLEAN NOT NULL DEFAULT 1`).catch(() => {})
libsql.execute(`ALTER TABLE Settings ADD COLUMN exitRequiresPin BOOLEAN NOT NULL DEFAULT 0`).catch(() => {})
```

---

## 2. Main Process & IPC Communication

### 2.1 IPC Channel Definition (`src/main/ipc/channels.ts`)
Ensure `EXIT_KIOSK` channel is defined:
```typescript
EXIT_KIOSK: 'system:exitKiosk'
```

### 2.2 IPC Main Handler (`src/main/index.ts`)
Register the IPC handle event to quit the Electron application:
```typescript
ipcMain.handle(IPC_CHANNELS.EXIT_KIOSK, () => {
  app.quit()
})
```

---

## 3. UI Components & Kiosk Integration

### 3.1 Kiosk Header Action Bar (`ProjectLauncher.tsx` & `ProjectShowcase.tsx`)
- Render an Exit button (`⏻` power icon or `✕` close icon) in the header action bar alongside `AccessibilityToggle` and `ThemeToggle`.
- Only displayed when `settings.showExitButton` evaluates to `true`.
- Styled using theme CSS variables (`var(--color-surface-raised)`, `var(--color-text-secondary)`, `var(--color-border)`) with hover states to maintain visual harmony.

### 3.2 Exit Dialogs & Verification Flow
- **Direct Confirmation Mode (`exitRequiresPin === false`)**:
  - Displays a modal prompt: *"Exit Showcase OS? Are you sure you want to close the presentation application?"*
  - Action buttons: **Cancel** and **Exit Application** (highlighted in error/accent theme color).
- **PIN Protected Mode (`exitRequiresPin === true`)**:
  - Displays `LauncherPinModal` (4-digit PIN entry).
  - Upon successful PIN verification via `IPC_CHANNELS.SETTINGS_VERIFY_PIN`, invokes `IPC_CHANNELS.EXIT_KIOSK`.

---

## 4. Admin Panel Settings & Header Exit Controls

### 4.1 Admin Settings Tab (`AdminSettingsTab.tsx` / `AdminTabs.tsx`)
Add a new **Kiosk Exit Controls** card under General Settings:
- **Toggle**: *Show Exit Button in Kiosk Header* (`showExitButton`)
- **Toggle**: *Require Admin PIN to Exit* (`exitRequiresPin`)

### 4.2 Admin Header Quick Exit
In the top header bar of the Admin route (`AdminLayout.tsx` / `AdminHeader`), include a dedicated **Exit Application** button so administrators can close the application directly from the Admin Panel regardless of kiosk header settings.

---

## 5. Verification & Testing Strategy
1. Verify database migration runs cleanly without data loss.
2. Test toggling `showExitButton` in Admin Settings and confirming immediate visual update in Kiosk Header.
3. Test `exitRequiresPin = false`: verify direct confirmation modal pops up and closes app upon confirmation.
4. Test `exitRequiresPin = true`: verify PIN modal prompts for 4-digit PIN, rejects invalid PIN, and closes app on correct PIN.
5. Verify Admin Panel Header Exit button closes app reliably.
