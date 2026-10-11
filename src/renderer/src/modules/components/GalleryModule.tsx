import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { toMediaUrl } from '../../utils/media'
import { useSwipeGesture } from '../../hooks/useSwipeGesture'
import { TouchGestureIcon } from '../../components/common/Icons'

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
  const [lightboxLoaded, setLightboxLoaded] = useState<boolean>(false)

  const categories = ['ALL', ...Array.from(new Set(media.map((m) => m.category.toUpperCase())))]

  const filteredMedia = activeTab === 'ALL'
    ? media
    : media.filter((m) => m.category.toUpperCase() === activeTab)

  // Reset loaded state on slide change
  useEffect(() => {
    setLightboxLoaded(false)
  }, [lightboxIndex])

  // Background idle warmup for top gallery images
  useEffect(() => {
    if (!media.length) return
    const preload = () => {
      media.slice(0, 10).forEach((item) => {
        if (item.filePath) {
          const img = new Image()
          img.src = toMediaUrl(item.filePath)
        }
      })
    }
    const timer = setTimeout(preload, 150)
    return () => clearTimeout(timer)
  }, [media])

  // Preload adjacent next/prev images when lightbox is open for 0ms transitions
  useEffect(() => {
    if (lightboxIndex === null || !filteredMedia.length) return
    const indicesToPreload = [
      (lightboxIndex + 1) % filteredMedia.length,
      (lightboxIndex - 1 + filteredMedia.length) % filteredMedia.length,
      (lightboxIndex + 2) % filteredMedia.length,
    ]
    indicesToPreload.forEach((idx) => {
      const item = filteredMedia[idx]
      if (item?.filePath) {
        const img = new Image()
        img.src = toMediaUrl(item.filePath)
      }
    })
  }, [lightboxIndex, filteredMedia])

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

  // Touch swipe navigation
  const { onTouchStart, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: () => {
      if (lightboxIndex !== null) {
        setLightboxIndex(lightboxIndex === filteredMedia.length - 1 ? 0 : lightboxIndex + 1)
      }
    },
    onSwipeRight: () => {
      if (lightboxIndex !== null) {
        setLightboxIndex(lightboxIndex === 0 ? filteredMedia.length - 1 : lightboxIndex - 1)
      }
    },
    onSwipeDown: () => setLightboxIndex(null),
    minDistance: 50,
  })

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
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-accent)', boxShadow: 'var(--shadow-md)',
          }}>
            <TouchGestureIcon size={32} />
          </div>
          <h3>No Images Yet</h3>
          <p>Add images to this project's gallery from the Admin Panel.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredMedia.map((item, idx) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={`View image: ${item.originalName || item.category}`}
              className="gallery-item"
              onClick={() => setLightboxIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setLightboxIndex(idx)
                }
              }}
              style={{
                gridColumn: idx === 0 ? 'span 2' : 'span 1',
                gridRow: idx === 0 ? 'span 2' : 'span 1',
                animation: `tileEntrance 0.4s ${0.04 * Math.min(idx, 10)}s var(--ease-out) both`,
              }}
            >
              <img
                src={toMediaUrl(item.thumbnailPath || item.filePath)}
                alt={item.originalName}
                loading={idx < 8 ? 'eager' : 'lazy'}
                decoding="async"
              />
              {/* Overlay */}
              <div className="gallery-item-overlay">
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.95)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.category}
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  Tap to view full resolution
                </span>
              </div>
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
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'fixed', inset: 0,
            background: 'var(--backdrop-modal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 'var(--z-supreme)' as any,
            animation: 'fadeIn 0.2s ease',
            touchAction: 'manipulation',
          }}
        >
          {/* Close - 60x60px touch target */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Close image viewer"
            style={{
              position: 'absolute', top: 24, right: 24,
              all: 'unset', cursor: 'pointer',
              width: 60, height: 60, minWidth: 60, minHeight: 60, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-primary)', fontSize: 24, transition: 'all var(--transition-fast)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            {String.fromCharCode(10005)}
          </button>

          {/* Prev - 64x64px touch target */}
          <button
            onClick={handlePrev}
            aria-label="Previous image"
            style={{
              position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
              all: 'unset', cursor: 'pointer',
              width: 64, height: 64, minWidth: 64, minHeight: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-primary)', fontSize: 32, transition: 'all var(--transition-fast)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            {String.fromCharCode(8249)}
          </button>

          {/* Image Container with instant blur-up placeholder */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '88vw',
              maxHeight: '86vh',
            }}
          >
            {/* Fast blurred low-res thumbnail backdrop */}
            {(filteredMedia[lightboxIndex].thumbnailPath || filteredMedia[lightboxIndex].filePath) && (
              <img
                src={toMediaUrl(filteredMedia[lightboxIndex].thumbnailPath || filteredMedia[lightboxIndex].filePath)}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'blur(16px)',
                  transform: 'scale(0.98)',
                  opacity: lightboxLoaded ? 0 : 0.75,
                  transition: 'opacity 0.25s ease-out',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* High-res Display Image */}
            <img
              key={lightboxIndex}
              src={toMediaUrl(filteredMedia[lightboxIndex].filePath)}
              alt={filteredMedia[lightboxIndex].originalName}
              decoding="async"
              onLoad={() => setLightboxLoaded(true)}
              style={{
                maxWidth: '88vw',
                maxHeight: '86vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                animation: 'scaleIn 0.25s var(--ease-out)',
                userSelect: 'none',
                pointerEvents: 'auto',
                opacity: lightboxLoaded ? 1 : 0.85,
                transition: 'opacity 0.2s ease-in',
              }}
            />
          </div>

          {/* Next - 64x64px touch target */}
          <button
            onClick={handleNext}
            aria-label="Next image"
            style={{
              position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
              all: 'unset', cursor: 'pointer',
              width: 64, height: 64, minWidth: 64, minHeight: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-primary)', fontSize: 32, transition: 'all var(--transition-fast)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            {String.fromCharCode(8250)}
          </button>

          {/* Caption & Gesture Hint */}
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            background: 'var(--backdrop-modal)', padding: '10px 24px', borderRadius: 24,
            backdropFilter: 'blur(12px)', border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>
              {filteredMedia[lightboxIndex].category} {String.fromCharCode(8226)} {lightboxIndex + 1} of {filteredMedia.length}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TouchGestureIcon size={14} color="var(--color-accent)" />
              <span>Swipe or tap arrows to navigate</span>
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

