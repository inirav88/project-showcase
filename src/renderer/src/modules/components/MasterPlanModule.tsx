import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { useShortlistStore } from '../../store/useShortlistStore'
import { toMediaUrl } from '../../utils/media'
import { usePinchPanZoom } from '../../hooks/usePinchPanZoom'
import { resolveFloorPlanImage, type MediaItem } from '../../utils/floorPlanMedia'
import UnitDetailModal from './UnitDetailModal'
import {
  ZoomInIcon,
  ZoomOutIcon,
  ResetZoomIcon,
  TouchGestureIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  BuildingTowerIcon,
  BlueprintIcon,
  HeartIcon
} from '../../components/common/Icons'

interface Unit {
  id: string
  unitNumber: string
  floor: number
  configuration: string
  carpetArea: number
  builtUpArea?: number
  superBuiltUpArea?: number
  facing?: string
  price: number
  priceLabel: string
  status: string
  floorPlanMediaId?: string | null
}

interface Tower {
  id: string
  name: string
  units: Unit[]
}

interface Project {
  name: string
  developer?: string
  towers: Tower[]
}

function formatPrice(n: number): string {
  if (!n || n <= 0) return 'Price on Request'
  if (n >= 10000000) return String.fromCharCode(8377) + (n / 10000000).toFixed(2) + ' Cr'
  return String.fromCharCode(8377) + (n / 100000).toFixed(0) + ' L'
}

export default function MasterPlanModule({ config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)
  const [projectMedia, setProjectMedia] = useState<MediaItem[]>([])
  const [currentView, setCurrentView] = useState<'MASTER_PLAN' | 'TOWER_VIEW'>('MASTER_PLAN')
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [activeUnitModal, setActiveUnitModal] = useState<Unit | null>(null)

  const { addItem, removeItem, isInShortlist } = useShortlistStore()

  // Master plan zoom/pan gestures
  const masterPlanZoom = usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 })
  // Floor plate zoom/pan gestures
  const floorPlateZoom = usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 })

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => {
        setProject(data as Project)
      })
      .catch(console.error)

    window.api
      .invoke(IPC_CHANNELS.MEDIA_LIST, { projectId })
      .then((data) => {
        if (Array.isArray(data)) {
          setProjectMedia(data as MediaItem[])
        }
      })
      .catch(console.error)
  }, [projectId])

  if (!project) {
    return <div className="loading">Loading Master Plan…</div>
  }

  const toggleShortlist = (u: Unit, towerName: string) => {
    if (isInShortlist(u.id)) {
      removeItem(u.id)
    } else {
      addItem({
        unitId: u.id,
        unitNumber: u.unitNumber,
        towerName: towerName,
        projectName: project.name,
        configuration: u.configuration,
        price: u.price
      })
    }
  }

  const handleSelectTower = (tower: Tower) => {
    setSelectedTower(tower)
    const floors = Array.from(new Set(tower.units.map((u) => u.floor))).sort((a, b) => a - b)
    setSelectedFloor(floors.length > 0 ? floors[0] : 1)
    floorPlateZoom.reset()
    setCurrentView('TOWER_VIEW')
  }

  const handleBackToMasterPlan = () => {
    setCurrentView('MASTER_PLAN')
    setSelectedTower(null)
    setSelectedFloor(null)
    setActiveUnitModal(null)
  }

  // Masterplan image: admin saves as 'imagePath', legacy key was 'masterPlanImage'
  const rawImg = config?.imagePath || config?.masterPlanImage || ''
  const masterPlanImg = rawImg
    ? toMediaUrl(rawImg)
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop'

  // Available floors for selected tower
  const availableFloors = selectedTower
    ? Array.from(new Set(selectedTower.units.map((u) => u.floor))).sort((a, b) => a - b)
    : []

  // Units filtered by selected floor
  const floorUnits = selectedTower && selectedFloor !== null
    ? selectedTower.units.filter((u) => u.floor === selectedFloor)
    : []

  // Resolved floor plate image for the tower and active floor
  const currentFloorPlateUrl = selectedTower && selectedFloor !== null
    ? resolveFloorPlanImage({
        towerName: selectedTower.name,
        floorNumber: selectedFloor,
        mediaList: projectMedia,
        fallbackImage: rawImg,
      })
    : ''

  // Project site summary calculations
  const totalUnits = project.towers.reduce((acc, t) => acc + t.units.length, 0)
  const availableUnits = project.towers.reduce(
    (acc, t) => acc + t.units.filter((u) => u.status === 'AVAILABLE').length,
    0
  )
  const allConfigs = Array.from(
    new Set(project.towers.flatMap((t) => t.units.map((u) => u.configuration)))
  ).filter(Boolean)
  const validPrices = project.towers.flatMap((t) => t.units.map((u) => u.price)).filter((p) => p > 0)
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0

  return (
    <div
      className="module-container"
      data-testid="module-MASTERPLAN"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', gap: 'var(--space-4)' }}
    >
      {/* ─── LEVEL 1: MASTER PLAN VIEW ────────────────────────────────────── */}
      {currentView === 'MASTER_PLAN' && (
        <div style={{ display: 'flex', gap: 'var(--space-6)', height: '100%', overflow: 'hidden' }}>
          {/* Interactive Map Area (Left side 2/3) */}
          <div
            onTouchStart={masterPlanZoom.onTouchStart}
            onTouchMove={masterPlanZoom.onTouchMove}
            onTouchEnd={masterPlanZoom.onTouchEnd}
            style={{
              flex: 2,
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: masterPlanZoom.scale > 1 ? 'grab' : 'crosshair',
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...masterPlanZoom.transformStyle,
              }}
            >
              <img
                src={masterPlanImg}
                alt="Master Plan"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, pointerEvents: 'none' }}
              />

              {/* Glassmorphic Tower Badges Overlaid on Map */}
              <div
                style={{
                  position: 'absolute',
                  top: 24,
                  left: 24,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  zIndex: 5,
                  maxWidth: 'calc(100% - 48px)',
                }}
              >
                {project.towers.map((tower) => {
                  const availCount = tower.units.filter((u) => u.status === 'AVAILABLE').length
                  const uCount = tower.units.length
                  return (
                    <button
                      key={tower.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectTower(tower)
                      }}
                      style={{
                        padding: '12px 18px',
                        minHeight: 56,
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        border: '1.5px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        backdropFilter: 'blur(16px)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: 'var(--shadow-lg)',
                        transition: 'all var(--transition-fast)',
                        touchAction: 'manipulation',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.borderColor = 'var(--color-accent)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-accent-dim)',
                          color: 'var(--color-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BuildingTowerIcon size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                          {tower.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 600, marginTop: 2 }}>
                          {availCount} of {uCount} {uCount === 1 ? 'Unit' : 'Units'} Available
                        </div>
                      </div>
                      <ChevronRightIcon size={16} color="var(--color-accent)" style={{ marginLeft: 4 }} />
                    </button>
                  )
                })}
                {project.towers.length === 0 && (
                  <div
                    style={{
                      color: 'var(--color-text-primary)',
                      padding: '16px 24px',
                      background: 'var(--color-surface)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    No towers configured for this project yet.
                  </div>
                )}
              </div>
            </div>

            {/* Floating Zoom & Pan Controls (56x56px, theme-aware glass) */}
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                zIndex: 10,
              }}
            >
              <button
                onClick={masterPlanZoom.zoomIn}
                aria-label="Zoom in master plan"
                style={{
                  width: 56,
                  height: 56,
                  minWidth: 56,
                  minHeight: 56,
                  borderRadius: '50%',
                  background: 'var(--color-surface)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-lg)',
                  touchAction: 'manipulation',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <ZoomInIcon size={22} />
              </button>
              <button
                onClick={masterPlanZoom.zoomOut}
                aria-label="Zoom out master plan"
                style={{
                  width: 56,
                  height: 56,
                  minWidth: 56,
                  minHeight: 56,
                  borderRadius: '50%',
                  background: 'var(--color-surface)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-lg)',
                  touchAction: 'manipulation',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <ZoomOutIcon size={22} />
              </button>
              {masterPlanZoom.scale > 1.0 && (
                <button
                  onClick={masterPlanZoom.reset}
                  aria-label="Reset master plan zoom"
                  style={{
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    minHeight: 56,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'scaleIn 0.2s ease',
                    touchAction: 'manipulation',
                  }}
                >
                  <ResetZoomIcon size={20} color="#fff" />
                </button>
              )}
            </div>

            {/* Gesture Hint Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: 24,
                background: 'var(--color-surface)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--color-border)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                pointerEvents: 'none',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10,
              }}
            >
              <TouchGestureIcon size={16} color="var(--color-accent)" />
              <span>Pinch to zoom · 2-finger pan ({masterPlanZoom.scale.toFixed(1)}x)</span>
            </div>
          </div>

          {/* Master Site & Towers Directory (Right 1/3) */}
          <div
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: 'var(--space-5)',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface-raised)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '22px', color: 'var(--color-text-primary)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    {project.name}
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                    Master Site & Inventory Directory
                  </p>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 99,
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: 'var(--color-available, #22c55e)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Live Inventory
                </span>
              </div>

              {/* 2x2 Project Key Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginTop: '16px',
                }}
              >
                <div style={{ background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Towers</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 2 }}>
                    {project.towers.length} {project.towers.length === 1 ? 'Block' : 'Blocks'}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Availability</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-available, #22c55e)', marginTop: 2 }}>
                    {availableUnits} Units
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Configurations</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {allConfigs.slice(0, 3).join(', ') || 'Luxury Units'}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Starting Price</span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-accent)', marginTop: 2 }}>
                    {minPrice > 0 ? formatPrice(minPrice) : 'On Request'}
                  </div>
                </div>
              </div>
            </div>

            {/* Towers Selection List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>
                Select a Tower to Explore Floors
              </div>

              {project.towers.map((tower) => {
                const floorsCount = new Set(tower.units.map((u) => u.floor)).size
                const availCount = tower.units.filter((u) => u.status === 'AVAILABLE').length
                const uCount = tower.units.length
                return (
                  <div
                    key={tower.id}
                    onClick={() => handleSelectTower(tower)}
                    style={{
                      padding: 'var(--space-4)',
                      background: 'var(--color-surface-raised)',
                      border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.borderColor = 'var(--color-accent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-accent-dim)',
                          color: 'var(--color-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BuildingTowerIcon size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          {tower.name}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                          {uCount} {uCount === 1 ? 'total unit' : 'total units'} · {floorsCount} {floorsCount === 1 ? 'floor' : 'floors'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 99,
                          backgroundColor: 'rgba(34, 197, 94, 0.12)',
                          color: 'var(--color-available, #22c55e)',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {availCount} Available
                      </span>
                      <ChevronRightIcon size={20} color="var(--color-accent)" />
                    </div>
                  </div>
                )
              })}

              {project.towers.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No towers added yet.
                </div>
              )}
            </div>

            {/* Bottom Kiosk Interactive Helper Prompt */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-surface-raised)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
              }}
            >
              <TouchGestureIcon size={18} color="var(--color-accent)" style={{ flexShrink: 0 }} />
              <span>Tap any block on the interactive site map or select a tower above to view architectural floor plans.</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── LEVEL 2: TOWER & FLOOR PLAN DRILL-DOWN VIEW ──────────────────── */}
      {currentView === 'TOWER_VIEW' && selectedTower && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-4)', overflow: 'hidden' }}>
          {/* Top Bar: Back Breadcrumb, Tower Name & Floor Selector Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-5)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              gap: 'var(--space-4)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Back Button */}
            <button
              onClick={handleBackToMasterPlan}
              aria-label="Back to Master Plan"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                minHeight: 48,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all var(--transition-fast)',
              }}
            >
              <ArrowLeftIcon size={16} />
              <span>Back to Master Plan</span>
            </button>

            {/* Tower Heading */}
            <div style={{ flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                {selectedTower.name}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600 }}>
                {selectedTower.units.filter((u) => u.status === 'AVAILABLE').length} Available Units
              </span>
            </div>

            {/* Horizontal Floor Selector Strip */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                overflowX: 'auto',
                padding: '4px 0',
                alignItems: 'center',
              }}
            >
              {availableFloors.length > 0 ? (
                availableFloors.map((floor) => {
                  const isActive = selectedFloor === floor
                  return (
                    <button
                      key={floor}
                      onClick={() => {
                        setSelectedFloor(floor)
                        floorPlateZoom.reset()
                      }}
                      style={{
                        padding: '10px 20px',
                        minHeight: 46,
                        minWidth: 78,
                        borderRadius: 'var(--radius-full)',
                        border: isActive ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                        backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-raised)',
                        color: isActive ? '#fff' : 'var(--color-text-secondary)',
                        fontSize: '14px',
                        fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all var(--transition-fast)',
                        touchAction: 'manipulation',
                        boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                      }}
                    >
                      Floor {floor}
                    </button>
                  )
                })
              ) : (
                <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>No floors in inventory</span>
              )}
            </div>
          </div>

          {/* Drill-down Body: Floor Plate Canvas (2/3) + Floor Units Drawer (1/3) */}
          <div style={{ display: 'flex', gap: 'var(--space-6)', flex: 1, overflow: 'hidden' }}>
            {/* Interactive Floor Plate Canvas */}
            <div
              onTouchStart={floorPlateZoom.onTouchStart}
              onTouchMove={floorPlateZoom.onTouchMove}
              onTouchEnd={floorPlateZoom.onTouchEnd}
              style={{
                flex: 2,
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none',
                userSelect: 'none',
                cursor: floorPlateZoom.scale > 1 ? 'grab' : 'default',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  ...floorPlateZoom.transformStyle,
                }}
              >
                {currentFloorPlateUrl ? (
                  <img
                    src={currentFloorPlateUrl}
                    alt={`Floor Plan for Floor ${selectedFloor}`}
                    style={{
                      maxWidth: '92%',
                      maxHeight: '92%',
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-md)',
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <BlueprintIcon size={64} color="var(--color-accent)" style={{ opacity: 0.7, marginBottom: 16 }} />
                    <h3 style={{ color: 'var(--color-text-primary)', marginBottom: 6, fontSize: '18px', fontWeight: 800 }}>
                      {selectedTower.name} · Floor {selectedFloor}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: 280 }}>
                      Architectural Floor Plate Drawing
                    </p>
                  </div>
                )}
              </div>

              {/* Floating Controls for Floor Plate (Theme-aware glass) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  right: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={floorPlateZoom.zoomIn}
                  aria-label="Zoom in floor plate"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'var(--color-surface)',
                    backdropFilter: 'blur(12px)',
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    touchAction: 'manipulation',
                  }}
                >
                  <ZoomInIcon size={20} />
                </button>
                <button
                  onClick={floorPlateZoom.zoomOut}
                  aria-label="Zoom out floor plate"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'var(--color-surface)',
                    backdropFilter: 'blur(12px)',
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    touchAction: 'manipulation',
                  }}
                >
                  <ZoomOutIcon size={20} />
                </button>
                {floorPlateZoom.scale > 1.0 && (
                  <button
                    onClick={floorPlateZoom.reset}
                    aria-label="Reset floor plate zoom"
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-lg)',
                      touchAction: 'manipulation',
                    }}
                  >
                    <ResetZoomIcon size={18} color="#fff" />
                  </button>
                )}
              </div>

              {/* Floor Label Tag */}
              <div
                style={{
                  position: 'absolute',
                  top: 18,
                  left: 18,
                  background: 'var(--color-surface)',
                  backdropFilter: 'blur(12px)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                Floor Plate · Floor {selectedFloor}
              </div>
            </div>

            {/* Floor Units Drawer (Right 1/3) */}
            <div
              style={{
                flex: 1,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-4) var(--space-5)',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'var(--color-surface-raised)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                    Floor {selectedFloor} Units
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {floorUnits.length} {floorUnits.length === 1 ? 'unit' : 'units'} on this floor
                  </span>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                {floorUnits.map((u) => {
                  const isSaved = isInShortlist(u.id)
                  const statusColor =
                    u.status === 'AVAILABLE'
                      ? 'var(--color-available, #22c55e)'
                      : u.status === 'HELD'
                        ? 'var(--color-held, #f59e0b)'
                        : 'var(--color-sold, #ef4444)'

                  return (
                    <div
                      key={u.id}
                      onClick={() => setActiveUnitModal(u)}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--color-surface-raised)',
                        border: '1.5px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.borderColor = 'var(--color-accent)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '17px', color: 'var(--color-text-primary)' }}>
                            Unit {u.unitNumber}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {u.configuration} · {u.carpetArea} sqft ({(u.carpetArea / 9).toFixed(1)} sqyd)
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 99,
                              backgroundColor: `${statusColor}15`,
                              color: statusColor,
                              border: `1px solid ${statusColor}35`,
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {u.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleShortlist(u, selectedTower.name)
                            }}
                            disabled={u.status === 'SOLD'}
                            aria-label={isSaved ? 'Remove from shortlist' : 'Add to shortlist'}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: u.status === 'SOLD' ? 'not-allowed' : 'pointer',
                              padding: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <HeartIcon
                              size={20}
                              isFilled={isSaved}
                              color={isSaved ? '#ef4444' : 'var(--color-text-muted)'}
                            />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-accent)' }}>
                          {formatPrice(u.price)}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-accent)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>Inspect Unit</span>
                          <ChevronRightIcon size={14} color="var(--color-accent)" />
                        </span>
                      </div>
                    </div>
                  )
                })}

                {floorUnits.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                    No units found for Floor {selectedFloor}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LEVEL 3: UNIT DETAIL MODAL ────────────────────────────────────── */}
      {activeUnitModal && selectedTower && (
        <UnitDetailModal
          unit={activeUnitModal}
          towerName={selectedTower.name}
          projectName={project.name}
          floorPlanImage={resolveFloorPlanImage({
            unit: activeUnitModal,
            towerName: selectedTower.name,
            floorNumber: activeUnitModal.floor,
            mediaList: projectMedia,
            fallbackImage: rawImg,
          })}
          isShortlisted={isInShortlist(activeUnitModal.id)}
          onToggleShortlist={() => toggleShortlist(activeUnitModal, selectedTower.name)}
          onClose={() => setActiveUnitModal(null)}
        />
      )}
    </div>
  )
}
