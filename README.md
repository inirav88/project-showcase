# ShowcaseOS — Desktop Real Estate Presentation & Management System

> **ShowcaseOS** is a high-performance, offline-first desktop application designed for real estate developers and sales agencies. It powers interactive touchscreen kiosks, sales office presentation displays, and mobile sales rep laptops with instant 3D model viewing, interactive unit selection, currency calculators, lead capture, and multi-user Role-Based Access Control (RBAC).

---

## 🌟 Key Features

### 1. 🏢 Interactive Property Showcase Kiosk
- **Offline-First Presentation Mode:** Full-screen presentation mode designed for touchscreens and TV displays.
- **Dynamic Module System:** Renders Project Overview, Master Layout, Tower 3D Views, Location Maps, Floor Plans, Gallery, Amenities, Video Walkthroughs, and EMI Calculators.
- **Interactive Unit Selector:** Filter inventory by Bedrooms (1BHK, 2BHK, 3BHK, Penthouses), Price Range, Facing (East, West, North, South), Area (Sq.Ft. / Sq.Yd.), and Availability Status (Available, Reserved, Sold).
- **Unit Shortlisting & Comparison:** Add units to a comparison drawer and calculate custom payment plans, down payments, and monthly EMIs.
- **Lead Capture & PDF Quotations:** Capture prospective buyers' names, phone numbers, and email addresses. Export customized PDF property brochures and unit quotes with instant QR codes.

### 2. 🔐 Multi-User Security & Role-Based Access Control (RBAC)
- **Role Hierarchy:**
  - `👑 SUPERADMIN`: Complete administrative authority. Full access to catalog editing, staff management, PIN resets, firm settings, and **VPS Cloud Publishing**.
  - `🛡️ ADMIN`: Management access to property catalogs, towers, units, media library, session logs, and leads.
  - `👤 AGENT / STAFF`: Presentation Mode operator for sales reps on showroom floors.
- **Security PIN Authentication:** Fast 4-digit PIN verification per user profile for seamless switching between sales staff and administrators.
- **User Switcher:** Top-bar session pill allowing instant user switching and logout without restarting the app.

### 3. ☁️ Dual Data Synchronization Engine
- **VPS Cloud Sync Server (`https://showcase.salesstudio.in`):**
  - **Publish (Push Admin):** Superadmins push live catalog updates (Projects, Towers, Units, Modules, Highlights, Amenities) to the central Node.js VPS server.
  - **Sync (Pull Client):** Presentation kiosks and sales laptops pull down live inventory and price updates over HTTPS delta sync.
- **Offline USB Backup ZIP:**
  - One-click export of complete ZIP archives (SQLite database + full media library).
  - Safe, automatic auto-backup before any import operation.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Electron + React (TypeScript) |
| **Bundler & Build Tool** | Vite + electron-vite |
| **Database & ORM** | SQLite + Prisma ORM (`@libsql/client` + `@prisma/adapter-libsql`) |
| **Styling** | Modern CSS Variables, Glassmorphism, Dark/Light Modern Themes |
| **PDF Generation** | `pdf-lib` + `qrcode` |
| **Media Processing** | `sharp` + `fluent-ffmpeg` |
| **State Management** | `zustand` |
| **Packaging** | `electron-builder` (Windows NSIS / macOS DMG) |

---

## 📁 Project Architecture & Directory Layout

```
showcaseos/
├── src/
│   ├── main/                  # Electron Main Process (Node.js Environment)
│   │   ├── index.ts           # App lifecycle, window creation, IPC initialization
│   │   ├── db/                # Prisma & LibSQL client setup with auto-migrations
│   │   └── ipc/               # IPC Handlers (Projects, Units, Media, Sync, Staff, Leads)
│   ├── preload/               # Secure Electron Preload Context Bridge
│   └── renderer/              # React UI Application (Chromium Renderer Environment)
│       └── src/
│           ├── components/    # UI Components (AdminTabs, Navigation, Modals)
│           ├── modules/       # Kiosk Presentation Modules (Overview, Layout, Units)
│           ├── pages/         # Top-level pages (Kiosk, Admin, Launcher)
│           └── routes/        # AdminRoute, PresentationRoute
├── sync-server/               # Standalone Express Node.js VPS Sync Server
│   ├── index.js               # Express API endpoints (/api/publish, /api/sync, /api/manifest)
│   ├── package.json           # Server dependencies (Express, CORS, dotenv)
│   └── README.md              # CloudPanel / PM2 deployment instructions
├── prisma/
│   ├── schema.prisma          # Database schema (Project, Tower, Unit, StaffProfile, Settings)
│   └── migrations/            # SQL migration history
├── dist/                      # Packaged production executables (electron-builder output)
└── out/                       # Compiled Vite output (main, preload, renderer)
```

---

## 🚀 Quick Start Guide for Developers

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/inirav88/project-showcase.git
   cd project-showcase/showcaseos
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Initialize Database:**
   ```bash
   npx prisma db push
   node scripts/patch-prisma-client.js
   ```

4. **Launch Development Environment:**
   ```bash
   npm run dev
   ```

---

## 📜 Available NPM Commands

| Command | Action |
|---|---|
| `npm run dev` | Launch Electron app in live hot-reloading development mode |
| `npm test` | Run complete unit test suite via Vitest (17 tests across 9 files) |
| `npm run build` | Compile main, preload, and renderer TypeScript bundles |
| `npm run package` | Build production installer executable (`ShowcaseOS Setup 0.0.1.exe` in `dist/`) |
| `npm run prisma:generate` | Generate Prisma Client and apply compatibility patches |

---

## 🌐 VPS Sync Server Deployment Guide

To deploy the standalone sync server on CloudPanel or Ubuntu VPS:

1. Copy the `sync-server/` directory to your web server (e.g. `/home/salesstudio-showcase/htdocs/showcase.salesstudio.in`).
2. Install production dependencies:
   ```bash
   npm install --production
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=3004
   API_KEY=salesstudio-secret-key-2026
   ```
4. Start process manager:
   ```bash
   pm2 start index.js --name "showcase-sync-server"
   ```
5. Test server health check:
   ```bash
   curl https://showcase.salesstudio.in/health
   ```
   *Response: `{"status":"ok","server":"ShowcaseOS Sync VPS Server","version":"1788350590550"}`*

---

## 🔄 Client Operations & Multi-Laptop Workflow

1. **One-Time Client Setup:** Run `npm run package` on main laptop -> Install `ShowcaseOS Setup 0.0.1.exe` on client laptop -> Configure VPS Base URL (`https://showcase.salesstudio.in`) and API Key in Admin Settings -> Create `AGENT` user account for sales reps.
2. **Publishing Updates (Superadmin Main Laptop):** Edit catalog/prices on main laptop -> Go to **Backup & Sync** -> Click **Publish (Push Admin)**.
3. **Syncing Updates (Client Laptops / Kiosks):** Client opens ShowcaseOS -> Go to **Backup & Sync** -> Click **Sync (Pull Client)**. Updates download in seconds!

---

## 🛡️ Git & Contribution Policy

- **Default Branch:** All local changes must be committed and pushed to the **`dev`** branch.
- **Direct Pushes:** Direct pushes to `main` or `staging` are strictly prohibited.
- **Verification Rule:** Always run `npm test` before committing changes to ensure 100% test pass rate.

---

## 📄 License & Attribution

Copyright © 2026 **Nirav Real Estate / ShowcaseOS**. All rights reserved.
