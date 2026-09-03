import React, { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'
import SalesStudioLogo from '../common/SalesStudioLogo'
import { toMediaUrl } from '../../utils/media'

interface StaffMember {
  id: string
  name: string
  role?: string
}

export function StartupLockGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('showcaseos_unlocked') === 'true'
  })
  const [loading, setLoading] = useState(true)
  const [securityMode, setSecurityMode] = useState<'DISABLED' | 'STAFF_PIN' | 'MASTER_PIN'>('DISABLED')
  const [settings, setSettings] = useState<any>(null)

  // Staff Login State
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [staffPin, setStaffPin] = useState('')
  const [staffError, setStaffError] = useState('')

  // Master PIN State
  const [masterPinDigits, setMasterPinDigits] = useState<string[]>([])
  const [masterError, setMasterError] = useState('')

  useEffect(() => {
    if (unlocked) {
      setLoading(false)
      return
    }

    window.api.invoke(IPC_CHANNELS.SETTINGS_GET)
      .then((s: any) => {
        setSettings(s)
        const mode = (s?.startupSecurityMode as any) || 'DISABLED'
        setSecurityMode(mode)

        if (mode === 'DISABLED') {
          sessionStorage.setItem('showcaseos_unlocked', 'true')
          setUnlocked(true)
        } else if (mode === 'STAFF_PIN') {
          window.api.invoke(IPC_CHANNELS.STAFF_LIST)
            .then((list: any) => {
              const active = (list as StaffMember[]) || []
              setStaffList(active)
              if (active.length > 0) setSelectedStaffId(active[0].id)
            })
            .catch(console.error)
        }
      })
      .catch(() => {
        setUnlocked(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [unlocked])

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) { setStaffError('Select a profile'); return }
    if (staffPin.length !== 4) { setStaffError('Enter 4-digit PIN'); return }

    try {
      const res = await (window as any).api.invoke(IPC_CHANNELS.STAFF_VERIFY_PIN, { id: selectedStaffId, pin: staffPin })
      if (res && res.valid) {
        sessionStorage.setItem('showcaseos_unlocked', 'true')
        setUnlocked(true)
      } else {
        setStaffError('Incorrect 4-digit PIN')
        setStaffPin('')
      }
    } catch {
      setStaffError('Verification failed')
    }
  }

  const handleMasterKey = async (digit: string) => {
    if (digit === '⌫') { setMasterPinDigits((p) => p.slice(0, -1)); setMasterError(''); return }
    const next = [...masterPinDigits, digit]
    setMasterPinDigits(next)
    if (next.length === 4) {
      try {
        const isValid = await (window as any).api.invoke(IPC_CHANNELS.SETTINGS_VERIFY_PIN, next.join(''))
        if (isValid) {
          sessionStorage.setItem('showcaseos_unlocked', 'true')
          setUnlocked(true)
        } else {
          setMasterError('Incorrect Master PIN')
          setMasterPinDigits([])
        }
      } catch {
        setMasterError('Verification failed')
        setMasterPinDigits([])
      }
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>Loading Showcase OS…</div>
  }

  if (unlocked || securityMode === 'DISABLED') {
    return <>{children}</>
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, fontFamily: 'var(--font-sans)' }}>
      {securityMode === 'STAFF_PIN' ? (
        <form onSubmit={handleStaffLogin} style={{ backgroundColor: 'var(--color-surface)', padding: '36px 32px', borderRadius: 20, width: 380, border: '1px solid var(--color-border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              {settings?.firmLogoPath ? (
                <img src={toMediaUrl(settings.firmLogoPath)} alt="Company Logo" style={{ height: 44, maxWidth: 220, objectFit: 'contain' }} />
              ) : (
                <SalesStudioLogo height={44} />
              )}
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {settings?.firmName ? `Welcome to ${settings.firmName}` : 'Welcome to SalesStudio'}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Select your profile and enter your PIN to start</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Select Staff Profile</label>
            <select
              value={selectedStaffId}
              onChange={(e) => { setSelectedStaffId(e.target.value); setStaffError(''); setStaffPin('') }}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600 }}
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.role === 'SUPERADMIN' ? '👑' : s.role === 'ADMIN' ? '🛡️' : '👤'} {s.name} ({s.role || 'AGENT'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Enter 4-Digit Security PIN</label>
            <input
              type="password"
              maxLength={4}
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', textAlign: 'center', fontSize: 24, letterSpacing: '0.4em' }}
              autoFocus
            />
          </div>

          {staffError && (
            <div style={{ fontSize: 13, color: 'var(--color-error, #ef4444)', textAlign: 'center', fontWeight: 600 }}>{staffError}</div>
          )}

          <button
            type="submit"
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'var(--color-accent)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}
          >
            Unlock & Start Kiosk
          </button>
        </form>
      ) : (
        <div className="pin-modal" style={{ maxWidth: 360, textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {settings?.firmLogoPath ? (
              <img src={toMediaUrl(settings.firmLogoPath)} alt="Company Logo" style={{ height: 40, maxWidth: 200, objectFit: 'contain' }} />
            ) : (
              <SalesStudioLogo height={40} />
            )}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Kiosk Startup Protection
          </div>
          <div style={{ fontSize: 16, color: 'var(--color-text-primary)', fontWeight: 700, marginBottom: 16 }}>
            Enter Master Admin PIN
          </div>
          <div className="pin-display">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`pin-dot${masterPinDigits[i] !== undefined ? ' filled' : ''}`} />
            ))}
          </div>
          {masterError && (
            <div style={{ fontSize: 13, color: 'var(--color-error, #ef4444)', textAlign: 'center', fontWeight: 600, margin: '8px 0' }}>
              {masterError}
            </div>
          )}
          <div className="pin-keypad">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
              key === '' ? <div key={i} /> : (
                <button key={key + i} className="pin-key" onClick={() => handleMasterKey(key)}>{key}</button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
