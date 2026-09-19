import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { toMediaUrl } from '../../utils/media'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface BrochureProps {
  config: Record<string, any>
  projectId: string
}

export default function BrochureModule({ config, projectId }: BrochureProps): JSX.Element {
  const filePath = config.brochurePath || config.filePath || config.url || ''
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

  // Generate QR Code when QR mode or client info changes
  useEffect(() => {
    if (!showShareModal || !project || !settings) return

    const rawPhone = settings.firmContactPhone || ''
    const salesPhone = rawPhone.replace(/\D/g, '')
    const brochureAbsUrl = fileUrl ? new URL(fileUrl, window.location.href).href : ''

    let text = ''
    if (clientPhone) {
      const cleanClientPhone = clientPhone.replace(/\D/g, '')
      const msgTemplate = settings.whatsappMessageTemplate || 'Hi {clientName}, here is the official brochure for {projectName}: {brochureUrl}'
      const msg = msgTemplate
        .replace(/{clientName}/g, clientName || 'Valued Client')
        .replace(/{projectName}/g, project.name || 'Project')
        .replace(/{brochureUrl}/g, brochureAbsUrl || fileUrl)
      text = `https://wa.me/${cleanClientPhone}?text=${encodeURIComponent(msg)}`
    } else {
      const msg = `Hi, please send me the official brochure for ${project.name}`
      text = `https://wa.me/${salesPhone}?text=${encodeURIComponent(msg)}`
    }

    QRCode.toDataURL(text, { width: 160, margin: 1 })
      .then(setQrUrl)
      .catch(console.error)
  }, [showShareModal, clientPhone, clientName, project, settings, fileUrl])

  const handleOpenShareModal = () => {
    // Determine default mode based on admin settings
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
    const brochureAbsUrl = fileUrl ? new URL(fileUrl, window.location.href).href : ''
    const msgTemplate = settings?.whatsappMessageTemplate || 'Hi {clientName}, here is the official brochure for {projectName}: {brochureUrl}'
    const msg = msgTemplate
      .replace(/{clientName}/g, clientName || 'Valued Client')
      .replace(/{projectName}/g, project?.name || 'Project')
      .replace(/{brochureUrl}/g, brochureAbsUrl || fileUrl)

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
      const brochureAbsUrl = fileUrl ? new URL(fileUrl, window.location.href).href : ''
      const res = await window.api.invoke(IPC_CHANNELS.WHATSAPP_SEND_API, {
        phone: clientPhone,
        clientName,
        projectName: project?.name || '',
        brochureUrl: brochureAbsUrl || fileUrl,
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
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <span>{fullscreen ? '📉 Exit Fullscreen' : '⛶ Fullscreen View'}</span>
          </button>

          {/* WhatsApp Share Button */}
          {whatsappEnabled && (
            <button
              type="button"
              onClick={handleOpenShareModal}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#25D366',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>📱 Send on WhatsApp</span>
            </button>
          )}

          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span>📥 {buttonLabel}</span>
          </a>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div
        style={{
          width: '100%',
          height: fullscreen ? '90vh' : '650px',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#1e293b',
          border: '1px solid var(--color-border)',
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
            style={{
              position: 'absolute',
              top: 36,
              right: 36,
              zIndex: 100000,
              padding: '10px 16px',
              borderRadius: 8,
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close Fullscreen ×
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
            border: '1px solid var(--color-border)', width: 440, maxWidth: '95vw',
            padding: 28, display: 'flex', flexDirection: 'column', gap: 16,
            boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  📱 Send Brochure on WhatsApp
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {project?.name ? `Project: ${project.name}` : 'Share digital brochure with client'}
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                ×
              </button>
            </div>

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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                {qrUrl ? (
                  <div style={{ background: '#fff', padding: 10, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
                    <img src={qrUrl} alt="WhatsApp QR Code" style={{ width: 140, height: 140 }} />
                  </div>
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Generating QR...</div>
                )}
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Ask the client to scan this QR code using their phone camera to instantly receive the brochure message on WhatsApp.
                </div>
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