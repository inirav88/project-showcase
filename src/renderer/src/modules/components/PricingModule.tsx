import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { useShortlistStore } from '../../store/useShortlistStore'

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
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  return `₹${(n / 100000).toFixed(0)} L`
}

export default function PricingModule({ projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  
  // Filters
  const [selectedTower, setSelectedTower] = useState<string>('ALL')
  const [selectedConfig, setSelectedConfig] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

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
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Tower</label>
            <select
              value={selectedTower}
              onChange={(e) => setSelectedTower(e.target.value)}
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              {towersList.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Config</label>
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              {configsList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              {statusList.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
            </select>
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
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '12px 8px' }}>Tower</th>
                <th style={{ padding: '12px 8px' }}>Unit</th>
                <th style={{ padding: '12px 8px' }}>Floor</th>
                <th style={{ padding: '12px 8px' }}>Config</th>
                <th style={{ padding: '12px 8px' }}>Carpet Area</th>
                <th style={{ padding: '12px 8px' }}>Price</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Shortlist</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => {
                const isSaved = isInShortlist(u.id)
                const statusColor = u.status === 'AVAILABLE' ? 'var(--color-available)' : u.status === 'HELD' ? 'var(--color-held)' : 'var(--color-sold)'
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color var(--transition-fast)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{u.towerName}</td>
                    <td style={{ padding: '12px 8px' }}>{u.unitNumber}</td>
                    <td style={{ padding: '12px 8px' }}>{u.floor}</td>
                    <td style={{ padding: '12px 8px' }}>{u.configuration}</td>
                    <td style={{ padding: '12px 8px' }}>{u.carpetArea} sqft</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{formatPrice(u.price)}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        backgroundColor: `${statusColor}15`,
                        color: statusColor,
                        border: `1px solid ${statusColor}35`,
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {u.status.toLowerCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleShortlist(u)}
                        disabled={u.status === 'SOLD'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isSaved ? '#f87171' : 'var(--color-text-muted)',
                          fontSize: '18px',
                          cursor: u.status === 'SOLD' ? 'not-allowed' : 'pointer',
                          outline: 'none',
                          transition: 'color var(--transition-fast)'
                        }}
                      >
                        {isSaved ? '❤️' : '🤍'}
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
