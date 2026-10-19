# Product Requirements Document (PRD)
## ShowcaseOS for Android Interactive Panels (ViewSonic ViewBoard IN7505V-N)

**Document Owner:** Product & Engineering  
**Target Hardware:** ViewSonic ViewBoard IN7505V-N (75" 4K UHD, Android 14 EDLA, 40-Point Touch)  
**Target Application:** ShowcaseOS Android Kiosk & Sales Galleria Presentation System  
**Status:** Ready for Development  
**Triage Label:** `ready-for-agent`  

---

## Problem Statement

ShowcaseOS currently operates as an Electron-based desktop application on Windows and macOS laptops. In modern sole-mandate real estate firms and luxury developer experience centers, sales consultations take place in front of large-format interactive flat panels—specifically commercial 75-inch touchscreens such as the **ViewSonic ViewBoard IN7505V-N**. 

Presenting from a laptop connected to the ViewBoard via HDMI introduces critical friction and degrades the luxury sales experience:
1. **Physical & Ergonomic Tethering:** Presenters must keep a laptop on a nearby desk or podium, physically tethered via HDMI and USB touch-back cables, cluttering the showroom floor and risking cable trip hazards or disconnects during walk-in client visits.
2. **Sub-optimal Touch & Latency:** Relaying 40-point IR touch events over USB touch-back to a Windows laptop frequently suffers from driver-induced touch latency, gesture misinterpretations (pinch-to-zoom lag), and complete lack of native dual-stylus palm rejection.
3. **Kiosk Vulnerability:** When running through a connected laptop, accidental OS notifications, desktop popups, incoming Slack/WhatsApp messages, or battery exhaustion disrupt the client experience and expose confidential firm data.
4. **Maintenance Overhead:** Office staff must power up, unlock, and connect a dedicated PC every morning instead of having the 75-inch panel boot autonomously into a branded, full-screen interactive sales kiosk that is ready for instant walk-ins.
5. **Hardware Underutilization:** The ViewBoard IN7505V-N features high-performance built-in compute (Octa-Core 4x Cortex-A76 + 4x Cortex-A55, 8GB RAM, 128GB high-speed ROM, Android 14 with Google EDLA, 500 nits 4K display, and 40-point Ultra Fine Touch). Running external video inputs bypasses this internal hardware and introduces avoidable point-of-failure dependencies.

Sales executives and firm administrators need a dedicated, native Android application that installs directly on the ViewSonic ViewBoard IN7505V-N, leverages its 4K resolution and 40-point touch/stylus hardware, operates 100% offline from internal storage, syncs with the central VPS cloud catalog, and locks the panel into an unshakeable, premium sales showroom kiosk.

---

## Solution

Port and optimize ShowcaseOS into a production-grade Android 14 application tailored for the **ViewSonic ViewBoard IN7505V-N** interactive panel.

The solution preserves the proven React presentation engine, modular architecture, and glassmorphic UI design system of ShowcaseOS, while introducing a native Android platform bridge (via Capacitor 6+ on Android 14):
1. **Direct On-Panel Execution:** The application runs natively on the panel's internal octa-core processor and Mali GPU, eliminating all HDMI cables, external laptops, and auxiliary hubs.
2. **75-Inch 4K Ergonomic UI:** The UI scale, typography, button targets, and interactive touch zones are calibrated for standing sales presentations on a 75" 4K (3840 x 2160) canvas. Primary navigation and filter drawers are anchored within the ergonomic reach zone (the lower 60% of the display) so presenters never strain to tap top headers.
3. **40-Point Multi-Touch & Dual-Stylus Drawing Seam:** Full native support for ViewBoard's Ultra Fine Touch technology—enabling simultaneous multi-client touch exploration, silky-smooth 60fps pinch-to-zoom on 4K master layout plans, and real-time stylus markup (dual-color pens for presenter notes and client highlighting) with automatic palm rejection.
4. **Offline-First High-Speed Storage:** All project assets (4K drone walkthroughs, high-resolution interior/exterior renders, interactive SVG layout plans, and full PDF brochures) reside locally within the 128GB onboard flash memory. Switching between projects occurs in under 2 seconds with zero network buffering.
5. **Kiosk Lockdown & Auto-Boot:** Leverages Android 14 enterprise kiosk capabilities (`SYSTEM_UI_FLAG_IMMERSIVE_STICKY`, Android Lock Task pinning, and `BOOT_COMPLETED` receiver) so the ViewBoard boots directly into ShowcaseOS with hidden system navigation bars, shielded settings, and 4-digit PIN-protected administrative escapes.
6. **Dual Cloud & USB Synchronization:** Retains full synchronization parity with the centralized Node.js VPS sync server (`https://showcase.salesstudio.in/api/sync`) over Wi-Fi 6 / Gigabit LAN, alongside direct USB-OTG archive import/export for zero-connectivity air-gapped updates.

---

## User Stories

### A. Sales Executive / Presenter on the ViewBoard
1. As a sales executive, I want the ViewBoard to turn on and immediately display the ShowcaseOS project launcher, so that I can start presenting to walk-in clients without setting up cables or logging into a PC.
2. As a sales executive, I want to tap any project card on the 75-inch screen and have its full presentation hub load in under 2 seconds, so that the meeting flow is seamless and professional.
3. As a sales executive, I want to use standard two-finger pinch and drag gestures to zoom into 4K master plans and floor layouts, so that I can show intricate unit details to clients clearly.
4. As a sales executive, I want to pick up the ViewBoard passive stylus and draw directly over floor plans and unit layouts, so that I can highlight room dimensions, balconies, and vastu alignments during discussions.
5. As a sales executive, I want my resting palm on the screen to be ignored while writing with the stylus, so that writing on the board feels natural like a whiteboard.
6. As a sales executive, I want to use the stylus eraser or a palm-swipe gesture to clear annotations, so that I do not have to search for an undo button while talking to a client.
7. As a sales executive, I want to filter apartment inventory by bedroom configuration (2BHK, 3BHK, 4BHK), facing direction, budget, and availability with large, finger-friendly buttons, so that I can quickly narrow down matching units without mistapping.
8. As a sales executive, I want to tap on a tower and drill down into individual floor plates and unit cards, so that the client understands the exact elevation and positioning of their unit.
9. As a sales executive, I want to add up to 3 units into a comparison drawer, so that I can display their floor areas, specifications, and prices side-by-side on the 75-inch screen.
10. As a sales executive, I want to play full-screen 4K drone walkthrough videos without any stutter, buffering wheel, or internet dependency, so that the visual presentation feels cinematic and premium.
11. As a sales executive, I want to navigate 360-degree virtual sample flat tours using one-finger swipe panning, so that clients can experience the space interactively.
12. As a sales executive, I want an on-screen interactive EMI and payment milestone calculator with large slider controls, so that I can calculate monthly installments and down payment schedules collaboratively with the client.
13. As a sales executive, I want to view official brochures inside the app using a smooth PDF viewer, so that I never have to switch away to external Android document apps.
14. As a sales executive, I want all navigation tabs and action buttons positioned within the lower two-thirds of the screen, so that I can comfortably reach every control without stretching.
15. As a sales executive, I want to quickly capture the client's name, phone number, and shortlisted units, so that a personalized session record is preserved for follow-up.
16. As a sales executive, I want to generate a dynamic on-screen QR code for shortlisted units and brochures, so that clients can scan it with their smartphones and take the materials with them immediately.
17. As a sales executive, I want to switch my user profile quickly using a 4-digit PIN from the top bar, so that my sales session and client interactions are accurately logged under my name.

### B. Buyer / Client Interacting with the Board
18. As a visiting client, I want to touch the screen at the same time as my spouse or the sales agent without freezing the interface, so that we can collaborate naturally.
19. As a visiting client, I want to see crisp, uncompressed 4K floor plans and renders without blurry pixelation, so that I can judge the quality and finish of the development.
20. As a visiting client, I want to clearly see whether a quoted unit price is "Official", "Estimated", or "Indicative", so that there are no misunderstandings about pricing terms.
21. As a visiting client, I want to scan a QR code with my phone camera at the conclusion of the presentation, so that I instantly receive the customized project summary, shortlisted floor plans, and pricing sheet on WhatsApp/PDF.
22. As a visiting client, I want an uncluttered visual interface free of computer desktop taskbars, system notifications, or antivirus popups, so that my focus remains entirely on the property.

### C. Admin & Operations Staff
23. As an admin, I want to access the administrative control center by entering a master 4-digit PIN, so that unauthorized showroom visitors cannot alter project data.
24. As an admin, I want to sync catalog updates from the VPS cloud server (`https://showcase.salesstudio.in`) with one tap when Wi-Fi is connected, so that all project prices, inventory statuses, and media files are up to date.
25. As an admin, I want delta synchronization to only download new or modified files, so that synchronization finishes rapidly and conserves bandwidth.
26. As an admin, I want to plug a USB thumb drive into the front USB port of the ViewBoard and import a complete offline catalog backup ZIP, so that the panel can be updated in completely air-gapped locations.
27. As an admin, I want to export local leads and session logs to a USB drive or sync them to the VPS, so that no walk-in leads are lost if the device is replaced.
28. As an admin, I want to configure the company logo, default currency formatting (Lakhs/Crores ₹), and RERA disclaimers from the admin settings tab, so that all project pages remain compliant with Gujarat RERA regulations.
29. As an admin, I want to mark units as "Available", "Reserved", or "Sold" directly on the unit inventory matrix, so that the presentation display always reflects real-time sales velocity.
30. As an admin, I want to reorder presentation modules (e.g. moving Floor Plans ahead of Construction Timeline) per project, so that the narrative flow matches each developer's strengths.

### D. IT & System Administrators
31. As an IT admin, I want to install ShowcaseOS as a signed Android APK via Google Play Store (EDLA), MDM (Mobile Device Management), or USB sideloading, so that deployment across multiple sales centers is straightforward.
32. As an IT admin, I want the application to automatically request and manage Android 14 permissions (Storage, Network, Wake Lock, Boot), so that non-technical sales staff do not encounter permission prompts.
33. As an IT admin, I want ShowcaseOS to run in Android Immersive Sticky mode and lock task mode, so that users cannot swipe up the Android navigation pill, access the home screen, or launch unauthorized apps.
34. As an IT admin, I want the app to hold a partial wake lock or keep screen on during showroom operating hours (e.g., 9:00 AM to 8:00 PM), so that the display never turns black mid-conversation.
35. As an IT admin, I want automatic crash recovery that relaunches ShowcaseOS in kiosk mode should an unexpected exception occur, so that the board is never left on the Android launcher.
36. As an IT admin, I want OTA (Over-The-Air) app update support via a dedicated APK release channel hosted on the VPS server, so that software updates can be rolled out without physical visits to the showroom.

---

## Implementation Decisions

### 1. Architectural Foundation & Runtime Strategy
- **Hybrid Container Architecture:** Retain the existing React + TypeScript renderer application (`showcaseos/src/renderer`) and host it inside an Android 14 container utilizing **Capacitor 6+**.
- **Android Target Specifications:**
  - `minSdkVersion`: 28 (Android 9 Pie)
  - `targetSdkVersion`: 34 (Android 14 UpsideDownCake)
  - `compileSdkVersion`: 34
  - JVM Target: Java 17
- **Hardware Acceleration:** Force hardware acceleration in Android Manifest (`android:hardwareAccelerated="true"`) and configure WebView with WebGL 2.0 and hardware compositing to ensure 60fps rendering across 4K resolution (3840 x 2160).
- **Process Model Comparison:**
  - *Previous Desktop Model:* Node.js Main Process $\longleftrightarrow$ Preload IPC Bridge $\longleftrightarrow$ Chromium Renderer.
  - *New Android Model:* Android Native Java/Kotlin Plugins $\longleftrightarrow$ Capacitor JavaScript Bridge $\longleftrightarrow$ Android System WebView (Chromium 120+).

```
+-----------------------------------------------------------------------------+
|               ViewSonic ViewBoard IN7505V-N (Android 14 EDLA)               |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |                 ShowcaseOS React 18 UI Presentation Layer             |  |
|  |  - Project Launcher & 4K Showcase Hub                                 |  |
|  |  - Interactive Master Plan & 40-Point Touch/Stylus Annotation Canvas  |  |
|  |  - Unit Selector, Compare Drawer, EMI & Payment Calculators          |  |
|  |  - PDF Brochure Viewer, 360 Panorama, Video Walkthroughs             |  |
|  +-----------------------------------+-----------------------------------+  |
|                                      | window.Capacitor.Plugins              |
|                                      v                                       |
|  +-----------------------------------------------------------------------+  |
|  |                    Native Android Platform Bridge                     |  |
|  |  +---------------------+ +----------------------+ +-----------------+  |  |
|  |  |  SQLite Storage     | |  Media File Manager  | |  Kiosk Manager  |  |  |
|  |  |  (Room / Capacitor) | |  (App-Specific Disk) | |  (LockTask Mode)|  |  |
|  |  +---------------------+ +----------------------+ +-----------------+  |  |
|  |  +---------------------+ +----------------------+ +-----------------+  |  |
|  |  |  VPS Delta Sync     | |  USB-OTG Archive     | |  Stylus Manager |  |  |
|  |  |  (OkHttp3 Client)   | |  (DocumentFile / SAF)| |  (MotionEvent)  |  |  |
|  |  +---------------------+ +----------------------+ +-----------------+  |  |
|  +-----------------------------------------------------------------------+  |
|                                      |                                       |
|                                      v                                       |
|  +-----------------------------------------------------------------------+  |
|  |        Device Hardware: Octa-Core ARM, 8GB RAM, 128GB Flash, IR Touch |  |
|  +-----------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------+
```

### 2. Database & Data Storage Seam
- **Local SQLite Engine:** Replace Electron's `@prisma/adapter-libsql` and local `dev.db` with native Android SQLite accessed via `@capacitor-community/sqlite` (or a lightweight Room DB bridge).
- **Relational Schema Fidelity:** Preserve the exact relational entities from Prisma:
  - `Project`, `Tower`, `Unit`, `ProjectModule`, `HighlightCard`, `Amenity`, `StaffProfile`, `Settings`, `SessionLog`, `Lead`.
- **Database Location:** Stored securely within the application's private internal data directory:  
  `/data/user/0/com.salesstudio.app/databases/showcaseos.db`.
- **Startup Integrity & Self-Healing:** The database initialization routine executes PRAGMA statements (`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`) and performs automated column self-healing migrations to match schema versions without data loss.

### 3. File System & Media Storage Management
- **Dedicated Offline Media Storage:** Store all high-resolution images, 4K videos, SVG layouts, and PDF brochures in the application-specific external storage directory:  
  `/sdcard/Android/data/com.salesstudio.app/files/media/`.
- **URL Resolution Bridge:** The web layer references media via standard local URL schemes (e.g. `capacitor://localhost/_capacitor_file_/` or `http://localhost:8080/media/`) to ensure fast, low-overhead streaming to `<video>` and `<img>` tags without base64 serialization.
- **Cache Size & Eviction:** With 128GB onboard storage on the ViewBoard, the application reserves up to 60GB for offline project media. A storage telemetry indicator in the Admin panel displays used vs. free storage.

### 4. 4K Large-Screen Display & Touch Ergonomics
- **Display Scaling & Viewport:**
  - Viewport configured to `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`.
  - CSS layout utilizes a fluid rem system rooted at `font-size: 20px` at 4K resolution (3840 x 2160) to maintain visual hierarchy, legibility from 2 meters away, and generous padding.
- **Ergonomic Touch Heights:**
  - Interactive controls (project selector cards, filter chips, navigation bars, unit cards, calculator sliders) must have touch targets of at least **64px $\times$ 64px**.
  - All critical presentation navigation is anchored along the bottom and lower-left/right regions of the screen (within 0–1200px from the bottom edge of the 75-inch physical display).
- **Stylus & Multi-Touch Gesture Handling:**
  - Master Plan and Floor Plan viewer modules bind native `PointerEvents` to support simultaneous 40-point input.
  - Stylus detection: Checks `event.pointerType === 'pen'` to switch seamlessly into markup/drawing mode on a transparent HTML5 canvas overlay.
  - Palm Rejection: Motion events reporting tool type `TOOL_TYPE_FINGER` with contact area greater than threshold ($>45\text{mm}^2$) or flagged with `ACTION_POINTER_DOWN` during pen contact are discarded by the drawing engine.
  - Annotations support instant save as PNG / PDF attachment to the client's session summary.

### 5. Kiosk Lockdown & Power Management
- **System UI Lockdown:**
  - Android `WindowInsetsControllerCompat` enforces `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE` and hides both `statusBars()` and `navigationBars()`.
  - Application registers as a Home Launcher (`CATEGORY_HOME` and `CATEGORY_DEFAULT`) so pressing any physical panel home buttons returns to ShowcaseOS.
  - Support for Android Lock Task Mode (`Activity.startLockTask()`), enabling full kiosk pinning where notification pull-downs, volume dialogs, and recent app switchers are completely disabled.
- **Showroom Wake Lock:**
  - Application flags `FLAG_KEEP_SCREEN_ON` on the main activity window to prevent the 75-inch panel from entering sleep mode while a presentation is in progress.
- **Emergency / Admin Escape Gesture:**
  - Hidden gesture: A continuous 5-second press on the top-right firm logo or a secret four-finger simultaneous tap brings up the master PIN entry dialog to access Admin settings or exit kiosk mode.

### 6. Cloud & USB Synchronization Engine
- **VPS Delta Sync (`syncNow`):**
  - Uses native Android networking (OkHttp3 or Capacitor HTTP) directly targeting `https://showcase.salesstudio.in/api/sync`.
  - Manifest Check: Compares remote `contentVersion` from `GET /api/manifest` against local `Settings.contentVersion`.
  - Transactional Application: Entity payloads (`projects`, `towers`, `units`, `modules`, `highlights`, `amenities`) are updated inside a single atomic SQLite transaction.
  - Media Delta Pull: Compares remote media SHA-256 hashes against local cached files and downloads only new or updated binary assets with resume support.
- **USB OTG Offline Backup/Restore:**
  - Leverages Android Storage Access Framework (`ACTION_OPEN_DOCUMENT_TREE`) to detect plugged USB flash drives.
  - Performs zip extraction of complete catalog packages (`database.sqlite` + `media/`) directly onto internal storage with automatic pre-import safety backups.

---

## Testing Decisions

### 1. Definition of a Good Test
Tests must verify observable system behavior from the user and presenter's perspective—not internal implementation mechanics:
- **Presentation Flow Integrity:** Can a presenter select a project, drill down into a tower, filter for a 3BHK unit, inspect the floor plan, add it to the comparison drawer, and generate an on-screen QR takeaway?
- **Offline Guarantee:** Does the entire presentation suite (videos, floor plans, calculators, brochure viewer) function flawlessly with airplane mode enabled / Wi-Fi disconnected?
- **Touch & Gesture Reliability:** Does pinch-to-zoom on master plans calculate transformations correctly without jumping, and do stylus events register ink strokes while palm touches are rejected?
- **Data Reconciliation:** When sync payloads or USB archives are applied, does the database update all relations atomically without orphan records or corrupted foreign keys?

### 2. Modules to be Tested
1. **Project Launcher & Navigation Seam:**
   - Rapid project switching under 2 seconds.
   - Project search, city filtering, and budget range slider reactivity.
2. **Interactive Unit Selector & Filter Seam:**
   - Multi-criteria filtering (BHK, Facing, Status, Price Range).
   - Real-time count of matching units.
   - State transition of units (`AVAILABLE` $\rightarrow$ `RESERVED` $\rightarrow$ `SOLD`).
3. **Master Plan & Floor Plan Interactive Seam:**
   - SVG tower hotspot hit-testing at 4K viewport dimensions.
   - Zoom/pan matrix calculations under multi-touch pointer sequences.
   - Drawing overlay state machine (Pen, Highlighter, Eraser, Clear All).
4. **Offline Media & Document Seam:**
   - Local URI resolution and fallback handling for missing media files.
   - Embedded PDF brochure rendering without external dependencies.
5. **Sync Engine & USB Archive Seam:**
   - Manifest delta evaluation.
   - Transaction rollback upon corrupted download payload.
   - USB OTG zip extraction and file integrity verification.
6. **Kiosk Lockout & Security Seam:**
   - Immersive mode enforcement upon app resume/focus gain.
   - PIN verification logic (correct PIN unlocks admin; 5 incorrect attempts triggers a 30-second lockout).

### 3. Prior Art & Testing Harness
- **Unit & Integration Tests:** Vitest test suites currently running in `showcaseos` (`ModuleRenderer.test.tsx`, `MasterPlanModule.test.tsx`, `UnitDetailModal.test.tsx`) serve as direct prior art for the React presentation modules.
- **End-to-End & Android Device Verification:** 
  - Android Espresso / Appium tests running on an Android 14 TV/Tablet emulator configured at 3840x2160 landscape resolution.
  - Physical smoke tests on the ViewSonic ViewBoard IN7505V-N verifying 40-point simultaneous touch response, dual-stylus input, and 4K 60fps video playback.

---

## Out of Scope

The following items are explicitly excluded from this conversion PRD:
1. **Interactive Camera / Video Conferencing Integration:** Leveraging the ViewBoard's built-in 48MP camera and 6-array microphone for Google Meet or Zoom calls is reserved for a future hybrid-meeting module.
2. **Multi-Board Simultaneous Screen Mirroring:** Real-time synchronized casting between multiple separate ViewBoard panels in different conference rooms.
3. **In-App Payment Gateway / POS Hardware Integration:** Direct collection of booking token amounts via external credit card POS hardware connected to the panel.
4. **Portrait / Vertical Orientation:** ViewSonic ViewBoard IN7505V-N is engineered as a 16:9 wall-mounted landscape display. Portrait mode is not supported.
5. **Direct 3D CAD/BIM File Parsing:** Real-time rendering of raw Revit/AutoCAD files; all 3D architectural views must be pre-rendered into high-res images, 360 panoramas, or 4K video walkthroughs prior to publishing.

---

## Further Notes

### ViewSonic ViewBoard IN7505V-N Technical Profile
- **Display:** 75" 4K UHD (3840 $\times$ 2160), 500 nits brightness, 1200:1 contrast, 16:9 aspect ratio.
- **Glass:** 8H toughened anti-glare scratch-resistant glass (essential for smooth stylus gliding and high showroom ambient lighting).
- **SoC & Compute:** Octa-Core (4 $\times$ ARM Cortex-A76 up to 2.4 GHz + 4 $\times$ ARM Cortex-A55), Mali-G57 GPU, 8GB LPDDR4 RAM, 128GB eMMC ROM.
- **Operating System:** Android 14 with Google Enterprise Device Licensing Agreement (EDLA) certification.
- **Touch System:** Ultra Fine Touch IR sensor array supporting up to 40 touch points simultaneously, $\le 8$ms response time, $\pm 1$mm touch accuracy.
- **Stylus Specification:** Passive dual-tip battery-free styluses (thin tip for writing/annotation, thick tip for highlighting/erasing).
- **I/O Connectivity:** Wi-Fi 6 (802.11ax), Gigabit RJ45 Ethernet, Bluetooth 5.2, USB 3.0 Type-A (front accessible for USB updates), USB-C with DP-Alt.

### Deployment & Distribution Workflow
1. The Android APK is built and signed with the firm's private release keystore: `SalesStudio-IN7505V-N-release.apk`.
2. Installation can be executed via:
   - Direct USB thumb drive sideloading via Android File Manager on the ViewBoard.
   - Enterprise MDM (e.g. ViewSonic Manager Advanced or Google Workspace MDM).
   - Direct download from the firm's private release portal: `https://showcase.salesstudio.in/downloads/android/latest.apk`.
3. Auto-update checks occur silently in the background on startup when an internet connection is detected, notifying the admin when a new release is available for one-tap install.
