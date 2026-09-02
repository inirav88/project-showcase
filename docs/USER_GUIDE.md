# ShowcaseOS User & Administrator Manual

This guide explains how to operate **ShowcaseOS** in both **Presentation Kiosk Mode** and **Admin Control Center Mode**.

---

## 🔑 1. Initial Launch & Default Credentials

When you launch ShowcaseOS for the first time:
- **Default Superadmin Account:** `Super Admin`
- **Default Security PIN:** `0000`

> ⚠️ **Important:** Log into `Admin Control Center -> Staff Profiles` immediately and change the default PIN for `Super Admin` to a secure 4-digit PIN of your choice.

---

## 🏢 2. Switching Between Kiosk & Admin Mode

- **Entering Admin Mode:** From the presentation launcher or showcase header, click **Admin Control Center**, select your user profile, and enter your 4-digit security PIN.
- **Returning to Presentation Kiosk:** In the Admin top bar, click **🚀 Launch Kiosk** to switch back to full-screen client presentation mode.

---

## 👥 3. Managing Users & Staff Profiles (RBAC)

1. Open **Admin Control Center** -> **Staff Profiles**.
2. **Create New User:**
   - Enter **Full Name**, **User Role** (`SUPERADMIN`, `ADMIN`, `AGENT`), **Email**, **Phone**, and a **4-Digit PIN**.
   - Click **Create User Account**.
3. **Reset Security PIN:**
   - Click **Reset PIN** next to any user account to assign a new 4-digit security PIN.
4. **Switch Logged In User:**
   - In the top right header, click **🚪 Switch User / Logout**.
   - Select your user profile from the dropdown, enter your 4-digit PIN, and click **Login User**.

---

## 🎨 4. Company Branding & Logo Setup

1. Go to **Admin Control Center** -> **Settings**.
2. Under **Company Logo**, click **Upload Company Logo**.
3. Select your PNG/JPG/SVG logo image.
4. The logo thumbnail preview will update instantly.
5. Click **Save Configuration**. Your company logo will now appear in the top-left launcher header!

---

## ☁️ 5. Cloud Publishing & Inventory Sync

### A. Publishing Updates from Main Laptop (Superadmin Only)
1. Open Admin Control Center -> **Settings** -> set **VPS Base URL** to `https://showcase.salesstudio.in` and **VPS Secret Key** to `salesstudio-secret-key-2026`.
2. Go to **Backup & Sync** tab.
3. Click **Publish (Push Admin)**.
4. Once completed, a green confirmation message will display: `✓ Cloud publish complete. Version: [timestamp]`.

### B. Syncing Client Laptops & Kiosks
1. Open ShowcaseOS on any presentation laptop or kiosk.
2. Go to Admin -> **Backup & Sync** -> click **Sync (Pull Client)**.
3. All new projects, towers, units, prices, and status changes will instantly download onto the kiosk!

---

## 📊 6. Lead Capture & CSV Export

1. During customer presentations, open the **Lead Drawer** or click **Get Quote**.
2. Enter the buyer's name, phone number, email address, and interest notes.
3. All leads are securely stored in the local SQLite database.
4. To export leads for CRM integration:
   - Go to Admin -> **Leads** tab.
   - Click **Export CSV** to download a spreadsheet of all customer contacts.

---

## 🔄 7. Master Client Management & Multi-Laptop Deployment Workflow

Since **YOU (Superadmin)** are the sole administrator updating property catalogs, towers, prices, and media, follow this step-by-step workflow:

### Phase 1: One-Time Client Installation (Setup)
1. **Build Installer:** On your main laptop, run `npm run package`. Copy `ShowcaseOS Setup 0.0.1.exe` from `dist/` onto a USB drive.
2. **Install on Client Laptop:** Plug the USB drive into the client system and run the installer.
3. **Configure VPS Connection (One-Time):**
   - Open ShowcaseOS on client laptop -> Admin -> **Settings**.
   - Set **VPS Base URL:** `https://showcase.salesstudio.in`
   - Set **VPS API Secret Key:** `salesstudio-secret-key-2026`
   - Click **Save Configuration**.
4. **Create Sales Rep Account:**
   - Go to **Staff Profiles** -> create account for showroom staff (Role: `AGENT / STAFF`, PIN: e.g. `1234`). Sales reps present safely without admin rights.

### Phase 2: Updating Projects & Prices (From Your Main Laptop)
1. Add new projects, create towers, or update unit status/prices in ShowcaseOS Admin on your main laptop.
2. Go to **Backup & Sync** tab -> Click **Publish (Push Admin)**.
3. Your latest catalog payload is securely pushed to `https://showcase.salesstudio.in`.

### Phase 3: Client Updating (On Their Laptops / Kiosks)
1. Client opens ShowcaseOS -> **Backup & Sync** tab.
2. Click **Sync (Pull Client)**.
3. All updated projects, towers, units, and pricing automatically download in seconds!

