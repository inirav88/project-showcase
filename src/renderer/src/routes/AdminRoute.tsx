import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPC_CHANNELS } from '../../../main/ipc/channels'
import { toMediaUrl } from '../utils/media'
import { ThemeToggle } from '../components/ThemeToggle'
import { StaffTab, AppointmentsTab, AnalyticsTab, BackupSyncTab } from '../components/admin/AdminTabs'

// ─── Smart Module Config Editor ───────────────────────────────────────────────

function parseConfig(raw: string): Record<string, any> {
  try { return JSON.parse(raw || '{}') } catch { return {} }
}

// ─── Native File Picker ───────────────────────────────────────────────────────

const browseBtn: React.CSSProperties = {
  padding: '8px 14px', backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer',
  fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
  display: 'flex', alignItems: 'center', gap: '4px'
}

type FileFilter = { name: string; extensions: string[] }

function FilePicker({
  value, onChange, placeholder, accept, label, projectId, mediaCategory
}: {
  value: string
  onChange: (path: string) => void
  placeholder?: string
  accept?: 'image' | 'video' | 'audio' | 'pdf' | 'any'
  label?: string
  projectId?: string
  mediaCategory?: string
}) {
  const [uploading, setUploading] = React.useState(false)
  const [progressText, setProgressText] = React.useState('')
  const [showSuccess, setShowSuccess] = React.useState(false)

  const filterMap: Record<string, FileFilter[]> = {
    image: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'] }],
    video: [{ name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }],
    audio: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'ogg', 'm4a'] }],
    pdf:   [{ name: 'PDF Documents', extensions: ['pdf'] }],
    any:   [{ name: 'All Files', extensions: ['*'] }],
  }
  const iconMap: Record<string, string> = { image: '🖼️', video: '🎥', audio: '🎵', pdf: '📄', any: '📁' }

  const browse = async () => {
    if (!projectId) {
      alert('Please select a project context at the top of the admin panel first!')
      return
    }
    const path = await (window as any).api.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, {
      title: label ? `Select ${label}` : 'Select File',
      filters: filterMap[accept ?? 'any']
    }) as string | null

    if (path) {
      setUploading(true)
      setProgressText('Copying file to project storage...')
      try {
        let category = mediaCategory || 'GALLERY'
        if (accept === 'video') category = mediaCategory || 'VIDEO'
        if (accept === 'audio') category = mediaCategory || 'AUDIO'
        if (accept === 'pdf') category = mediaCategory || 'DOCUMENT'

        // 1. Trigger the background upload/optimization handler
        setProgressText('Optimizing and registering media element...')
        const mediaRecord = await (window as any).api.invoke(IPC_CHANNELS.MEDIA_UPLOAD, {
          projectId,
          category,
          filePath: path
        }) as any

        // 2. Set the resulting appData/media path
        onChange(mediaRecord.filePath)
        
        // 3. Show a brief success pulse
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } catch (err: any) {
        alert(`Failed to import media element: ${err.message}`)
      } finally {
        setUploading(false)
        setProgressText('')
      }
    }
  }

  const isImage = value && (
    value.toLowerCase().endsWith('.png') ||
    value.toLowerCase().endsWith('.jpg') ||
    value.toLowerCase().endsWith('.jpeg') ||
    value.toLowerCase().endsWith('.webp') ||
    value.toLowerCase().endsWith('.svg') ||
    value.toLowerCase().includes('_thumb')
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        {/* Render a nice thumbnail preview for images if available */}
        {isImage && (
          <div style={{
            width: '38px', height: '38px', borderRadius: '6px', overflow: 'hidden',
            border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', flexShrink: 0,
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img
              src={toMediaUrl(value)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
            />
            <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', fontSize: '10px' }}>✅</span>
          </div>
        )}

        <input
          style={{
            flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: '6px',
            border: uploading ? '1px solid var(--color-accent)' : showSuccess ? '1px solid var(--color-success)' : '1px solid #334155',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text-primary)', fontSize: '13px', boxSizing: 'border-box' as const
          }}
          disabled={uploading}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'Select a file or type a path…'}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={browse}
          title="Browse for file"
          style={{
            ...browseBtn,
            opacity: uploading ? 0.5 : 1,
            backgroundColor: showSuccess ? 'var(--color-success)' : '#334155',
            color: 'var(--color-text-primary)'
          }}
        >
          {uploading ? '⏳ Processing' : showSuccess ? '✅ Done' : `${iconMap[accept ?? 'any']} Browse`}
        </button>
      </div>

      {/* Progress feedback bar */}
      {uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-accent)' }}>
            <span>⚡ {progressText}</span>
            <span style={{ animation: 'pulse 1.5s infinite' }}>Importing...</span>
          </div>
          {/* Animated loading bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: '40%', height: '100%',
              backgroundColor: 'var(--color-accent)',
              borderRadius: '2px',
              animation: 'loadingProgress 1.5s infinite ease-in-out'
            }} />
          </div>
        </div>
      )}

      {/* Inject custom keyframe styles if not present */}
      <style>{`
        @keyframes loadingProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: '6px',
  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-primary)', fontSize: '13px', boxSizing: 'border-box'
}
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '5px', fontSize: '11px',
  fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
}
const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)',
  borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px'
}
const removeBtn: React.CSSProperties = {
  padding: '4px 10px', fontSize: '11px', backgroundColor: 'var(--color-error)', color: 'var(--color-text-primary)',
  border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-end', fontWeight: 600
}
const addBtn: React.CSSProperties = {
  padding: '8px 14px', fontSize: '12px', backgroundColor: 'var(--color-accent)', color: 'var(--color-text-primary)',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start'
}

function ModuleConfigEditor({
  moduleType, configJson, onChange, projectId
}: { moduleType: string; configJson: string; onChange: (newJson: string) => void; projectId: string }) {
  const [cfg, setCfg] = useState<Record<string, any>>(() => parseConfig(configJson))

  useEffect(() => {
    onChange(JSON.stringify(cfg))
  }, [cfg])

  const set = (key: string, value: any) => setCfg(prev => ({ ...prev, [key]: value }))
  const setArr = (key: string, arr: any[]) => setCfg(prev => ({ ...prev, [key]: arr }))

  // ── OVERVIEW ─────────────────────────────────────────────────────────────
  if (moduleType === 'OVERVIEW') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Hero Headline</label>
          <input style={inputStyle} value={cfg.heroHeadline || ''} onChange={e => set('heroHeadline', e.target.value)} placeholder="e.g. Luxury 4 BHK Residences in Gandhinagar" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subheadline / Tagline</label>
          <input style={inputStyle} value={cfg.subHeadline || ''} onChange={e => set('subHeadline', e.target.value)} placeholder="e.g. Life elevated, naturally." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Key Stats (comma-separated, e.g. 2BHK-4BHK, 1200-3800 sqft)</label>
          <input style={inputStyle} value={(cfg.stats || []).join(', ')} onChange={e => set('stats', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="2BHK-4BHK, 1200-3800 sqft, RERA Approved" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Hero Background Image (optional)</label>
          <FilePicker projectId={projectId} value={cfg.heroImage || ''} onChange={v => set('heroImage', v)} accept="image" label="Hero Background Image" placeholder="Select a hero background image..." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Call-to-action Button Label</label>
          <input style={inputStyle} value={cfg.ctaLabel || ''} onChange={e => set('ctaLabel', e.target.value)} placeholder="Explore Units" />
        </div>
      </div>
    )
  }

  // ── GALLERY ──────────────────────────────────────────────────────────────
  if (moduleType === 'GALLERY') {
    const images: { path: string; caption: string; category: string }[] = cfg.images || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>Click <strong>🖼️ Browse</strong> to pick images from your computer for each gallery entry.</p>
        {images.map((img, i) => (
          <div key={i} style={cardStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Image File</label>
              <FilePicker projectId={projectId} value={img.path} onChange={v => { const a = [...images]; a[i] = { ...a[i], path: v }; setArr('images', a) }} accept="image" label="Gallery Image" placeholder="Select an image file..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Caption</label>
                <input style={inputStyle} value={img.caption} onChange={e => { const a = [...images]; a[i] = { ...a[i], caption: e.target.value }; setArr('images', a) }} placeholder="Grand Lobby" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={img.category} onChange={e => { const a = [...images]; a[i] = { ...a[i], category: e.target.value }; setArr('images', a) }}>
                  <option value="GALLERY">General Gallery</option>
                  <option value="EXTERIOR">Exterior</option>
                  <option value="INTERIOR">Interior</option>
                  <option value="LANDSCAPE">Landscape</option>
                  <option value="FLOOR_PLAN">Floor Plan</option>
                </select>
              </div>
            </div>
            <button style={removeBtn} onClick={() => setArr('images', images.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('images', [...images, { path: '', caption: '', category: 'GALLERY' }])}>+ Add Image</button>
      </div>
    )
  }

  // ── AMENITIES ────────────────────────────────────────────────────────────
  if (moduleType === 'AMENITIES') {
    const items: { name: string; icon: string; description: string; imagePath?: string }[] = cfg.amenities || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Amenity Name</label>
                <input style={inputStyle} value={item.name} onChange={e => { const a = [...items]; a[i] = { ...a[i], name: e.target.value }; setArr('amenities', a) }} placeholder="Infinity Pool" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Icon</label>
                <input style={inputStyle} value={item.icon} onChange={e => { const a = [...items]; a[i] = { ...a[i], icon: e.target.value }; setArr('amenities', a) }} placeholder="🏊" />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={item.description} onChange={e => { const a = [...items]; a[i] = { ...a[i], description: e.target.value }; setArr('amenities', a) }} placeholder="Olympic-size pool on the rooftop" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Amenity Image (optional)</label>
              <FilePicker projectId={projectId} value={item.imagePath || ''} onChange={v => { const a = [...items]; a[i] = { ...a[i], imagePath: v }; setArr('amenities', a) }} accept="image" label="Amenity Image" placeholder="Select an image for this amenity..." mediaCategory="AMENITIES" />
            </div>
            <button style={removeBtn} onClick={() => setArr('amenities', items.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('amenities', [...items, { name: '', icon: '🏠', description: '', imagePath: '' }])}>+ Add Amenity</button>
      </div>
    )
  }

  // ── VIDEOS ───────────────────────────────────────────────────────────────
  if (moduleType === 'VIDEOS') {
    const videos: { path: string; title: string; thumbnailPath: string }[] = cfg.videos || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>Click <strong>🎥 Browse</strong> to select .mp4 video files from your computer.</p>
        {videos.map((v, i) => (
          <div key={i} style={cardStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Video File (.mp4 / .mov)</label>
              <FilePicker projectId={projectId} value={v.path} onChange={p => { const a = [...videos]; a[i] = { ...a[i], path: p }; setArr('videos', a) }} accept="video" label="Walkthrough Video" placeholder="Select a video file..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} value={v.title} onChange={e => { const a = [...videos]; a[i] = { ...a[i], title: e.target.value }; setArr('videos', a) }} placeholder="Grand Lobby Walkthrough" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Thumbnail Image (optional)</label>
                <FilePicker projectId={projectId} value={v.thumbnailPath || ''} onChange={p => { const a = [...videos]; a[i] = { ...a[i], thumbnailPath: p }; setArr('videos', a) }} accept="image" label="Video Thumbnail" placeholder="Select thumbnail image..." />
              </div>
            </div>
            <button style={removeBtn} onClick={() => setArr('videos', videos.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('videos', [...videos, { path: '', title: '', thumbnailPath: '' }])}>+ Add Video</button>
      </div>
    )
  }

  // ── USP_SPOTLIGHT ────────────────────────────────────────────────────────
  if (moduleType === 'USP_SPOTLIGHT') {
    const cards: { title: string; description: string; imagePath: string; badge: string }[] = cfg.highlights || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {cards.map((c, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Highlight Title</label>
                <input style={inputStyle} value={c.title} onChange={e => { const a = [...cards]; a[i] = { ...a[i], title: e.target.value }; setArr('highlights', a) }} placeholder="Sky-High Views" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Badge Label (optional)</label>
                <input style={inputStyle} value={c.badge || ''} onChange={e => { const a = [...cards]; a[i] = { ...a[i], badge: e.target.value }; setArr('highlights', a) }} placeholder="Signature" />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={c.description} onChange={e => { const a = [...cards]; a[i] = { ...a[i], description: e.target.value }; setArr('highlights', a) }} placeholder="Panoramic 270° views across the city skyline" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Highlight Image (optional)</label>
              <FilePicker projectId={projectId} value={c.imagePath || ''} onChange={v => { const a = [...cards]; a[i] = { ...a[i], imagePath: v }; setArr('highlights', a) }} accept="image" label="Highlight Image" placeholder="Select a highlight image..." />
            </div>
            <button style={removeBtn} onClick={() => setArr('highlights', cards.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('highlights', [...cards, { title: '', description: '', imagePath: '', badge: '' }])}>+ Add Highlight Card</button>
      </div>
    )
  }

  // ── LOCATION ─────────────────────────────────────────────────────────────
  if (moduleType === 'LOCATION') {
    const pois: { name: string; distance: string; category: string }[] = cfg.nearbyPOIs || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Map Embed URL (optional)</label>
          <input style={inputStyle} value={cfg.mapEmbedUrl || ''} onChange={e => set('mapEmbedUrl', e.target.value)} placeholder="https://maps.google.com/..." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Address Description</label>
          <input style={inputStyle} value={cfg.addressLine || ''} onChange={e => set('addressLine', e.target.value)} placeholder="Near Infocity, Gandhinagar, Gujarat – 382009" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Location Aerial / Map Image (optional)</label>
          <FilePicker projectId={projectId} value={cfg.mapImagePath || ''} onChange={v => set('mapImagePath', v)} accept="image" label="Location Map Image" placeholder="Select a location map or aerial image..." mediaCategory="LOCATION" />
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>Nearby Connectivity Points</p>
        {pois.map((p, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Place Name</label>
                <input style={inputStyle} value={p.name} onChange={e => { const a = [...pois]; a[i] = { ...a[i], name: e.target.value }; setArr('nearbyPOIs', a) }} placeholder="Ahmedabad Airport" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Distance</label>
                <input style={inputStyle} value={p.distance} onChange={e => { const a = [...pois]; a[i] = { ...a[i], distance: e.target.value }; setArr('nearbyPOIs', a) }} placeholder="12 km" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={p.category} onChange={e => { const a = [...pois]; a[i] = { ...a[i], category: e.target.value }; setArr('nearbyPOIs', a) }}>
                  {['Transport','Education','Healthcare','Shopping','Worship','Recreation','Business'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button style={removeBtn} onClick={() => setArr('nearbyPOIs', pois.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('nearbyPOIs', [...pois, { name: '', distance: '', category: 'Transport' }])}>+ Add Nearby Location</button>
      </div>
    )
  }

  // ── CALCULATORS ──────────────────────────────────────────────────────────
  if (moduleType === 'CALCULATORS') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Default Loan Amount (INR)</label>
            <input type="number" style={inputStyle} value={cfg.defaultLoanAmount || 5000000} onChange={e => set('defaultLoanAmount', Number(e.target.value))} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Default Tenure (Years)</label>
            <input type="number" style={inputStyle} value={cfg.defaultTenure || 20} onChange={e => set('defaultTenure', Number(e.target.value))} min={1} max={30} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Default Interest Rate (%)</label>
            <input type="number" style={inputStyle} value={cfg.defaultRate || 8.5} onChange={e => set('defaultRate', Number(e.target.value))} step={0.1} min={1} max={20} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Max Loan Amount Slider (INR)</label>
            <input type="number" style={inputStyle} value={cfg.maxLoanAmount || 50000000} onChange={e => set('maxLoanAmount', Number(e.target.value))} />
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Bank Partner Names (comma-separated)</label>
          <input style={inputStyle} value={(cfg.bankPartners || []).join(', ')} onChange={e => set('bankPartners', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="SBI, HDFC, ICICI, Axis" />
        </div>
      </div>
    )
  }

  // ── PRICING ──────────────────────────────────────────────────────────────
  if (moduleType === 'PRICING') {
    const configs: { configuration: string; priceFrom: number; priceTo: number; note: string }[] = cfg.pricingTiers || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Pricing Section Headline</label>
          <input style={inputStyle} value={cfg.headline || ''} onChange={e => set('headline', e.target.value)} placeholder="Transparent Pricing, No Hidden Charges" />
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>Price Summary Cards (shown above the unit table)</p>
        {configs.map((tier, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Config</label>
                <input style={inputStyle} value={tier.configuration} onChange={e => { const a = [...configs]; a[i] = { ...a[i], configuration: e.target.value }; setArr('pricingTiers', a) }} placeholder="3BHK" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Price From (INR)</label>
                <input type="number" style={inputStyle} value={tier.priceFrom} onChange={e => { const a = [...configs]; a[i] = { ...a[i], priceFrom: Number(e.target.value) }; setArr('pricingTiers', a) }} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Price To (INR)</label>
                <input type="number" style={inputStyle} value={tier.priceTo} onChange={e => { const a = [...configs]; a[i] = { ...a[i], priceTo: Number(e.target.value) }; setArr('pricingTiers', a) }} />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Note</label>
              <input style={inputStyle} value={tier.note || ''} onChange={e => { const a = [...configs]; a[i] = { ...a[i], note: e.target.value }; setArr('pricingTiers', a) }} placeholder="All-inclusive. BSP + PLC" />
            </div>
            <button style={removeBtn} onClick={() => setArr('pricingTiers', configs.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('pricingTiers', [...configs, { configuration: '', priceFrom: 0, priceTo: 0, note: '' }])}>+ Add Pricing Tier</button>
      </div>
    )
  }

  // ── MASTER_PLAN ──────────────────────────────────────────────────────────
  if (moduleType === 'MASTER_PLAN' || moduleType === 'MASTERPLAN') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Master Plan Image</label>
          <FilePicker projectId={projectId} value={cfg.imagePath || ''} onChange={v => set('imagePath', v)} accept="image" label="Master Plan Image" placeholder="Select the master plan image..." mediaCategory="MASTER_PLAN" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Description / Legend Text</label>
          <input style={inputStyle} value={cfg.description || ''} onChange={e => set('description', e.target.value)} placeholder="Spread across 10 acres with dedicated green zones" />
        </div>
      </div>
    )
  }

  // ── BROCHURE ─────────────────────────────────────────────────────────────
  if (moduleType === 'BROCHURE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>PDF Brochure File</label>
          <FilePicker projectId={projectId} value={cfg.brochurePath || ''} onChange={v => set('brochurePath', v)} accept="pdf" label="Project Brochure PDF" placeholder="Select a PDF brochure file..." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Download Button Label</label>
          <input style={inputStyle} value={cfg.buttonLabel || ''} onChange={e => set('buttonLabel', e.target.value)} placeholder="Download Project Brochure" />
        </div>
      </div>
    )
  }
  if (moduleType === 'CONSTRUCTION_TIMELINE') {
    const items: { title: string; status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'; date: string; progress: number; description: string }[] = cfg.milestones || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Milestone Title</label>
                <input style={inputStyle} value={item.title} onChange={e => { const a = [...items]; a[i] = { ...a[i], title: e.target.value }; setArr('milestones', a) }} placeholder='e.g. Pile Foundation' />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={item.status} onChange={e => { const a = [...items]; a[i] = { ...a[i], status: e.target.value as any }; setArr('milestones', a) }}>
                  <option value='COMPLETED'>Completed</option>
                  <option value='IN_PROGRESS'>In Progress</option>
                  <option value='PENDING'>Scheduled</option>
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Date Tag</label>
                <input style={inputStyle} value={item.date} onChange={e => { const a = [...items]; a[i] = { ...a[i], date: e.target.value }; setArr('milestones', a) }} placeholder='e.g. Jan 2026' />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Progress % ({item.progress || 0}%)</label>
                <input type='range' min='0' max='100' style={{ width: '100%', height: '36px' }} value={item.progress || 0} onChange={e => { const a = [...items]; a[i] = { ...a[i], progress: Number(e.target.value) }; setArr('milestones', a) }} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Description</label>
                <input style={inputStyle} value={item.description} onChange={e => { const a = [...items]; a[i] = { ...a[i], description: e.target.value }; setArr('milestones', a) }} placeholder='Brief overview of structural milestones met' />
              </div>
            </div>
            <button style={removeBtn} onClick={() => setArr('milestones', items.filter((_, j) => j !== i))}>Remove Milestone</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('milestones', [...items, { title: '', status: 'PENDING', date: '', progress: 0, description: '' }])}>+ Add Milestone</button>
      </div>
    )
  }
  // TOUR_360
  if (moduleType === 'TOUR_360' || moduleType === 'TOUR360') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>360° Virtual Tour Title</label>
          <input style={inputStyle} value={cfg.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. 360° Immersive Virtual Tour" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Description / Subtext</label>
          <input style={inputStyle} value={cfg.subtext || ''} onChange={e => set('subtext', e.target.value)} placeholder="e.g. Experience the residence in immersive virtual reality." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Embed URL</label>
          <input style={inputStyle} value={cfg.embedUrl || ''} onChange={e => set('embedUrl', e.target.value)} placeholder="e.g. https://my.matterport.com/show/?m=..." />
        </div>
      </div>
    )
  }

  // SMART_HOME
  if (moduleType === 'SMART_HOME') {
    const items: { title: string; description: string; icon: string }[] = cfg.features || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Headline</label>
          <input style={inputStyle} value={cfg.headline || ''} onChange={e => set('headline', e.target.value)} placeholder="e.g. Automation & Smart Living" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subtext</label>
          <input style={inputStyle} value={cfg.subtext || ''} onChange={e => set('subtext', e.target.value)} placeholder="e.g. Next-generation home automation features integrated for absolute convenience." />
        </div>
        <label style={labelStyle}>Smart Features List</label>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Feature Title</label>
                <input style={inputStyle} value={item.title} onChange={e => { const a = [...items]; a[i] = { ...a[i], title: e.target.value }; setArr('features', a) }} placeholder="e.g. Biometric Access" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Icon</label>
                <input style={inputStyle} value={item.icon} onChange={e => { const a = [...items]; a[i] = { ...a[i], icon: e.target.value }; setArr('features', a) }} placeholder="e.g. 🔒" />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={item.description} onChange={e => { const a = [...items]; a[i] = { ...a[i], description: e.target.value }; setArr('features', a) }} placeholder="Brief overview of how the feature works..." />
            </div>
            <button style={removeBtn} onClick={() => setArr('features', items.filter((_, j) => j !== i))}>Remove Feature</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('features', [...items, { title: '', description: '', icon: '🤖' }])}>+ Add Smart Feature</button>
      </div>
    )
  }

  // RERA_TRUST
  if (moduleType === 'RERA_TRUST') {
    const items: { title: string; filePath: string }[] = cfg.documents || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>RERA Registration No.</label>
            <input style={inputStyle} value={cfg.reraNo || ''} onChange={e => set('reraNo', e.target.value)} placeholder="e.g. PR/GJ/GANDHINAGAR/..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Approved Authority</label>
            <input style={inputStyle} value={cfg.approvedBy || ''} onChange={e => set('approvedBy', e.target.value)} placeholder="e.g. GUJRERA" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Validity Date Info</label>
            <input style={inputStyle} value={cfg.validityDate || ''} onChange={e => set('validityDate', e.target.value)} placeholder="e.g. December 2028" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Details / Disclaimer Text</label>
            <input style={inputStyle} value={cfg.detailsText || ''} onChange={e => set('detailsText', e.target.value)} placeholder="Compliance text details..." />
          </div>
        </div>
        <label style={labelStyle}>Official Certification Certificates</label>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Certificate Title</label>
              <input style={inputStyle} value={item.title} onChange={e => { const a = [...items]; a[i] = { ...a[i], title: e.target.value }; setArr('documents', a) }} placeholder="e.g. Approved Building Layout Plan" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>PDF Certificate File</label>
              <FilePicker projectId={projectId} value={item.filePath || ''} onChange={v => { const a = [...items]; a[i] = { ...a[i], filePath: v }; setArr('documents', a) }} accept="pdf" label="RERA Document PDF" placeholder="Select a PDF certificate file..." />
            </div>
            <button style={removeBtn} onClick={() => setArr('documents', items.filter((_, j) => j !== i))}>Remove Document</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('documents', [...items, { title: '', filePath: '' }])}>+ Add Document</button>
      </div>
    )
  }

  // TESTIMONIALS
  if (moduleType === 'TESTIMONIALS') {
    const items: { clientName: string; designation: string; text: string; rating: number; photoPath?: string }[] = cfg.reviews || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Headline</label>
          <input style={inputStyle} value={cfg.headline || ''} onChange={e => set('headline', e.target.value)} placeholder="e.g. What Our Buyers Say" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subtext</label>
          <input style={inputStyle} value={cfg.subtext || ''} onChange={e => set('subtext', e.target.value)} placeholder="e.g. Hear from client reviews who found their dream properties." />
        </div>
        <label style={labelStyle}>Buyer Testimonials List</label>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Client Name</label>
                <input style={inputStyle} value={item.clientName} onChange={e => { const a = [...items]; a[i] = { ...a[i], clientName: e.target.value }; setArr('reviews', a) }} placeholder="e.g. Rajesh Sharma" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Designation / Row Meta</label>
                <input style={inputStyle} value={item.designation} onChange={e => { const a = [...items]; a[i] = { ...a[i], designation: e.target.value }; setArr('reviews', a) }} placeholder="e.g. Premium 4BHK Resident" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Rating (Stars)</label>
                <select style={inputStyle} value={item.rating || 5} onChange={e => { const a = [...items]; a[i] = { ...a[i], rating: Number(e.target.value) }; setArr('reviews', a) }}>
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                </select>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Testimonial Review Message</label>
              <textarea style={{ ...inputStyle, fontFamily: 'sans-serif' }} rows={3} value={item.text} onChange={e => { const a = [...items]; a[i] = { ...a[i], text: e.target.value }; setArr('reviews', a) }} placeholder="Testimonial message details..." />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Client Portrait Photo (optional)</label>
              <FilePicker projectId={projectId} value={item.photoPath || ''} onChange={v => { const a = [...items]; a[i] = { ...a[i], photoPath: v }; setArr('reviews', a) }} accept="image" label="Client Photo" placeholder="Select client portrait photo..." mediaCategory="TESTIMONIALS" />
            </div>
            <button style={removeBtn} onClick={() => setArr('reviews', items.filter((_, j) => j !== i))}>Remove Testimonial</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('reviews', [...items, { clientName: '', designation: '', text: '', rating: 5, photoPath: '' }])}>+ Add Testimonial</button>
      </div>
    )
  }

  // FOUNDERS_NOTE
  if (moduleType === 'FOUNDERS_NOTE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Founder Name</label>
            <input style={inputStyle} value={cfg.founderName || ''} onChange={e => set('founderName', e.target.value)} placeholder="e.g. Sanjay Kumbhani" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>Founder Designation / Role</label>
            <input style={inputStyle} value={cfg.founderRole || ''} onChange={e => set('founderRole', e.target.value)} placeholder="e.g. Managing Director" />
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Message Address Text</label>
          <textarea style={{ ...inputStyle, fontFamily: 'sans-serif' }} rows={4} value={cfg.noteText || ''} onChange={e => set('noteText', e.target.value)} placeholder="Note message..." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Founder Portrait Image</label>
          <FilePicker projectId={projectId} value={cfg.photoPath || ''} onChange={v => set('photoPath', v)} accept="image" label="Founder Portrait" placeholder="Select portrait image..." mediaCategory="FOUNDERS_NOTE" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Founder Digital Signature (optional)</label>
          <FilePicker projectId={projectId} value={cfg.signaturePath || ''} onChange={v => set('signaturePath', v)} accept="image" label="Founder Signature" placeholder="Select signature overlay transparent image..." mediaCategory="FOUNDERS_NOTE" />
        </div>
      </div>
    )
  }

  // SUSTAINABILITY
  if (moduleType === 'SUSTAINABILITY') {
    const items: { title: string; description: string; icon: string }[] = cfg.initiatives || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Headline</label>
          <input style={inputStyle} value={cfg.headline || ''} onChange={e => set('headline', e.target.value)} placeholder="e.g. Green & Eco-Friendly Design" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subtext</label>
          <input style={inputStyle} value={cfg.subtext || ''} onChange={e => set('subtext', e.target.value)} placeholder="e.g. Responsible architecture solutions engineered for resource efficiency." />
        </div>
        <label style={labelStyle}>Green Initiatives List</label>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Initiative Title</label>
                <input style={inputStyle} value={item.title} onChange={e => { const a = [...items]; a[i] = { ...a[i], title: e.target.value }; setArr('initiatives', a) }} placeholder="e.g. Solar Panels Grid" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Icon</label>
                <input style={inputStyle} value={item.icon} onChange={e => { const a = [...items]; a[i] = { ...a[i], icon: e.target.value }; setArr('initiatives', a) }} placeholder="e.g. ☀️" />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={item.description} onChange={e => { const a = [...items]; a[i] = { ...a[i], description: e.target.value }; setArr('initiatives', a) }} placeholder="How this practice benefits sustainability..." />
            </div>
            <button style={removeBtn} onClick={() => setArr('initiatives', items.filter((_, j) => j !== i))}>Remove Initiative</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('initiatives', [...items, { title: '', description: '', icon: '🌱' }])}>+ Add Initiative</button>
      </div>
    )
  }

  // SPORTS_CAROUSEL
  if (moduleType === 'SPORTS_CAROUSEL') {
    const items: { name: string; description: string; imagePath?: string }[] = cfg.facilities || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Headline</label>
          <input style={inputStyle} value={cfg.headline || ''} onChange={e => set('headline', e.target.value)} placeholder="e.g. Active Sports & Fitness" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subtext</label>
          <input style={inputStyle} value={cfg.subtext || ''} onChange={e => set('subtext', e.target.value)} placeholder="e.g. Premium sports facilities engineered to keep you active." />
        </div>
        <label style={labelStyle}>Sports & Outdoor Arenas</label>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Arena Name</label>
              <input style={inputStyle} value={item.name} onChange={e => { const a = [...items]; a[i] = { ...a[i], name: e.target.value }; setArr('facilities', a) }} placeholder="e.g. Rooftop Tennis Court" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={item.description} onChange={e => { const a = [...items]; a[i] = { ...a[i], description: e.target.value }; setArr('facilities', a) }} placeholder="Specify court dimensions, features, floorings..." />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Facility Picture</label>
              <FilePicker projectId={projectId} value={item.imagePath || ''} onChange={v => { const a = [...items]; a[i] = { ...a[i], imagePath: v }; setArr('facilities', a) }} accept="image" label="Facility Photo" placeholder="Select facility picture..." mediaCategory="SPORTS_CAROUSEL" />
            </div>
            <button style={removeBtn} onClick={() => setArr('facilities', items.filter((_, j) => j !== i))}>Remove Arena</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('facilities', [...items, { name: '', description: '', imagePath: '' }])}>+ Add Arena</button>
      </div>
    )
  }

  // FINANCING_PARTNER
  if (moduleType === 'FINANCING_PARTNER') {
    const items: { bankName: string; logoPath?: string; interestRate?: string; maxTenure?: string }[] = cfg.partners || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Headline</label>
          <input style={inputStyle} value={cfg.headline || ''} onChange={e => set('headline', e.target.value)} placeholder="e.g. Approved Banking Partners" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subtext</label>
          <input style={inputStyle} value={cfg.subtext || ''} onChange={e => set('subtext', e.target.value)} placeholder="e.g. Get home loan pre-approvals with attractive interest rates." />
        </div>
        <label style={labelStyle}>Home Loan Bank Partners List</label>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Bank Name</label>
              <input style={inputStyle} value={item.bankName} onChange={e => { const a = [...items]; a[i] = { ...a[i], bankName: e.target.value }; setArr('partners', a) }} placeholder="e.g. State Bank of India" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Interest Rate Info (p.a.)</label>
                <input style={inputStyle} value={item.interestRate || ''} onChange={e => { const a = [...items]; a[i] = { ...a[i], interestRate: e.target.value }; setArr('partners', a) }} placeholder="e.g. 8.40%" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Max Tenure Period</label>
                <input style={inputStyle} value={item.maxTenure || ''} onChange={e => { const a = [...items]; a[i] = { ...a[i], maxTenure: e.target.value }; setArr('partners', a) }} placeholder="e.g. 30 Years" />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Bank Brand Logo</label>
              <FilePicker projectId={projectId} value={item.logoPath || ''} onChange={v => { const a = [...items]; a[i] = { ...a[i], logoPath: v }; setArr('partners', a) }} accept="image" label="Bank Logo" placeholder="Select bank brand logo..." mediaCategory="FINANCING_PARTNER" />
            </div>
            <button style={removeBtn} onClick={() => setArr('partners', items.filter((_, j) => j !== i))}>Remove Bank Partner</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('partners', [...items, { bankName: '', logoPath: '', interestRate: '', maxTenure: '' }])}>+ Add Banking Partner</button>
      </div>
    )
  }

  // COMMUNITY_LIFESTYLE
  if (moduleType === 'COMMUNITY_LIFESTYLE') {
    const items: { title: string; description: string; imagePath?: string }[] = cfg.activities || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Headline</label>
          <input style={inputStyle} value={cfg.headline || ''} onChange={e => set('headline', e.target.value)} placeholder="e.g. Community & Social Lifestyle" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subtext</label>
          <input style={inputStyle} value={cfg.subtext || ''} onChange={e => set('subtext', e.target.value)} placeholder="e.g. Interactive spaces designed for social events and relaxing walks." />
        </div>
        <label style={labelStyle}>Community Social Activities & Features</label>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Feature / Activity Title</label>
              <input style={inputStyle} value={item.title} onChange={e => { const a = [...items]; a[i] = { ...a[i], title: e.target.value }; setArr('activities', a) }} placeholder="e.g. Senior Citizen Tranquil Park" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={item.description} onChange={e => { const a = [...items]; a[i] = { ...a[i], description: e.target.value }; setArr('activities', a) }} placeholder="Describe the layout feature details..." />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Activity Picture</label>
              <FilePicker projectId={projectId} value={item.imagePath || ''} onChange={v => { const a = [...items]; a[i] = { ...a[i], imagePath: v }; setArr('activities', a) }} accept="image" label="Activity Photo" placeholder="Select activity photo..." mediaCategory="COMMUNITY_LIFESTYLE" />
            </div>
            <button style={removeBtn} onClick={() => setArr('activities', items.filter((_, j) => j !== i))}>Remove Social Feature</button>
          </div>
        ))}
        <button style={addBtn} onClick={() => setArr('activities', [...items, { title: '', description: '', imagePath: '' }])}>+ Add Social Feature</button>
      </div>
    )
  }

  // ── FALLBACK: raw JSON editor ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>No visual editor for <strong>{moduleType}</strong> — edit raw JSON below.</p>
      <textarea
        value={configJson}
        onChange={e => onChange(e.target.value)}
        rows={6}
        style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
      />
    </div>
  )
}

// ─── Admin Route ──────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  developer: string
  reraNumber: string
  location: string
  description: string
  type: string
  status: string
  possessionStatus: string
  possessionDate: string
  priceRangeMin: number
  priceRangeMax: number
  isFeatured: boolean
  sortOrder: number
  themeAccentColor: string
  themeFontPairing: string
  logoPath?: string
  thumbnailPath?: string
}

interface ProjectModule {
  id: string
  projectId: string
  moduleType: string
  config: string
  sortOrder: number
  isVisible: boolean
}

interface MediaItem {
  id: string
  category: string
  originalName: string
  filePath: string
  thumbnailPath: string
  sizeBytes: number
}

interface SessionLog {
  id: string
  projectId: string
  personaMode?: string
  sectionsViewed: string
  unitsShortlisted: string
  startedAt: string
  endedAt?: string
  project?: { name: string }
  staff?: { name: string }
}

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  budgetMin?: number
  budgetMax?: number
  notes: string
  capturedAt: string
  project?: { name: string }
}
interface Settings {
  firmName: string
  firmLogoPath?: string
  firmContactPhone: string
  firmContactEmail: string
  firmWebsite: string
  disclaimerText: string
  narrationEnabled: boolean
  watermarkEnabled: boolean
}

export default function AdminRoute(): JSX.Element {
  const navigate = useNavigate()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }
  const alert = (msg: string) => {
    const isError = msg.toLowerCase().includes('error') || msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('invalid')
    showToast(msg, isError ? 'error' : 'success')
  }

  const [activeTab, setActiveTab] = useState<'projects' | 'modules' | 'media' | 'units' | 'sessions' | 'leads' | 'staff' | 'appointments' | 'analytics' | 'backup' | 'settings'>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  
  // Edit mode tracking
  const [isEditing, setIsEditing] = useState(false)
  
  // Project Form State
  const [name, setName] = useState('')
  const [developer, setDeveloper] = useState('')
  const [reraNumber, setReraNumber] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('RESIDENTIAL')
  const [possessionStatus, setPossessionStatus] = useState('UNDER_CONSTRUCTION')
  const [possessionDate, setPossessionDate] = useState('')
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(0)
  const [sortOrder, setSortOrder] = useState(0)
  const [isFeatured, setIsFeatured] = useState(false)
  const [accentColor, setAccentColor] = useState('#c9a84c')
  const [fontPairing, setFontPairing] = useState('Inter')
  const [logoPath, setLogoPath] = useState('')
  const [thumbnailPath, setThumbnailPath] = useState('')

  // Modules tab state
  const [modules, setModules] = useState<ProjectModule[]>([])
  const [editingModuleId, setEditingModuleId] = useState<string>('')
  const [moduleConfigInput, setModuleConfigInput] = useState<string>('')
  const [moduleAddType, setModuleAddType] = useState<string>('OVERVIEW')

  // Media tab state
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [uploadFilePath, setUploadFilePath] = useState('')
  const [uploadCategory, setUploadCategory] = useState('GALLERY')
  const [uploadTags, setUploadTags] = useState('')

  // Units tab state
  const [csvContent, setCsvContent] = useState('')
  const [importStatus, setImportStatus] = useState('')
  // Single unit entry state
  const [towerName, setTowerName] = useState('')
  const [floorNumber, setFloorNumber] = useState(0)
  const [unitNumber, setUnitNumber] = useState('')
  const [unitConfig, setUnitConfig] = useState('2BHK')
  const [carpetArea, setCarpetArea] = useState(0)
  const [builtUpArea, setBuiltUpArea] = useState(0)
  const [superBuiltUpArea, setSuperBuiltUpArea] = useState(0)
  const [unitFacing, setUnitFacing] = useState('East')
  const [unitPrice, setUnitPrice] = useState(0)
  const [priceLabel, setPriceLabel] = useState('OFFICIAL')
  const [unitStatus, setUnitStatus] = useState('AVAILABLE')
  const [unitNotes, setUnitNotes] = useState('')

  // Towers management state
  const [towers, setTowers] = useState<any[]>([])
  const [newTowerName, setNewTowerName] = useState('')
  const [renamingTowerId, setRenamingTowerId] = useState('')
  const [renamingTowerValue, setRenamingTowerValue] = useState('')

  // Units management additional state
  const [units, setUnits] = useState<any[]>([])
  const [filterTowerId, setFilterTowerId] = useState<string>('ALL')
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>('')
  const [editingUnit, setEditingUnit] = useState<any | null>(null)
  const [useExistingTower, setUseExistingTower] = useState(true)
  const [areaDisplayMode, setAreaDisplayMode] = useState<'SQFT' | 'SQYD' | 'DUAL'>('DUAL')
  const [formAreaUnit, setFormAreaUnit] = useState<'SQFT' | 'SQYD'>('SQFT')

  // Session & Lead list state
  const [sessions, setSessions] = useState<SessionLog[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  // Global settings state
  const [settings, setSettings] = useState<Settings>({
    firmName: '',
    firmLogoPath: '',
    firmContactPhone: '',
    firmContactEmail: '',
    firmWebsite: '',
    disclaimerText: '',
    narrationEnabled: true,
    watermarkEnabled: true
  })
  const [adminPinInput, setAdminPinInput] = useState('')

  const handleCompanyLogoUpload = async () => {
    try {
      const filePath = await (window as any).api.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, {
        title: 'Select Company Logo Image',
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'svg'] }]
      }) as string | null

      if (filePath) {
        const mediaRecord = await (window as any).api.invoke(IPC_CHANNELS.MEDIA_UPLOAD, {
          projectId: selectedProjectId || 'GLOBAL',
          category: 'LOGO',
          filePath
        }) as any

        if (mediaRecord?.filePath) {
          setSettings(prev => ({ ...prev, firmLogoPath: mediaRecord.filePath }))
          alert('Company logo uploaded! Click "Save branding Settings" below to persist changes.')
        }
      }
    } catch (err: any) {
      alert(`Failed to upload company logo: ${err.message}`)
    }
  }

  // Settings action
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        firmName: settings.firmName,
        firmLogoPath: settings.firmLogoPath || '',
        firmContactPhone: settings.firmContactPhone,
        firmContactEmail: settings.firmContactEmail,
        firmWebsite: settings.firmWebsite,
        disclaimerText: settings.disclaimerText,
        narrationEnabled: settings.narrationEnabled,
        watermarkEnabled: settings.watermarkEnabled
      }
      if (adminPinInput) {
        payload.adminPin = adminPinInput
      }
      await (window as any).api.invoke(IPC_CHANNELS.SETTINGS_SET, payload)
      alert('Branding configurations saved!')
      setAdminPinInput('')
      loadSettings()
    } catch (err: any) {
      alert(`Settings update error: ${err.message}`)
    }
  }

  useEffect(() => {
    loadProjects()
    loadSessions()
    loadLeads()
    loadSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'units' && selectedProjectId) {
      loadTowers(selectedProjectId)
      loadUnits(selectedProjectId)
    }
  }, [activeTab, selectedProjectId])

  const loadProjects = async () => {
    try {
      const list = await (window as any).api.invoke(IPC_CHANNELS.PROJECT_LIST)
      setProjects(list || [])
      if (list && list.length > 0 && !selectedProjectId) {
        selectProject(list[0])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadModules = async (projId: string) => {
    if (!projId) return
    try {
      const list = await (window as any).api.invoke(IPC_CHANNELS.MODULE_LIST, projId)
      setModules((list || []) as ProjectModule[])
    } catch (e) {
      console.error(e)
    }
  }

  const loadMedia = async (projId: string) => {
    if (!projId) return
    try {
      const list = await (window as any).api.invoke(IPC_CHANNELS.MEDIA_LIST, { projectId: projId })
      setMediaList((list || []) as MediaItem[])
    } catch (e) {
      console.error(e)
    }
  }

  const loadUnits = async (projId: string) => {
    if (!projId) return
    try {
      const list = await (window as any).api.invoke(IPC_CHANNELS.UNIT_LIST_ALL, projId)
      setUnits(list || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadSessions = async () => {
    try {
      const list = await (window as any).api.invoke(IPC_CHANNELS.SESSION_LOG_LIST)
      setSessions((list || []) as SessionLog[])
    } catch (e) {
      console.error(e)
    }
  }

  const loadLeads = async () => {
    try {
      const list = await (window as any).api.invoke(IPC_CHANNELS.LEAD_LIST)
      setLeads((list || []) as Lead[])
    } catch (e) {
      console.error(e)
    }
  }

  const loadSettings = async () => {
    try {
      const config = await (window as any).api.invoke(IPC_CHANNELS.SETTINGS_GET)
      if (config) {
        setSettings({
          ...config,
          narrationEnabled: config.narrationEnabled !== false,
          watermarkEnabled: config.watermarkEnabled !== false
        } as Settings)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const selectProject = (project: Project) => {
    setSelectedProjectId(project.id)
    setIsEditing(true)
    setName(project.name)
    setDeveloper(project.developer)
    setReraNumber(project.reraNumber)
    setLocation(project.location)
    setDescription(project.description || '')
    setProjectType(project.type)
    setPossessionStatus(project.possessionStatus)
    setPossessionDate(project.possessionDate || '')
    setPriceMin(project.priceRangeMin)
    setPriceMax(project.priceRangeMax)
    setSortOrder(project.sortOrder || 0)
    setIsFeatured(project.isFeatured || false)
    setAccentColor(project.themeAccentColor?.startsWith('#') ? project.themeAccentColor : '#c9a84c')
    setFontPairing(project.themeFontPairing || 'Inter')
    setLogoPath(project.logoPath || '')
    setThumbnailPath(project.thumbnailPath || '')
    
    // Load modules, media, towers & units for this selected project
    loadModules(project.id)
    loadMedia(project.id)
    loadTowers(project.id)
    loadUnits(project.id)
  }

  const startNewProjectMode = () => {
    setIsEditing(false)
    setName('')
    setDeveloper('')
    setReraNumber('')
    setLocation('')
    setDescription('')
    setProjectType('RESIDENTIAL')
    setPossessionStatus('UNDER_CONSTRUCTION')
    setPossessionDate('')
    setPriceMin(0)
    setPriceMax(0)
    setSortOrder(0)
    setIsFeatured(false)
    setAccentColor('#c9a84c')
    setFontPairing('Inter')
    setLogoPath('')
    setThumbnailPath('')
  }

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name,
        developer,
        reraNumber,
        location,
        description,
        type: projectType,
        possessionStatus,
        possessionDate,
        priceRangeMin: Number(priceMin),
        priceRangeMax: Number(priceMax),
        sortOrder: Number(sortOrder),
        isFeatured,
        themeAccentColor: accentColor,
        themeFontPairing: fontPairing,
        logoPath,
        thumbnailPath,
        status: 'ACTIVE'
      }

      if (isEditing) {
        await (window as any).api.invoke(IPC_CHANNELS.PROJECT_UPDATE, {
          id: selectedProjectId,
          data: payload
        })
        alert('Project details updated successfully!')
      } else {
        await (window as any).api.invoke(IPC_CHANNELS.PROJECT_CREATE, payload)
        alert('New project created successfully!')
        startNewProjectMode()
      }
      loadProjects()
    } catch (err: any) {
      alert(`Error saving project: ${err.message}`)
    }
  }

  const handleArchiveProject = async () => {
    if (!selectedProjectId) return
    if (!confirm('Are you sure you want to archive this project? It will be hidden from the launcher.')) return
    try {
      await (window as any).api.invoke(IPC_CHANNELS.PROJECT_ARCHIVE, selectedProjectId)
      alert('Project archived successfully!')
      loadProjects()
      startNewProjectMode()
    } catch (err: any) {
      alert(`Archive error: ${err.message}`)
    }
  }

  // Module actions
  const handleToggleModuleVisibility = async (mod: ProjectModule) => {
    try {
      await (window as any).api.invoke(IPC_CHANNELS.MODULE_UPSERT, {
        id: mod.id,
        projectId: mod.projectId,
        moduleType: mod.moduleType,
        config: mod.config,
        sortOrder: mod.sortOrder,
        isVisible: !mod.isVisible
      })
      loadModules(selectedProjectId)
    } catch (err: any) {
      alert(`Error toggling module: ${err.message}`)
    }
  }

  const handleSaveModuleConfig = async (mod: ProjectModule) => {
    try {
      // Validate JSON
      JSON.parse(moduleConfigInput)
      await (window as any).api.invoke(IPC_CHANNELS.MODULE_UPSERT, {
        id: mod.id,
        projectId: mod.projectId,
        moduleType: mod.moduleType,
        config: moduleConfigInput,
        sortOrder: mod.sortOrder,
        isVisible: mod.isVisible
      })
      alert('Module configuration saved successfully!')
      setEditingModuleId('')
      loadModules(selectedProjectId)
    } catch (err: any) {
      alert(`Invalid JSON or config update error: ${err.message}`)
    }
  }

  const handleMoveModule = async (idx: number, direction: 'UP' | 'DOWN') => {
    if (idx === 0 && direction === 'UP') return
    if (idx === modules.length - 1 && direction === 'DOWN') return
    
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1
    const currentMod = modules[idx]
    const targetMod = modules[targetIdx]

    try {
      await (window as any).api.invoke(IPC_CHANNELS.MODULE_UPSERT, {
        id: currentMod.id,
        projectId: currentMod.projectId,
        moduleType: currentMod.moduleType,
        config: currentMod.config,
        sortOrder: targetMod.sortOrder,
        isVisible: currentMod.isVisible
      })
      await (window as any).api.invoke(IPC_CHANNELS.MODULE_UPSERT, {
        id: targetMod.id,
        projectId: targetMod.projectId,
        moduleType: targetMod.moduleType,
        config: targetMod.config,
        sortOrder: currentMod.sortOrder,
        isVisible: targetMod.isVisible
      })
      loadModules(selectedProjectId)
    } catch (err: any) {
      alert(`Error shifting order: ${err.message}`)
    }
  }

  // Media actions
  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) {
      alert('Please select a project first')
      return
    }
    if (!uploadFilePath) {
      alert('Provide absolute path of media file')
      return
    }
    try {
      await (window as any).api.invoke(IPC_CHANNELS.MEDIA_UPLOAD, {
        projectId: selectedProjectId,
        category: uploadCategory,
        filePath: uploadFilePath,
        tags: uploadTags
      })
      alert('Media uploaded and stored successfully!')
      setUploadFilePath('')
      setUploadTags('')
      loadMedia(selectedProjectId)
    } catch (err: any) {
      alert(`Media upload failed: ${err.message}`)
    }
  }

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media item physically?')) return
    try {
      await (window as any).api.invoke(IPC_CHANNELS.MEDIA_DELETE, id)
      alert('Media deleted successfully')
      loadMedia(selectedProjectId)
    } catch (err: any) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // ── Tower management handlers ─────────────────────────────────────────────
  const loadTowers = async (pid: string) => {
    if (!pid) return
    try {
      const data = await (window as any).api.invoke(IPC_CHANNELS.TOWER_LIST, pid) as any[]
      setTowers(data)
    } catch { setTowers([]) }
  }

  const handleCreateTower = async () => {
    if (!selectedProjectId) { alert('Select a project first'); return }
    if (!newTowerName.trim()) { alert('Enter a tower name'); return }
    try {
      await (window as any).api.invoke(IPC_CHANNELS.TOWER_CREATE, { projectId: selectedProjectId, name: newTowerName.trim() })
      setNewTowerName('')
      await loadTowers(selectedProjectId)
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  const handleRenameTower = async (towerId: string) => {
    if (!renamingTowerValue.trim()) { alert('Name cannot be empty'); return }
    try {
      await (window as any).api.invoke(IPC_CHANNELS.TOWER_RENAME, { towerId, name: renamingTowerValue.trim() })
      setRenamingTowerId('')
      setRenamingTowerValue('')
      await loadTowers(selectedProjectId)
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  const handleDeleteTower = async (towerId: string, towerName: string, unitCount: number) => {
    const msg = unitCount > 0
      ? `Delete tower "${towerName}" and its ${unitCount} unit${unitCount !== 1 ? 's' : ''}? This cannot be undone.`
      : `Delete tower "${towerName}"?`
    if (!confirm(msg)) return
    try {
      await (window as any).api.invoke(IPC_CHANNELS.TOWER_DELETE, towerId)
      await loadTowers(selectedProjectId)
    } catch (err: any) { alert(`Error: ${err.message}`) }
  }

  // Unit actions
  const handleCsvImport = async () => {
    if (!selectedProjectId) {
      alert('Please select a project first')
      return
    }
    if (!csvContent.trim()) {
      alert('Please paste CSV content')
      return
    }

    try {
      setImportStatus('Importing...')
      const res = await (window as any).api.invoke(IPC_CHANNELS.UNIT_BULK_IMPORT, {
        projectId: selectedProjectId,
        csvContent
      }) as any
      if (res.success) {
        setImportStatus(`Success! Imported ${res.count} units.`)
        setCsvContent('')
        await loadTowers(selectedProjectId)
        await loadUnits(selectedProjectId)
      } else {
        setImportStatus(`Failed: ${res.reason}`)
      }
    } catch (err: any) {
      setImportStatus(`Error: ${err.message}`)
    }
  }

  const handleSingleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) {
      alert('Please select a project first')
      return
    }
    if (!towerName || !unitNumber) {
      alert('Tower name and Unit number are required')
      return
    }

    try {
      // First resolve/create the tower
      const list = await (window as any).api.invoke(IPC_CHANNELS.PROJECT_GET, selectedProjectId) as any
      let tower = list.towers.find((t: any) => t.name.toLowerCase() === towerName.toLowerCase())
      
      let towerId = ''
      if (tower) {
        towerId = tower.id
      } else {
        // Auto-create the tower using our new IPC handler
        const newTower = await (window as any).api.invoke(IPC_CHANNELS.TOWER_CREATE, { projectId: selectedProjectId, name: towerName.trim() }) as any
        towerId = newTower.id
        await loadTowers(selectedProjectId) // refresh panel
      }

      const areaMultiplier = formAreaUnit === 'SQYD' ? 9 : 1
      const payload: any = {
        towerId,
        floor: Number(floorNumber),
        unitNumber,
        configuration: unitConfig,
        carpetArea: Number(carpetArea) * areaMultiplier,
        builtUpArea: Number(builtUpArea) * areaMultiplier,
        superBuiltUpArea: Number(superBuiltUpArea) * areaMultiplier,
        facing: unitFacing,
        price: Number(unitPrice),
        priceLabel,
        status: unitStatus,
        notes: unitNotes
      }

      if (editingUnit) {
        payload.id = editingUnit.id
      }

      await (window as any).api.invoke(IPC_CHANNELS.UNIT_UPSERT, payload)

      alert(editingUnit ? 'Unit updated successfully!' : 'Unit record created successfully!')
      cancelEditUnit()
      await loadTowers(selectedProjectId)
      await loadUnits(selectedProjectId)
    } catch (err: any) {
      alert(`Error saving unit: ${err.message}`)
    }
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return
    try {
      await (window as any).api.invoke(IPC_CHANNELS.UNIT_DELETE, unitId)
      await loadTowers(selectedProjectId)
      await loadUnits(selectedProjectId)
    } catch (err: any) {
      alert(`Error deleting unit: ${err.message}`)
    }
  }

  const handleFormAreaUnitChange = (newUnit: 'SQFT' | 'SQYD') => {
    if (newUnit === formAreaUnit) return
    if (newUnit === 'SQYD') {
      setCarpetArea(prev => Math.round((prev / 9) * 100) / 100)
      setBuiltUpArea(prev => Math.round((prev / 9) * 100) / 100)
      setSuperBuiltUpArea(prev => Math.round((prev / 9) * 100) / 100)
    } else {
      setCarpetArea(prev => Math.round(prev * 9))
      setBuiltUpArea(prev => Math.round(prev * 9))
      setSuperBuiltUpArea(prev => Math.round(prev * 9))
    }
    setFormAreaUnit(newUnit)
  }

  const startEditUnit = (u: any) => {
    setEditingUnit(u)
    const tName = u.tower?.name || ''
    setTowerName(tName)
    const hasTower = towers.some((t: any) => t.name.toLowerCase() === tName.toLowerCase())
    setUseExistingTower(hasTower && towers.length > 0)
    setFloorNumber(u.floor)
    setUnitNumber(u.unitNumber)
    setUnitConfig(u.configuration)
    const divider = formAreaUnit === 'SQYD' ? 9 : 1
    setCarpetArea(Math.round((u.carpetArea / divider) * 100) / 100)
    setBuiltUpArea(Math.round((u.builtUpArea / divider) * 100) / 100)
    setSuperBuiltUpArea(Math.round(((u.superBuiltUpArea || 0) / divider) * 100) / 100)
    setUnitFacing(u.facing || '')
    setUnitPrice(u.price)
    setPriceLabel(u.priceLabel)
    setUnitStatus(u.status)
    setUnitNotes(u.notes || '')
  }

  const cancelEditUnit = () => {
    setEditingUnit(null)
    setTowerName('')
    setUseExistingTower(true)
    setFloorNumber(0)
    setUnitNumber('')
    setUnitConfig('2BHK')
    setCarpetArea(0)
    setBuiltUpArea(0)
    setSuperBuiltUpArea(0)
    setUnitFacing('East')
    setUnitPrice(0)
    setPriceLabel('OFFICIAL')
    setUnitStatus('AVAILABLE')
    setUnitNotes('')
  }

  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden'
    }}>
      {/* SIDEBAR TABS SELECTOR */}
      <aside style={{
        width: '240px',
        borderRight: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        gap: '24px',
        flexShrink: 0,
        boxShadow: '2px 0 12px rgba(0,0,0,0.3)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>ShowcaseOS</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Admin Control Center
          </p>
        </div>

        {/* Sidebar Nav Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {([
            { id: 'projects', label: 'Projects' },
            { id: 'modules', label: 'Modules' },
            { id: 'media', label: 'Media Library' },
            { id: 'units', label: 'Units' },
            { id: 'sessions', label: 'Sessions' },
            { id: 'leads', label: 'Leads' },
            { id: 'staff', label: 'Staff Profiles' },
            { id: 'appointments', label: 'Appointments' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'backup', label: 'Backup & Sync' },
            { id: 'settings', label: 'Settings' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: activeTab === id ? 'var(--color-surface-raised)' : 'transparent',
                color: activeTab === id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                borderLeft: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent',
                fontSize: '13px',
                fontWeight: activeTab === id ? 600 : 400,
                transition: 'all 0.18s ease',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => { if (activeTab !== id) { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'; e.currentTarget.style.color = 'var(--color-text-primary)' } }}
              onMouseLeave={(e) => { if (activeTab !== id) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' } }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Selected Project Quick Display */}
        {selectedProjectId && (
          <div style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Project</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '13px' }}>{name || 'Loading...'}</span>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        
        {/* TOP BAR / PROJECT selector */}
        <header style={{
          padding: '18px 28px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
              {activeTab.replace('_', ' ')} Management
            </h2>
            <p style={{ margin: '2px 0 0 0', color: 'var(--color-text-muted)', fontSize: '12px' }}>
              Configure property databases and kiosk parameters
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Launch Kiosk button — switches back to the client-facing kiosk view */}
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'var(--color-accent)', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              title="Switch to client kiosk view"
            >
              {String.fromCodePoint(128250)} Launch Kiosk
            </button>
            <ThemeToggle />
            
            {/* Project Selector (only for tabs that need a project context) */}
            {['projects', 'modules', 'media', 'units'].includes(activeTab) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Context:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  const proj = projects.find((p) => p.id === e.target.value)
                  if (proj) selectProject(proj)
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          </div>
        </header>

        {/* CONTENT CONTAINER */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          
          {/* TAB 1: PROJECTS */}
          {activeTab === 'projects' && (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
              {/* Projects List sidebar */}
              <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>Property Catalog</h4>
                  <button onClick={startNewProjectMode} style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--color-success)', border: 'none', borderRadius: '4px', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                    + New Project
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '420px' }}>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectProject(p)}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: selectedProjectId === p.id && isEditing ? 'var(--color-accent)' : 'var(--color-border)',
                        fontSize: '13px',
                        fontWeight: 500,
                        textAlign: 'left'
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Form */}
              <form onSubmit={handleProjectSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h3 style={{ gridColumn: 'span 2', margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                  {isEditing ? `Modify Project: ${name}` : 'Register New Kiosk Property Showcase'}
                </h3>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Project Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Developer Name</label>
                  <input value={developer} onChange={e => setDeveloper(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>RERA Registration Number</label>
                  <input value={reraNumber} onChange={e => setReraNumber(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Price Min (INR)</label>
                  <input type="number" value={priceMin} onChange={e => setPriceMin(Number(e.target.value))} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Price Max (INR)</label>
                  <input type="number" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Project Type</label>
                  <select value={projectType} onChange={e => setProjectType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="MIXED_USE">Mixed Use</option>
                    <option value="PLOTTED_DEVELOPMENT">Plotted Development</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Possession Status</label>
                  <select value={possessionStatus} onChange={e => setPossessionStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    <option value="READY">Ready to Move</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Possession Date (Text Description)</label>
                  <input value={possessionDate} onChange={e => setPossessionDate(e.target.value)} placeholder="E.g. Dec 2026" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Sort Order</label>
                  <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Accent Theme Color</label>
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '60px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="isFeatured" style={{ fontSize: '13px', cursor: 'pointer' }}>Highlight as Featured Property</label>
                </div>

                {isEditing ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)' }}>Project Brand Logo</label>
                      <FilePicker
                        projectId={selectedProjectId}
                        value={logoPath}
                        onChange={setLogoPath}
                        accept="image"
                        label="Project Logo"
                        placeholder="Upload project brand logo..."
                        mediaCategory="LOGO"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)' }}>Project Launcher Thumbnail / Cover</label>
                      <FilePicker
                        projectId={selectedProjectId}
                        value={thumbnailPath}
                        onChange={setThumbnailPath}
                        accept="image"
                        label="Project Thumbnail"
                        placeholder="Upload project launcher cover image..."
                        mediaCategory="THUMBNAIL"
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: 'span 2', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '6px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    Note: Project Logo and Launcher Cover Image can be uploaded after saving the project.
                  </div>
                )}

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  {isEditing && (
                    <button type="button" onClick={handleArchiveProject} style={{ padding: '10px 20px', backgroundColor: 'var(--color-error)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      Archive Project
                    </button>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                    <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--color-accent)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      {isEditing ? 'Save Changes' : 'Register Property'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MODULES */}
          {activeTab === 'modules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Add Module Panel */}
              <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '20px 24px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>Add Module to Project</h3>
                <select
                  value={moduleAddType}
                  onChange={e => setModuleAddType(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '13px', flex: 1, minWidth: '200px' }}
                >
                  {['OVERVIEW','GALLERY','AMENITIES','PRICING','CALCULATORS','VIDEOS','LOCATION','USP_SPOTLIGHT','MASTER_PLAN','BROCHURE','TESTIMONIALS','SUSTAINABILITY','SMART_HOME','COMMUNITY_LIFESTYLE','CONSTRUCTION_TIMELINE','FINANCING_PARTNER','FOUNDERS_NOTE','RERA_TRUST','SPORTS_CAROUSEL','COMPARE_UNITS','TOUR_360'].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!selectedProjectId) { alert('Select a project first'); return }
                    await (window as any).api.invoke(IPC_CHANNELS.MODULE_UPSERT, {
                      projectId: selectedProjectId,
                      moduleType: moduleAddType,
                      config: '{}',
                      sortOrder: modules.length,
                      isVisible: true
                    })
                    loadModules(selectedProjectId)
                  }}
                  style={{ padding: '8px 20px', backgroundColor: 'var(--color-success)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  + Add Module
                </button>
              </div>

              <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Property Modules Registry Layout</h3>
              
              {!selectedProjectId ? (
                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px' }}>Please select a project first</div>
              ) : modules.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '48px' }}>📦</span>
                  <p style={{ margin: 0, fontSize: '14px' }}>No modules configured yet.</p>
                  <p style={{ margin: 0, fontSize: '12px' }}>Use the panel above to add modules to this project.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {modules.map((mod, idx) => (
                    <div key={mod.id} style={{
                      backgroundColor: 'var(--color-border)',
                      border: editingModuleId === mod.id ? '1px solid var(--color-accent)' : '1px solid #334155',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      {/* Module header row */}
                      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: editingModuleId === mod.id ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--project-accent)', fontSize: '14px' }}>{mod.moduleType.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', padding: '2px 8px', borderRadius: '20px' }}>Order {mod.sortOrder}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: mod.isVisible ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                            <input type="checkbox" checked={mod.isVisible} onChange={() => handleToggleModuleVisibility(mod)} />
                            {mod.isVisible ? 'Visible on Kiosk' : 'Hidden'}
                          </label>
                          <button onClick={() => handleMoveModule(idx, 'UP')} disabled={idx === 0} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>▲</button>
                          <button onClick={() => handleMoveModule(idx, 'DOWN')} disabled={idx === modules.length - 1} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>▼</button>
                          <button
                            onClick={() => {
                              if (editingModuleId === mod.id) {
                                setEditingModuleId('')
                              } else {
                                setEditingModuleId(mod.id)
                                setModuleConfigInput(mod.config || '{}')
                              }
                            }}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: editingModuleId === mod.id ? 'var(--color-text-muted)' : 'var(--color-accent)',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'var(--color-text-primary)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {editingModuleId === mod.id ? 'Cancel' : 'Configure ▾'}
                          </button>
                        </div>
                      </div>

                      {/* Module smart config panel */}
                      {editingModuleId === mod.id && (
                        <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <ModuleConfigEditor
                            moduleType={mod.moduleType}
                            configJson={moduleConfigInput}
                            onChange={setModuleConfigInput}
                            projectId={selectedProjectId}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                            <button
                              onClick={() => setEditingModuleId('')}
                              style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              Discard
                            </button>
                            <button
                              onClick={() => handleSaveModuleConfig(mod)}
                              style={{ padding: '8px 20px', backgroundColor: 'var(--color-success)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Save Configuration
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA */}
          {activeTab === 'media' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              {/* Media List Grid */}
              <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Project Storage Library</h3>
                {!selectedProjectId ? (
                  <div style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Select project context</div>
                ) : mediaList.length === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px' }}>No media files linked. Use the uploader sidebar to upload files.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                    {mediaList.map((m) => (
                      <div key={m.id} style={{
                        backgroundColor: 'var(--color-border)',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {m.category !== 'VIDEO' && m.category !== 'AUDIO' && m.thumbnailPath ? (
                          <img src={toMediaUrl(m.thumbnailPath)} alt={m.originalName} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ height: '100px', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                            {m.category === 'VIDEO' ? '🎥' : '🎵'}
                          </div>
                        )}
                        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{m.originalName}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{m.category}</span>
                          <button
                            onClick={() => handleDeleteMedia(m.id)}
                            style={{
                              marginTop: 'auto', padding: '4px', backgroundColor: 'var(--color-error)', border: 'none',
                              borderRadius: '4px', color: 'var(--color-text-primary)', fontSize: '10px', cursor: 'pointer', fontWeight: 600
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadMedia} style={{ backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Import New Media Element</h4>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Select File</label>
                  <FilePicker
                    value={uploadFilePath}
                    onChange={setUploadFilePath}
                    accept={
                      uploadCategory === 'VIDEO' || uploadCategory === 'INTRO_VIDEO' ? 'video' :
                      uploadCategory === 'AUDIO' ? 'audio' : 'image'
                    }
                    label="Media File"
                    placeholder="Click Browse to select a file from your computer..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="GALLERY">General Gallery</option>
                    <option value="EXTERIOR">Exterior Walk</option>
                    <option value="INTERIOR">Interior Walk</option>
                    <option value="LANDSCAPE">Landscape Detail</option>
                    <option value="VIDEO">Video Walkthrough</option>
                    <option value="AUDIO">Ambient Audio Background</option>
                    <option value="INTRO_VIDEO">Launcher Intro Video</option>
                    <option value="FLOOR_PLAN">Floor Plan Blueprint</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Search tags</label>
                  <input
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="E.g. bedroom, entrance"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }}
                  />
                </div>
                <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--color-success)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
                  Store Media
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: UNITS */}
          {activeTab === 'units' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* ── TOWERS MANAGEMENT PANEL ─────────────────────────────── */}
              <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Towers / Blocks Management</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Create, rename or delete towers. Towers appear as clickable blocks on the Master Plan screen.</p>
                  </div>
                  <button
                    onClick={() => loadTowers(selectedProjectId)}
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  >
                    &#x21BB; Refresh
                  </button>
                </div>

                {/* Tower list */}
                {towers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: '13px', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                    No towers yet. Create one below or import via CSV.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    {towers.map((tower: any) => {
                      const unitCount = tower.units?.length || 0
                      const available = tower.units?.filter((u: any) => u.status === 'AVAILABLE').length || 0
                      const sold = tower.units?.filter((u: any) => u.status === 'SOLD').length || 0
                      const held = tower.units?.filter((u: any) => u.status === 'HELD').length || 0
                      const isRenaming = renamingTowerId === tower.id
                      return (
                        <div key={tower.id} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '14px 16px', background: 'var(--color-bg)',
                          borderRadius: '8px', border: '1px solid var(--color-border)'
                        }}>
                          {/* Tower icon */}
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '6px',
                            backgroundColor: 'rgba(201, 168, 76, 0.12)', color: 'var(--color-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', flexShrink: 0
                          }}>
                            &#x1F3E2;
                          </div>

                          {/* Name / inline rename */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isRenaming ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                  autoFocus
                                  value={renamingTowerValue}
                                  onChange={e => setRenamingTowerValue(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleRenameTower(tower.id); if (e.key === 'Escape') setRenamingTowerId('') }}
                                  style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-accent)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600 }}
                                />
                                <button onClick={() => handleRenameTower(tower.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--color-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>Save</button>
                                <button onClick={() => setRenamingTowerId('')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                              </div>
                            ) : (
                              <>
                                <div style={{ fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tower.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span>{unitCount} unit{unitCount !== 1 ? 's' : ''}</span>
                                  {unitCount > 0 && (
                                    <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                      <span style={{ color: 'var(--color-available)', fontWeight: 600 }}>&#x25CF; {available} avail</span>
                                      {held > 0 && <span style={{ color: 'var(--color-held)', fontWeight: 600 }}>&#x25CF; {held} held</span>}
                                      {sold > 0 && <span style={{ color: 'var(--color-sold)', fontWeight: 600 }}>&#x25CF; {sold} sold</span>}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          {!isRenaming && (
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <button
                                onClick={() => { setRenamingTowerId(tower.id); setRenamingTowerValue(tower.name) }}
                                style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteTower(tower.id, tower.name, unitCount)}
                                style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Create new tower */}
                <div style={{ display: 'flex', gap: '10px', marginTop: towers.length > 0 ? '0' : '8px' }}>
                  <input
                    value={newTowerName}
                    onChange={e => setNewTowerName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateTower() }}
                    placeholder="New tower name, e.g. Tower C or Block 3"
                    style={{ flex: 1, padding: '9px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '13px' }}
                  />
                  <button
                    onClick={handleCreateTower}
                    style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', background: 'var(--color-accent)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    + Add Tower
                  </button>
                </div>
              </div>

              {/* ── UNIT INVENTORY EXPLORER + CSV & SINGLE UNIT FORM ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 360px)', gap: '24px', alignItems: 'start' }}>
                
                {/* Left Side: Unit Explorer & CSV Import stacked */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
                  
                  {/* 1. Unit Inventory Explorer */}
                  <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Unit Inventory Explorer</h3>
                      <button
                        onClick={() => loadUnits(selectedProjectId)}
                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer', flexShrink: 0 }}
                      >
                        &#x21BB; Reload List
                      </button>
                    </div>

                    {/* Search & Filters */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={unitSearchQuery}
                        onChange={e => setUnitSearchQuery(e.target.value)}
                        placeholder="Search unit number (e.g. 501)..."
                        style={{ flex: '1 1 180px', minWidth: '160px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '13px' }}
                      />
                      <select
                        value={filterTowerId}
                        onChange={e => setFilterTowerId(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '13px', minWidth: '130px', flexShrink: 0 }}
                      >
                        <option value="ALL">All Towers</option>
                        {towers.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>

                      {/* Area Display Unit Mode Toggle */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--color-bg)', padding: '3px', borderRadius: '6px', border: '1px solid var(--color-border)', gap: '2px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setAreaDisplayMode('SQFT')}
                          style={{
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: areaDisplayMode === 'SQFT' ? 700 : 500,
                            borderRadius: '4px',
                            border: 'none',
                            whiteSpace: 'nowrap',
                            backgroundColor: areaDisplayMode === 'SQFT' ? 'var(--color-accent)' : 'transparent',
                            color: areaDisplayMode === 'SQFT' ? '#fff' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Sq. Ft.
                        </button>
                        <button
                          type="button"
                          onClick={() => setAreaDisplayMode('SQYD')}
                          style={{
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: areaDisplayMode === 'SQYD' ? 700 : 500,
                            borderRadius: '4px',
                            border: 'none',
                            whiteSpace: 'nowrap',
                            backgroundColor: areaDisplayMode === 'SQYD' ? 'var(--color-accent)' : 'transparent',
                            color: areaDisplayMode === 'SQYD' ? '#fff' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Sq. Yd.
                        </button>
                        <button
                          type="button"
                          onClick={() => setAreaDisplayMode('DUAL')}
                          style={{
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: areaDisplayMode === 'DUAL' ? 700 : 500,
                            borderRadius: '4px',
                            border: 'none',
                            whiteSpace: 'nowrap',
                            backgroundColor: areaDisplayMode === 'DUAL' ? 'var(--color-accent)' : 'transparent',
                            color: areaDisplayMode === 'DUAL' ? '#fff' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Dual
                        </button>
                      </div>
                    </div>

                    {/* Table View */}
                    <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface-raised)', zIndex: 1, borderBottom: '1px solid var(--color-border)' }}>
                          <tr style={{ color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '10px 12px' }}>Tower</th>
                            <th style={{ padding: '10px 12px' }}>Floor</th>
                            <th style={{ padding: '10px 12px' }}>Unit No.</th>
                            <th style={{ padding: '10px 12px' }}>Config</th>
                            <th style={{ padding: '10px 12px' }}>Area</th>
                            <th style={{ padding: '10px 12px' }}>Price</th>
                            <th style={{ padding: '10px 12px' }}>Status</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = units.filter((u: any) => {
                              const matchesSearch = u.unitNumber.toLowerCase().includes(unitSearchQuery.toLowerCase())
                              const matchesTower = filterTowerId === 'ALL' || u.towerId === filterTowerId
                              return matchesSearch && matchesTower
                            })
                            
                            const formatPrice = (p: number) => {
                              if (p >= 10000000) return `${(p / 10000000).toFixed(2)} Cr`
                              if (p >= 100000) return `${(p / 100000).toFixed(2)} Lk`
                              return p.toLocaleString('en-IN')
                            }

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                                    No units found matching search/filter criteria.
                                  </td>
                                </tr>
                              )
                            }

                            return filtered.map((u: any) => {
                              const statusColor = u.status === 'AVAILABLE' ? 'var(--color-available)' : u.status === 'HELD' ? 'var(--color-held)' : 'var(--color-sold)'
                              const displayArea = areaDisplayMode === 'SQYD'
                                ? `${(u.carpetArea / 9).toFixed(1)} sqyd`
                                : areaDisplayMode === 'DUAL'
                                ? `${u.carpetArea} sqft (${(u.carpetArea / 9).toFixed(1)} sqyd)`
                                : `${u.carpetArea} sqft`
                              return (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s ease' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.tower?.name}</td>
                                  <td style={{ padding: '10px 12px' }}>{u.floor}</td>
                                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{u.unitNumber}</td>
                                  <td style={{ padding: '10px 12px' }}>{u.configuration}</td>
                                  <td style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums' }}>{displayArea}</td>
                                  <td style={{ padding: '10px 12px', color: 'var(--color-accent)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(u.price)}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{
                                      display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
                                      backgroundColor: `${statusColor}15`, color: statusColor,
                                      border: `1px solid ${statusColor}35`, fontSize: '10px', fontWeight: 600
                                    }}>
                                      {u.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                      <button onClick={() => startEditUnit(u)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                                      <button onClick={() => handleDeleteUnit(u.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #f87171', background: 'none', color: '#f87171', cursor: 'pointer', fontSize: '11px' }}>Delete</button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2. CSV Import */}
                  <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>Bulk Unit CSV Import</h3>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      Format columns: <code>towerName,floor,unitNumber,configuration,carpetArea,builtUpArea,superBuiltUpArea,facing,price,priceLabel,status,notes,areaUnit</code>
                    </p>
                    <textarea
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      placeholder="Tower A,5,A-501,4BHK,2450,4050,0,East,16500000,OFFICIAL,AVAILABLE,Luxury pool view,SQFT&#10;Tower A,6,A-601,4BHK,272.2,450,0,East,16500000,OFFICIAL,AVAILABLE,Sky villa,SQYD"
                      rows={6}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '6px',
                        border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)',
                        fontFamily: 'monospace', fontSize: '12px', resize: 'vertical', marginBottom: '16px'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{importStatus}</span>
                      <button onClick={handleCsvImport} style={{ padding: '10px 20px', backgroundColor: 'var(--color-accent)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                        Bulk Import
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Side: Form (Single Unit Entry or Edit) */}
                <form onSubmit={handleSingleUnitSubmit} style={{ backgroundColor: 'var(--color-surface-raised)', padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content', minWidth: 0 }}>
                  <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                      {editingUnit ? 'Edit Unit Record' : 'Create Single Unit Record'}
                    </h4>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Tower Name *</label>
                      {towers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUseExistingTower(!useExistingTower)
                            if (useExistingTower) {
                              setTowerName('')
                            } else {
                              setTowerName(towers[0]?.name || '')
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '11px', padding: 0, whiteSpace: 'nowrap' }}
                        >
                          {useExistingTower ? 'Create new tower' : 'Choose existing'}
                        </button>
                      )}
                    </div>
                    {useExistingTower && towers.length > 0 ? (
                      <select
                        value={towerName}
                        onChange={(e) => setTowerName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }}
                      >
                        <option value="">-- Select Tower --</option>
                        {towers.map((t: any) => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={towerName}
                        onChange={(e) => setTowerName(e.target.value)}
                        placeholder="E.g. Tower C"
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }}
                      />
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Floor Number *</label>
                      <input type="number" value={floorNumber} onChange={(e) => setFloorNumber(Number(e.target.value))} required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Unit Number *</label>
                      <input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="A-101" required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Configuration</label>
                    <input value={unitConfig} onChange={(e) => setUnitConfig(e.target.value)} placeholder="3BHK" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                  </div>

                  {/* Area Dimensions Header + Input Unit Picker */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        Area Dimensions
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Input Unit:</span>
                        <div style={{ display: 'inline-flex', backgroundColor: 'var(--color-bg)', padding: '3px', borderRadius: '6px', border: '1px solid var(--color-border)', gap: '3px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleFormAreaUnitChange('SQFT')}
                            style={{
                              padding: '4px 10px', fontSize: '11px', fontWeight: formAreaUnit === 'SQFT' ? 700 : 500,
                              borderRadius: '4px', border: 'none', whiteSpace: 'nowrap',
                              backgroundColor: formAreaUnit === 'SQFT' ? 'var(--color-accent)' : 'transparent',
                              color: formAreaUnit === 'SQFT' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Sq. Ft.
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormAreaUnitChange('SQYD')}
                            style={{
                              padding: '4px 10px', fontSize: '11px', fontWeight: formAreaUnit === 'SQYD' ? 700 : 500,
                              borderRadius: '4px', border: 'none', whiteSpace: 'nowrap',
                              backgroundColor: formAreaUnit === 'SQYD' ? 'var(--color-accent)' : 'transparent',
                              color: formAreaUnit === 'SQYD' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Sq. Yd.
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Carpet ({formAreaUnit === 'SQYD' ? 'Sq.Yd.' : 'Sq.Ft.'})
                        </label>
                        <input type="number" step="any" value={carpetArea} onChange={(e) => setCarpetArea(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Built Up ({formAreaUnit === 'SQYD' ? 'Sq.Yd.' : 'Sq.Ft.'})
                        </label>
                        <input type="number" step="any" value={builtUpArea} onChange={(e) => setBuiltUpArea(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Super ({formAreaUnit === 'SQYD' ? 'Sq.Yd.' : 'Sq.Ft.'})
                        </label>
                        <input type="number" step="any" value={superBuiltUpArea} onChange={(e) => setSuperBuiltUpArea(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Price (INR) *</label>
                      <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Price Label</label>
                      <select value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }}>
                        <option value="OFFICIAL">Official</option>
                        <option value="ESTIMATED">Estimated</option>
                        <option value="INDICATIVE">Indicative</option>
                        <option value="SUBJECT_TO_CONFIRMATION">Subject to Confirmation</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Unit Facing</label>
                      <input value={unitFacing} onChange={(e) => setUnitFacing(e.target.value)} placeholder="East" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</label>
                      <select value={unitStatus} onChange={(e) => setUnitStatus(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }}>
                        <option value="AVAILABLE">Available</option>
                        <option value="HELD">Held</option>
                        <option value="SOLD">Sold</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Notes</label>
                    <input value={unitNotes} onChange={(e) => setUnitNotes(e.target.value)} placeholder="E.g. Pool view" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '12px' }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-success)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                      {editingUnit ? 'Update Unit' : 'Register Unit'}
                    </button>
                    {editingUnit && (
                      <button type="button" onClick={cancelEditUnit} style={{ padding: '10px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-secondary)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* TAB 5: SESSIONS */}
          {activeTab === 'sessions' && (
            <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Interactive Presentation Session Logs</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '12px' }}>Property</th>
                      <th style={{ padding: '12px' }}>Persona</th>
                      <th style={{ padding: '12px' }}>Started At</th>
                      <th style={{ padding: '12px' }}>Duration</th>
                      <th style={{ padding: '12px' }}>Viewed Sections</th>
                      <th style={{ padding: '12px' }}>Shortlisted count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => {
                      const dur = s.endedAt
                        ? `${Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000 / 60)} min`
                        : 'Active'
                      let viewsCount = 0
                      try { viewsCount = JSON.parse(s.sectionsViewed || '[]').length } catch(err) {}
                      let shortlistCount = 0
                      try { shortlistCount = JSON.parse(s.unitsShortlisted || '[]').length } catch(err) {}
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{s.project?.name}</td>
                          <td style={{ padding: '12px' }}>{s.personaMode || 'Not specified'}</td>
                          <td style={{ padding: '12px' }}>{new Date(s.startedAt).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>{dur}</td>
                          <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>{viewsCount} sections</td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{shortlistCount} units</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: LEADS */}
          {activeTab === 'leads' && (
            <div style={{ backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Captured Customer Leads</h3>
              <button
                onClick={async () => {
                  const res = await (window as any).api.invoke(IPC_CHANNELS.LEAD_EXPORT_CSV) as any
                  if (res.success) alert('Exported ' + res.count + ' leads to: ' + res.filePath)
                  else if (res.reason !== 'Cancelled') alert('Export failed: ' + res.reason)
                }}
                style={{ padding: '8px 18px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                Export CSV
              </button>
            </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '12px' }}>Customer Name</th>
                      <th style={{ padding: '12px' }}>Phone Number</th>
                      <th style={{ padding: '12px' }}>Email Address</th>
                      <th style={{ padding: '12px' }}>Project Area</th>
                      <th style={{ padding: '12px' }}>Captured Date</th>
                      <th style={{ padding: '12px' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{l.name}</td>
                        <td style={{ padding: '12px' }}>{l.phone}</td>
                        <td style={{ padding: '12px' }}>{l.email || 'N/A'}</td>
                        <td style={{ padding: '12px', color: 'var(--color-success)' }}>{l.project?.name || 'General interest'}</td>
                        <td style={{ padding: '12px' }}>{new Date(l.capturedAt).toLocaleString()}</td>
                        <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{l.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* TAB: STAFF PROFILES */}
          {activeTab === 'staff' && (
            <StaffTab />
          )}

          {/* TAB: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <AppointmentsTab />
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <AnalyticsTab sessions={sessions} />
          )}

          {/* TAB: BACKUP & SYNC */}
          {activeTab === 'backup' && (
            <BackupSyncTab />
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--color-surface-raised)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)', maxWidth: '600px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>Global Firm Configuration</h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Company Name</label>
                <input value={settings.firmName} onChange={(e) => setSettings({ ...settings, firmName: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Company Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  {settings.firmLogoPath ? (
                    <div style={{ position: 'relative', width: '120px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <img
                        src={toMediaUrl(settings.firmLogoPath)}
                        alt="Company Logo Preview"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '120px', height: '60px', borderRadius: '6px', border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '11px', flexShrink: 0 }}>
                      <span style={{ fontSize: '18px', marginBottom: '2px' }}>&#x1F5BC;</span>
                      <span>No Logo</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleCompanyLogoUpload}
                        style={{ padding: '8px 16px', backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        &#x1F5BC; {settings.firmLogoPath ? 'Change Company Logo' : 'Upload Company Logo'}
                      </button>
                      {settings.firmLogoPath && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, firmLogoPath: '' })}
                          style={{ padding: '8px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Appears on Kiosk launcher header, PDFs, and exported brochures (PNG, SVG, or WebP recommended).
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Contact Phone</label>
                  <input value={settings.firmContactPhone} onChange={(e) => setSettings({ ...settings, firmContactPhone: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Website</label>
                  <input value={settings.firmWebsite} onChange={(e) => setSettings({ ...settings, firmWebsite: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Contact Email</label>
                <input value={settings.firmContactEmail} onChange={(e) => setSettings({ ...settings, firmContactEmail: e.target.value })} type="email" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Kiosk Footer Disclaimer Text</label>
                <textarea value={settings.disclaimerText} onChange={(e) => setSettings({ ...settings, disclaimerText: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', resize: 'vertical' }} />
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Kiosk Features Configuration</h4>
                
                {/* Voice Narration Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                      {'\uD83D\uDD0A'} Voice Narration
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {settings.narrationEnabled
                        ? 'Auto-narration is ON \u2014 visitors hear module descriptions when browsing the kiosk.'
                        : 'Auto-narration is OFF \u2014 the kiosk runs silently.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, narrationEnabled: !settings.narrationEnabled })}
                    style={{
                      flexShrink: 0,
                      width: '56px', height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: settings.narrationEnabled ? 'var(--color-accent)' : 'var(--color-border)',
                      position: 'relative',
                      transition: 'background-color 0.25s ease'
                    }}
                    title={settings.narrationEnabled ? 'Click to disable narration' : 'Click to enable narration'}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      left: settings.narrationEnabled ? '31px' : '4px',
                      width: '20px', height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      transition: 'left 0.25s ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                    }} />
                  </button>
                </div>

                {/* Watermark Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                      {'\uD83D\uDDFD'} Kiosk Screens Watermark Overlay
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {settings.watermarkEnabled
                        ? 'Watermark is ON \u2014 a diagonal overlay of your company name tiles all media and floor plans.'
                        : 'Watermark is OFF \u2014 kiosk screens remain completely clean and clear.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, watermarkEnabled: !settings.watermarkEnabled })}
                    style={{
                      flexShrink: 0,
                      width: '56px', height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: settings.watermarkEnabled ? 'var(--color-accent)' : 'var(--color-border)',
                      position: 'relative',
                      transition: 'background-color 0.25s ease'
                    }}
                    title={settings.watermarkEnabled ? 'Click to disable watermark' : 'Click to enable watermark'}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      left: settings.watermarkEnabled ? '31px' : '4px',
                      width: '20px', height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      transition: 'left 0.25s ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                    }} />
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Change Admin Security PIN</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current PIN"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <button type="submit" style={{ padding: '12px', backgroundColor: 'var(--color-accent)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', alignSelf: 'flex-end' }}>
                Save branding Settings
              </button>
            </form>
          )}

        </div>
      </main>
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? 'var(--color-error)' : toast.type === 'success' ? 'var(--color-success)' : 'var(--color-accent)',
          color: toast.type === 'error' ? '#fff' : '#000',
          padding: '14px 28px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          animation: 'slideInRight 0.3s ease-out forwards'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}









