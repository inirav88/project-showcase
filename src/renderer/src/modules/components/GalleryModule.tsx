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

export default function GalleryModule({ projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.MEDIA_LIST, { projectId })
      .then((data) => {
        const items = (data as MediaItem[]).filter((m) =>
          ['EXTERIOR', 'INTERIOR', 'LANDSCAPE', 'GALLERY'].includes(m.category.toUpperCase())
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

  return (
    <div className="gallery-module-card" data-testid="module-GALLERY" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Project Gallery</h3>
        {media.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: activeTab === cat ? 'var(--project-accent)' : 'var(--color-surface-raised)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}
              >
                {cat.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredMedia.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No gallery images available
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {filteredMedia.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                aspectRatio: '4/3',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                transition: 'transform var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img
                src={toMediaUrl(item.thumbnailPath || item.filePath)}
                alt={item.originalName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                insetInline: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                padding: '8px',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                fontWeight: 500
              }}>
                {item.category.toLowerCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filteredMedia[lightboxIndex] && (
        <div
          role="dialog"
          aria-label="Image Lightbox"
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000
          }}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>

          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '24px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ‹
          </button>

          <img
            src={toMediaUrl(filteredMedia[lightboxIndex].filePath)}
            alt={filteredMedia[lightboxIndex].originalName}
            style={{
              maxWidth: '85vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          />

          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '24px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ›
          </button>

          <div style={{
            position: 'absolute',
            bottom: '24px',
            color: '#fff',
            fontSize: 'var(--font-size-md)',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            <p style={{ fontWeight: 600 }}>{filteredMedia[lightboxIndex].originalName}</p>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
              {filteredMedia[lightboxIndex].category} · {lightboxIndex + 1} of {filteredMedia.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
