import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface Unit {
  id: string
  status: string
}

interface Tower {
  id: string
  units: Unit[]
}

interface Project {
  id: string
  name: string
  developer: string
  location: string
  type: string
  possessionStatus: string
  priceRangeMin: number
  priceRangeMax: number
  themeAccentColor: string
  thumbnailPath?: string
  towers?: Tower[]
}

interface Settings {
  firmName: string
  disclaimerText: string
}

function formatPrice(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  return `₹${(n / 100000).toFixed(0)} L`
}

export default function ProjectLauncher(): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  
  // Filter States
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedPossession, setSelectedPossession] = useState('ALL')
  const [selectedBudgetMax, setSelectedBudgetMax] = useState('ALL')

  const navigate = useNavigate()

  useEffect(() => {
    // Load projects list
    window.api
      .invoke(IPC_CHANNELS.PROJECT_LIST)
      .then((data) => setProjects(data as Project[]))
      .catch(console.error)

    // Load global configurations / firm branding
    window.api
      .invoke(IPC_CHANNELS.SETTINGS_GET)
      .then((data) => setSettings(data as Settings))
      .catch(console.error)
  }, [])

  // Filter application
  const filtered = projects.filter((p) => {
    const textMatch = [p.name, p.developer, p.location].some((s) =>
      s.toLowerCase().includes(query.toLowerCase())
    )
    const typeMatch = selectedType === 'ALL' || p.type.toUpperCase() === selectedType
    const possessionMatch = selectedPossession === 'ALL' || p.possessionStatus.toUpperCase() === selectedPossession
    
    let budgetMatch = true
    if (selectedBudgetMax !== 'ALL') {
      const maxVal = Number(selectedBudgetMax)
      // Check if project price minimum is less than selected budget max limit
      budgetMatch = p.priceRangeMin <= maxVal
    }

    return textMatch && typeMatch && possessionMatch && budgetMatch
  })

  // Scarcity counter helper
  const getAvailableUnitsCount = (p: Project) => {
    if (!p.towers) return 0
    let count = 0
    p.towers.forEach((t) => {
      t.units.forEach((u) => {
        if (u.status.toUpperCase() === 'AVAILABLE') {
          count++
        }
      })
    })
    return count
  }

  return (
    <div className="launcher" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'linear-gradient(135deg, #09090e 0%, #111119 100%)',
      padding: 'var(--space-8)',
      gap: 'var(--space-6)',
      overflow: 'hidden'
    }}>
      {/* Branding Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            {settings?.firmName || 'ShowcaseOS'}
          </h1>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Interactive Offline Kiosk Portal
          </p>
        </div>
        <div style={{
          padding: '6px 14px',
          borderRadius: '99px',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--font-size-xs)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          color: 'var(--color-text-secondary)'
        }}>
          🖥️ Offline Node Connected
        </div>
      </header>

      {/* Filters Bar */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
        alignItems: 'center',
        backgroundColor: 'var(--color-surface)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)'
      }}>
        <input
          role="searchbox"
          type="search"
          placeholder="Search projects by name, developer, or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 2,
            minWidth: '260px',
            padding: '10px 16px',
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: '#fff',
            outline: 'none',
            fontSize: 'var(--font-size-sm)'
          }}
        />

        {/* Dropdowns */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', flex: 1, minWidth: '320px' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="MIXED_USE">Mixed Use</option>
            <option value="PLOTTED_DEVELOPMENT">Plotted Development</option>
          </select>

          <select
            value={selectedPossession}
            onChange={(e) => setSelectedPossession(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Possessions</option>
            <option value="READY">Ready to Move</option>
            <option value="UNDER_CONSTRUCTION">Under Construction</option>
          </select>

          <select
            value={selectedBudgetMax}
            onChange={(e) => setSelectedBudgetMax(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Any Budget</option>
            <option value="5000000">Under ₹50 L</option>
            <option value="10000000">Under ₹1.0 Cr</option>
            <option value="30000000">Under ₹3.0 Cr</option>
            <option value="50000000">Under ₹5.0 Cr</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="project-grid" style={{ flex: 1, paddingBottom: 'var(--space-4)' }}>
        {filtered.map((p) => {
          const availCount = getAvailableUnitsCount(p)
          return (
            <button
              key={p.id}
              className="project-tile"
              style={{ '--project-accent': p.themeAccentColor } as React.CSSProperties}
              onClick={() => navigate(`project/${p.id}`)}
            >
              {p.thumbnailPath ? (
                <img src={`media://${p.thumbnailPath}`} alt={p.name} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '200px',
                  background: `linear-gradient(135deg, ${p.themeAccentColor}44, ${p.themeAccentColor}11)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px'
                }}>
                  🏢
                </div>
              )}
              <div className="tile-body">
                <h2>{p.name}</h2>
                <p>{p.developer} · {p.location}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                  <span className="price-badge" style={{ margin: 0 }}>
                    {formatPrice(p.priceRangeMin)} – {formatPrice(p.priceRangeMax)}
                  </span>
                  <span className={`possession-badge ${p.possessionStatus}`}>
                    {p.possessionStatus === 'READY' ? 'Ready' : 'Under Const.'}
                  </span>
                  
                  {/* Live scarcity indicators */}
                  {availCount > 0 && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '99px',
                      backgroundColor: 'rgba(52, 211, 153, 0.1)',
                      color: 'var(--color-available)',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      🔥 {availCount} Available
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        )}
      </div>

      {/* Disclaimer Text Footer */}
      {settings?.disclaimerText && (
        <footer style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          {settings.disclaimerText}
        </footer>
      )}
    </div>
  )
}
