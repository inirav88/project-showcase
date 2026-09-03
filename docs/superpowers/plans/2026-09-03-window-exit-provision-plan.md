# Configurable Window Exit Provision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide configurable application window exit controls in Showcase OS via header exit button and Admin Panel toggles.

**Architecture:** Extend SQLite Settings table schema and database client auto-migrations with `showExitButton` and `exitRequiresPin`. Wire up `system:exitKiosk` IPC channel in Electron main process to trigger `app.quit()`. Render exit buttons in kiosk headers (`ProjectLauncher`, `ProjectShowcase`) and Admin navigation bar with optional PIN or confirmation dialog verification.

**Tech Stack:** Electron, React, TypeScript, Prisma/LibSQL SQLite, CSS Modules/Tailwind/Vanilla CSS.

---

### File Structure Map
- Modify: `prisma/schema.prisma` — Add `showExitButton` and `exitRequiresPin` to `Settings` model.
- Modify: `src/main/db/client.ts` — Add safe `ALTER TABLE Settings ADD COLUMN ...` startup migrations.
- Modify: `src/main/index.ts` — Add `ipcMain.handle(IPC_CHANNELS.EXIT_KIOSK, ...)` to quit app.
- Modify: `src/renderer/src/pages/kiosk/ProjectLauncher.tsx` — Add Exit button in top header & exit confirmation modal / PIN trigger.
- Modify: `src/renderer/src/pages/kiosk/ProjectShowcase.tsx` — Add Exit button in top header & exit confirmation modal / PIN trigger.
- Modify: `src/renderer/src/components/admin/AdminTabs.tsx` — Add Exit toggles in Settings tab & Exit App button in Admin Header.

---

### Task 1: Database Schema & Startup Column Migration

**Files:**
- Modify: `prisma/schema.prisma:194-215`
- Modify: `src/main/db/client.ts:40-46`

- [ ] **Step 1: Update Prisma Settings model in schema**

In `prisma/schema.prisma`, add `showExitButton` and `exitRequiresPin` to the `Settings` model:

```prisma
model Settings {
  id                 Int      @id @default(1)
  firmName           String   @default("")
  firmLogoPath       String   @default("")
  firmContactPhone   String   @default("")
  firmContactEmail   String   @default("")
  firmWebsite        String   @default("")
  disclaimerText     String   @default("")
  themeAccentColor   String   @default("#1A73E8")
  adminPinHash       String   @default("")
  exchangeRateUsd    Float    @default(83.5)
  exchangeRateGbp    Float    @default(106.0)
  exchangeRateAed    Float    @default(22.7)
  idleTimeoutSeconds Int      @default(300)
  lastBackupAt       DateTime?
  lastSyncedAt       DateTime?
  contentVersion     String   @default("0")
  vpsBaseUrl         String   @default("")
  vpsApiKey          String   @default("")
  narrationEnabled   Boolean  @default(true)
  watermarkEnabled   Boolean  @default(true)
  showExitButton     Boolean  @default(true)
  exitRequiresPin   Boolean  @default(false)
}
```

- [ ] **Step 2: Add database startup column migrations**

In `src/main/db/client.ts`, add startup `ALTER TABLE` statements inside `getDb()`:

```typescript
      libsql.execute(`ALTER TABLE Settings ADD COLUMN narrationEnabled BOOLEAN NOT NULL DEFAULT 1`).catch(() => {})
      libsql.execute(`ALTER TABLE Settings ADD COLUMN watermarkEnabled BOOLEAN NOT NULL DEFAULT 1`).catch(() => {})
      libsql.execute(`ALTER TABLE Settings ADD COLUMN showExitButton BOOLEAN NOT NULL DEFAULT 1`).catch(() => {})
      libsql.execute(`ALTER TABLE Settings ADD COLUMN exitRequiresPin BOOLEAN NOT NULL DEFAULT 0`).catch(() => {})
```

- [ ] **Step 3: Run Prisma generate to update client types**

Run: `npx prisma generate` in `showcaseos` directory.
Expected: Client generated successfully with `showExitButton` and `exitRequiresPin` fields.

- [ ] **Step 4: Commit schema changes**

```bash
git add prisma/schema.prisma src/main/db/client.ts
git commit -m "feat(db): add showExitButton and exitRequiresPin settings columns"
```

---

### Task 2: Main Process IPC Handler for App Exit

**Files:**
- Modify: `src/main/index.ts:114-117`

- [ ] **Step 1: Register IPC listener for `system:exitKiosk`**

In `src/main/index.ts`, register the handler to quit the Electron app when `IPC_CHANNELS.EXIT_KIOSK` (`system:exitKiosk`) is invoked:

```typescript
    // Register system:exitKiosk IPC handler to quit application
    ipcMain.handle(IPC_CHANNELS.EXIT_KIOSK, () => {
      app.quit()
    })
```

- [ ] **Step 2: Verify main process compilation**

Run: `npm run build` or `npx tsc --noEmit` in `showcaseos`.
Expected: No TypeScript or compilation errors.

- [ ] **Step 3: Commit IPC handler**

```bash
git add src/main/index.ts
git commit -m "feat(ipc): add system:exitKiosk main process IPC handler"
```

---

### Task 3: Kiosk Exit Controls in ProjectLauncher Header

**Files:**
- Modify: `src/renderer/src/pages/kiosk/ProjectLauncher.tsx:180-385`

- [ ] **Step 1: Update settings state & fetch settings in `ProjectLauncher`**

In `ProjectLauncher.tsx`, load settings on mount and track `showExitButton` and `exitRequiresPin`:

```typescript
  const [settings, setSettings] = useState<{ showExitButton?: boolean; exitRequiresPin?: boolean }>({ showExitButton: true, exitRequiresPin: false })
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  useEffect(() => {
    window.api.invoke(IPC_CHANNELS.SETTINGS_GET).then((s: any) => {
      if (s) setSettings({ showExitButton: s.showExitButton ?? true, exitRequiresPin: s.exitRequiresPin ?? false })
    }).catch(() => {})
  }, [])
```

- [ ] **Step 2: Render Exit button in `ProjectLauncher` top header**

Inside `ProjectLauncher.tsx` header actions bar (next to `ThemeToggle`):

```tsx
          {settings.showExitButton && (
            <button
              onClick={() => {
                if (settings.exitRequiresPin) {
                  setShowPinModal(true)
                } else {
                  setShowExitConfirm(true)
                }
              }}
              title="Exit Application"
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
                background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-error, #ef4444)'
                e.currentTarget.style.borderColor = 'var(--color-error, #ef4444)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <span>⏻</span> Exit
            </button>
          )}
```

- [ ] **Step 3: Add Exit Confirmation Modal in `ProjectLauncher`**

When `showExitConfirm` is true, render confirmation dialog:

```tsx
      {showExitConfirm && (
        <div className="pin-backdrop" role="dialog" aria-label="Exit confirmation">
          <div className="pin-modal" style={{ maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏻</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Exit Showcase OS?
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              Are you sure you want to close the presentation application?
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => window.api.invoke(IPC_CHANNELS.EXIT_KIOSK)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: 'var(--color-error, #ef4444)', color: '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}
              >
                Exit Application
              </button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 4: Update PIN verify callback to handle PIN-protected exit**

Update `handlePinVerify` so if PIN exit was triggered, it calls `IPC_CHANNELS.EXIT_KIOSK` or navigates to `/admin`.

- [ ] **Step 5: Commit Launcher exit button changes**

```bash
git add src/renderer/src/pages/kiosk/ProjectLauncher.tsx
git commit -m "feat(kiosk): add configurable exit button and confirmation modal to ProjectLauncher"
```

---

### Task 4: Kiosk Exit Controls in ProjectShowcase Header

**Files:**
- Modify: `src/renderer/src/pages/kiosk/ProjectShowcase.tsx:250-320`

- [ ] **Step 1: Load settings and add Exit button in `ProjectShowcase` header**

Add `showExitButton` and `exitRequiresPin` checks in `ProjectShowcase.tsx` top navbar:

```tsx
          {settings.showExitButton && (
            <button
              onClick={() => {
                if (settings.exitRequiresPin) {
                  setShowPinModal(true)
                } else {
                  setShowExitConfirm(true)
                }
              }}
              title="Exit Application"
              className="top-bar-action-btn"
              style={{
                padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-border)',
                background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <span>⏻</span> Exit
            </button>
          )}
```

- [ ] **Step 2: Commit Showcase exit button changes**

```bash
git add src/renderer/src/pages/kiosk/ProjectShowcase.tsx
git commit -m "feat(kiosk): add header exit button and confirmation dialog to ProjectShowcase"
```

---

### Task 5: Admin Panel Exit Controls & Settings Switches

**Files:**
- Modify: `src/renderer/src/components/admin/AdminTabs.tsx`

- [ ] **Step 1: Add Exit Switches in Admin Settings form**

In `AdminTabs.tsx` under the Settings tab form:

```tsx
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>
                  Kiosk Window Exit Controls
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.showExitButton ?? true}
                      onChange={(e) => setSettingsForm({ ...settingsForm, showExitButton: e.target.checked })}
                    />
                    <span>Show Exit Button in Kiosk Header</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.exitRequiresPin ?? false}
                      onChange={(e) => setSettingsForm({ ...settingsForm, exitRequiresPin: e.target.checked })}
                    />
                    <span>Require Admin PIN to Exit Application</span>
                  </label>
                </div>
              </div>
```

- [ ] **Step 2: Add Direct Exit App button in Admin Header**

In `AdminTabs.tsx` header area (or Admin layout header), add an Exit Application button:

```tsx
            <button
              onClick={() => window.api.invoke(IPC_CHANNELS.EXIT_KIOSK)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid var(--color-error, #ef4444)',
                background: 'transparent', color: 'var(--color-error, #ef4444)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <span>⏻</span> Exit Application
            </button>
```

- [ ] **Step 3: Commit Admin settings changes**

```bash
git add src/renderer/src/components/admin/AdminTabs.tsx
git commit -m "feat(admin): add exit settings toggles and admin header exit button"
```

---

### Task 6: Verification & End-to-End Build Test

**Files:**
- Test: Manual / Build check

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npm run build` or `npx tsc --noEmit` in `showcaseos`.
Expected: 0 errors.

- [ ] **Step 2: Commit plan completion**

```bash
git add docs/superpowers/plans/2026-09-03-window-exit-provision-plan.md
git commit -m "docs: add implementation plan for window exit provision"
```
