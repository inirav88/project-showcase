# Configurable Application Startup Security Provision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide configurable app startup PIN protection in Showcase OS with three modes: Disabled (Direct launch), Staff Profile PIN Login, or Master Kiosk Lock.

**Architecture:** Extend Settings schema with `startupSecurityMode` (`"DISABLED"` | `"STAFF_PIN"` | `"MASTER_PIN"`). Create a reusable `<StartupLockGate>` wrapper component that enforces the configured startup lock modal before rendering kiosk presentation routes. Add a choice selector in Admin Settings.

**Tech Stack:** Electron, React, TypeScript, Prisma/LibSQL SQLite, CSS.

---

### File Structure Map
- Modify: `prisma/schema.prisma` — Add `startupSecurityMode` to `Settings` model.
- Modify: `src/main/db/client.ts` — Add safe `ALTER TABLE Settings ADD COLUMN startupSecurityMode ...` migration.
- Create: `src/renderer/src/components/kiosk/StartupLockGate.tsx` — Reusable security gate wrapper for kiosk routes.
- Modify: `src/renderer/src/App.tsx` — Wrap kiosk routes with `<StartupLockGate>`.
- Modify: `src/renderer/src/routes/AdminRoute.tsx` — Add `startupSecurityMode` settings choices in Admin Panel.

---

### Task 1: Database Schema & Column Migration

**Files:**
- Modify: `prisma/schema.prisma:194-218`
- Modify: `src/main/db/client.ts:40-48`

- [ ] **Step 1: Update Settings model in Prisma schema**

In `prisma/schema.prisma`, add `startupSecurityMode` field to `Settings`:

```prisma
model Settings {
  id                  Int      @id @default(1)
  firmName            String   @default("")
  firmLogoPath        String   @default("")
  firmContactPhone    String   @default("")
  firmContactEmail    String   @default("")
  firmWebsite         String   @default("")
  disclaimerText      String   @default("")
  themeAccentColor    String   @default("#1A73E8")
  adminPinHash        String   @default("")
  exchangeRateUsd     Float    @default(83.5)
  exchangeRateGbp     Float    @default(106.0)
  exchangeRateAed     Float    @default(22.7)
  idleTimeoutSeconds  Int      @default(300)
  lastBackupAt        DateTime?
  lastSyncedAt        DateTime?
  contentVersion      String   @default("0")
  vpsBaseUrl          String   @default("")
  vpsApiKey           String   @default("")
  narrationEnabled    Boolean  @default(true)
  watermarkEnabled    Boolean  @default(true)
  showExitButton      Boolean  @default(true)
  exitRequiresPin    Boolean  @default(false)
  startupSecurityMode String   @default("DISABLED")
}
```

- [ ] **Step 2: Add column migration in `client.ts`**

In `src/main/db/client.ts`, add:

```typescript
      libsql.execute(`ALTER TABLE Settings ADD COLUMN startupSecurityMode TEXT NOT NULL DEFAULT 'DISABLED'`).catch(() => {})
```

- [ ] **Step 3: Run `npx prisma generate`**

Run: `npx prisma generate` in `showcaseos` directory.
Expected: Client generated successfully with `startupSecurityMode` field.

- [ ] **Step 4: Commit Task 1**

```bash
git add prisma/schema.prisma src/main/db/client.ts
git commit -m "feat(db): add startupSecurityMode column to Settings model"
```

---

### Task 2: Create `StartupLockGate` Component

**Files:**
- Create: `src/renderer/src/components/kiosk/StartupLockGate.tsx`

- [ ] **Step 1: Write `StartupLockGate.tsx` component**

Create `src/renderer/src/components/kiosk/StartupLockGate.tsx`:

```tsx
import React, { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface StaffMember {
  id: string
  name: string
  role?: string
}

export function StartupLockGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('showcaseos_unlocked') === 'true'
  })
  const [loading, setLoading] = useState(true)
  const [securityMode, setSecurityMode] = useState<'DISABLED' | 'STAFF_PIN' | 'MASTER_PIN'>('DISABLED')

  // Staff Login State
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [staffPin, setStaffPin] = useState('')
  const [staffError, setStaffError] = useState('')

  // Master PIN State
  const [masterPinDigits, setMasterPinDigits] = useState<string[]>([])
  const [masterError, setMasterError] = useState('')

  useEffect(() => {
    if (unlocked) {
      setLoading(false)
      return
    }

    window.api.invoke(IPC_CHANNELS.SETTINGS_GET)
      .then((s: any) => {
        const mode = (s?.startupSecurityMode as any) || 'DISABLED'
        setSecurityMode(mode)

        if (mode === 'DISABLED') {
          sessionStorage.setItem('showcaseos_unlocked', 'true')
          setUnlocked(true)
        } else if (mode === 'STAFF_PIN') {
          window.api.invoke(IPC_CHANNELS.STAFF_LIST)
            .then((list: any) => {
              const active = (list as StaffMember[]) || []
              setStaffList(active)
              if (active.length > 0) setSelectedStaffId(active[0].id)
            })
            .catch(console.error)
        }
      })
      .catch(() => {
        setUnlocked(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [unlocked])

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) { setStaffError('Select a profile'); return }
    if (staffPin.length !== 4) { setStaffError('Enter 4-digit PIN'); return }

    try {
      const res = await (window as any).api.invoke(IPC_CHANNELS.STAFF_VERIFY_PIN, { id: selectedStaffId, pin: staffPin })
      if (res && res.valid) {
        sessionStorage.setItem('showcaseos_unlocked', 'true')
        setUnlocked(true)
      } else {
        setStaffError('Incorrect 4-digit PIN')
        setStaffPin('')
      }
    } catch {
      setStaffError('Verification failed')
    }
  }

  const handleMasterKey = async (digit: string) => {
    if (digit === '⌫') { setMasterPinDigits((p) => p.slice(0, -1)); setMasterError(''); return }
    const next = [...masterPinDigits, digit]
    setMasterPinDigits(next)
    if (next.length === 4) {
      try {
        const isValid = await (window as any).api.invoke(IPC_CHANNELS.SETTINGS_VERIFY_PIN, next.join(''))
        if (isValid) {
          sessionStorage.setItem('showcaseos_unlocked', 'true')
          setUnlocked(true)
        } else {
          setMasterError('Incorrect Master PIN')
          setMasterPinDigits([])
        }
      } catch {
        setMasterError('Verification failed')
        setMasterPinDigits([])
      }
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>Loading Showcase OS…</div>
  }

  if (unlocked || securityMode === 'DISABLED') {
    return <>{children}</>
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      {securityMode === 'STAFF_PIN' ? (
        <form onSubmit={handleStaffLogin} style={{ backgroundColor: 'var(--color-surface)', padding: '36px 32px', borderRadius: 20, width: 380, border: '1px solid var(--color-border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Welcome to Showcase OS</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Select your profile and enter your PIN to start</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Select Staff Profile</label>
            <select
              value={selectedStaffId}
              onChange={(e) => { setSelectedStaffId(e.target.value); setStaffError(''); setStaffPin('') }}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600 }}
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.role === 'SUPERADMIN' ? '👑' : s.role === 'ADMIN' ? '🛡️' : '👤'} {s.name} ({s.role || 'AGENT'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Enter 4-Digit Security PIN</label>
            <input
              type="password"
              maxLength={4}
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', textAlign: 'center', fontSize: 24, letterSpacing: '0.4em' }}
              autoFocus
            />
          </div>

          {staffError && (
            <div style={{ fontSize: 13, color: 'var(--color-error, #ef4444)', textAlign: 'center', fontWeight: 600 }}>{staffError}</div>
          )}

          <button
            type="submit"
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'var(--color-accent)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}
          >
            Unlock & Start Kiosk
          </button>
        </form>
      ) : (
        <div className="pin-modal" style={{ maxWidth: 360, textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Kiosk Startup Protection
          </div>
          <div style={{ fontSize: 18, color: 'var(--color-text-primary)', fontWeight: 700, marginBottom: 16 }}>
            Enter Master Admin PIN
          </div>
          <div className="pin-display">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`pin-dot${masterPinDigits[i] !== undefined ? ' filled' : ''}`} />
            ))}
          </div>
          {masterError && (
            <div style={{ fontSize: 13, color: 'var(--color-error, #ef4444)', textAlign: 'center', fontWeight: 600, margin: '8px 0' }}>
              {masterError}
            </div>
          )}
          <div className="pin-keypad">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
              key === '' ? <div key={i} /> : (
                <button key={key + i} className="pin-key" onClick={() => handleMasterKey(key)}>{key}</button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit `StartupLockGate` component**

```bash
git add src/renderer/src/components/kiosk/StartupLockGate.tsx
git commit -m "feat(kiosk): create StartupLockGate component for app launch protection"
```

---

### Task 3: Wrap Kiosk Routes with `StartupLockGate`

**Files:**
- Modify: `src/renderer/src/App.tsx:1-40`

- [ ] **Step 1: Wrap kiosk routes in `App.tsx`**

In `src/renderer/src/App.tsx`, import `StartupLockGate` and wrap Kiosk route elements:

```tsx
import { StartupLockGate } from './components/kiosk/StartupLockGate'

// Inside HashRouter routes:
<Route path="/kiosk" element={<StartupLockGate><ProjectLauncher /></StartupLockGate>} />
<Route path="/kiosk/project/:projectId" element={<StartupLockGate><ProjectShowcase /></StartupLockGate>} />
```

- [ ] **Step 2: Commit App route wrapper**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat(kiosk): wrap presentation kiosk routes with StartupLockGate"
```

---

### Task 4: Add Startup Protection Selector to Admin Settings

**Files:**
- Modify: `src/renderer/src/routes/AdminRoute.tsx`

- [ ] **Step 1: Include `startupSecurityMode` in Settings form payload**

In `handleSettingsSubmit` in `AdminRoute.tsx`:

```typescript
        startupSecurityMode: settings.startupSecurityMode || 'DISABLED',
```

- [ ] **Step 2: Render Startup Security Mode radio choices in Admin Settings tab**

In `AdminRoute.tsx` under Kiosk Features Configuration:

```tsx
                {/* App Startup Protection Mode Choice */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                      🔐 App Startup Protection Mode
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Choose what security verification is required when launching Showcase OS.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    {([
                      { id: 'DISABLED', title: 'Disabled (Direct Kiosk Launch)', desc: 'App opens directly into presentation without any PIN prompt.' },
                      { id: 'STAFF_PIN', title: 'Staff Profile PIN Login', desc: 'App opens with agent/admin profile picker + 4-digit PIN login.' },
                      { id: 'MASTER_PIN', title: 'Master Kiosk Lock', desc: 'App requires entering the 4-digit Master Admin PIN on launch.' },
                    ] as const).map(({ id, title, desc }) => (
                      <label key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: (settings.startupSecurityMode || 'DISABLED') === id ? 'var(--color-surface-raised)' : 'transparent', border: `1px solid ${(settings.startupSecurityMode || 'DISABLED') === id ? 'var(--color-accent)' : 'var(--color-border)'}`, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="startupSecurityMode"
                          value={id}
                          checked={(settings.startupSecurityMode || 'DISABLED') === id}
                          onChange={(e) => setSettings({ ...settings, startupSecurityMode: e.target.value })}
                          style={{ marginTop: 2 }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
```

- [ ] **Step 3: Commit Admin settings updates**

```bash
git add src/renderer/src/routes/AdminRoute.tsx
git commit -m "feat(admin): add App Startup Protection Mode selector to Admin Settings"
```

---

### Task 5: Verification & End-to-End Build Test

**Files:**
- Test: Manual / Build check

- [ ] **Step 1: Run TypeScript compiler check**

Run: `npx tsc --noEmit` in `showcaseos`.
Expected: 0 errors.

- [ ] **Step 2: Commit plan completion**

```bash
git add docs/superpowers/plans/2026-09-03-configurable-startup-security-plan.md
git commit -m "docs: add implementation plan for configurable application startup security"
```
