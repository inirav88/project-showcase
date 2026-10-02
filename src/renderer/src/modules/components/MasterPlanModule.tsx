import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { useShortlistStore } from '../../store/useShortlistStore'
import { toMediaUrl } from '../../utils/media'
import { usePinchPanZoom } from '../../hooks/usePinchPanZoom'
import { resolveFloorPlanImage, type MediaItem } from '../../utils/floorPlanMedia'
import UnitDetailModal from './UnitDetailModal'

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
  towers: Tower[]
}

function formatPrice(n: number): string {
  if (!n) return 'Price on Request'
  if (n >= 10000000) return String.fromCharCode(8377) + (n / 10000000).toFixed(2) + ' Cr'
  return String.fromCharCode(8377) + (n / 100000).toFixed(0) + ' L'
}

export default function MasterPlanModule({ config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)
  const [floorPlanMedia, setFloorPlanMedia] = useState<MediaItem[]>([])
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
          setFloorPlanMedia(
            data.filter((m: any) => m.category?.toUpperCase() === 'FLOOR_PLAN')
          )
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
        mediaList: floorPlanMedia,
      })
    : ''

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
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, pointerEvents: 'none' }}
              />

              {/* Tower Hotspot Buttons */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  padding: 'var(--space-8)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  alignContent: 'flex-start',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                {project.towers.map((tower) => (
                  <button
                    key={tower.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectTower(tower)
                    }}
                    style={{
                      padding: 'var(--space-4) var(--space-6)',
                      background: 'var(--backdrop-modal)',
                      color: 'var(--color-text-primary)',
                      border: '1.5px solid var(--color-border)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 'var(--font-size-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      transition: 'all var(--transition-fast)',
                      touchAction: 'manipulation',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      minWidth: 160,
                    }}
                  >
                    <span>{tower.name}</span>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-accent)', marginTop: 4 }}>
                      {tower.units.length} Units · Tap to Explore →
                    </span>
                  </button>
                ))}
                {project.towers.length === 0 && (
                  <div style={{ color: 'white', padding: 20, background: 'rgba(0,0,0,0.5)', borderRadius: 8 }}>
                    No towers configured for this project yet.
                  </div>
                )}
              </div>
            </div>

            {/* Floating Zoom & Pan Controls (56x56px) */}
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
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
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: 26,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-lg)',
                  touchAction: 'manipulation',
                }}
              >
                +
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
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: 26,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-lg)',
                  touchAction: 'manipulation',
                }}
              >
                –
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
                    fontSize: 20,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'scaleIn 0.2s ease',
                    touchAction: 'manipulation',
                  }}
                >
                  ⟲
                </button>
              )}
            </div>

            {/* Gesture Hint Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 14px',
                borderRadius: 16,
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <span>👆 Pinch to zoom or drag with two fingers ({masterPlanZoom.scale.toFixed(1)}x)</span>
            </div>
          </div>

          {/* Quick Tower Guide Side Panel (Right 1/3) */}
          <div
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                {project.name}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 4 }}>
                Master Site & Towers Overview
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {project.towers.map((tower) => (
                <div
                  key={tower.id}
                  onClick={() => handleSelectTower(tower)}
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                      {tower.name}
                    </h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                      {tower.units.length} total units · {new Set(tower.units.map(u => u.floor)).size} floors
                    </p>
                  </div>
                  <span style={{ fontSize: '18px', color: 'var(--color-accent)' }}>➔</span>
                </div>
              ))}
              {project.towers.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No towers added yet.
                </div>
              )}
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
              }}
            >
              <span>←</span>
              <span>Master Plan</span>
            </button>

            {/* Tower Heading */}
            <div style={{ flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                {selectedTower.name}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--color-accent)' }}>
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
                        padding: '8px 16px',
                        minHeight: 44,
                        minWidth: 70,
                        borderRadius: '99px',
                        border: isActive ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                        backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-raised)',
                        color: isActive ? '#fff' : 'var(--color-text-secondary)',
                        fontSize: '13px',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all var(--transition-fast)',
                        touchAction: 'manipulation',
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
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: 56, opacity: 0.4, marginBottom: 12 }}>🏢</div>
                    <h3 style={{ color: 'var(--color-text-primary)', marginBottom: 6 }}>
                      {selectedTower.name} · Floor {selectedFloor}
                    </h3>
                    <p style={{ fontSize: '13px' }}>
                      Architectural Floor Plate Drawing
                    </p>
                  </div>
                )}
              </div>

              {/* Floating Controls for Floor Plate */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  right: 20,
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
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: 24,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    touchAction: 'manipulation',
                  }}
                >
                  +
                </button>
                <button
                  onClick={floorPlateZoom.zoomOut}
                  aria-label="Zoom out floor plate"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: 24,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    touchAction: 'manipulation',
                  }}
                >
                  –
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
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-lg)',
                      touchAction: 'manipulation',
                    }}
                  >
                    ⟲
                  </button>
                )}
              </div>

              {/* Floor Label Tag */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
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
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    Floor {selectedFloor} Units
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {floorUnits.length} units on this floor
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
                      ? 'var(--color-available)'
                      : u.status === 'HELD'
                        ? 'var(--color-held)'
                        : 'var(--color-sold)'

                  return (
                    <div
                      key={u.id}
                      onClick={() => setActiveUnitModal(u)}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--color-surface-raised)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '16px' }}>
                            Unit {u.unitNumber}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {u.configuration} · {u.carpetArea} sqft ({(u.carpetArea / 9).toFixed(1)} sqyd)
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 99,
                              backgroundColor: `${statusColor}15`,
                              color: statusColor,
                              border: `1px solid ${statusColor}35`,
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
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
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isSaved ? '#f87171' : 'var(--color-text-muted)',
                              fontSize: '18px',
                              cursor: u.status === 'SOLD' ? 'not-allowed' : 'pointer',
                              padding: 2,
                            }}
                          >
                            {isSaved ? '❤️' : '🤍'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-accent)' }}>
                          {formatPrice(u.price)}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600 }}>
                          View Details ➔
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
            mediaList: floorPlanMedia,
          })}
          isShortlisted={isInShortlist(activeUnitModal.id)}
          onToggleShortlist={() => toggleShortlist(activeUnitModal, selectedTower.name)}
          onClose={() => setActiveUnitModal(null)}
        />
      )}
    </div>
  )
}
