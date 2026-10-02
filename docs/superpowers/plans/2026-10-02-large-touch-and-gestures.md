# Large-Touch UI & Multi-Touch Gestures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a large-touch kiosk interface with 60–80px hit targets, two-finger pinch-to-zoom and pan on the Master Plan with hybrid floating controls, and touch swipe navigation in the Gallery Lightbox.

**Architecture:** Native React gesture hooks (`usePinchPanZoom`, `useSwipeGesture`) using standard Touch/Pointer Events with hardware-accelerated CSS 3D transforms, paired with updated kiosk CSS layout tokens for large touch surfaces (60–80px interactive elements, 12–16px touch buffers).

**Tech Stack:** React 18, TypeScript, CSS Variables, Vitest, Testing Library.

---

### Task 1: Swipe Gesture Hook (`useSwipeGesture`)

**Files:**
- Create: `src/renderer/src/hooks/useSwipeGesture.ts`
- Test: `src/renderer/src/hooks/__tests__/useSwipeGesture.test.ts`

- [ ] **Step 1: Write the failing unit tests for `useSwipeGesture`**

Create `src/renderer/src/hooks/__tests__/useSwipeGesture.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeGesture } from '../useSwipeGesture'

describe('useSwipeGesture', () => {
  it('triggers onSwipeLeft when user swipes horizontally left > 50px', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 200, clientY: 100 }],
      } as any)
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 120, clientY: 105 }],
      } as any)
    })

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('triggers onSwipeRight when user swipes horizontally right > 50px', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as any)
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 180, clientY: 95 }],
      } as any)
    })

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
    expect(onSwipeLeft).not.toHaveBeenCalled()
  })

  it('triggers onSwipeDown when user swipes down > 80px', () => {
    const onSwipeDown = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeDown })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as any)
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 105, clientY: 210 }],
      } as any)
    })

    expect(onSwipeDown).toHaveBeenCalledTimes(1)
  })

  it('ignores minor jitter movements < 50px', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as any)
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 120, clientY: 105 }],
      } as any)
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/hooks/__tests__/useSwipeGesture.test.ts`  
Expected: FAIL with module not found or function not implemented.

- [ ] **Step 3: Write minimal implementation for `useSwipeGesture`**

Create `src/renderer/src/hooks/useSwipeGesture.ts`:
```typescript
import { useRef } from 'react'

export interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minDistance?: number
}

export function useSwipeGesture(options: SwipeOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minDistance = 50,
  } = options

  const startCoord = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length === 1) {
      startCoord.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!startCoord.current || !e.changedTouches || e.changedTouches.length === 0) {
      return
    }

    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = endX - startCoord.current.x
    const deltaY = endY - startCoord.current.y

    startCoord.current = null

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Check vertical swipe down (dismiss modal)
    if (absY > absX && deltaY >= 80 && onSwipeDown) {
      onSwipeDown()
      return
    }

    // Check horizontal swipe
    if (absX >= minDistance && absX > absY) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
      }
    }
  }

  return {
    onTouchStart,
    onTouchEnd,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/renderer/src/hooks/__tests__/useSwipeGesture.test.ts`  
Expected: PASS with 4 tests passed.

- [ ] **Step 5: Commit to dev**

```bash
git add src/renderer/src/hooks/useSwipeGesture.ts src/renderer/src/hooks/__tests__/useSwipeGesture.test.ts
git commit -m "feat(gestures): implement useSwipeGesture hook for touch swipe detection"
git push origin dev
```

---

### Task 2: Gallery Lightbox Swipe & Enlarged Touch Targets

**Files:**
- Modify: `src/renderer/src/modules/components/GalleryModule.tsx`

- [ ] **Step 1: Integrate `useSwipeGesture` and enlarged 64×64px touch arrows**

In `src/renderer/src/modules/components/GalleryModule.tsx`:
- Import `useSwipeGesture` from `../../hooks/useSwipeGesture`.
- Wire `useSwipeGesture` to `handleNext` (onSwipeLeft), `handlePrev` (onSwipeRight), and `() => setLightboxIndex(null)` (onSwipeDown).
- Attach `onTouchStart` and `onTouchEnd` to the lightbox container.
- Increase arrow button dimensions from 56×56px to `width: 64, height: 64` with `min-width: 64, min-height: 64`.
- Increase close button dimensions from 44×44px to `width: 60, height: 60`.
- Add touch hint text below lightbox image: `"Swipe or tap arrows to navigate"`.

- [ ] **Step 2: Verify existing tests and build**

Run: `npx vitest run` and `npm run build`  
Expected: PASS (all tests pass, build code 0).

- [ ] **Step 3: Commit to dev**

```bash
git add src/renderer/src/modules/components/GalleryModule.tsx
git commit -m "feat(gallery): add swipe navigation and enlarged 64px touch controls in lightbox"
git push origin dev
```

---

### Task 3: Multi-Touch Pinch & Pan Zoom Hook (`usePinchPanZoom`)

**Files:**
- Create: `src/renderer/src/hooks/usePinchPanZoom.ts`
- Test: `src/renderer/src/hooks/__tests__/usePinchPanZoom.test.ts`

- [ ] **Step 1: Write the failing unit tests for `usePinchPanZoom`**

Create `src/renderer/src/hooks/__tests__/usePinchPanZoom.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePinchPanZoom } from '../usePinchPanZoom'

describe('usePinchPanZoom', () => {
  it('initializes at scale 1.0 with zero translation', () => {
    const { result } = renderHook(() => usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 }))
    expect(result.current.scale).toBe(1.0)
    expect(result.current.pan).toEqual({ x: 0, y: 0 })
  })

  it('increments scale on zoomIn() and clamps at maxScale', () => {
    const { result } = renderHook(() => usePinchPanZoom({ minScale: 1.0, maxScale: 2.0 }))
    act(() => {
      result.current.zoomIn()
    })
    expect(result.current.scale).toBe(1.5)

    act(() => {
      result.current.zoomIn()
      result.current.zoomIn()
    })
    expect(result.current.scale).toBe(2.0)
  })

  it('decrements scale on zoomOut() and resets pan when returning to 1.0', () => {
    const { result } = renderHook(() => usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 }))
    act(() => {
      result.current.zoomIn()
      result.current.zoomIn()
    })
    expect(result.current.scale).toBe(2.0)

    act(() => {
      result.current.zoomOut()
      result.current.zoomOut()
    })
    expect(result.current.scale).toBe(1.0)
    expect(result.current.pan).toEqual({ x: 0, y: 0 })
  })

  it('resets scale and pan cleanly on reset()', () => {
    const { result } = renderHook(() => usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 }))
    act(() => {
      result.current.zoomIn()
    })
    expect(result.current.scale).toBe(1.5)

    act(() => {
      result.current.reset()
    })
    expect(result.current.scale).toBe(1.0)
    expect(result.current.pan).toEqual({ x: 0, y: 0 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/hooks/__tests__/usePinchPanZoom.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `usePinchPanZoom` hook**

Create `src/renderer/src/hooks/usePinchPanZoom.ts`:
```typescript
import { useState, useRef, useCallback } from 'react'

export interface PinchPanOptions {
  minScale?: number
  maxScale?: number
}

export function usePinchPanZoom(options: PinchPanOptions = {}) {
  const { minScale = 1.0, maxScale = 3.5 } = options

  const [scale, setScale] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const initialDistance = useRef<number | null>(null)
  const initialScale = useRef<number>(1.0)
  const lastTouchMidpoint = useRef<{ x: number; y: number } | null>(null)

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(Number((prev + 0.5).toFixed(1)), maxScale))
  }, [maxScale])

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), minScale)
      if (next <= 1.0) {
        setPan({ x: 0, y: 0 })
      }
      return next
    })
  }, [minScale])

  const reset = useCallback(() => {
    setScale(1.0)
    setPan({ x: 0, y: 0 })
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      initialDistance.current = dist
      initialScale.current = scale
      lastTouchMidpoint.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current !== null) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const ratio = currentDist / initialDistance.current
      const newScale = Math.min(Math.max(initialScale.current * ratio, minScale), maxScale)

      setScale(Number(newScale.toFixed(2)))

      // Two-finger pan
      const currentMidpoint = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      }

      if (lastTouchMidpoint.current) {
        const dx = currentMidpoint.x - lastTouchMidpoint.current.x
        const dy = currentMidpoint.y - lastTouchMidpoint.current.y
        setPan((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }))
      }
      lastTouchMidpoint.current = currentMidpoint
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistance.current = null
      lastTouchMidpoint.current = null
      if (scale <= 1.05) {
        reset()
      }
    }
  }

  return {
    scale,
    pan,
    zoomIn,
    zoomOut,
    reset,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    transformStyle: {
      transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
      transformOrigin: 'center center',
      transition: initialDistance.current ? 'none' : 'transform 0.15s ease-out',
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/renderer/src/hooks/__tests__/usePinchPanZoom.test.ts`  
Expected: PASS with 4 tests passed.

- [ ] **Step 5: Commit to dev**

```bash
git add src/renderer/src/hooks/usePinchPanZoom.ts src/renderer/src/hooks/__tests__/usePinchPanZoom.test.ts
git commit -m "feat(gestures): implement usePinchPanZoom hook for multi-touch pinch and pan"
git push origin dev
```

---

### Task 4: Master Plan Pinch-Zoom & Floating Touch Controls

**Files:**
- Modify: `src/renderer/src/modules/components/MasterPlanModule.tsx`

- [ ] **Step 1: Integrate `usePinchPanZoom` and floating zoom buttons**

In `src/renderer/src/modules/components/MasterPlanModule.tsx`:
- Import `usePinchPanZoom` from `../../hooks/usePinchPanZoom`.
- Initialize `const { scale, zoomIn, zoomOut, reset, onTouchStart, onTouchMove, onTouchEnd, transformStyle } = usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 })`.
- Wrap the Master Plan image and hotspot overlays inside a gesture viewport with `transformStyle`, `onTouchStart`, `onTouchMove`, and `onTouchEnd`.
- Render a floating glassmorphic control pill in the bottom-right corner of the map with three 56×56px touch buttons:
  - **Zoom In (+):** 56×56px target, calls `zoomIn`.
  - **Zoom Out (–):** 56×56px target, calls `zoomOut`.
  - **Reset (⟲):** 56×56px target, calls `reset`, visible when `scale > 1.0`.
- Display a small touch badge: `"Pinch to zoom or use controls"`.

- [ ] **Step 2: Verify existing tests and build**

Run: `npx vitest run` and `npm run build`  
Expected: PASS (all tests pass, build code 0).

- [ ] **Step 3: Commit to dev**

```bash
git add src/renderer/src/modules/components/MasterPlanModule.tsx
git commit -m "feat(masterplan): integrate multi-touch pinch-to-zoom, pan, and floating touch controls"
git push origin dev
```

---

### Task 5: Enlarge Touch Targets (60–80px Baseline) Across Kiosk Navigation

**Files:**
- Modify: `src/renderer/src/assets/index.css`
- Modify: `src/renderer/src/pages/kiosk/ProjectShowcase.tsx`
- Modify: `src/renderer/src/pages/kiosk/ProjectLauncher.tsx`

- [ ] **Step 1: Update design tokens and class definitions in `index.css`**

In `src/renderer/src/assets/index.css`:
- Increase `--touch-target-min: 44px` to `--touch-target-kiosk: 64px`.
- Update `.kiosk-nav-btn` / tab navigation items to `min-height: 64px; padding: 14px 24px; font-size: 15px;`.
- Update `.filter-chip` to `min-height: 56px; padding: 12px 22px; font-size: 14px; border-radius: 28px;`.
- Ensure buttons have `touch-action: manipulation` and generous 12–16px gaps.

- [ ] **Step 2: Verify buttons in `ProjectShowcase.tsx` & `ProjectLauncher.tsx`**

- In `ProjectShowcase.tsx`: Enlarge End Presentation / Exit button, WhatsApp Share button, and back button to have minimum 60–64px hit heights.
- In `ProjectLauncher.tsx`: Ensure search input, clear button, and comparison bar trigger have ≥56–64px touch targets.

- [ ] **Step 3: Run full verification suite**

Run: `npx vitest run`  
Expected: All 19+ test suites and 47+ tests passing.  
Run: `npm run build`  
Expected: Clean electron-vite production compilation with exit code 0.

- [ ] **Step 4: Commit and push to `dev`**

```bash
git add src/renderer/src/assets/index.css src/renderer/src/pages/kiosk/ProjectShowcase.tsx src/renderer/src/pages/kiosk/ProjectLauncher.tsx
git commit -m "feat(ui): enlarge touch targets to 60-80px baseline across kiosk navigation and layout"
git push origin dev
```
