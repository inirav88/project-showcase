import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface Project {
  id: string
  name: string
  developer: string
  reraNumber: string
  location: string
  priceRangeMin: number
  priceRangeMax: number
}

interface ModuleRecord {
  id: string
  moduleType: string
  config: string
  sortOrder: number
  isVisible: boolean
}

const PRESENTER_NOTES: Record<string, string> = {
  OVERVIEW: "Overview: Emphasize the developer's 15+ year track record. Mention premium construction materials and state-of-the-art security.",
  LOCATION: "Location: Detail proximity to key landmarks (metro station: 5 mins, major highway: 2 mins). Highlight high rental yield potential in this locality.",
  PRICING: "Pricing: Use this tab to guide the negotiation. Highlight starting price of ?X.X Cr. Suggest limited-period launch discounts if appropriate.",
  AMENITIES: "Amenities: Highlight the double-height clubhouse, temperature-controlled pool, and sky lounge. Great selling points for luxury buyers.",
  GALLERY: "Gallery: Allow client to gaze at the high-resolution renders while explaining the architectural design language."
}

const MODULE_LABELS: Record<string, string> = {
  OVERVIEW: 'Overview', GALLERY: 'Gallery', VIDEOS: 'Videos',
  TOUR_360: '360\u00B0 Tour', MASTER_PLAN: 'Master Plan', AMENITIES: 'Amenities',
  LOCATION: 'Location', PRICING: 'Pricing', BROCHURE: 'Brochure',
  COMPARE_UNITS: 'Compare', CALCULATORS: 'Calculators', USP_SPOTLIGHT: 'Highlights',
}

export default function PresenterConsole(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [activeModule, setActiveModule] = useState<ModuleRecord | null>(null)
  const [clientActiveType, setClientActiveType] = useState<string>('OVERVIEW')

  useEffect(() => {
    if (!projectId) return
    window.api.invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => setProject(data as Project))
      .catch(console.error)

    window.api.invoke(IPC_CHANNELS.MODULE_LIST, projectId)
      .then((data) => {
        const visible = (data as ModuleRecord[]).filter((m) => m.isVisible)
        setModules(visible)
        if (visible.length > 0) {
          setActiveModule(visible[0])
        }
      })
      .catch(console.error)

    // Listen for client window sync navigation back
    const unsub = window.api.on('system:kioskNavigated', (moduleType: any) => {
      setClientActiveType(String(moduleType))
      const target = modules.find((m) => m.moduleType === moduleType)
      if (target) setActiveModule(target)
    })
    return () => unsub()
  }, [projectId, modules.length])

  const handlePushToClient = (mod: ModuleRecord) => {
    setActiveModule(mod)
    setClientActiveType(mod.moduleType)
    window.api.invoke(IPC_CHANNELS.SECOND_DISPLAY, {
      action: 'navigate',
      moduleId: mod.id,
      moduleType: mod.moduleType
    }).catch(console.error)
  }

  if (!project) return <div style={{ padding: 40, color: '#fff', background: '#121214', height: '100vh' }}>Loading Presenter Console...</div>

  return (
    <div style={{
      background: '#121214', color: '#e4e4e7', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)',
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px', background: '#18181b', borderBottom: '1px solid #27272a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--color-accent)' }}>💼 Sales Presenter Control Console</h1>
          <p style={{ fontSize: 12, color: '#a1a1aa', margin: '4px 0 0' }}>Dual-Screen mode active for: <strong>{project.name}</strong></p>
        </div>
        <div style={{ background: '#22c55e20', border: '1px solid #22c55e40', padding: '6px 12px', borderRadius: 20, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
          🟢 Synchronized with Client TV
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, minHeight: 0 }}>
        {/* Left: Navigation Controls */}
        <aside style={{ background: '#18181b', borderRight: '1px solid #27272a', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa' }}>Client Screen Controls</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {modules.map((mod) => {
              const isActive = clientActiveType === mod.moduleType
              return (
                <button
                  key={mod.id}
                  onClick={() => handlePushToClient(mod)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 8, textAlign: 'left',
                    cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', transition: 'all 0.15s',
                    border: `1.5px solid ${isActive ? 'var(--color-accent)' : '#27272a'}`,
                    background: isActive ? 'rgba(26,115,232,0.1)' : '#202024',
                    color: isActive ? '#fff' : '#c4c4c7',
                  }}
                >
                  <span>{MODULE_LABELS[mod.moduleType] || mod.moduleType}</span>
                  <span style={{ fontSize: 11, opacity: isActive ? 1 : 0.4 }}>
                    {isActive ? 'Showing 🟢' : 'Show ➔'}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right: Presenter Notes & Active Module Details */}
        <main style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeModule ? (
            <>
              <div style={{ background: '#1c1c20', borderRadius: 12, padding: 28, border: '1px solid #27272a' }}>
                <h2 style={{ fontSize: 18, margin: '0 0 12px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📝 Presenter Script & Strategic Notes
                </h2>
                <div style={{
                  fontSize: 15, lineHeight: 1.6, color: '#e4e4e7', background: '#121214',
                  padding: 20, borderRadius: 8, borderLeft: '4px solid var(--color-accent)',
                }}>
                  {PRESENTER_NOTES[activeModule.moduleType] || `Presenter Guidance: Walk the client through the details of the ${MODULE_LABELS[activeModule.moduleType] || activeModule.moduleType} module. Address spatial configuration, premium utility points, and RERA authenticity parameters.`}
                </div>
              </div>

              <div style={{ background: '#1c1c20', borderRadius: 12, padding: 24, border: '1px solid #27272a', flex: 1 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#fff' }}>Broker Live Pricing & Negotiation Desk</h3>
                <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>
                  This side of the screen is negotiation-secure and invisible to the client. Use the pricing calculator, view payment plans, or record buyer specifications directly.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div style={{ padding: 16, background: '#121214', borderRadius: 8, border: '1px solid #27272a' }}>
                    <div style={{ fontSize: 12, color: '#a1a1aa' }}>Unit Base Price Range</div>
                    <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: '#fff' }}>
                      ?{(project.priceRangeMin / 10000000).toFixed(1)} Cr � ?{(project.priceRangeMax / 10000000).toFixed(1)} Cr
                    </div>
                  </div>
                  <div style={{ padding: 16, background: '#121214', borderRadius: 8, border: '1px solid #27272a' }}>
                    <div style={{ fontSize: 12, color: '#a1a1aa' }}>Strategic Margin Allowance</div>
                    <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: '#e11d48' }}>
                      Up to 5% Launch Discount
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#a1a1aa' }}>
              Select a module from the left panel to display on the client TV and view presenter notes.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

