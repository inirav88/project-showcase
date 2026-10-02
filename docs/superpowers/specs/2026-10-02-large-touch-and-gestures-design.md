# Design Specification: Large-Touch UI & Multi-Touch Gestures (ShowcaseOS)

**Document Reference:** SPEC-TOUCH-2026-10-02  
**Feature:** Large-Touch Optimized UI & Multi-Touch Gestures  
**Status:** Approved by User  
**Author:** Antigravity AI & ShowcaseOS Core Team  
**Date:** October 2, 2026  

---

## 1. Overview & Objectives

ShowcaseOS is designed for high-impact real estate sales galleries, operating on interactive touchscreen kiosks, wall displays, and large-format touch tables. While the initial MVP established basic touch-friendly tap compliance (44×44px hit areas per WCAG 2.2 Level AA), large kiosk displays (43"–65"+) and touch tables demand a dedicated touch-first interface architecture:

1. **Large Touch Targets (60–80px Baseline):** Elevating primary and secondary touch targets to 60–80px with generous 12–16px touch buffers to eliminate mis-taps.
2. **Multi-Touch Gestures on Master Plan:** Native two-finger pinch-to-zoom (1.0x to 3.5x scale) and two-finger panning with hardware-accelerated transforms and rubber-band boundary clamping.
3. **Hybrid Zoom Controls:** On-screen floating action buttons (+, –, ⟲ Reset) with 56×56px touch targets for users who prefer single-tap zoom over pinch gestures.
4. **Touch-Swipe Lightbox & Carousels:** Left/right horizontal touch swipes (`deltaX > 50px`) for seamless image browsing in the Gallery Lightbox, plus swipe-down to dismiss.
5. **Zero External Dependencies:** Native implementation using React hooks and standard Pointer/Touch Events with no external runtime bundle weight or transitive supply chain risks.

---

## 2. Architecture & Component Design

### 2.1 Multi-Touch Gesture Engine (`usePinchPanZoom`)

A custom React hook located at `src/renderer/src/hooks/usePinchPanZoom.ts`:

- **Touch State Tracking:**
  - Manages contact points via `touchstart`, `touchmove`, `touchend`, and `touchcancel`.
  - Distinguishes between 1-finger taps (for hotspot selection) and 2-finger gestures (pinch/pan).
- **Mathematical Model:**
  - **Pinch Distance:** Calculates Euclidean distance between 2 contact points:
    $$D = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
  - **Scale Factor:** Compares current distance with initial distance:
    $$\Delta S = \frac{D_{\text{current}}}{D_{\text{initial}}}$$
    Clamped between `minScale = 1.0` and `maxScale = 3.5`.
  - **Pan Midpoint:** Tracks midpoint coordinates $(\frac{x_1 + x_2}{2}, \frac{y_1 + y_2}{2})$ to shift the canvas translation smoothly while zooming.
  - **Boundary Clamping:** Ensures content cannot be panned outside the viewport boundaries when zoomed in.
- **Hardware Acceleration:** Applies CSS `transform: translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})` on an inner viewport wrapper.
- **Controls & API:**
  - `scale`: Current scale factor (number).
  - `pan`: `{ x: number, y: number }`.
  - `zoomIn()`: Increments scale by +0.5x up to max.
  - `zoomOut()`: Decrements scale by -0.5x down to 1.0x.
  - `reset()`: Smoothly resets to 1.0x and (0, 0).
  - `containerRef`: Ref to attach event listeners and measurements.

### 2.2 Gallery Touch-Swipe Engine (`useSwipeGesture`)

A custom React hook located at `src/renderer/src/hooks/useSwipeGesture.ts`:

- **Touch Vector Analysis:**
  - Records touch start coordinates $(X_{\text{start}}, Y_{\text{start}})$ and timestamp.
  - On `touchend`, computes $\Delta X = X_{\text{end}} - X_{\text{start}}$ and $\Delta Y = Y_{\text{end}} - Y_{\text{start}}$.
  - Checks if $|\Delta X| > |\Delta Y|$ (horizontal swipe) and $|\Delta X| \ge 50\text{px}$.
  - Triggers `onSwipeLeft` (next slide) or `onSwipeRight` (previous slide).
  - If $\Delta Y > 80\text{px}$ downward with high vertical dominance, triggers `onSwipeDown` (close modal/lightbox).

### 2.3 Master Plan Integration (`MasterPlanModule.tsx`)

- Integrates `usePinchPanZoom` onto the interactive map container.
- Renders floating touch-zoom controls in the bottom-right corner of the map viewport:
  - **Zoom In (+):** 56×56px glassmorphic button.
  - **Zoom Out (–):** 56×56px glassmorphic button.
  - **Reset (⟲):** 56×56px glassmorphic button (active when scale > 1.0).
- Maintains tower hotspot tap targets without gesture conflict: Single finger tap initiates `setSelectedTower()`, while 2 fingers engage pan/pinch.

### 2.4 Gallery Module Integration (`GalleryModule.tsx`)

- Integrates `useSwipeGesture` on the full-screen Lightbox overlay.
- Enlarges Lightbox Previous/Next touch controls to 64×64px with prominent touch padding.
- Displays a brief subtle touch hint ("Swipe or tap arrows to navigate") on initial touch open.

### 2.5 Large Touch Targets & Spacing System (`index.css` & Kiosk Pages)

Updates to design tokens and component styling:

| Component | Previous Size | New Large-Touch Target Size | Spacing / Touch Buffer |
| :--- | :---: | :---: | :---: |
| **Kiosk Navigation Tabs** | 44px height | **64px height** | 12px gap, 24px horizontal padding |
| **Launcher Filter Chips** | 40px height | **56px height** | 12px gap, 20px padding |
| **Primary Kiosk CTAs** | 48px height | **64px height** | 16px bottom/margin buffer |
| **Lightbox Arrows** | 56×56px | **64×64px** | 24px screen margin |
| **Map Zoom Controls** | None | **56×56px** | 12px gap, floating corner |
| **Modal Close Buttons** | 44×44px | **60×60px** | 24px corner inset |

---

## 3. Data Flow & Gesture Handling

```
[Touch Surface Contact]
        │
        ├── 1 Touch Point
        │     ├── Tap (< 200ms, < 10px move) ───► Select Tower Hotspot / Open Media
        │     └── Horizontal Drag (> 50px) ─────► Lightbox / Carousel Slide Change
        │
        └── 2 Touch Points
              ├── Distance delta (D_curr vs D_init) ──► Calculate Scale (1.0x - 3.5x)
              └── Midpoint delta (P_curr vs P_init) ──► Calculate Pan (X, Y)
                                                              │
                                                              ▼
                                                   [CSS Transform Update]
                                               translate3d(x, y, 0) scale(s)
```

---

## 4. Error Handling & Edge Cases

1. **Touch Interruption / Cancellation:** If a touch gesture is interrupted by an incoming system dialog or palm resting on the edge (`touchcancel`), the engine gracefully completes or resets without leaving the canvas in an unstable transform state.
2. **Boundary Clamping:** Content cannot be panned infinitely off-screen; pan limits are clamped based on $(scale - 1) \times \text{dimension}$.
3. **Mouse & Remote Navigation Fallback:** All mouse click, scroll-wheel zoom, and keyboard arrow interactions are preserved 100% alongside touch gestures.
4. **Performance & 60fps Rendering:** Transforms use `translate3d` and `scale` to guarantee GPU compositor layer rendering, preventing DOM reflows and layout thrashing.

---

## 5. Verification & Testing Strategy

1. **Unit Tests:**
   - Test `usePinchPanZoom` hook state updates for zoom in, zoom out, reset, and boundary clamping.
   - Test `useSwipeGesture` vector calculations (horizontal swipe triggers, swipe down close, small movement ignore).
2. **Integration Tests:**
   - Verify `MasterPlanModule` renders zoom buttons and responds to click/touch events.
   - Verify `GalleryModule` lightbox handles swipe navigation callbacks.
   - Verify all existing 17 test suites pass without regression.
3. **Visual & Touch Target Inspection:**
   - Measure rendered heights and hitboxes to ensure ≥60px for kiosk navigation, ≥56px for filter chips and zoom controls.
