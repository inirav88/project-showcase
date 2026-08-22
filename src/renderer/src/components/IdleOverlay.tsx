import React, { useEffect, useState } from 'react'
import { toMediaUrl } from '../utils/media'

interface Props {
  heroImages: string[]   // media file paths for ambient slideshow
  onDismiss: () => void
}

/**
 * Full-screen idle/exhibition overlay. Shows a crossfade slideshow of project
 * hero images. Any tap/click dismisses it.
 */
export function IdleOverlay({ heroImages, onDismiss }: Props) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (heroImages.length <= 1) return
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 8888, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Slideshow */}
      {heroImages.length > 0 ? (
        <img
          key={idx}
          src={toMediaUrl(heroImages[idx])}
          alt="Ambient showcase"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', animation: 'fadeIn 1.2s ease',
          }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--color-bg)' }} />
      )}

      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.65))',
      }} />

      {/* Text */}
      <div style={{
        position: 'relative', textAlign: 'center', color: '#fff', padding: '0 24px',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.9 }}>???</div>
        <h2 style={{
          fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.03em',
          marginBottom: 16, textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>
          Tap anywhere to continue
        </h2>
        <p style={{ fontSize: 16, opacity: 0.7 }}>Showcase is ready when you are</p>
      </div>
    </div>
  )
}
