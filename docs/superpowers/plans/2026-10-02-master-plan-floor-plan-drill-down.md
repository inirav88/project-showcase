# Master Plan to Floor Plan & Unit Drill-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 3-step kiosk drill-down hierarchy (`Master Site Plan → Tower Floor Plan View → Individual Unit Detail Modal`) in ShowcaseOS with large-touch targets, multi-touch pinch-to-zoom on floor plates, and intelligent fallback for architectural drawings.

**Architecture:** A state-machine inside `MasterPlanModule.tsx` transitions between `'MASTER_PLAN'` and `'TOWER_VIEW'`, with a modal overlay for unit details. A pure utility resolves floor plan media using per-unit media IDs, tower/configuration matching, or project-level floor plan fallbacks.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, HTML5 Canvas/Pinch-Zoom Gestures, Zustand.

---

### Task 1: Floor Plan Media Resolution Utility

**Files:**
- Create: `src/renderer/src/utils/floorPlanMedia.ts`
- Test: `src/renderer/src/utils/floorPlanMedia.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/renderer/src/utils/floorPlanMedia.test.ts
import { describe, it, expect } from 'vitest'
import { resolveFloorPlanImage, type MediaItem, type UnitLike } from './floorPlanMedia'

describe('resolveFloorPlanImage', () => {
  const sampleMedia: MediaItem[] = [
    { id: 'm1', originalName: 'Tower A Typical Floor Plan.jpg', filePath: '/media/fp_tower_a.jpg', category: 'FLOOR_PLAN' },
    { id: 'm2', originalName: '3BHK Luxury Layout.png', filePath: '/media/fp_3bhk.png', category: 'FLOOR_PLAN' },
    { id: 'm3', originalName: 'Master Brochure Floorplan.png', filePath: '/media/fp_general.png', category: 'FLOOR_PLAN' }
  ]

  it('returns unit-linked media when floorPlanMediaId matches', () => {
    const unit: UnitLike = { id: 'u1', unitNumber: '101', floor: 1, configuration: '3BHK', floorPlanMediaId: 'm2' }
    const url = resolveFloorPlanImage({ unit, towerName: 'Tower A', floorNumber: 1, mediaList: sampleMedia })
    expect(url).toContain('fp_3bhk.png')
  })

  it('matches tower name in media list when unit has no floorPlanMediaId', () => {
    const unit: UnitLike = { id: 'u2', unitNumber: '102', floor: 1, configuration: '2BHK' }
    const url = resolveFloorPlanImage({ unit, towerName: 'Tower A', floorNumber: 1, mediaList: sampleMedia })
    expect(url).toContain('fp_tower_a.jpg')
  })

  it('falls back to the first available FLOOR_PLAN media when no tower-specific match exists', () => {
    const url = resolveFloorPlanImage({ towerName: 'Tower C', floorNumber: 5, mediaList: sampleMedia })
    expect(url).toContain('fp_tower_a.jpg')
  })

  it('returns empty string when media list has no floor plan media', () => {
    const url = resolveFloorPlanImage({ towerName: 'Tower B', floorNumber: 1, mediaList: [] })
    expect(url).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/utils/floorPlanMedia.test.ts`  
Expected: FAIL ("cannot find module ./floorPlanMedia")

- [ ] **Step 3: Implement `resolveFloorPlanImage`**

```typescript
// src/renderer/src/utils/floorPlanMedia.ts
import { toMediaUrl } from './media'

export interface MediaItem {
  id: string
  originalName: string
  filePath: string
  category: string
  tags?: string
}

export interface UnitLike {
  id?: string
  unitNumber?: string
  floor?: number
  configuration?: string
  floorPlanMediaId?: string | null
}

export function resolveFloorPlanImage(options: {
  unit?: UnitLike | null
  towerName?: string
  floorNumber?: number
  mediaList?: MediaItem[]
}): string {
  const { unit, towerName, floorNumber, mediaList = [] } = options
  const floorPlans = mediaList.filter(
    (m) => m.category?.toUpperCase() === 'FLOOR_PLAN'
  )

  // 1. Direct unit floorPlanMediaId match
  if (unit?.floorPlanMediaId) {
    const matched = floorPlans.find((m) => m.id === unit.floorPlanMediaId)
    if (matched) return toMediaUrl(matched.filePath)
  }

  // 2. Tower name or floor match in filename / tags
  if (towerName) {
    const normalizedTower = towerName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const towerMatched = floorPlans.find((m) => {
      const name = (m.originalName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const tags = (m.tags || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return name.includes(normalizedTower) || tags.includes(normalizedTower)
    })
    if (towerMatched) return toMediaUrl(towerMatched.filePath)
  }

  // 3. Unit configuration match (e.g. "3BHK", "2 BHK")
  if (unit?.configuration) {
    const normalizedConfig = unit.configuration.toLowerCase().replace(/[^a-z0-9]/g, '')
    const configMatched = floorPlans.find((m) => {
      const name = (m.originalName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return name.includes(normalizedConfig)
    })
    if (configMatched) return toMediaUrl(configMatched.filePath)
  }

  // 4. Fallback to first available floor plan image
  if (floorPlans.length > 0) {
    return toMediaUrl(floorPlans[0].filePath)
  }

  return ''
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/renderer/src/utils/floorPlanMedia.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/renderer/src/utils/floorPlanMedia.ts src/renderer/src/utils/floorPlanMedia.test.ts
git commit -m "feat: add floor plan media resolution utility with smart fallback"
```

---

### Task 2: Build `UnitDetailModal` Component

**Files:**
- Create: `src/renderer/src/modules/components/UnitDetailModal.tsx`
- Test: `src/renderer/src/modules/components/UnitDetailModal.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/renderer/src/modules/components/UnitDetailModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UnitDetailModal from './UnitDetailModal'

describe('UnitDetailModal', () => {
  const sampleUnit = {
    id: 'u1',
    unitNumber: '302',
    floor: 3,
    configuration: '3 BHK Luxury',
    carpetArea: 1450,
    builtUpArea: 1850,
    facing: 'East',
    price: 18500000,
    priceLabel: 'OFFICIAL',
    status: 'AVAILABLE'
  }

  it('renders unit details and dimensions', () => {
    render(
      <UnitDetailModal
        unit={sampleUnit}
        towerName="Tower B"
        projectName="Grand Heights"
        floorPlanImage="/media/test_plan.png"
        isShortlisted={false}
        onToggleShortlist={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Unit 302/i)).toBeDefined()
    expect(screen.getByText(/3 BHK Luxury/i)).toBeDefined()
    expect(screen.getByText(/1450 sqft/i)).toBeDefined()
    expect(screen.getByText(/East/i)).toBeDefined()
  })

  it('fires onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <UnitDetailModal
        unit={sampleUnit}
        towerName="Tower B"
        projectName="Grand Heights"
        floorPlanImage=""
        isShortlisted={false}
        onToggleShortlist={vi.fn()}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/modules/components/UnitDetailModal.test.tsx`  
Expected: FAIL ("cannot find module ./UnitDetailModal")

- [ ] **Step 3: Implement `UnitDetailModal`**

```tsx
// src/renderer/src/modules/components/UnitDetailModal.tsx
import React from 'react'

export interface UnitDetailProps {
  unit: {
    id: string
    unitNumber: string
    floor: number
    configuration: string
    carpetArea: number
    builtUpArea?: number
    superBuiltUpArea?: number
    facing?: string
    price: number
    priceLabel?: string
    status: string
    floorPlanMediaId?: string | null
  }
  towerName: string
  projectName: string
  floorPlanImage: string
  isShortlisted: boolean
  onToggleShortlist: () => void
  onClose: () => void
}

function formatPrice(n: number): string {
  if (!n) return 'Price on Request'
  if (n >= 10000000) return String.fromCharCode(8377) + (n / 10000000).toFixed(2) + ' Cr'
  return String.fromCharCode(8377) + (n / 100000).toFixed(0) + ' L'
}

export default function UnitDetailModal({
  unit,
  towerName,
  projectName,
  floorPlanImage,
  isShortlisted,
  onToggleShortlist,
  onClose
}: UnitDetailProps): JSX.Element {
  const statusColor =
    unit.status === 'AVAILABLE'
      ? 'var(--color-available)'
      : unit.status === 'HELD'
        ? 'var(--color-held)'
        : 'var(--color-sold)'

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Floor Plan Drawing Preview */}
        <div
          style={{
            flex: 1.2,
            backgroundColor: 'var(--color-bg)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            position: 'relative',
            minHeight: '450px',
          }}
        >
          {floorPlanImage ? (
            <img
              src={floorPlanImage}
              alt={`Floor Plan for Unit ${unit.unitNumber}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
              }}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-8)',
                color: 'var(--color-text-muted)',
              }}
            >
              <div style={{ fontSize: 52, opacity: 0.5, marginBottom: 12 }}>📐</div>
              <h4 style={{ color: 'var(--color-text-primary)', marginBottom: 6 }}>Architectural Layout</h4>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                {unit.configuration} layout for {towerName}
              </p>
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              background: 'rgba(0,0,0,0.6)',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--color-text-secondary)',
            }}
          >
            {unit.configuration} Layout Plan
          </div>
        </div>

        {/* Right: Specifications & Pricing */}
        <div
          style={{
            flex: 1,
            padding: 'var(--space-8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 99,
                    backgroundColor: `${statusColor}15`,
                    color: statusColor,
                    border: `1px solid ${statusColor}35`,
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  {unit.status}
                </span>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Unit {unit.unitNumber}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                  {towerName} · Floor {unit.floor} · {projectName}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-raised)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Price Box */}
            <div
              style={{
                marginTop: 'var(--space-6)',
                padding: 'var(--space-5)',
                backgroundColor: 'var(--color-surface-raised)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pricing ({unit.priceLabel || 'Official'})
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-accent)', marginTop: 4 }}>
                {formatPrice(unit.price)}
              </div>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-4)',
                marginTop: 'var(--space-6)',
              }}
            >
              <div style={{ background: 'var(--color-surface-raised)', padding: '12px 16px', borderRadius: 8 }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Configuration</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: 2 }}>{unit.configuration}</div>
              </div>
              <div style={{ background: 'var(--color-surface-raised)', padding: '12px 16px', borderRadius: 8 }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Carpet Area</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: 2 }}>
                  {unit.carpetArea} sqft ({(unit.carpetArea / 9).toFixed(1)} sqyd)
                </div>
              </div>
              {unit.builtUpArea ? (
                <div style={{ background: 'var(--color-surface-raised)', padding: '12px 16px', borderRadius: 8 }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Built-Up Area</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: 2 }}>{unit.builtUpArea} sqft</div>
                </div>
              ) : null}
              {unit.facing ? (
                <div style={{ background: 'var(--color-surface-raised)', padding: '12px 16px', borderRadius: 8 }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Facing</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginTop: 2 }}>{unit.facing}</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)' }}>
            <button
              onClick={onToggleShortlist}
              disabled={unit.status === 'SOLD'}
              style={{
                flex: 1,
                minHeight: 56,
                padding: '0 20px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                backgroundColor: isShortlisted ? '#ef4444' : 'var(--color-accent)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: unit.status === 'SOLD' ? 'not-allowed' : 'pointer',
                opacity: unit.status === 'SOLD' ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span>{isShortlisted ? '❤️ In Shortlist (Remove)' : '🤍 Add to Shortlist'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/renderer/src/modules/components/UnitDetailModal.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/renderer/src/modules/components/UnitDetailModal.tsx src/renderer/src/modules/components/UnitDetailModal.test.tsx
git commit -m "feat: add UnitDetailModal component with specs and floor plan preview"
```

---

### Task 3: Upgrade `MasterPlanModule.tsx` to 3-Tier Drill-Down

**Files:**
- Modify: `src/renderer/src/modules/components/MasterPlanModule.tsx`

- [ ] **Step 1: Integrate view states, floor picker, floor plate canvas, and unit modal in `MasterPlanModule.tsx`**
  - Add state `currentView`: `'MASTER_PLAN' | 'TOWER_VIEW'`.
  - Add state `selectedFloor`: `number | null`.
  - Add state `activeUnitModal`: `Unit | null`.
  - Fetch project media via `IPC_CHANNELS.MEDIA_LIST` to populate `floorPlanMedia`.
  - Render Level 1 when `currentView === 'MASTER_PLAN'`.
  - Render Level 2 when `currentView === 'TOWER_VIEW'`:
    - Top bar: Back button `← Back to Master Plan`, Tower title, and horizontal Floor Selector strip.
    - Left 2/3 canvas: High-res interactive floor plate drawing using `usePinchPanZoom` and `resolveFloorPlanImage`.
    - Right 1/3 drawer: Filtered unit cards for `selectedFloor` with tap-to-inspect opening Level 3 modal.
  - Render Level 3 `UnitDetailModal` when `activeUnitModal !== null`.

- [ ] **Step 2: Verify `MasterPlanModule` compiles cleanly**

Run: `npx vitest run`  
Expected: All tests pass.

- [ ] **Step 3: Commit changes**

```bash
git add src/renderer/src/modules/components/MasterPlanModule.tsx
git commit -m "feat: implement 3-tier master plan to floor plan and unit drill-down"
```

---

### Task 4: Add Integration Test Suite for `MasterPlanModule`

**Files:**
- Create: `src/renderer/src/modules/components/MasterPlanModule.test.tsx`

- [ ] **Step 1: Write integration tests**
  - Verify rendering master plan view.
  - Verify clicking a tower switches view to `'TOWER_VIEW'` and selects lowest floor.
  - Verify floor buttons update filtered units.
  - Verify clicking a unit card opens unit detail modal.
  - Verify back button restores master plan view.

- [ ] **Step 2: Run test suite**

Run: `npx vitest run src/renderer/src/modules/components/MasterPlanModule.test.tsx`  
Expected: PASS

- [ ] **Step 3: Commit changes**

```bash
git add src/renderer/src/modules/components/MasterPlanModule.test.tsx
git commit -m "test: add integration test suite for master plan drill-down hierarchy"
```

---

### Task 5: End-to-End Verification & Build

- [ ] **Step 1: Run all test suites**

Run: `npx vitest run`  
Expected: All test suites PASS (20+ suites).

- [ ] **Step 2: Run production build**

Run: `npm run build`  
Expected: Clean exit code 0.

- [ ] **Step 3: Push all commits to `dev` branch**

Run: `git push origin dev`  
Expected: All changes pushed cleanly.
