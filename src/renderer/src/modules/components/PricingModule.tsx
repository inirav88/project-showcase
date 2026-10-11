import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { useShortlistStore } from '../../store/useShortlistStore'
import { HeartIcon } from '../../components/common/Icons'

interface Unit {
  id: string
  unitNumber: string
  floor: number
  configuration: string
  carpetArea: number
  price: number
  priceLabel: string
  status: string
  notes?: string
  towerName?: string // added post-processing
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
  if (!n) return 'N/A'
  if (n >= 10000000) return String.fromCharCode(8377) + (n / 10000000).toFixed(2) + ' Cr'
  return String.fromCharCode(8377) + (n / 100000).toFixed(0) + ' L'
}

export default function PricingModule({ projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  
  // Filters
  const [selectedTower, setSelectedTower] = useState<string>('ALL')
  const [selectedConfig, setSelectedConfig] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [areaDisplayMode, setAreaDisplayMode] = useState<'SQFT' | 'SQYD' | 'DUAL'>('DUAL')

  const { addItem, removeItem, isInShortlist } = useShortlistStore()

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => {
        const proj = data as Project
        setProject(proj)
        
        // Flatten units with tower name context
        const flat: Unit[] = []
        proj.towers.forEach((t) => {
          t.units.forEach((u) => {
            flat.push({
              ...u,
              towerName: t.name
            })
          })
        })
        setUnits(flat)
      })
      .catch(console.error)
  }, [projectId])

  if (!project) {
    return <div className="loading">Loading pricing and availability…</div>
  }

  // Get distinct filter options
  const towersList = ['ALL', ...project.towers.map((t) => t.name)]
  const configsList = ['ALL', ...Array.from(new Set(units.map((u) => u.configuration)))]
  const statusList = ['ALL', 'AVAILABLE', 'HELD', 'SOLD']

  // Filter logic
  const filteredUnits = units.filter((u) => {
    const towerMatch = selectedTower === 'ALL' || u.towerName === selectedTower
    const configMatch = selectedConfig === 'ALL' || u.configuration === selectedConfig
    const statusMatch = selectedStatus === 'ALL' || u.status.toUpperCase() === selectedStatus
    return towerMatch && configMatch && statusMatch
  })

  const toggleShortlist = (u: Unit) => {
    if (isInShortlist(u.id)) {
      removeItem(u.id)
    } else {
      addItem({
        unitId: u.id,
        unitNumber: u.unitNumber,
        towerName: u.towerName || 'Block',
        projectName: project.name,
        configuration: u.configuration,
        price: u.price
      })
    }
  }

  return (
    <div className="pricing-module-card" data-testid="module-PRICING" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Pricing & Inventory</h3>
        
        {/* Filters bar */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tower</label>
            <select
              value={selectedTower}
              onChange={(e) => setSelectedTower(e.target.value)}
              className="luxury-select"
            >
              {towersList.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Config</label>
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className="luxury-select"
            >
              {configsList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="luxury-select"
            >
              {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Area Units</label>
            <div style={{ display: 'flex', background: 'var(--color-surface-raised)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '3px', minHeight: 44, boxSizing: 'border-box' }}>
              <button
                type="button"
                onClick={() => setAreaDisplayMode('SQFT')}
                style={{
                  padding: '8px 14px', fontSize: '12px', fontWeight: areaDisplayMode === 'SQFT' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  backgroundColor: areaDisplayMode === 'SQFT' ? 'var(--color-accent)' : 'transparent',
                  color: areaDisplayMode === 'SQFT' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Sq. Ft.
              </button>
              <button
                type="button"
                onClick={() => setAreaDisplayMode('SQYD')}
                style={{
                  padding: '8px 14px', fontSize: '12px', fontWeight: areaDisplayMode === 'SQYD' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  backgroundColor: areaDisplayMode === 'SQYD' ? 'var(--color-accent)' : 'transparent',
                  color: areaDisplayMode === 'SQYD' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Sq. Yd.
              </button>
              <button
                type="button"
                onClick={() => setAreaDisplayMode('DUAL')}
                style={{
                  padding: '8px 14px', fontSize: '12px', fontWeight: areaDisplayMode === 'DUAL' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  backgroundColor: areaDisplayMode === 'DUAL' ? 'var(--color-accent)' : 'transparent',
                  color: areaDisplayMode === 'DUAL' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Dual
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredUnits.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No matching units found
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 12px' }}>Tower</th>
                <th style={{ padding: '14px 12px' }}>Unit</th>
                <th style={{ padding: '14px 12px' }}>Floor</th>
                <th style={{ padding: '14px 12px' }}>Config</th>
                <th style={{ padding: '14px 12px' }}>Carpet Area</th>
                <th style={{ padding: '14px 12px' }}>Price</th>
                <th style={{ padding: '14px 12px' }}>Status</th>
                <th style={{ padding: '14px 12px', textAlign: 'center' }}>Shortlist</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => {
                const isSaved = isInShortlist(u.id)
                const statusColor = u.status === 'AVAILABLE' ? 'var(--color-available)' : u.status === 'HELD' ? 'var(--color-held)' : 'var(--color-sold)'
                const displayArea = areaDisplayMode === 'SQYD'
                  ? `${(u.carpetArea / 9).toFixed(1)} sqyd`
                  : areaDisplayMode === 'DUAL'
                  ? `${u.carpetArea} sqft (${(u.carpetArea / 9).toFixed(1)} sqyd)`
                  : `${u.carpetArea} sqft`
                return (
                  <tr key={u.id} className="table-row-interactive">
                    <td style={{ padding: '14px 12px', fontWeight: 600 }}>{u.towerName}</td>
                    <td style={{ padding: '14px 12px' }}>{u.unitNumber}</td>
                    <td style={{ padding: '14px 12px' }}>{u.floor}</td>
                    <td style={{ padding: '14px 12px' }}>{u.configuration}</td>
                    <td style={{ padding: '14px 12px' }}>{displayArea}</td>
                    <td style={{ padding: '14px 12px', fontWeight: 700, color: 'var(--color-accent)' }}>{formatPrice(u.price)}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '99px',
                        backgroundColor: `${statusColor}18`,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`,
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleShortlist(u)}
                        disabled={u.status === 'SOLD'}
                        aria-label={isSaved ? `Remove Unit ${u.unitNumber} from shortlist` : `Add Unit ${u.unitNumber} to shortlist`}
                        style={{
                          background: isSaved ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-surface-raised)',
                          border: `1px solid ${isSaved ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-border)'}`,
                          borderRadius: '50%',
                          width: 38,
                          height: 38,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: u.status === 'SOLD' ? 'not-allowed' : 'pointer',
                          opacity: u.status === 'SOLD' ? 0.4 : 1,
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <HeartIcon size={18} isFilled={isSaved} color={isSaved ? '#ef4444' : 'var(--color-text-secondary)'} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
