import { useEffect, useState, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKioskExit } from '../../hooks/useKioskExit'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface Project {
  id: string
  name: string
  developer: string
  reraNumber: string
  themeAccentColor: string
  themeFontPairing: string
}

export default function ProjectShowcase(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)

  const { startHold, endHold } = useKioskExit({
    onExit: () => setShowPinModal(true),
  })

  useEffect(() => {
    if (!projectId) return
    window.api
      .invoke(IPC_CHANNELS.PROJECT_GET, projectId)
      .then((data) => setProject(data as Project))
      .catch(console.error)
  }, [projectId])

  useEffect(() => {
    if (!project) return
    document.documentElement.style.setProperty('--project-accent', project.themeAccentColor)
    document.documentElement.style.setProperty('--project-font', project.themeFontPairing)
    return () => {
      document.documentElement.style.removeProperty('--project-accent')
      document.documentElement.style.removeProperty('--project-font')
    }
  }, [project])

  if (!project) return <div className="loading">Loading project…</div>

  return (
    <div className="showcase">
      {/* 5-second corner hold to open admin */}
      <div
        className="kiosk-exit-corner"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        style={{ position: 'fixed', top: 0, left: 0, width: 60, height: 60, zIndex: 9999 }}
      />

      <header className="showcase-header">
        <button className="back-btn" onClick={() => navigate('/kiosk')}>
          ← All Projects
        </button>
        <h1>{project.name}</h1>
        <span className="rera">RERA: {project.reraNumber}</span>
      </header>

      <main className="showcase-content">
        <Suspense fallback={<div className="loading">Loading modules…</div>}>
          {/* ModuleRenderer wired in P3 */}
          <p style={{ color: 'var(--color-text-muted)' }}>
            Modules will render here — Module Registry Engine (P3)
          </p>
        </Suspense>
      </main>

      {showPinModal && (
        <div role="dialog" aria-label="Enter Admin PIN" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ background: 'var(--color-surface)', padding: 32, borderRadius: 16 }}>
            <p style={{ marginBottom: 16 }}>Enter PIN to access Admin Panel</p>
            <input type="password" id="pin-input" placeholder="PIN" style={{ padding: 8, width: '100%', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowPinModal(false); navigate('/admin') }}>Confirm</button>
              <button onClick={() => setShowPinModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
