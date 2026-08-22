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

export default function MasterPlanModule({ config, projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [project, setProject] = useState<Project | null>(null)
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null)
  const { addItem, removeItem, isInShortlist } = useShortlistStore()

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => {
        setProject(data as Project)
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

  // Masterplan placeholder image (fallback if not configured)
  const masterPlanImg = config?.masterPlanImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop'

  return (
    <div className="module-container" data-testid="module-MASTERPLAN" style={{ display: 'flex', gap: 'var(--space-6)', height: '100%', overflow: 'hidden' }}>
      
      {/* Interactive Map Area (Left side 2/3) */}
      <div style={{
        flex: 2,
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'crosshair'
      }}>
        <img 
          src={masterPlanImg} 
          alt="Master Plan" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
        />
        
        {/* Abstract Tower Overlay Hotspots */}
        <div style={{ position: 'absolute', inset: 0, padding: 'var(--space-8)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignContent: 'flex-start', background: 'rgba(0,0,0,0.2)' }}>
           {project.towers.map((tower, i) => (
             <button
                key={tower.id}
                onClick={() => setSelectedTower(tower)}
                style={{
                  padding: 'var(--space-4) var(--space-6)',
                  background: selectedTower?.id === tower.id ? 'var(--color-accent)' : 'var(--backdrop-modal)',
                  color: selectedTower?.id === tower.id ? 'var(--color-bg)' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  transition: 'all var(--transition-fast)'
                }}
             >
                {tower.name}
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 400, opacity: 0.8, marginTop: '4px' }}>
                  {tower.units.length} Units Available
                </div>
             </button>
           ))}
           {project.towers.length === 0 && (
             <div style={{ color: 'white', padding: 20, background: 'rgba(0,0,0,0.5)', borderRadius: 8 }}>
                No towers configured for this project yet.
             </div>
           )}
        </div>
      </div>

      {/* Side Panel (Right side 1/3) */}
      <div style={{
        flex: 1,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {selectedTower ? (
          <>
            <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-accent)', fontWeight: 700 }}>{selectedTower.name}</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>Inventory Overview</p>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {selectedTower.units.map((u) => {
                const isSaved = isInShortlist(u.id)
                const statusColor = u.status === 'AVAILABLE' ? 'var(--color-available)' : u.status === 'HELD' ? 'var(--color-held)' : 'var(--color-sold)'
                
                return (
                  <div key={u.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    background: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>Unit {u.unitNumber} <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>| Fl {u.floor}</span></div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{u.configuration} · {u.carpetArea} sqft</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-accent)', marginTop: 4 }}>
                        {formatPrice(u.price)}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                       <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          backgroundColor: `${statusColor}15`,
                          color: statusColor,
                          border: `1px solid ${statusColor}35`,
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {u.status}
                        </span>
                        
                        <button
                          onClick={() => toggleShortlist(u, selectedTower.name)}
                          disabled={u.status === 'SOLD'}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isSaved ? '#f87171' : 'var(--color-text-muted)',
                            fontSize: '20px',
                            cursor: u.status === 'SOLD' ? 'not-allowed' : 'pointer',
                            transition: 'transform var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {if(u.status!=='SOLD') e.currentTarget.style.transform = 'scale(1.1)'}}
                          onMouseLeave={(e) => {e.currentTarget.style.transform = 'scale(1)'}}
                        >
                          {isSaved ? '❤️' : '🤍'}
                        </button>
                    </div>
                  </div>
                )
              })}
              
              {selectedTower.units.length === 0 && (
                 <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                    No units entered for this tower yet.
                 </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', textAlign: 'center' }}>
            <span style={{ fontSize: 48, opacity: 0.5 }}>🏢</span>
            <h3 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>Select a Tower</h3>
            <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Click on a block in the master plan to view available floor plans and inventory.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}