import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { toMediaUrl } from '../../utils/media'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import { ShareIcon, DownloadIcon, CloseIcon } from '../../components/common/Icons'

interface BrochureProps {
  config: Record<string, any>
  projectId: string
}

export function isDocumentUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false
  const clean = url.trim().toLowerCase()
  if (!/^https?:\/\//i.test(clean)) return false
  if (/\.(pdf|doc|docx|ppt|pptx)($|\?|#)/i.test(clean)) return true
  if (
    clean.includes('drive.google.com') ||
    clean.includes('docs.google.com') ||
    clean.includes('dropbox.com') ||
    clean.includes('onedrive.live.com') ||
    clean.includes('1drv.ms') ||
    clean.includes('s3.') ||
    clean.includes('amazonaws.com') ||
    clean.includes('/media/') ||
    clean.includes('/brochure') ||
    clean.includes('/downloads/') ||
    clean.includes('/documents/')
  ) {
    return true
  }
  return false
}

export default function BrochureModule({ config, projectId }: BrochureProps): JSX.Element {
  const filePath = config.brochurePath || config.filePath || config.url || config.pdfUrl || ''
  const buttonLabel = config.buttonLabel || 'Download Project Brochure'
  const fileUrl = filePath ? toMediaUrl(filePath) : ''
  const [fullscreen, setFullscreen] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Settings & Project details
  const [settings, setSettings] = useState<any>(null)
  const [project, setProject] = useState<any>(null)

  // WhatsApp form state
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [qrMode, setQrMode] = useState<'DIRECT_PDF' | 'WHATSAPP'>('DIRECT_PDF')
  const [copiedLink, setCopiedLink] = useState(false)
  const [sendingApi, setSendingApi] = useState(false)
  const [apiFeedback, setApiFeedback] = useState('')
  const [activeTabMode, setActiveTabMode] = useState<'DEEP_LINK' | 'QR_CODE' | 'API_SEND'>('DEEP_LINK')

  useEffect(() => {
    window.api.invoke(IPC_CHANNELS.SETTINGS_GET)
      .then((data: any) => setSettings(data))
      .catch(console.error)

    if (projectId) {
      window.api.invoke(IPC_CHANNELS.PROJECT_GET, projectId)
        .then((data: any) => setProject(data))
        .catch(console.error)
    }
  }, [projectId])

  // Helper to resolve the actual public brochure PDF URL
  const getPublicBrochureUrl = (): string => {
    // 1. Direct explicit document link in config (Google Drive, Dropbox, hosted PDF)
    if (config.publicBrochureUrl && isDocumentUrl(config.publicBrochureUrl)) return config.publicBrochureUrl
    if (config.brochureUrl && isDocumentUrl(config.brochureUrl)) return config.brochureUrl
    if (config.publicUrl && isDocumentUrl(config.publicUrl)) return config.publicUrl
    if (config.webUrl && isDocumentUrl(config.webUrl)) return config.webUrl
    if (filePath && isDocumentUrl(filePath)) return filePath

    // 2. Cloud VPS hosted media file for physical local brochure file
    const vps = settings?.vpsBaseUrl || 'https://showcase.salesstudio.in'
    if (vps && /^https?:\/\//i.test(vps) && filePath) {
      const fileName = filePath.split(/[/\\]/).pop() || ''
      if (fileName) {
        return `${vps.replace(/\/$/, '')}/media/${encodeURIComponent(fileName)}`
      }
    }

    // 3. Fallback to any public document link if present
    if (config.publicUrl && isDocumentUrl(config.publicUrl)) return config.publicUrl
    if (config.webUrl && isDocumentUrl(config.webUrl)) return config.webUrl

    return ''
  }

  // Helper to resolve project website URL (for marketing context alongside the brochure)
  const getProjectWebsiteUrl = (): string => {
    if (config.projectWebUrl && /^https?:\/\//i.test(config.projectWebUrl)) return config.projectWebUrl
    if (config.webUrl && !isDocumentUrl(config.webUrl) && /^https?:\/\//i.test(config.webUrl)) return config.webUrl
    if (config.publicUrl && !isDocumentUrl(config.publicUrl) && /^https?:\/\//i.test(config.publicUrl)) return config.publicUrl
    if (settings?.firmWebsite && /^https?:\/\//i.test(settings.firmWebsite)) return settings.firmWebsite
    return ''
  }

  // Constructs a complete brochure sharing message with PDF link & website
  const buildBrochureMessage = (clientNameStr: string): string => {
    const publicBrochureUrl = getPublicBrochureUrl()
    const websiteUrl = getProjectWebsiteUrl()
    const name = clientNameStr || 'Valued Client'
    const projName = project?.name || 'Project'

    if (publicBrochureUrl) {
      const baseMsg = settings?.whatsappMessageTemplate
        ? settings.whatsappMessageTemplate
            .replace(/{clientName}/g, name)
            .replace(/{projectName}/g, projName)
            .replace(/{brochureUrl}/g, publicBrochureUrl)
        : `Hi ${name}, here is the official brochure for ${projName}: ${publicBrochureUrl}`

      if (websiteUrl && websiteUrl !== publicBrochureUrl && !baseMsg.includes(websiteUrl)) {
        return `${baseMsg}\n🌐 Official Website: ${websiteUrl}`
      }
      return baseMsg
    }

    if (websiteUrl) {
      return `Hi ${name}, here is the official information for ${projName}:\n🌐 Website: ${websiteUrl}`
    }

    return `Hi ${name}, interested in ${projName}. Please send me the official project brochure.`
  }

  // Generate QR Code when QR mode or client info changes
  useEffect(() => {
    if (!showShareModal || !project) return

    const rawPhone = settings?.firmContactPhone || ''
    const salesPhone = rawPhone.replace(/\D/g, '')
    const publicBrochureUrl = getPublicBrochureUrl()

    let text = ''
    if (qrMode === 'DIRECT_PDF' && publicBrochureUrl) {
      // Direct QR code to the actual brochure PDF!
      text = publicBrochureUrl
    } else {
      // WhatsApp message QR code
      const cleanClientPhone = clientPhone.replace(/\D/g, '')
      const msg = buildBrochureMessage(clientName)
      if (cleanClientPhone) {
        text = `https://wa.me/${cleanClientPhone.length === 10 ? '91' + cleanClientPhone : cleanClientPhone}?text=${encodeURIComponent(msg)}`
      } else {
        const deskMsg = `Hi, please send me the official brochure for ${project.name}`
        text = `https://wa.me/${salesPhone}?text=${encodeURIComponent(deskMsg)}`
      }
    }

    QRCode.toDataURL(text, { width: 180, margin: 1 })
      .then(setQrUrl)
      .catch(console.error)
  }, [showShareModal, clientPhone, clientName, project, settings, filePath, config, qrMode])

  const handleOpenShareModal = () => {
    const allowDeepLink = settings?.whatsappAllowDeepLink ?? true
    const allowQrCode = settings?.whatsappAllowQrCode ?? true
    const allowApiSend = settings?.whatsappAllowApiSend ?? false

    if (allowDeepLink) setActiveTabMode('DEEP_LINK')
    else if (allowQrCode) setActiveTabMode('QR_CODE')
    else if (allowApiSend) setActiveTabMode('API_SEND')

    setShowShareModal(true)
  }

  const handleDeepLinkSend = () => {
    if (!clientPhone) {
      alert('Please enter client phone number')
      return
    }
    const cleanPhone = clientPhone.replace(/\D/g, '')
    const msg = buildBrochureMessage(clientName)
    const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
    setShowShareModal(false)
  }

  const handleApiSend = async () => {
    if (!clientPhone) {
      alert('Please enter client phone number')
      return
    }
    setSendingApi(true)
    setApiFeedback('')
    try {
      const publicBrochureUrl = getPublicBrochureUrl()
      const res = await window.api.invoke(IPC_CHANNELS.WHATSAPP_SEND_API, {
        phone: clientPhone,
        clientName,
        projectName: project?.name || '',
        brochureUrl: publicBrochureUrl,
      }) as any

      if (res.success) {
        setApiFeedback('✓ Brochure sent successfully via WhatsApp Cloud API!')
        setTimeout(() => setShowShareModal(false), 1500)
      } else {
        setApiFeedback(`⚠️ Delivery failed: ${res.reason}`)
      }
    } catch (err: any) {
      setApiFeedback(`Error: ${err.message}`)
    } finally {
      setSendingApi(false)
    }
  }

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

  const allowDeepLink = settings?.whatsappAllowDeepLink ?? true
  const allowQrCode = settings?.whatsappAllowQrCode ?? true
  const allowApiSend = settings?.whatsappAllowApiSend ?? false
  const whatsappEnabled = settings?.whatsappEnabled !== false

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

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            className="luxury-btn"
          >
            <span>{fullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}</span>
          </button>

          {/* WhatsApp Share Button */}
          {whatsappEnabled && (
            <button
              type="button"
              onClick={handleOpenShareModal}
              className="luxury-btn"
              style={{
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
              }}
            >
              <ShareIcon size={16} color="#fff" />
              <span>Send on WhatsApp</span>
            </button>
          )}

          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="luxury-btn luxury-btn-primary"
          >
            <DownloadIcon size={16} color="#fff" />
            <span>{buttonLabel}</span>
          </a>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div
        style={{
          width: '100%',
          flex: 1,
          minHeight: fullscreen ? '90vh' : 'calc(100vh - 280px)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface-raised)',
          border: '1.5px solid var(--color-border)',
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
            className="luxury-btn luxury-btn-danger"
            style={{
              position: 'absolute',
              top: 36,
              right: 36,
              zIndex: 100000,
            }}
          >
            <CloseIcon size={16} />
            <span>Close Fullscreen</span>
          </button>
        )}
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          title="Project Brochure PDF Viewer"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>

      {/* WhatsApp Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--backdrop-modal)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100001, padding: 20
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 20,
            border: '1.5px solid var(--color-border)', width: 440, maxWidth: '95vw',
            padding: 28, display: 'flex', flexDirection: 'column', gap: 16,
            boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShareIcon size={18} color="#25D366" />
                  <span>Send Brochure on WhatsApp</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {project?.name ? `Project: ${project.name}` : 'Share digital brochure with client'}
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                aria-label="Close modal"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center',
                  padding: 8, borderRadius: '50%'
                }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {(!config.webUrl && !config.publicUrl) && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                💡 <strong>Tip:</strong> Add a public PDF link in <em>Admin &gt; Modules &gt; Brochure (&quot;Online / Public Brochure Link&quot;)</em> so clients can open/download the brochure directly on their mobile phones.
              </div>
            )}

            {/* Client Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                  Client Name (Optional)
                </label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Nirav Patel"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                  Client WhatsApp Mobile Number *
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)', fontSize: 13 }}
                />
              </div>
            </div>

            {/* Delivery Method Selector Tabs */}
            <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg)', padding: 4, borderRadius: 10 }}>
              {allowDeepLink && (
                <button
                  type="button"
                  onClick={() => setActiveTabMode('DEEP_LINK')}
                  style={{
                    flex: 1, padding: '8px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: activeTabMode === 'DEEP_LINK' ? '#25D366' : 'transparent',
                    color: activeTabMode === 'DEEP_LINK' ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  1-Click Link
                </button>
              )}

              {allowQrCode && (
                <button
                  type="button"
                  onClick={() => setActiveTabMode('QR_CODE')}
                  style={{
                    flex: 1, padding: '8px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: activeTabMode === 'QR_CODE' ? 'var(--color-accent)' : 'transparent',
                    color: activeTabMode === 'QR_CODE' ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  Scan QR Code
                </button>
              )}

              {allowApiSend && (
                <button
                  type="button"
                  onClick={() => setActiveTabMode('API_SEND')}
                  style={{
                    flex: 1, padding: '8px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: activeTabMode === 'API_SEND' ? 'var(--color-accent)' : 'transparent',
                    color: activeTabMode === 'API_SEND' ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  Cloud API Send
                </button>
              )}
            </div>

            {/* Mode Content */}
            {activeTabMode === 'DEEP_LINK' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Opens WhatsApp Web / Desktop app pre-filled with the client's phone and brochure link.
                </div>
                <button
                  type="button"
                  onClick={handleDeepLinkSend}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                    background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                  }}
                >
                  🚀 Launch WhatsApp Chat (1-Click)
                </button>
              </div>
            )}

            {activeTabMode === 'QR_CODE' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                {/* QR Target Sub-selector */}
                <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg)', padding: 3, borderRadius: 8, width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => setQrMode('DIRECT_PDF')}
                    style={{
                      flex: 1, padding: '7px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: qrMode === 'DIRECT_PDF' ? 'var(--color-accent)' : 'transparent',
                      color: qrMode === 'DIRECT_PDF' ? '#fff' : 'var(--color-text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    📄 Direct PDF Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode('WHATSAPP')}
                    style={{
                      flex: 1, padding: '7px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: qrMode === 'WHATSAPP' ? '#25D366' : 'transparent',
                      color: qrMode === 'WHATSAPP' ? '#fff' : 'var(--color-text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    💬 WhatsApp Chat
                  </button>
                </div>

                {qrUrl ? (
                  <div style={{ background: '#fff', padding: 12, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
                    <img src={qrUrl} alt="Brochure QR Code" style={{ width: 160, height: 160, display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ height: 184, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Generating QR...</div>
                )}

                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 360, lineHeight: 1.4 }}>
                  {qrMode === 'DIRECT_PDF' ? (
                    <span>
                      📸 <strong>Scan with Phone Camera:</strong> Instantly opens and downloads the official brochure PDF directly on the client's phone.
                    </span>
                  ) : (
                    <span>
                      💬 <strong>Scan with Phone Camera:</strong> Opens WhatsApp with the official brochure download link and project details.
                    </span>
                  )}
                </div>

                {/* Display destination brochure URL & Copy Button */}
                {getPublicBrochureUrl() && (
                  <div style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    borderRadius: 8, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)',
                    fontSize: 11, color: 'var(--color-text-secondary)'
                  }}>
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getPublicBrochureUrl()}>
                      📄 {getPublicBrochureUrl()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(getPublicBrochureUrl())
                        setCopiedLink(true)
                        setTimeout(() => setCopiedLink(false), 2000)
                      }}
                      style={{
                        padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      {copiedLink ? '✓ Copied' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTabMode === 'API_SEND' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  Sends the brochure media message directly to the client's WhatsApp chat in the background using Meta / Twilio Cloud API.
                </div>
                {apiFeedback && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: apiFeedback.startsWith('✓') ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {apiFeedback}
                  </div>
                )}
                <button
                  type="button"
                  disabled={sendingApi}
                  onClick={handleApiSend}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                    background: 'var(--color-accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: sendingApi ? 'not-allowed' : 'pointer'
                  }}
                >
                  {sendingApi ? 'Sending API Message...' : '⚡ Send via Cloud API'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}