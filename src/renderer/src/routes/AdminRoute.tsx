import React, { useState, useEffect } from 'react'
import { IPC_CHANNELS } from '../../../main/ipc/channels'
import { toMediaUrl } from '../utils/media'

// ─── Smart Module Config Editor ───────────────────────────────────────────────

function parseConfig(raw: string): Record<string, any> {
  try { return JSON.parse(raw || '{}') } catch { return {} }
}

// ─── Native File Picker ───────────────────────────────────────────────────────

const browseBtn: React.CSSProperties = {
  padding: '8px 14px', backgroundColor: '#334155', color: '#CBD5E1',
  border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer',
  fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
  display: 'flex', alignItems: 'center', gap: '4px'
}

type FileFilter = { name: string; extensions: string[] }

function FilePicker({
  value, onChange, placeholder, accept, label, projectId
}: {
  value: string
  onChange: (path: string) => void
  placeholder?: string
  accept?: 'image' | 'video' | 'audio' | 'pdf' | 'any'
  label?: string
  projectId?: string
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
        let category = 'GALLERY'
        if (accept === 'video') category = 'VIDEO'
        if (accept === 'audio') category = 'AUDIO'
        if (accept === 'pdf') category = 'DOCUMENT'

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
            border: '1px solid #334155', backgroundColor: '#09090e', flexShrink: 0,
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
            border: uploading ? '1px solid #3B82F6' : showSuccess ? '1px solid #10B981' : '1px solid #334155',
            backgroundColor: '#09090e',
            color: '#F8FAFC', fontSize: '13px', boxSizing: 'border-box' as const
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
            backgroundColor: showSuccess ? '#10B981' : '#334155',
            color: '#fff'
          }}
        >
          {uploading ? '⏳ Processing' : showSuccess ? '✅ Done' : `${iconMap[accept ?? 'any']} Browse`}
        </button>
      </div>

      {/* Progress feedback bar */}
      {uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#3B82F6' }}>
            <span>⚡ {progressText}</span>
            <span style={{ animation: 'pulse 1.5s infinite' }}>Importing...</span>
          </div>
          {/* Animated loading bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: '#1E293B', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: '40%', height: '100%',
              backgroundColor: '#3B82F6',
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
  border: '1px solid #334155', backgroundColor: '#09090e',
  color: '#F8FAFC', fontSize: '13px', boxSizing: 'border-box'
}
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '5px', fontSize: '11px',
  fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em'
}
const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }
const cardStyle: React.CSSProperties = {
  backgroundColor: '#1a2236', border: '1px solid #2d3f5e',
  borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px'
}
const removeBtn: React.CSSProperties = {
  padding: '4px 10px', fontSize: '11px', backgroundColor: '#EF4444', color: '#fff',
  border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-end', fontWeight: 600
}
const addBtn: React.CSSProperties = {
  padding: '8px 14px', fontSize: '12px', backgroundColor: '#2563EB', color: '#fff',
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
          <FilePicker projectId={projectId} value={cfg.heroImage || ''} onChange={v => set('heroImage', v)} accept="image" label="Hero Background Image" placeholder="Select a hero background image…" />
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
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Click <strong>🖼️ Browse</strong> to pick images from your computer for each gallery entry.</p>
        {images.map((img, i) => (
          <div key={i} style={cardStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Image File</label>
              <FilePicker projectId={projectId} value={img.path} onChange={v => { const a = [...images]; a[i] = { ...a[i], path: v }; setArr('images', a) }} accept="image" label="Gallery Image" placeholder="Select an image file…" />
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
              <FilePicker projectId={projectId} value={item.imagePath || ''} onChange={v => { const a = [...items]; a[i] = { ...a[i], imagePath: v }; setArr('amenities', a) }} accept="image" label="Amenity Image" placeholder="Select an image for this amenity…" />
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
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Click <strong>🎥 Browse</strong> to select .mp4 video files from your computer.</p>
        {videos.map((v, i) => (
          <div key={i} style={cardStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Video File (.mp4 / .mov)</label>
              <FilePicker projectId={projectId} value={v.path} onChange={p => { const a = [...videos]; a[i] = { ...a[i], path: p }; setArr('videos', a) }} accept="video" label="Walkthrough Video" placeholder="Select a video file…" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} value={v.title} onChange={e => { const a = [...videos]; a[i] = { ...a[i], title: e.target.value }; setArr('videos', a) }} placeholder="Grand Lobby Walkthrough" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Thumbnail Image (optional)</label>
                <FilePicker projectId={projectId} value={v.thumbnailPath || ''} onChange={p => { const a = [...videos]; a[i] = { ...a[i], thumbnailPath: p }; setArr('videos', a) }} accept="image" label="Video Thumbnail" placeholder="Select thumbnail image…" />
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
              <FilePicker projectId={projectId} value={c.imagePath || ''} onChange={v => { const a = [...cards]; a[i] = { ...a[i], imagePath: v }; setArr('highlights', a) }} accept="image" label="Highlight Image" placeholder="Select a highlight image…" />
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
          <FilePicker projectId={projectId} value={cfg.mapImagePath || ''} onChange={v => set('mapImagePath', v)} accept="image" label="Location Map Image" placeholder="Select a location map or aerial image…" />
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #2d3f5e' }} />
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, fontWeight: 600 }}>Nearby Connectivity Points</p>
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
        <hr style={{ border: 'none', borderTop: '1px solid #2d3f5e' }} />
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, fontWeight: 600 }}>Price Summary Cards (shown above the unit table)</p>
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
          <FilePicker projectId={projectId} value={cfg.imagePath || ''} onChange={v => set('imagePath', v)} accept="image" label="Master Plan Image" placeholder="Select the master plan image…" />
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
          <FilePicker projectId={projectId} value={cfg.brochurePath || ''} onChange={v => set('brochurePath', v)} accept="pdf" label="Project Brochure PDF" placeholder="Select a PDF brochure file…" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Download Button Label</label>
          <input style={inputStyle} value={cfg.buttonLabel || ''} onChange={e => set('buttonLabel', e.target.value)} placeholder="Download Project Brochure" />
        </div>
      </div>
    )
  }

  // ── FALLBACK: raw JSON editor ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>No visual editor for <strong>{moduleType}</strong> — edit raw JSON below.</p>
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
  personaMode?: string
  sectionsViewed: string
  unitsShortlisted: string
  startedAt: string
  endedAt?: string
  project: { name: string }
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
  firmContactPhone: string
  firmContactEmail: string
  firmWebsite: string
  disclaimerText: string
}

export default function AdminRoute(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'projects' | 'modules' | 'media' | 'units' | 'sessions' | 'leads' | 'settings'>('projects')
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
  const [accentColor, setAccentColor] = useState('#1A73E8')
  const [fontPairing, setFontPairing] = useState('Inter')

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

  // Session & Lead list state
  const [sessions, setSessions] = useState<SessionLog[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  // Global settings state
  const [settings, setSettings] = useState<Settings>({
    firmName: '',
    firmContactPhone: '',
    firmContactEmail: '',
    firmWebsite: '',
    disclaimerText: ''
  })
  const [adminPinInput, setAdminPinInput] = useState('')

  useEffect(() => {
    loadProjects()
    loadSessions()
    loadLeads()
    loadSettings()
  }, [])

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
        setSettings(config as Settings)
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
    setAccentColor(project.themeAccentColor)
    setFontPairing(project.themeFontPairing || 'Inter')
    
    // Load modules & media for this selected project
    loadModules(project.id)
    loadMedia(project.id)
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
    setAccentColor('#1A73E8')
    setFontPairing('Inter')
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
        // Mock creating a tower or use transaction. Since unit upsert schema needs towerId, let's notify user to import via CSV or handle it
        alert('Tower not found. Please use bulk CSV importer to register towers first, or import units.')
        return
      }

      await (window as any).api.invoke(IPC_CHANNELS.UNIT_UPSERT, {
        towerId,
        floor: Number(floorNumber),
        unitNumber,
        configuration: unitConfig,
        carpetArea: Number(carpetArea),
        builtUpArea: Number(builtUpArea),
        superBuiltUpArea: Number(superBuiltUpArea),
        facing: unitFacing,
        price: Number(unitPrice),
        priceLabel,
        status: unitStatus,
        notes: unitNotes
      })

      alert('Unit record created successfully!')
      setUnitNumber('')
      setUnitPrice(0)
    } catch (err: any) {
      alert(`Error saving unit: ${err.message}`)
    }
  }

  // Settings action
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        firmName: settings.firmName,
        firmContactPhone: settings.firmContactPhone,
        firmContactEmail: settings.firmContactEmail,
        firmWebsite: settings.firmWebsite,
        disclaimerText: settings.disclaimerText
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
                backgroundColor: activeTab === id ? 'var(--color-accent-dim)' : 'transparent',
                color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
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
        </header>

        {/* CONTENT CONTAINER */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          
          {/* TAB 1: PROJECTS */}
          {activeTab === 'projects' && (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
              {/* Projects List sidebar */}
              <div style={{ backgroundColor: '#111119', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>Property Catalog</h4>
                  <button onClick={startNewProjectMode} style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#10B981', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
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
                        backgroundColor: selectedProjectId === p.id && isEditing ? '#3B82F6' : '#1E293B',
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
              <form onSubmit={handleProjectSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                <h3 style={{ gridColumn: 'span 2', margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                  {isEditing ? `Modify Project: ${name}` : 'Register New Kiosk Property Showcase'}
                </h3>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Project Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Developer Name</label>
                  <input value={developer} onChange={e => setDeveloper(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>RERA Registration Number</label>
                  <input value={reraNumber} onChange={e => setReraNumber(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Price Min (INR)</label>
                  <input type="number" value={priceMin} onChange={e => setPriceMin(Number(e.target.value))} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Price Max (INR)</label>
                  <input type="number" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Project Type</label>
                  <select value={projectType} onChange={e => setProjectType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }}>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="MIXED_USE">Mixed Use</option>
                    <option value="PLOTTED_DEVELOPMENT">Plotted Development</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Possession Status</label>
                  <select value={possessionStatus} onChange={e => setPossessionStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }}>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    <option value="READY">Ready to Move</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Possession Date (Text Description)</label>
                  <input value={possessionDate} onChange={e => setPossessionDate(e.target.value)} placeholder="E.g. Dec 2026" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Sort Order</label>
                  <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Accent Theme Color</label>
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '60px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="isFeatured" style={{ fontSize: '13px', cursor: 'pointer' }}>Highlight as Featured Property</label>
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  {isEditing && (
                    <button type="button" onClick={handleArchiveProject} style={{ padding: '10px 20px', backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      Archive Project
                    </button>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                    <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
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
              <div style={{ backgroundColor: '#111119', padding: '20px 24px', borderRadius: '8px', border: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap' }}>Add Module to Project</h3>
                <select
                  value={moduleAddType}
                  onChange={e => setModuleAddType(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#fff', fontSize: '13px', flex: 1, minWidth: '200px' }}
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
                  style={{ padding: '8px 20px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  + Add Module
                </button>
              </div>

              <div style={{ backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Property Modules Registry Layout</h3>
              
              {!selectedProjectId ? (
                <div style={{ color: '#94A3B8', textAlign: 'center', padding: '24px' }}>Please select a project first</div>
              ) : modules.length === 0 ? (
                <div style={{ color: '#94A3B8', textAlign: 'center', padding: '48px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '48px' }}>📦</span>
                  <p style={{ margin: 0, fontSize: '14px' }}>No modules configured yet.</p>
                  <p style={{ margin: 0, fontSize: '12px' }}>Use the panel above to add modules to this project.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {modules.map((mod, idx) => (
                    <div key={mod.id} style={{
                      backgroundColor: '#1E293B',
                      border: editingModuleId === mod.id ? '1px solid #3B82F6' : '1px solid #334155',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      {/* Module header row */}
                      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: editingModuleId === mod.id ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--project-accent)', fontSize: '14px' }}>{mod.moduleType.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#0F172A', padding: '2px 8px', borderRadius: '20px' }}>Order {mod.sortOrder}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: mod.isVisible ? '#10B981' : '#64748B' }}>
                            <input type="checkbox" checked={mod.isVisible} onChange={() => handleToggleModuleVisibility(mod)} />
                            {mod.isVisible ? 'Visible on Kiosk' : 'Hidden'}
                          </label>
                          <button onClick={() => handleMoveModule(idx, 'UP')} disabled={idx === 0} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#fff' }}>▲</button>
                          <button onClick={() => handleMoveModule(idx, 'DOWN')} disabled={idx === modules.length - 1} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#fff' }}>▼</button>
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
                              backgroundColor: editingModuleId === mod.id ? '#64748B' : '#2563EB',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fff',
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
                        <div style={{ padding: '20px', borderTop: '1px solid #334155', backgroundColor: '#0F1829', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <ModuleConfigEditor
                            moduleType={mod.moduleType}
                            configJson={moduleConfigInput}
                            onChange={setModuleConfigInput}
                            projectId={selectedProjectId}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                            <button
                              onClick={() => setEditingModuleId('')}
                              style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              Discard
                            </button>
                            <button
                              onClick={() => handleSaveModuleConfig(mod)}
                              style={{ padding: '8px 20px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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
              <div style={{ backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Project Storage Library</h3>
                {!selectedProjectId ? (
                  <div style={{ color: '#94A3B8', textAlign: 'center' }}>Select project context</div>
                ) : mediaList.length === 0 ? (
                  <div style={{ color: '#94A3B8', textAlign: 'center', padding: '24px' }}>No media files linked. Use the uploader sidebar to upload files.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                    {mediaList.map((m) => (
                      <div key={m.id} style={{
                        backgroundColor: '#1E293B',
                        borderRadius: '6px',
                        border: '1px solid #334155',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {m.category !== 'VIDEO' && m.category !== 'AUDIO' && m.thumbnailPath ? (
                          <img src={toMediaUrl(m.thumbnailPath)} alt={m.originalName} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ height: '100px', backgroundColor: '#09090e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                            {m.category === 'VIDEO' ? '🎥' : '🎵'}
                          </div>
                        )}
                        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>{m.originalName}</span>
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>{m.category}</span>
                          <button
                            onClick={() => handleDeleteMedia(m.id)}
                            style={{
                              marginTop: 'auto', padding: '4px', backgroundColor: '#EF4444', border: 'none',
                              borderRadius: '4px', color: '#fff', fontSize: '10px', cursor: 'pointer', fontWeight: 600
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
              <form onSubmit={handleUploadMedia} style={{ backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Import New Media Element</h4>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Select File</label>
                  <FilePicker
                    value={uploadFilePath}
                    onChange={setUploadFilePath}
                    accept={
                      uploadCategory === 'VIDEO' || uploadCategory === 'INTRO_VIDEO' ? 'video' :
                      uploadCategory === 'AUDIO' ? 'audio' : 'image'
                    }
                    label="Media File"
                    placeholder="Click Browse to select a file from your computer…"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }}
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
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Search tags</label>
                  <input
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="E.g. bedroom, entrance"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }}
                  />
                </div>
                <button type="submit" style={{ padding: '10px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
                  Store Media
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: UNITS */}
          {activeTab === 'units' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              {/* CSV Import */}
              <div style={{ backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Bulk Unit CSV Import</h3>
                <p style={{ margin: '0 0 16px 0', color: '#94A3B8', fontSize: '12px' }}>
                  Format columns: <code>towerName,floor,unitNumber,configuration,carpetArea,builtUpArea,superBuiltUpArea,facing,price,priceLabel,status,notes</code>
                </p>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="Tower A,5,A-501,4BHK,2450,4050,0,East,16500000,OFFICIAL,AVAILABLE,Luxury pool view"
                  rows={10}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '6px',
                    border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF',
                    fontFamily: 'monospace', fontSize: '12px', resize: 'vertical', marginBottom: '16px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#38BDF8' }}>{importStatus}</span>
                  <button onClick={handleCsvImport} style={{ padding: '10px 20px', backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                    Bulk Import
                  </button>
                </div>
              </div>

              {/* Single Unit Form */}
              <form onSubmit={handleSingleUnitSubmit} style={{ backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Create Single Unit Record</h4>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Tower Name *</label>
                  <input value={towerName} onChange={(e) => setTowerName(e.target.value)} placeholder="Block A" required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Floor Number *</label>
                  <input type="number" value={floorNumber} onChange={(e) => setFloorNumber(Number(e.target.value))} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Unit Number *</label>
                  <input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="A-101" required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Configuration</label>
                  <input value={unitConfig} onChange={(e) => setUnitConfig(e.target.value)} placeholder="3BHK" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Carpet Area</label>
                    <input type="number" value={carpetArea} onChange={(e) => setCarpetArea(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Built Up Area</label>
                    <input type="number" value={builtUpArea} onChange={(e) => setBuiltUpArea(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Super Area</label>
                    <input type="number" value={superBuiltUpArea} onChange={(e) => setSuperBuiltUpArea(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Price (INR) *</label>
                    <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Price Label</label>
                    <select value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }}>
                      <option value="OFFICIAL">Official</option>
                      <option value="ESTIMATED">Estimated</option>
                      <option value="INDICATIVE">Indicative</option>
                      <option value="SUBJECT_TO_CONFIRMATION">Subject to Confirmation</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Unit Facing</label>
                  <input value={unitFacing} onChange={(e) => setUnitFacing(e.target.value)} placeholder="East" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Status</label>
                  <select value={unitStatus} onChange={(e) => setUnitStatus(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }}>
                    <option value="AVAILABLE">Available</option>
                    <option value="HELD">Held</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#94A3B8' }}>Notes</label>
                  <input value={unitNotes} onChange={(e) => setUnitNotes(e.target.value)} placeholder="E.g. Pool view" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }} />
                </div>
                <button type="submit" style={{ padding: '8px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', marginTop: '4px', fontSize: '12px' }}>
                  Register Unit
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: SESSIONS */}
          {activeTab === 'sessions' && (
            <div style={{ backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Interactive Presentation Session Logs</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
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
                        <tr key={s.id} style={{ borderBottom: '1px solid #1E293B' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{s.project?.name}</td>
                          <td style={{ padding: '12px' }}>{s.personaMode || 'Not specified'}</td>
                          <td style={{ padding: '12px' }}>{new Date(s.startedAt).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>{dur}</td>
                          <td style={{ padding: '12px', color: '#38BDF8' }}>{viewsCount} sections</td>
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
            <div style={{ backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Captured Customer Leads</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
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
                      <tr key={l.id} style={{ borderBottom: '1px solid #1E293B' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{l.name}</td>
                        <td style={{ padding: '12px' }}>{l.phone}</td>
                        <td style={{ padding: '12px' }}>{l.email || 'N/A'}</td>
                        <td style={{ padding: '12px', color: '#10B981' }}>{l.project?.name || 'General interest'}</td>
                        <td style={{ padding: '12px' }}>{new Date(l.capturedAt).toLocaleString()}</td>
                        <td style={{ padding: '12px', color: '#94A3B8' }}>{l.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B', maxWidth: '600px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>Global Firm Configuration</h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Company Name</label>
                <input value={settings.firmName} onChange={(e) => setSettings({ ...settings, firmName: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Contact Phone</label>
                  <input value={settings.firmContactPhone} onChange={(e) => setSettings({ ...settings, firmContactPhone: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Website</label>
                  <input value={settings.firmWebsite} onChange={(e) => setSettings({ ...settings, firmWebsite: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Contact Email</label>
                <input value={settings.firmContactEmail} onChange={(e) => setSettings({ ...settings, firmContactEmail: e.target.value })} type="email" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Kiosk Footer Disclaimer Text</label>
                <textarea value={settings.disclaimerText} onChange={(e) => setSettings({ ...settings, disclaimerText: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', resize: 'vertical' }} />
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '16px', marginTop: '8px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Change Admin Security PIN</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current PIN"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF' }}
                />
              </div>

              <button type="submit" style={{ padding: '12px', backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', alignSelf: 'flex-end' }}>
                Save branding Settings
              </button>
            </form>
          )}

        </div>
      </main>
    </div>
  )
}
