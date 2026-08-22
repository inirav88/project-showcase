import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { toMediaUrl } from '../../utils/media'

interface MediaItem {
  id: string
  category: string
  originalName: string
  filePath: string
  thumbnailPath: string
  sortOrder: number
}

const CAT_LABELS: Record<string, string> = {
  ALL: 'All', GALLERY: 'Gallery', EXTERIOR: 'Exterior',
  INTERIOR: 'Interior', LANDSCAPE: 'Landscape', FLOOR_PLAN: 'Floor Plans',
}

export default function GalleryModule({ projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.MEDIA_LIST, { projectId })
      .then((data) => {
        const items = (data as MediaItem[]).filter((m) =>
          ['EXTERIOR', 'INTERIOR', 'LANDSCAPE', 'GALLERY', 'FLOOR_PLAN'].includes(m.category.toUpperCase())
        )
        setMedia(items)
      })
      .catch(console.error)
  }, [projectId])

  const categories = ['ALL', ...Array.from(new Set(media.map((m) => m.category.toUpperCase())))]

  const filteredMedia = activeTab === 'ALL'
    ? media
    : media.filter((m) => m.category.toUpperCase() === activeTab)

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex === 0 ? filteredMedia.length - 1 : lightboxIndex - 1)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex === filteredMedia.length - 1 ? 0 : lightboxIndex + 1)
  }

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? 0 : i === filteredMedia.length - 1 ? 0 : i + 1))
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? 0 : i === 0 ? filteredMedia.length - 1 : i - 1))
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, filteredMedia.length])

  return (
    <div data-testid="module-GALLERY" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Header row with category filter chips */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>Project Gallery</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
            {filteredMedia.length} image{filteredMedia.length !== 1 ? 's' : ''}
          </p>
        </div>
        {media.length > 0 && (
          <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                style={{
                  all: 'unset', cursor: 'pointer', padding: '7px 14px',
                  borderRadius: 8,
                  background: activeTab === cat ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === cat ? 'var(--color-bg)' : 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)', fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {CAT_LABELS[cat] ?? cat.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {filteredMedia.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🖼️</span>
          <h3>No Images Yet</h3>
          <p>Add images to this project's gallery from the Admin Panel.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gridAutoRows: '180px',
          gap: 'var(--space-3)',
        }}>
          {filteredMedia.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-raised)',
                // Larger items for variety
                gridColumn: idx === 0 ? 'span 2' : 'span 1',
                gridRow: idx === 0 ? 'span 2' : 'span 1',
                animation: `tileEntrance 0.4s ${0.05 * Math.min(idx, 10)}s var(--ease-out) both`,
              }}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector('img')
                if (img) img.style.transform = 'scale(1.07)'
                e.currentTarget.style.borderColor = 'var(--color-accent-border)'
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('img')
                if (img) img.style.transform = 'scale(1)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <img
                src={toMediaUrl(item.thumbnailPath || item.filePath)}
                alt={item.originalName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms var(--ease-out)' }}
              />
              {/* Overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                padding: 'var(--space-3)',
                opacity: 0,
                transition: 'opacity var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.9)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.category}
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                  Click to expand
                </span>
              </div>

              {/* Always-visible hover overlay using CSS sibling trick */}
              <style>{`
                [data-gallery-item]:hover > [data-overlay] { opacity: 1 !important; }
              `}</style>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && filteredMedia[lightboxIndex] && (
        <div
          role="dialog"
          aria-label="Image viewer"
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'var(--backdrop-modal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 'var(--z-supreme)' as any,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute', top: 24, right: 24,
              all: 'unset', cursor: 'pointer',
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-primary)', fontSize: 22, transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            ×
          </button>

          {/* Prev */}
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
              all: 'unset', cursor: 'pointer',
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-primary)', fontSize: 28, transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            ‹
          </button>

          {/* Image */}
          <img
            key={lightboxIndex}
            src={toMediaUrl(filteredMedia[lightboxIndex].filePath)}
            alt={filteredMedia[lightboxIndex].originalName}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '88vw', maxHeight: '86vh', objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              animation: 'scaleIn 0.25s var(--ease-out)',
            }}
          />

          {/* Next */}
          <button
            onClick={handleNext}
            style={{
              position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
              all: 'unset', cursor: 'pointer',
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-primary)', fontSize: 28, transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            ›
          </button>

          {/* Caption */}
          <div style={{
            position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {filteredMedia[lightboxIndex].originalName}
            </p>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {filteredMedia[lightboxIndex].category} · {lightboxIndex + 1} of {filteredMedia.length}
            </span>
            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {filteredMedia.slice(Math.max(0, lightboxIndex - 4), lightboxIndex + 5).map((_, j) => {
                const absIdx = Math.max(0, lightboxIndex - 4) + j
                return (
                  <button
                    key={absIdx}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(absIdx) }}
                    style={{
                      all: 'unset', cursor: 'pointer',
                      width: absIdx === lightboxIndex ? 20 : 6,
                      height: 6, borderRadius: 3,
                      background: absIdx === lightboxIndex ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)',
                      transition: 'all var(--transition-fast)',
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

