import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface MediaItem {
  id: string
  category: string
  originalName: string
  filePath: string
  thumbnailPath: string
  durationSecs?: number
}

export default function VideosModule({ projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [videos, setVideos] = useState<MediaItem[]>([])
  const [activeVideo, setActiveVideo] = useState<MediaItem | null>(null)

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.MEDIA_LIST, { projectId })
      .then((data) => {
        const items = (data as MediaItem[]).filter((m) =>
          ['VIDEO', 'INTRO_VIDEO'].includes(m.category.toUpperCase())
        )
        setVideos(items)
        if (items.length > 0) {
          setActiveVideo(items[0])
        }
      })
      .catch(console.error)
  }, [projectId])

  const formatDuration = (secs?: number) => {
    if (!secs) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="videos-module-card" data-testid="module-VIDEOS" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-4)'
    }}>
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Project Videos</h3>

      {videos.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No video walkthroughs available
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-4)', minHeight: '320px' }}>
          {/* Main Video Player */}
          {activeVideo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <video
                key={activeVideo.id}
                src={`media://${activeVideo.filePath}`}
                controls
                autoPlay={false}
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#000',
                  aspectRatio: '16/9'
                }}
              />
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>{activeVideo.originalName}</div>
            </div>
          )}

          {/* Playlist Sidebar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '360px',
            paddingRight: '4px'
          }}>
            {videos.map((vid) => {
              const isActive = activeVideo?.id === vid.id
              return (
                <button
                  key={vid.id}
                  onClick={() => setActiveVideo(vid)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'var(--project-accent)' : 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'background-color var(--transition-fast)'
                  }}
                >
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: '#fff', wordBreak: 'break-word' }}>
                    {vid.originalName}
                  </span>
                  <span style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
                    Category: {vid.category.toLowerCase()} {vid.durationSecs ? `· ${formatDuration(vid.durationSecs)}` : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}