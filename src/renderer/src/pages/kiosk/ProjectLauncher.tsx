import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { toMediaUrl } from '../../utils/media'

interface Unit { id: string; status: string }
interface Tower { id: string; units: Unit[] }
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
interface Settings { firmName: string; firmLogoPath?: string; disclaimerText: string }

function formatPrice(n: number): string {
  if (!n) return 'N/A'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  return `₹${(n / 100000).toFixed(0)} L`
}

const TYPE_LABELS: Record<string, string> = {
  ALL: 'All Types',
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  MIXED_USE: 'Mixed Use',
  PLOTTED_DEVELOPMENT: 'Plotted',
}

const POSSESSION_LABELS: Record<string, string> = {
  ALL: 'All Status',
  READY: 'Ready to Move',
  UNDER_CONSTRUCTION: 'Under Construction',
}

const BUDGET_OPTIONS = [
  { label: 'Any Budget', value: 'ALL' },
  { label: 'Under ₹50L', value: '5000000' },
  { label: 'Under ₹1 Cr', value: '10000000' },
  { label: 'Under ₹3 Cr', value: '30000000' },
  { label: 'Under ₹5 Cr', value: '50000000' },
]

function FilterChipGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="filter-chip-group">
      {options.map((o) => (
        <button
          key={o.value}
          className={`filter-chip${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function ProjectLauncher(): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedPossession, setSelectedPossession] = useState('ALL')
  const [selectedBudgetMax, setSelectedBudgetMax] = useState('ALL')
  const navigate = useNavigate()

  useEffect(() => {
    window.api.invoke(IPC_CHANNELS.PROJECT_LIST)
      .then((data) => setProjects(data as Project[]))
      .catch(console.error)

    window.api.invoke(IPC_CHANNELS.SETTINGS_GET)
      .then((data) => setSettings(data as Settings))
      .catch(() => {/* settings may not exist yet */})
  }, [])

  const filtered = projects.filter((p) => {
    const textMatch = [p.name, p.developer, p.location].some((s) =>
      s.toLowerCase().includes(query.toLowerCase())
    )
    const typeMatch = selectedType === 'ALL' || p.type.toUpperCase() === selectedType
    const possessionMatch = selectedPossession === 'ALL' || p.possessionStatus.toUpperCase() === selectedPossession
    let budgetMatch = true
    if (selectedBudgetMax !== 'ALL') {
      budgetMatch = p.priceRangeMin <= Number(selectedBudgetMax)
    }
    return textMatch && typeMatch && possessionMatch && budgetMatch
  })

  const getAvailableCount = (p: Project) => {
    if (!p.towers) return 0
    return p.towers.flatMap((t) => t.units).filter((u) => u.status === 'AVAILABLE').length
  }

  const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
  const possessionOptions = Object.entries(POSSESSION_LABELS).map(([value, label]) => ({ value, label }))

  return (
    <div className="launcher">
      {/* Header */}
      <header className="launcher-header">
        <div className="launcher-brand">
          {settings?.firmLogoPath ? (
            <img
              src={toMediaUrl(settings.firmLogoPath)}
              alt="Firm Logo"
              style={{ height: 36, maxWidth: 180, objectFit: 'contain', marginBottom: 4 }}
            />
          ) : (
            <h1>{settings?.firmName || 'ShowcaseOS'}</h1>
          )}
          <p>Offline Real Estate Presentation Kiosk</p>
        </div>
        <div className="launcher-status-pill">
          <span className="status-dot" />
          System Online
        </div>
      </header>

      {/* Filters */}
      <div className="filter-bar">
        <input
          role="searchbox"
          type="search"
          className="filter-search"
          placeholder="Search by name, developer, or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-chips">
          <FilterChipGroup
            options={typeOptions}
            value={selectedType}
            onChange={setSelectedType}
          />
          <FilterChipGroup
            options={possessionOptions}
            value={selectedPossession}
            onChange={setSelectedPossession}
          />
          <FilterChipGroup
            options={BUDGET_OPTIONS}
            value={selectedBudgetMax}
            onChange={setSelectedBudgetMax}
          />
        </div>
      </div>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ flex: 1 }}>
          <span className="empty-state-icon">🏙️</span>
          <h3>No Projects Found</h3>
          <p>Try adjusting your search or filter criteria, or add a new project from the Admin Panel.</p>
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((p) => {
            const availCount = getAvailableCount(p)
            return (
              <button
                key={p.id}
                className="project-tile"
                style={{ '--project-accent': p.themeAccentColor } as React.CSSProperties}
                onClick={() => navigate(`project/${p.id}`)}
              >
                <div className="project-tile-image-wrap">
                  {p.thumbnailPath ? (
                    <img src={toMediaUrl(p.thumbnailPath)} alt={p.name} />
                  ) : (
                    <div
                      className="project-tile-gradient-cover"
                      style={{
                        background: `linear-gradient(135deg, ${p.themeAccentColor}30 0%, ${p.themeAccentColor}08 100%)`,
                      }}
                    >
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={p.themeAccentColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity={0.6}>
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="tile-body">
                  <div className="tile-name">{p.name}</div>
                  <div className="tile-meta">{p.developer} · {p.location}</div>
                  <div className="tile-badges">
                    <span className="price-badge">
                      {formatPrice(p.priceRangeMin)} – {formatPrice(p.priceRangeMax)}
                    </span>
                    <span className={`possession-badge ${p.possessionStatus}`}>
                      {p.possessionStatus === 'READY' ? 'Ready' : 'Under Const.'}
                    </span>
                    {availCount > 0 && (
                      <span className="scarcity-badge">
                        <span className="dot" />
                        {availCount} Available
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Footer Disclaimer */}
      {settings?.disclaimerText && (
        <footer className="launcher-footer">{settings.disclaimerText}</footer>
      )}
    </div>
  )
}
