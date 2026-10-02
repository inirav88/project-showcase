# Master Plan to Floor Plan & Unit Drill-Down Design

**Date:** 2026-10-02  
**Status:** Approved  
**Author:** Antigravity Team  

---

## 1. Overview & Objective

Provide a seamless 3-step kiosk drill-down hierarchy on 55"+ interactive touchscreen displays:
$$\text{Master Site Plan} \xrightarrow{\text{Select Tower/Block}} \text{Tower Floor Plan View} \xrightarrow{\text{Select Unit}} \text{Individual Unit Detail Modal}$$

Currently, clicking a tower on the Master Plan opens a generic unit list without intermediate floor plate exploration. This design upgrades `MasterPlanModule.tsx` to include an interactive Floor Selector, a visual Floor Plate canvas with pinch-to-zoom and pan gestures, a filtered floor-specific unit inventory drawer, and a rich Unit Detail Modal with floor layout drawings, full specifications, and 1-tap shortlisting.

---

## 2. Architecture & State Management

Within `src/renderer/src/modules/components/MasterPlanModule.tsx`, view transitions and levels are managed via a lightweight state machine:

### 2.1 State Variables
- `currentView`: `'MASTER_PLAN' | 'TOWER_VIEW'`
- `selectedTower`: `Tower | null`
- `selectedFloor`: `number | null` (automatically defaults to the lowest floor in `selectedTower.units`)
- `activeUnitModal`: `Unit | null` (controls the Level 3 overlay dialog)
- `floorPlanMedia`: `MediaItem[]` (all project media items categorized under `FLOOR_PLAN`)

### 2.2 Navigation Transitions
1. **Entering Tower View:**
   - User taps a Tower Hotspot on the Master Plan.
   - `selectedTower` is set to the clicked tower.
   - Available floors for the tower are calculated: `Array.from(new Set(tower.units.map(u => u.floor))).sort((a, b) => a - b)`.
   - `selectedFloor` is set to the first available floor (or `1` if no units).
   - `currentView` transitions to `'TOWER_VIEW'`.
2. **Navigating Floors:**
   - User taps a floor pill in the horizontal Floor Selector strip.
   - `selectedFloor` updates immediately.
   - Canvas dynamically updates the floor plate graphic.
   - Side drawer filters units to show only units matching `unit.floor === selectedFloor`.
3. **Opening Unit Detail Modal:**
   - User taps a unit card in the floor drawer.
   - `activeUnitModal` is set to the selected unit.
4. **Closing Modal & Returning to Master Plan:**
   - Tapping the Close button or modal backdrop clears `activeUnitModal`.
   - Tapping `← Back to Master Plan` sets `currentView = 'MASTER_PLAN'` and clears `selectedTower`.

---

## 3. UI/UX Specifications

### 3.1 Level 1: Master Site Plan
- Interactive master plan canvas with touch pinch-to-zoom (`usePinchPanZoom`) and floating 56px touch controls (`+`, `–`, `⟲`).
- Clickable tower badges showing tower name and available unit count.

### 3.2 Level 2: Tower Floor Plan View
- **Top Control Bar:**
  - Back Button: 56px touch button with `← Back to Master Plan`.
  - Tower Title & Badge: `[Tower Name] · [N Available Units]`.
  - Floor Selector: Horizontal scrollable strip with 50px pill buttons (`Floor 1`, `Floor 2`, `Floor 3`...). Active floor is highlighted with `var(--color-accent)` and bold typography.
- **Main Canvas (2/3 width):**
  - Displays the high-resolution architectural floor plate drawing for `selectedFloor`.
  - Full multi-touch support via `usePinchPanZoom` (pinch-to-zoom, two-finger pan, floating reset/zoom controls).
- **Floor Unit Drawer (1/3 width):**
  - Displays all units on `selectedFloor`.
  - Each unit card contains:
    - Unit number (e.g. `Unit 301`) and floor indicator.
    - Configuration (e.g. `3 BHK`) and dual area display (sqft and sqyd).
    - Formatted price in Indian numbering system (`₹1.85 Cr` / `₹95 L`).
    - Availability status badge (`AVAILABLE`, `HELD`, `SOLD`).
    - 1-tap shortlist button (`❤️`/`🤍`) synced with `useShortlistStore`.
    - "Inspect Unit →" action cue.

### 3.3 Level 3: Unit Detail Modal
- Centered modal dialog with blurred backdrop (`rgba(0,0,0,0.7)`, `backdrop-filter: blur(12px)`).
- **Visual Section:** High-resolution unit layout plan drawing.
- **Specification Panel:**
  - Unit Number, Tower Name, Project Name.
  - Configuration badge and Status tag.
  - Dual Area metrics: Carpet Area (sqft/sqyd), Built-Up Area, Super Built-Up Area.
  - Facing direction (e.g., `East`, `North-East`).
  - Price & Price Label (`Official Price`, `Indicative`, etc.).
  - 60px touch button: `Add to Shortlist` / `Remove from Shortlist`.
  - Close button in top-right corner.

---

## 4. Media Resolution & Fallback Strategy

To ensure robust presentation even if developers have not uploaded individual unit floor plans:
1. **Per-Unit Media:** If `unit.floorPlanMediaId` is populated, fetch and render that specific media item.
2. **Tower / Floor Match:** Check `FLOOR_PLAN` media for original filenames or tags matching the tower name (e.g., `Tower A`) or configuration (e.g., `3BHK`).
3. **Project Floor Plan Fallback:** If no specific match is found, use the first available `FLOOR_PLAN` image from project media.
4. **Architectural Placeholder:** If no `FLOOR_PLAN` media exists in the project at all, display a clean architectural blueprint placeholder with floor and unit dimension specs.

---

## 5. Testing & Verification

1. **Unit Test Suite (`MasterPlanModule.test.tsx`):**
   - Verify initial render of Master Plan with tower buttons.
   - Verify clicking a tower transitions to `'TOWER_VIEW'` and defaults to the lowest floor.
   - Verify clicking floor tabs filters the units displayed.
   - Verify clicking a unit opens the Unit Detail Modal.
   - Verify shortlisting toggles from both list and modal.
   - Verify returning back to Master Plan restores level 1.
2. **Build & Type Check:**
   - Clean execution of `npx vitest run` across all test suites.
   - Clean compilation via `npm run build`.
