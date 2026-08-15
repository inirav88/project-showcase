import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { toMediaUrl } from '../../utils/media'

interface MediaItem {
  id: string
  category: string
  originalName: string
  filePath: string
  thumbnailPath: string
  durationSecs?: number
}

function formatDuration(secs?: number): string {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export default function VideosModule({ projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const [videos, setVideos] = useState<MediaItem[]>([])
  const [activeVideo, setActiveVideo] = useState<MediaItem | null>(null)

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.MEDIA_LIST, { projectId })
      .then((data) => {
        const items = (data as MediaItem[]).filter((m) =>
          ['VIDEO', 'INTRO_VIDEO', 'WALKTHROUGH'].includes(m.category.toUpperCase())
        )
        setVideos(items)
        if (items.length > 0) setActiveVideo(items[0])
      })
      .catch(console.error)
  }, [projectId])

  return (
    <div data-testid="module-VIDEOS" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {videos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🎥</span>
          <h3>No Videos Available</h3>
          <p>Add video walkthroughs or project films from the Admin Panel Media Library.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: videos.length > 1 ? '1fr 280px' : '1fr',
          gap: 'var(--space-5)',
          alignItems: 'start',
        }}>
          {/* Main Video Player */}
          {activeVideo && (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              <video
                key={activeVideo.id}
                src={toMediaUrl(activeVideo.filePath)}
                controls
                autoPlay={false}
                style={{
                  width: '100%',
                  backgroundColor: '#000',
                  aspectRatio: '16/9',
                  display: 'block',
                }}
              />
              <div style={{ padding: 'var(--space-5)' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
                  {activeVideo.originalName}
                </div>
                <div style={{ marginTop: 4, display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 'var(--radius-full)',
                    background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-border)',
                    fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-accent)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {activeVideo.category.toLowerCase()}
                  </span>
                  {activeVideo.durationSecs && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatDuration(activeVideo.durationSecs)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Playlist Sidebar */}
          {videos.length > 1 && (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-xs)', fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Up Next — {videos.length} Videos
              </div>
              <div style={{ overflowY: 'auto', maxHeight: 380 }}>
                {videos.map((vid, idx) => {
                  const isActive = activeVideo?.id === vid.id
                  return (
                    <button
                      key={vid.id}
                      onClick={() => setActiveVideo(vid)}
                      style={{
                        all: 'unset', cursor: 'pointer', display: 'flex',
                        gap: 'var(--space-3)', alignItems: 'center',
                        padding: 'var(--space-3) var(--space-4)',
                        width: '100%', boxSizing: 'border-box',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        background: isActive ? 'var(--color-accent-dim)' : 'transparent',
                        borderLeft: `3px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-raised)' }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Thumbnail */}
                      <div style={{
                        width: 60, height: 38, borderRadius: 6,
                        background: vid.thumbnailPath ? 'transparent' : '#111',
                        overflow: 'hidden', flexShrink: 0, position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {vid.thumbnailPath ? (
                          <img src={toMediaUrl(vid.thumbnailPath)} alt={vid.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 18, opacity: 0.4 }}>▶</span>
                        )}
                        {isActive && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-accent)', fontSize: 14,
                          }}>▶</div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 600, color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {idx + 1}. {vid.originalName}
                        </div>
                        {vid.durationSecs && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                            {formatDuration(vid.durationSecs)}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}