import React, { useState } from 'react'
import { toMediaUrl } from '../../utils/media'

interface BrochureProps {
  config: Record<string, any>
  projectId: string
}

export default function BrochureModule({ config }: BrochureProps): JSX.Element {
  const filePath = config.brochurePath || config.filePath || config.url || ''
  const buttonLabel = config.buttonLabel || 'Download Project Brochure'
  const fileUrl = filePath ? toMediaUrl(filePath) : ''
  const [fullscreen, setFullscreen] = useState(false)

  if (!filePath) {
    return (
      <div
        data-testid="module-BROCHURE"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          backgroundColor: 'var(--color-surface-raised)',
          borderRadius: 16,
          border: '1px solid var(--color-border)',
          textAlign: 'center',
          margin: '24px 0',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Project Brochure
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 420 }}>
          No PDF brochure has been uploaded for this project yet. You can upload one in Admin &gt; Modules &gt; Brochure.
        </p>
      </div>
    )
  }

  return (
    <div
      data-testid="module-BROCHURE"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: 24,
        backgroundColor: 'var(--color-surface)',
        borderRadius: 16,
        border: '1px solid var(--color-border)',
        margin: '24px 0',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Official E-Brochure
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Project Brochure & Presentation
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <span>{fullscreen ? '📉 Exit Fullscreen' : '⛶ Fullscreen View'}</span>
          </button>

          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span>📥 {buttonLabel}</span>
          </a>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div
        style={{
          width: '100%',
          height: fullscreen ? '90vh' : '650px',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#1e293b',
          border: '1px solid var(--color-border)',
          position: fullscreen ? 'fixed' : 'relative',
          inset: fullscreen ? 0 : undefined,
          zIndex: fullscreen ? 99999 : 1,
          padding: fullscreen ? 24 : 0,
          boxSizing: 'border-box',
        }}
      >
        {fullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            style={{
              position: 'absolute',
              top: 36,
              right: 36,
              zIndex: 100000,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕ Close Fullscreen
          </button>
        )}
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=0`}
          title="Project Brochure PDF Viewer"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    </div>
  )
}