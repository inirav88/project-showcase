# WhatsApp Brochure Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 1-click & multi-option WhatsApp Brochure Sharing system in ShowcaseOS with Admin panel mode controls (Deep Link, QR Code, Cloud API).

**Architecture:** Extend SQLite Settings schema for WhatsApp configurations, create main process IPC handler `whatsapp:sendApi`, update Admin Settings UI for mode & credential management, and build `WhatsAppShareModal` in `BrochureModule.tsx` for 1-click and interactive sharing.

**Tech Stack:** Electron, React, TypeScript, Prisma ORM, SQLite, Zod, QR Code (`qrcode` library), Vitest.

---

### Task 1: Update Database Schema & Settings Defaults

**Files:**
- Modify: `prisma/schema.prisma:194-219`
- Modify: `src/main/ipc/handlers/settings.ts`
- Test: `src/main/ipc/handlers/__tests__/sync.test.ts`

- [ ] **Step 1: Update `schema.prisma` with WhatsApp settings fields**

```prisma
model Settings {
  id                      Int       @id @default(1)
  firmName                String    @default("")
  firmLogoPath            String    @default("")
  firmContactPhone        String    @default("")
  firmContactEmail        String    @default("")
  firmWebsite             String    @default("")
  disclaimerText          String    @default("")
  themeAccentColor        String    @default("#1A73E8")
  adminPinHash            String    @default("")
  exchangeRateUsd         Float     @default(83.5)
  exchangeRateGbp         Float     @default(106.0)
  exchangeRateAed         Float     @default(22.7)
  idleTimeoutSeconds      Int       @default(300)
  lastBackupAt            DateTime?
  lastSyncedAt            DateTime?
  contentVersion          String    @default("0")
  vpsBaseUrl              String    @default("")
  vpsApiKey               String    @default("")
  narrationEnabled        Boolean   @default(true)
  watermarkEnabled        Boolean   @default(true)
  showExitButton          Boolean   @default(true)
  exitRequiresPin        Boolean   @default(false)
  startupSecurityMode     String    @default("DISABLED")

  // WhatsApp Brochure Sharing Configuration
  whatsappEnabled         Boolean   @default(true)
  whatsappAllowDeepLink   Boolean   @default(true)
  whatsappAllowQrCode     Boolean   @default(true)
  whatsappAllowApiSend    Boolean   @default(false)
  whatsappDefaultMode     String    @default("SHOW_CHOICE")
  whatsappMessageTemplate String    @default("Hi {clientName}, here is the official brochure for {projectName}: {brochureUrl}")
  whatsappApiProvider     String    @default("META_CLOUD")
  whatsappApiToken        String    @default("")
  whatsappApiPhoneNumberId String   @default("")
}
```

- [ ] **Step 2: Generate Prisma Client & Migrate DB**

Run: `npx prisma generate`
Expected: Client generated successfully.

- [ ] **Step 3: Update `SettingsHandlers` in `src/main/ipc/handlers/settings.ts`**

Update `getSettings` and `updateSettings` methods to include the new fields.

- [ ] **Step 4: Commit schema changes**

```bash
git add prisma/schema.prisma src/main/ipc/handlers/settings.ts
git commit -m "feat(whatsapp): update Settings schema and IPC handlers for WhatsApp sharing configuration"
```

---

### Task 2: Main Process WhatsApp IPC Handler & Sanitizer

**Files:**
- Create: `src/main/ipc/handlers/whatsapp.ts`
- Modify: `src/main/ipc/channels.ts`
- Modify: `src/main/index.ts`
- Test: `src/main/ipc/handlers/__tests__/whatsapp.test.ts`

- [ ] **Step 1: Define IPC Channel constant**

Add to `src/main/ipc/channels.ts`:
`WHATSAPP_SEND_API: 'whatsapp:sendApi'`

- [ ] **Step 2: Write failing unit test for `whatsapp.ts`**

Create `src/main/ipc/handlers/__tests__/whatsapp.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}))

import { WhatsappHandlers } from '../whatsapp'

describe('WhatsappHandlers', () => {
  let mockDb: any
  let handlers: WhatsappHandlers

  beforeEach(() => {
    mockDb = {
      settings: {
        findUnique: vi.fn(),
      },
    }
    handlers = new WhatsappHandlers(mockDb)
  })

  it('formats phone numbers to E.164 and returns error if API settings missing', async () => {
    mockDb.settings.findUnique.mockResolvedValueOnce({
      whatsappAllowApiSend: true,
      whatsappApiToken: '',
    })

    const res = await handlers.sendApi({
      phone: '+91 (98765) 43210',
      clientName: 'Nirav',
      projectName: 'Avyanna',
      brochureUrl: 'https://example.com/brochure.pdf',
    })

    expect(res.success).toBe(false)
    expect(res.reason).toContain('API credentials missing')
  })
})
```

- [ ] **Step 3: Run test to verify failure**

Run: `npx vitest run src/main/ipc/handlers/__tests__/whatsapp.test.ts`
Expected: FAIL ("WhatsappHandlers not found")

- [ ] **Step 4: Implement `WhatsappHandlers` in `src/main/ipc/handlers/whatsapp.ts`**

```ts
import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client/showcase-client'
import { IPC_CHANNELS } from '../channels'

export interface WhatsappSendPayload {
  phone: string
  clientName: string
  projectName: string
  brochureUrl: string
}

export class WhatsappHandlers {
  constructor(private db: PrismaClient) {}

  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) return `91${cleaned}` // Default India prefix if 10 digits
    return cleaned
  }

  async sendApi(payload: WhatsappSendPayload) {
    const settings = await this.db.settings.findUnique({ where: { id: 1 } })
    if (!settings?.whatsappApiToken || !settings?.whatsappApiPhoneNumberId) {
      return { success: false, reason: 'WhatsApp API credentials missing in Admin Settings.' }
    }

    const formattedPhone = this.formatPhoneNumber(payload.phone)
    const template = settings.whatsappMessageTemplate || 'Hi {clientName}, here is the brochure for {projectName}: {brochureUrl}'
    const message = template
      .replace(/{clientName}/g, payload.clientName || 'Valued Client')
      .replace(/{projectName}/g, payload.projectName || 'Project')
      .replace(/{brochureUrl}/g, payload.brochureUrl || '')

    try {
      if (settings.whatsappApiProvider === 'META_CLOUD') {
        const url = `https://graph.facebook.com/v18.0/${settings.whatsappApiPhoneNumberId}/messages`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.whatsappApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: message },
          }),
        })
        if (!res.ok) {
          const errText = await res.text()
          return { success: false, reason: `Meta API returned ${res.status}: ${errText}` }
        }
        return { success: true, message: 'Brochure sent via WhatsApp API' }
      }
      return { success: false, reason: 'Unsupported WhatsApp API provider' }
    } catch (err: any) {
      return { success: false, reason: err?.message || 'Unknown network error' }
    }
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.WHATSAPP_SEND_API, (_, payload: WhatsappSendPayload) => this.sendApi(payload))
  }
}
```

- [ ] **Step 5: Register `WhatsappHandlers` in `src/main/index.ts`**

Add `new WhatsappHandlers(db).registerIpc()` to `main/index.ts`.

- [ ] **Step 6: Run test to verify pass**

Run: `npx vitest run src/main/ipc/handlers/__tests__/whatsapp.test.ts`
Expected: PASS

- [ ] **Step 7: Commit task**

```bash
git add src/main/ipc/channels.ts src/main/ipc/handlers/whatsapp.ts src/main/ipc/handlers/__tests__/whatsapp.test.ts src/main/index.ts
git commit -m "feat(whatsapp): implement WhatsApp IPC handler for Cloud API dispatches and number formatting"
```

---

### Task 3: Admin Settings UI Configuration Section

**Files:**
- Modify: `src/renderer/src/routes/AdminRoute.tsx`

- [ ] **Step 1: Add WhatsApp Settings Form Controls in Admin Panel**

Add a dedicated **WhatsApp Brochure Sharing Configuration** section to `AdminRoute.tsx` settings tab with toggles for:
- `whatsappEnabled`
- `whatsappAllowDeepLink`
- `whatsappAllowQrCode`
- `whatsappAllowApiSend`
- `whatsappDefaultMode`
- `whatsappMessageTemplate`
- `whatsappApiProvider`, `whatsappApiPhoneNumberId`, `whatsappApiToken`

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build passes without TS errors.

- [ ] **Step 3: Commit Admin UI changes**

```bash
git add src/renderer/src/routes/AdminRoute.tsx
git commit -m "feat(admin): add WhatsApp brochure sharing settings configuration section to Admin panel"
```

---

### Task 4: Brochure Tab 1-Click & Multi-Option WhatsApp Modal (`BrochureModule.tsx`)

**Files:**
- Modify: `src/renderer/src/modules/components/BrochureModule.tsx`

- [ ] **Step 1: Add `📱 Send on WhatsApp` button to `BrochureModule.tsx` action bar**

- [ ] **Step 2: Implement `WhatsAppShareModal` component inside `BrochureModule.tsx`**

Integrate:
- Pre-filled `clientName` & `phone` from session / shortlist store.
- **Option 1 (Deep Link)**: Triggers `https://wa.me/<phone>?text=<encoded_msg>`.
- **Option 2 (QR Code)**: Renders live QR code via `QRCode.toDataURL`.
- **Option 3 (Cloud API)**: Calls `window.api.invoke(IPC_CHANNELS.WHATSAPP_SEND_API, payload)`.
- Respects Admin settings toggles and `whatsappDefaultMode`.

- [ ] **Step 3: Run full vitest suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Commit task**

```bash
git add src/renderer/src/modules/components/BrochureModule.tsx
git commit -m "feat(brochure): add 1-click & multi-option WhatsApp brochure sharing button and modal"
```

---

## Verification Plan

1. **Automated Tests**:
   - `npx vitest run` to ensure all main IPC, handler, renderer, and new `whatsapp.test.ts` pass cleanly.
2. **Build Check**:
   - `npm run build` to verify production Electron app compilation.
