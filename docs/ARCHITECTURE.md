# ShowcaseOS Architecture & System Design Document

This document provides a comprehensive technical overview of **ShowcaseOS**, detailing the Electron process model, database architecture, IPC communications, security design, and data synchronization workflows.

---

## 1. High-Level Architecture Overview

ShowcaseOS uses a multi-process Electron architecture separated into the **Main Process** (Node.js runtime with direct SQLite database access) and the **Renderer Process** (React SPA executing within a sandboxed Chromium browser context).

```
+-----------------------------------------------------------------------------------+
|                                  ELECTRON MAIN                                    |
|                                                                                   |
|  +--------------------+    +--------------------+    +-------------------------+  |
|  |   Electron Main    |    |  Prisma / LibSQL   |    |  Local SQLite Database  |  |
|  |     (index.ts)     |<-->|  Database Adapter  |<-->|        (dev.db)         |  |
|  +---------+----------+    +--------------------+    +-------------------------+  |
|            |                                                                      |
|            | IPC Handlers (Projects, Units, Media, Staff, Sync, Backup)           |
|            v                                                                      |
|  +-----------------------------------------------------------------------------+  |
|  |                           Secure Context Bridge                             |  |
|  |                             (preload/index.ts)                              |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
+----------------------------------------|------------------------------------------+
                                         | window.api.invoke()
                                         v
+-----------------------------------------------------------------------------------+
|                                ELECTRON RENDERER                                  |
|                                                                                   |
|  +--------------------+    +--------------------+    +-------------------------+  |
|  |   React Router     |    | Presentation Kiosk |    |   Admin Control Center  |  |
|  | (Kiosk / Admin)    |<-->| (ProjectShowcase)  |<-->|   (AdminRoute & Tabs)   |  |
|  +--------------------+    +--------------------+    +-------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Database Schema (Prisma ORM)

The application uses an offline-first SQLite relational database managed via Prisma ORM.

### Key Models & Relationships:

1. **`Project`**: Core real estate project model (e.g. *Aurelia Heights*).
   - Relations: `Tower[]`, `Unit[]`, `ProjectModule[]`, `HighlightCard[]`, `Amenity[]`, `SessionLog[]`, `Lead[]`.
2. **`Tower`**: Represents high-rise towers/blocks within a project.
   - Relations: Belongs to `Project`, contains `Unit[]`.
3. **`Unit`**: Individual apartment/property inventory unit.
   - Fields: `unitNumber`, `floorNumber`, `bedrooms`, `builtUpArea`, `superBuiltUpArea`, `facing`, `unitPrice`, `status` (`AVAILABLE` | `RESERVED` | `SOLD`).
   - Relations: Belongs to `Tower` (`towerId`).
4. **`StaffProfile`**: Role-Based Access Control (RBAC) user profile.
   - Fields: `name`, `email`, `phone`, `pinHash` (SHA-256), `role` (`SUPERADMIN` | `ADMIN` | `AGENT`), `isActive`.
5. **`Settings`**: Global firm parameters (Company name, logo path, currency rates, VPS URL, API key).

---

## 3. Data Synchronization Engine

### A. VPS Cloud Publishing (`publishNow`)
1. Superadmin clicks **Publish (Push Admin)** in Admin -> Backup & Sync.
2. Main process fetches all relational entities (`projects`, `towers`, `units`, `modules`, `highlights`, `amenities`).
3. Payload is serialized with a version timestamp (`contentVersion: Date.now().toString()`).
4. Sends HTTP `POST` to `https://showcase.salesstudio.in/api/publish` with `x-api-key` header.
5. Server saves `store.json` and updates `contentVersion`.

### B. VPS Client Synchronization (`syncNow`)
1. Presentation Kiosk or Sales Laptop clicks **Sync (Pull Client)**.
2. Checks manifest (`GET /api/manifest`). If `contentVersion` matches local version, sync skips.
3. If new version exists, fetches full payload (`GET /api/sync`).
4. Main process executes a single SQLite transaction:
   - Dependency order: `Projects → Towers → Units → Modules → Highlights → Amenities`.
   - Strips nested relation fields to avoid Prisma cascade errors.
   - Updates local `Settings.contentVersion` and `lastSyncedAt`.

---

## 4. Security & Role-Based Access Control (RBAC)

- **Password & PIN Hashing:** 4-digit PINs are hashed using `crypto.createHash('sha256')`.
- **Session Persistence:** Active logged-in user details (`{ id, name, role }`) are stored in `localStorage` and sent with context sensitive IPC calls.
- **Permission Enforcement:**
  - `SUPERADMIN`: Full access + VPS Cloud Publishing rights.
  - `ADMIN`: Catalog & Inventory editing.
  - `AGENT`: Presentation mode only.
- **Fail-Safe Startup:** SQLite schema self-healing automatically adds missing columns on app startup if upgrading from older installations.
