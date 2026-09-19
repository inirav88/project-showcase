# Configurable Multi-Option WhatsApp Brochure Sharing System Design

**Date:** 2026-09-19  
**Target Application:** ShowcaseOS (Offline Real Estate Showcase System)  
**Status:** Approved  

---

## 1. Executive Summary

This specification defines the architecture, data models, IPC handlers, UI components, and Admin panel settings for sending project brochures to clients via WhatsApp directly from the **Brochure Module** (`BrochureModule.tsx`).

The system supports **3 distinct WhatsApp delivery options**, each fully configurable in the Admin Panel so administrators can choose which mode(s) to enable or set as default:

1. **Option A: 1-Click WhatsApp Link (`wa.me`)** — Opens WhatsApp Desktop or WhatsApp Web on the sales laptop with a pre-formatted message containing client name, project details, and brochure link.
2. **Option B: Instant Client QR Code** — Displays an on-screen QR code for the client to scan with their phone camera to instantly open a pre-filled WhatsApp conversation on their phone.
3. **Option C: Background WhatsApp Cloud API** — Sends the brochure PDF media message directly to the client's WhatsApp chat in the background using Twilio or Meta Cloud API credentials.

---

## 2. Database & Schema Updates (`prisma/schema.prisma`)

Add the following fields to the `Settings` model in SQLite:

```prisma
model Settings {
  // Existing fields...
  
  // WhatsApp Brochure Sharing Configuration
  whatsappEnabled          Boolean @default(true)
  whatsappAllowDeepLink    Boolean @default(true)
  whatsappAllowQrCode      Boolean @default(true)
  whatsappAllowApiSend     Boolean @default(false)
  whatsappDefaultMode      String  @default("SHOW_CHOICE") // DEEP_LINK | QR_CODE | API_SEND | SHOW_CHOICE
  whatsappMessageTemplate  String  @default("Hi {clientName}, here is the official brochure for {projectName}: {brochureUrl}")
  whatsappApiProvider      String  @default("META_CLOUD")  // META_CLOUD | TWILIO | ULTRAMSG
  whatsappApiToken         String  @default("")
  whatsappApiPhoneNumberId String  @default("")
}
```

---

## 3. Main Process IPC & Services (`src/main/ipc/`)

### A. IPC Channels (`channels.ts`)
Add new channel constants:
- `WHATSAPP_SEND_API`: `'whatsapp:sendApi'`

### B. WhatsApp Handler (`src/main/ipc/handlers/whatsapp.ts`)
Creates `WhatsappHandlers` class with:
- `sendApiPayload(phone, clientName, projectName, brochureUrl)`:
  - Formats phone numbers to international E.164 format.
  - Formats message using `whatsappMessageTemplate`.
  - Dispatches HTTPS request to Meta Cloud API / Twilio WhatsApp API.
  - Returns `{ success: boolean, messageId?: string, reason?: string }`.

---

## 4. Frontend UI Components (`src/renderer/src/`)

### A. Admin Settings Configuration (`src/renderer/src/routes/AdminRoute.tsx`)
In **Admin > Settings tab**:
- Add **WhatsApp Brochure Sharing Configuration** section with:
  - Master Toggle (`whatsappEnabled`)
  - Mode Toggles (`whatsappAllowDeepLink`, `whatsappAllowQrCode`, `whatsappAllowApiSend`)
  - Default Action Dropdown (`whatsappDefaultMode`)
  - Message Template Textarea with placeholder variables guide (`{clientName}`, `{projectName}`, `{brochureUrl}`)
  - API Credentials inputs (Provider, Phone Number ID / Account SID, Secret API Token) shown when Cloud API mode is enabled.

### B. Brochure Module Toolbar & Sharing Modal (`BrochureModule.tsx`)
In **BrochureModule.tsx**:
- Add green **`📱 Send on WhatsApp`** button to action header.
- Create `WhatsAppShareModal` component:
  - Auto-reads lead name & phone from active session / shortlist store.
  - Evaluates active Admin modes:
    - If 1 mode enabled in Admin: executes in 1 click.
    - If multiple modes enabled in Admin: presents clean touch selector tabs (Deep Link, QR Code, Cloud API).
  - Generates live QR code via `qrcode` package for Option B.
  - Dispatches IPC call for Option C.

---

## 5. Verification & Testing Plan

### Automated Tests (`npm test`)
- Unit tests for `WhatsappHandlers` IPC handlers (phone formatting, payload building, error handling).
- Unit tests for `SettingsHandlers` setting updates.
- Component render tests for `BrochureModule` WhatsApp button and sharing modal.

### Manual Verification
- Verify Admin Settings persistence.
- Verify 1-click WhatsApp deep link generation.
- Verify QR Code scanning on test mobile devices.
- Run `npm test` and `npm run build` to confirm clean compilation.
