import React, { useRef } from 'react'
import { toMediaUrl } from '../utils/media'

interface Props {
  mediaFilePath: string
  onComplete: () => void
}

/**
 * Fullscreen cinematic intro video overlay shown when entering a project showcase.
 * Skip button is shown immediately. Auto-dismisses on video end.
 */
export function IntroVideoOverlay({ mediaFilePath, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        src={toMediaUrl(mediaFilePath)}
        autoPlay
        playsInline
        onEnded={onComplete}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <button
        onClick={onComplete}
        style={{
          position: 'absolute', bottom: 48, right: 48,
          padding: '12px 28px', background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.4)', borderRadius: 40,
          color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          backdropFilter: 'blur(8px)', letterSpacing: '0.03em',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
      >
        Skip Intro ?
      </button>
    </div>
  )
}
