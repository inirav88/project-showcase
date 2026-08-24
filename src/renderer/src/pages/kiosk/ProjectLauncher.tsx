import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { toMediaUrl } from '../../utils/media'
import { ThemeToggle } from '../../components/ThemeToggle'
import { AccessibilityToggle } from '../../components/AccessibilityToggle'
import { MatchmakerQuiz } from '../../components/MatchmakerQuiz'
import { ProjectComparison } from '../../components/ProjectComparison'
import { IdleOverlay } from '../../components/IdleOverlay'
import { useIdleTimer } from '../../hooks/useIdleTimer'
import { useKioskExit } from '../../hooks/useKioskExit'

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
  logoPath?: string
  reraNumber?: string
  description?: string
  towers?: Tower[]
}
interface Settings {
  firmName: string
  firmLogoPath?: string
  disclaimerText: string
  idleTimeoutSeconds?: number
}

function formatPrice(n: number): string {
  if (!n) return 'N/A'
  if (n >= 10000000) return `\u20B9${(n / 10000000).toFixed(1)} Cr`
  return `\u20B9${(n / 100000).toFixed(0)} L`
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
  { label: 'Under \u20B950L', value: '5000000' },
  { label: 'Under \u20B91 Cr', value: '10000000' },
  { label: 'Under \u20B93 Cr', value: '30000000' },
  { label: 'Under \u20B95 Cr', value: '50000000' },
]

function FilterChipGroup({ options, value, onChange }: {
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

// ── PIN Keypad Modal (Launcher) ───────────────────────────────────────────────
function LauncherPinModal({
  onVerify, onClose,
}: {
  onVerify: (pin: string) => Promise<boolean>
  onClose: () => void
}) {
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleKey = async (d: string) => {
    if (checking) return
    if (d === '⌫') { setDigits((p) => p.slice(0, -1)); setError(''); return }
    const next = [...digits, d]
    setDigits(next)
    if (next.length === 4) {
      setChecking(true)
      const ok = await onVerify(next.join(''))
      if (!ok) { setError('Incorrect PIN — try again'); setDigits([]) }
      setChecking(false)
    }
  }

  return (
    <div className="pin-backdrop" role="dialog" aria-label="Admin PIN entry">
      <div className="pin-modal">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Admin Access
          </div>
          <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)', fontWeight: 600 }}>
            Enter 4-digit PIN
          </div>
        </div>
        <div className="pin-display">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`pin-dot${digits[i] !== undefined ? ' filled' : ''}`} />
          ))}
        </div>
        {error && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}
        <div className="pin-keypad">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
            key === '' ? <div key={i} /> : (
              <button key={key + i} className="pin-key" onClick={() => handleKey(key)} disabled={checking}>{key}</button>
            )
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ all: 'unset', cursor: 'pointer', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', padding: '8px', transition: 'color var(--transition-fast)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          Cancel
        </button>
      </div>
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
  const [matchScores, setMatchScores] = useState<Record<string, number> | null>(null)
  const [showMatchmaker, setShowMatchmaker] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareSelected, setCompareSelected] = useState<Project[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const navigate = useNavigate()

  const { startHold, endHold } = useKioskExit({
    onExit: () => setShowPinModal(true),
  })

  const handlePinVerify = async (pin: string): Promise<boolean> => {
    try {
      const isValid = await (window as any).api.invoke(IPC_CHANNELS.SETTINGS_VERIFY_PIN, pin)
      if (isValid) {
        setShowPinModal(false)
        navigate('/admin')
        return true
      }
      return false
    } catch {
      return false
    }
  }

  useEffect(() => {
    window.api.invoke(IPC_CHANNELS.PROJECT_LIST)
      .then((data) => setProjects(data as Project[]))
      .catch(console.error)
    window.api.invoke(IPC_CHANNELS.SETTINGS_GET)
      .then((data) => setSettings(data as Settings))
      .catch(() => {})
  }, [])

  const idleTimeoutMs = (settings?.idleTimeoutSeconds ?? 300) * 1000
  const handleIdle = useCallback(() => setIsIdle(true), [])
  const handleActive = useCallback(() => setIsIdle(false), [])
  useIdleTimer(idleTimeoutMs, handleIdle, handleActive)

  const heroImages = projects
    .filter((p) => p.thumbnailPath)
    .map((p) => p.thumbnailPath as string)

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

  // Sort by match score if matchmaker has run
  const displayed = matchScores
    ? [...filtered].sort((a, b) => (matchScores[b.id] ?? 0) - (matchScores[a.id] ?? 0))
    : filtered

  const getAvailableCount = (p: Project) => {
    if (!p.towers) return 0
    return p.towers.flatMap((t) => t.units).filter((u) => u.status === 'AVAILABLE').length
  }

  const handleProjectClick = (p: Project) => {
    if (compareMode) {
      if (compareSelected.find((s) => s.id === p.id)) {
        setCompareSelected((prev) => prev.filter((s) => s.id !== p.id))
      } else if (compareSelected.length < 2) {
        setCompareSelected((prev) => [...prev, p])
      }
    } else {
      navigate(`project/${p.id}`)
    }
  }

  const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
  const possessionOptions = Object.entries(POSSESSION_LABELS).map(([value, label]) => ({ value, label }))

  return (
    <div className="launcher">
      {/* Hidden corner hold zone for admin PIN access (hold bottom-right corner 5s) */}
      <div
        className="kiosk-exit-corner"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
      />

      {/* Admin PIN Modal */}
      {showPinModal && (
        <LauncherPinModal
          onVerify={handlePinVerify}
          onClose={() => setShowPinModal(false)}
        />
      )}

      {/* Idle overlay */}
      {isIdle && (
        <IdleOverlay heroImages={heroImages} onDismiss={() => setIsIdle(false)} />
      )}

      {/* Matchmaker Quiz modal */}
      {showMatchmaker && (
        <MatchmakerQuiz
          projects={projects}
          onComplete={(scored) => {
            const scores: Record<string, number> = {}
            scored.forEach((p) => { scores[p.id] = p.matchScore })
            setMatchScores(scores)
            setShowMatchmaker(false)
          }}
          onDismiss={() => setShowMatchmaker(false)}
        />
      )}

      {/* Comparison view */}
      {showComparison && compareSelected.length === 2 && (
        <ProjectComparison
          projectA={compareSelected[0]}
          projectB={compareSelected[1]}
          onClose={() => { setShowComparison(false); setCompareMode(false); setCompareSelected([]) }}
        />
      )}

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
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          {/* Matchmaker button */}
          <button
            onClick={() => { setMatchScores(null); setShowMatchmaker(true) }}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: matchScores ? 'var(--color-accent-dim)' : 'var(--color-surface-raised)',
              color: matchScores ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
          >
            {matchScores ? String.fromCharCode(10003) + ' Matched' : String.fromCodePoint(128269) + ' Find Match'}
          </button>
          {matchScores && (
            <button
              onClick={() => setMatchScores(null)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-text-muted)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              {String.fromCharCode(10005)} Clear
            </button>
          )}
          {/* Compare button */}
          <button
            onClick={() => { setCompareMode((m) => !m); setCompareSelected([]) }}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: compareMode ? 'var(--color-accent-dim)' : 'var(--color-surface-raised)',
              color: compareMode ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
          >
            {String.fromCodePoint(9878)} {compareMode ? 'Cancel Compare' : 'Compare'}
          </button>
          {compareMode && compareSelected.length === 2 && (
            <button
              onClick={() => setShowComparison(true)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'var(--color-accent)', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              Compare Now {String.fromCharCode(8594)}
            </button>
          )}
          <AccessibilityToggle />
          <ThemeToggle />
          <div className="launcher-status-pill">
            <span className="status-dot" />
            System Online
          </div>
        </div>
      </header>

      {/* Compare mode banner */}
      {compareMode && (
        <div style={{
          background: 'var(--color-accent-dim)', borderBottom: '1px solid var(--color-accent-border)',
          padding: '10px 32px', fontSize: 13, color: 'var(--color-accent)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span>{String.fromCodePoint(9878)} Compare Mode: Select 2 projects to compare</span>
          <span style={{ opacity: 0.7 }}>({compareSelected.length}/2 selected)</span>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <input
          role="searchbox"
          type="search"
          className="filter-search"
          placeholder="Search by name, developer, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-chips">
          <FilterChipGroup options={typeOptions} value={selectedType} onChange={setSelectedType} />
          <FilterChipGroup options={possessionOptions} value={selectedPossession} onChange={setSelectedPossession} />
          <FilterChipGroup options={BUDGET_OPTIONS} value={selectedBudgetMax} onChange={setSelectedBudgetMax} />
        </div>
      </div>

      {/* Project Grid */}
      {displayed.length === 0 ? (
        <div className="empty-state" style={{ flex: 1 }}>
          <span className="empty-state-icon">{String.fromCodePoint(128194)}</span>
          <h3>No Projects Found</h3>
          <p>Try adjusting your search or filter criteria, or add a new project from the Admin Panel.</p>
        </div>
      ) : (
        <div className="project-grid">
          {displayed.map((p) => {
            const availCount = getAvailableCount(p)
            const score = matchScores?.[p.id]
            const isCompareSelected = compareSelected.some((s) => s.id === p.id)
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                className={`project-tile${isCompareSelected ? ' compare-selected' : ''}`}
                style={{
                  '--project-accent': p.themeAccentColor,
                  ...(isCompareSelected ? { outline: `3px solid ${p.themeAccentColor}`, outlineOffset: 3 } : {}),
                } as React.CSSProperties}
                onClick={() => handleProjectClick(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleProjectClick(p)
                  }
                }}
              >
                <div className="project-tile-image-wrap">
                  {p.thumbnailPath ? (
                    <img src={toMediaUrl(p.thumbnailPath)} alt={p.name} />
                  ) : (
                    <div
                      className="project-tile-gradient-cover"
                      style={{ background: `linear-gradient(135deg, ${p.themeAccentColor}30 0%, ${p.themeAccentColor}08 100%)` }}
                    >
                      {!p.logoPath && (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={p.themeAccentColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity={0.6}>
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                      )}
                    </div>
                  )}
                  {/* Overlaid logo if available */}
                  {p.logoPath && (
                    <div className="project-tile-logo-overlay">
                      <img src={toMediaUrl(p.logoPath)} alt={`${p.name} logo`} />
                    </div>
                  )}
                  {/* Match score badge */}
                  {score !== undefined && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626',
                      color: '#fff', fontSize: 11, fontWeight: 800,
                      padding: '4px 9px', borderRadius: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                      {score}% Match
                    </div>
                  )}
                  {/* Compare selection badge */}
                  {compareMode && (
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      width: 26, height: 26, borderRadius: '50%',
                      background: isCompareSelected ? p.themeAccentColor : 'rgba(255,255,255,0.2)',
                      border: `2px solid ${isCompareSelected ? p.themeAccentColor : 'rgba(255,255,255,0.6)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: '#fff', fontWeight: 800,
                    }}>
                      {isCompareSelected ? String.fromCharCode(10003) : ''}
                    </div>
                  )}
                </div>

                <div className="tile-body">
                  <div className="tile-name">{p.name}</div>
                  <div className="tile-meta">{p.developer} {String.fromCharCode(8226)} {p.location}</div>
                  <div className="tile-badges">
                    <span className="price-badge">
                      {formatPrice(p.priceRangeMin)} {" \u2014 "} {formatPrice(p.priceRangeMax)}
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
              </div>
            )
          })}
        </div>
      )}

      {settings?.disclaimerText && (
        <footer className="launcher-footer">{settings.disclaimerText}</footer>
      )}
    </div>
  )
}





