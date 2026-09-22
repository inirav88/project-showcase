# ShowcaseOS Git Workflow, Versioning & OTA Auto-Update Guide

This document serves as the official operational guide for version control, branching rules, release management, and Over-The-Air (OTA) software delivery for **SalesStudio / ShowcaseOS**.

---

## 1. Repository Structure & Branching Rules

The repository follows a two-tier branching strategy:

```
  main ──────────────────────────────●────────────────────────●────────  (Production Releases)
                                    ▲                        ▲
                                  v0.0.1                   v0.0.2
                                    │                        │
  dev  ───●──────●──────●───────────┴──●──────●──────●───────┴────────  (Daily Development)
```

| Branch | Purpose | Rules & Constraints |
| :--- | :--- | :--- |
| **`dev`** | Daily development, AI coding sessions, bug fixes, feature work | All daily work must be committed and pushed to `dev`. |
| **`main`** | Production gold-standard code delivered to client laptops | Never commit directly to `main`. `main` only receives merged releases from `dev`. Tagged with version numbers (e.g. `v0.0.1`). |

---

## 2. Distinction Between Updates

ShowcaseOS has two distinct update mechanisms:

| Update Type | Handles | Delivery Mechanism | Client Action |
| :--- | :--- | :--- | :--- |
| **A. Data & Catalog Updates** | Real estate projects, towers, units, pricing, floor plans, media files | VPS Sync Engine (`https://showcase.salesstudio.in/api/publish` & `/api/sync`) | Click **"Sync (Pull Client)"** in app |
| **B. Software & Feature Updates** | App UI, new buttons, bug fixes, code changes | `electron-updater` via VPS static updates (`https://showcase.salesstudio.in/updates/`) | Automatic background download $\rightarrow$ Click **"Restart & Install Now"** |

---

## 3. Step-by-Step Guide: Pushing Future Feature Updates

Follow these exact steps whenever you want to release a new software version to clients:

### Step 1: Develop & Test Locally
1. Make code changes on your laptop on the **`dev`** branch.
2. Run test suite:
   ```bash
   npm run test
   ```
3. Test locally in dev mode:
   ```bash
   npm run dev
   ```

### Step 2: Bump Version & Merge to `main`
1. Open [package.json](file:///e:/Project%20Showcase/showcaseos/package.json) and update the version field:
   ```json
   "version": "0.0.2"
   ```
2. Commit and push your changes to `dev`:
   ```bash
   git add .
   git commit -m "feat: release version 0.0.2 with new features"
   git push origin dev
   ```
3. Merge `dev` into `main` and tag the release:
   ```bash
   git checkout main
   git merge dev
   git tag -a v0.0.2 -m "Release v0.0.2"
   git push origin main --tags
   git checkout dev
   ```

### Step 3: Package the Software Build
On your development machine, package the application:
```bash
npm run package
```
This runs `electron-vite build` and `electron-builder` to generate release files in the `dist/` folder:
- **`latest.yml`** (Auto-updater release manifest)
- **`SalesStudio Setup 0.0.2.exe`** (Windows NSIS installer executable)

### Step 4: Upload Release Files to VPS
Upload both `latest.yml` and `SalesStudio Setup 0.0.2.exe` from your local `dist/` folder to your VPS server directory at:
```bash
~/htdocs/showcase.salesstudio.in/updates/
```
*(You can upload via FileZilla, SCP, SFTP, or cPanel File Manager).*

### Step 5: Automatic Client Laptop Update Flow
1. When a client opens **SalesStudio** on their laptop (connected to the internet), Electron auto-checks:
   `https://showcase.salesstudio.in/updates/latest.yml`
2. It detects version `0.0.2` is newer than installed version `0.0.1`.
3. It downloads `SalesStudio Setup 0.0.2.exe` in the background without interrupting the client.
4. A floating notification banner appears:
   > 🔔 **Update Ready:** Version `v0.0.2` downloaded! **[Restart & Install Now]**
5. Client clicks **"Restart & Install Now"**.
6. The installer updates the app files in `AppData/Local/Programs/SalesStudio`.
7. **Client SQLite database (`dev.db`), saved leads, and local media files in `AppData/Roaming/SalesStudio` remain 100% safe and intact.**

---

## 4. Useful Terminal Commands Reference

```bash
# Check current git status
git status

# Switch between branches
git checkout dev
git checkout main

# View tags
git tag -l

# Build & test before release
npm run test
npm run build
npm run package
```
