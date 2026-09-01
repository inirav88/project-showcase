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
  towerName?: string
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

export default function CompareUnitsModule({ config: _config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  
  // Track selected units for comparison (up to 3)
  const [slot1, setSlot1] = useState<string>('')
  const [slot2, setSlot2] = useState<string>('')
  const [slot3, setSlot3] = useState<string>('')

  const { addItem, removeItem, isInShortlist } = useShortlistStore()

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => {
        const proj = data as Project
        setProject(proj)
        
        const flat: Unit[] = []
        proj.towers.forEach((t) => {
          t.units.forEach((u) => {
            flat.push({ ...u, towerName: t.name })
          })
        })
        setUnits(flat)
      })
      .catch(console.error)
  }, [projectId])

  if (!project) return <div className="loading">Loading Compare Module…</div>

  const getUnit = (id: string) => units.find(u => u.id === id)

  const toggleShortlist = (u: Unit) => {
    if (isInShortlist(u.id)) {
      removeItem(u.id)
    } else {
      addItem({
        unitId: u.id,
        unitNumber: u.unitNumber,
        towerName: u.towerName || '',
        projectName: project.name,
        configuration: u.configuration,
        price: u.price
      })
    }
  }

  const renderSlot = (slotValue: string, setSlot: (val: string) => void, _slotLabel: string) => {
    const u = getUnit(slotValue)
    
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Dropdown Selector */}
        <select 
          value={slotValue} 
          onChange={(e) => setSlot(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">Select a unit...</option>
          {units.map(unit => (
            <option key={unit.id} value={unit.id} disabled={[slot1, slot2, slot3].includes(unit.id) && slotValue !== unit.id}>
              {unit.towerName} - {unit.unitNumber} ({unit.configuration})
            </option>
          ))}
        </select>

        {/* Data Card */}
        {u ? (
          <div style={{ 
            background: 'var(--color-surface)', 
            border: '1px solid var(--color-border)', 
            borderRadius: 'var(--radius-lg)', 
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            position: 'relative'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {u.towerName}-{u.unitNumber}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                {u.configuration}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <SpecRow label="Price" value={formatPrice(u.price)} highlight />
              <SpecRow label="Floor" value={`Floor ${u.floor}`} />
              <SpecRow label="Carpet Area" value={`${u.carpetArea} sqft`} />
              <SpecRow label="Status" value={u.status} isStatus />
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-5)', textAlign: 'center' }}>
               <button
                  onClick={() => toggleShortlist(u)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: isInShortlist(u.id) ? 'var(--color-surface-raised)' : 'var(--color-accent)',
                    color: isInShortlist(u.id) ? 'var(--color-text-primary)' : 'var(--color-bg)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {isInShortlist(u.id) ? '❤️ Shortlisted' : '🤍 Add to Shortlist'}
                </button>
            </div>
          </div>
        ) : (
          <div style={{ 
            flex: 1, 
            border: '2px dashed var(--color-border)', 
            borderRadius: 'var(--radius-lg)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            background: 'var(--color-surface-raised)'
          }}>
            <span style={{ fontSize: 32, marginBottom: 8 }}>⚖️</span>
            <div>Select a unit to compare</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="module-container" data-testid="module-COMPARE_UNITS" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-4)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Unit Comparison</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Compare configurations, areas, and pricing side-by-side.</p>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-6)', flex: 1 }}>
        {renderSlot(slot1, setSlot1, 'Unit 1')}
        {renderSlot(slot2, setSlot2, 'Unit 2')}
        {renderSlot(slot3, setSlot3, 'Unit 3')}
      </div>
    </div>
  )
}

function SpecRow({ label, value, highlight = false, isStatus = false }: { label: string, value: string, highlight?: boolean, isStatus?: boolean }) {
  let valColor = highlight ? 'var(--color-accent)' : 'var(--color-text-primary)'
  if (isStatus) {
    valColor = value === 'AVAILABLE' ? 'var(--color-available)' : value === 'HELD' ? 'var(--color-held)' : 'var(--color-sold)'
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>{label}</span>
      <span style={{ color: valColor, fontWeight: highlight ? 700 : 500, fontSize: highlight ? 'var(--font-size-lg)' : 'var(--font-size-base)' }}>
        {value}
      </span>
    </div>
  )
}
