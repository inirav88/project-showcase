import React, { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

const cardStyle: React.CSSProperties = { backgroundColor: 'var(--color-surface-raised)', padding: 24, borderRadius: 8, border: '1px solid var(--color-border)' }

// ---- STAFF & USER ROLES TAB ----
interface StaffMember { id: string; name: string; email?: string; phone?: string; role?: string; isActive: boolean; createdAt: string }
export function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<'SUPERADMIN' | 'ADMIN' | 'AGENT'>('AGENT')
  const [newPin, setNewPin] = useState('')
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [editRole, setEditRole] = useState<string>('AGENT')
  const [editPin, setEditPin] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const load = async () => { const list = await (window as any).api.invoke(IPC_CHANNELS.STAFF_LIST); setStaff((list as StaffMember[]) || []) }
  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { alert('Name required and PIN must be exactly 4 digits'); return }
    setSaving(true)
    try {
      await (window as any).api.invoke(IPC_CHANNELS.STAFF_CREATE, {
        name: newName,
        email: newEmail,
        phone: newPhone,
        role: newRole,
        pin: newPin
      })
      setNewName('')
      setNewEmail('')
      setNewPhone('')
      setNewRole('AGENT')
      setNewPin('')
      await load()
    } finally { setSaving(false) }
  }

  const handleUpdateRole = async (s: StaffMember, role: string) => {
    try {
      await (window as any).api.invoke(IPC_CHANNELS.STAFF_UPDATE, { id: s.id, role })
      await load()
    } catch (err: any) {
      alert(`Failed to update user role: ${err.message}`)
    }
  }

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return
    if (editPin.length !== 4 || !/^\d{4}$/.test(editPin)) { alert('PIN must be exactly 4 digits'); return }
    try {
      await (window as any).api.invoke(IPC_CHANNELS.STAFF_UPDATE, { id: editingStaff.id, pin: editPin })
      alert(`PIN updated successfully for ${editingStaff.name}!`)
      setEditingStaff(null)
      setEditPin('')
      await load()
    } catch (err: any) {
      alert(`Failed to reset PIN: ${err.message}`)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', boxSizing: 'border-box' }
  const roleBadgeStyle = (role?: string): React.CSSProperties => {
    if (role === 'SUPERADMIN') return { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: 'rgba(234, 179, 8, 0.15)', color: '#d97706', border: '1px solid rgba(234, 179, 8, 0.4)' }
    if (role === 'ADMIN') return { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.4)' }
    return { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: 'rgba(107, 114, 128, 0.15)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* USER LIST CARD */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0 }}>System Users & Staff Profiles</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
              Manage access permissions. Only <b>SUPERADMIN</b> can configure global firm settings & publish catalog updates to the Cloud VPS.
            </p>
          </div>
        </div>

        {staff.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No users found.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>User Name</th>
                <th style={{ padding: 10, textAlign: 'left' }}>System Role</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Added On</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 10, fontWeight: 600 }}>
                    <div>{s.name}</div>
                    {s.email && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>{s.email}</div>}
                  </td>
                  <td style={{ padding: 10 }}>
                    <select
                      value={s.role || 'AGENT'}
                      onChange={(e) => handleUpdateRole(s, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="SUPERADMIN">👑 SUPERADMIN</option>
                      <option value="ADMIN">🛡️ ADMIN</option>
                      <option value="AGENT">👤 AGENT</option>
                    </select>
                  </td>
                  <td style={{ padding: 10 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: s.isActive ? '#16a34a' : '#dc2626' }}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: 10, color: 'var(--color-text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={() => setEditingStaff(s)}
                      style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      🔑 Reset PIN
                    </button>
                    <button
                      onClick={async () => { await (window as any).api.invoke(IPC_CHANNELS.STAFF_TOGGLE_ACTIVE, s.id); load() }}
                      style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}
                    >
                      {s.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={async () => { if (!confirm(`Delete user ${s.name}?`)) return; await (window as any).api.invoke(IPC_CHANNELS.STAFF_DELETE, s.id); load() }}
                      style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* RESET PIN MODAL */}
      {editingStaff && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={handleResetPin} style={{ backgroundColor: 'var(--color-surface-raised)', padding: 24, borderRadius: 10, width: 340, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ margin: 0, fontSize: 16 }}>Reset PIN for {editingStaff.name}</h4>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>New 4-Digit Security PIN</label>
              <input
                value={editPin}
                onChange={(e) => setEditPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                required
                type="password"
                maxLength={4}
                placeholder="- - - -"
                style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center', fontSize: 18 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="button" onClick={() => setEditingStaff(null)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--color-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Update PIN</button>
            </div>
          </form>
        </div>
      )}

      {/* ADD USER CARD */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px' }}>Create New User Account</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 650 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Full Name *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="e.g. Nirav Sales Admin" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>User Role *</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} style={inputStyle}>
              <option value="SUPERADMIN">👑 SUPERADMIN (Full Access + VPS Push)</option>
              <option value="ADMIN">🛡️ ADMIN (Catalog & Inventory Edit)</option>
              <option value="AGENT">👤 AGENT / STAFF (Presentation Only)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Email Address</label>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="admin@salesstudio.in" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Contact Phone</label>
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+91 9904033395" style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>4-Digit Security PIN *</label>
            <input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g,'').slice(0,4))} required type="password" maxLength={4} placeholder="- - - -" style={{ ...inputStyle, letterSpacing: 8, maxWidth: 200 }} />
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', justifySelf: 'start', fontFamily: 'var(--font-sans)', gridColumn: 'span 2' }}>
            {saving ? 'Creating User...' : 'Create User Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---- APPOINTMENTS TAB ----
interface Appointment { id: string; clientName: string; scheduledAt: string; notes: string }
export function AppointmentsTab() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clientName, setClientName] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const load = async () => { const list = await (window as any).api.invoke(IPC_CHANNELS.APPOINTMENT_LIST); setAppointments((list as Appointment[]) || []) }
  useEffect(() => { load() }, [])
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!clientName || !scheduledAt) return; setSaving(true)
    try { await (window as any).api.invoke(IPC_CHANNELS.APPOINTMENT_CREATE, { clientName, scheduledAt, notes }); setClientName(''); setScheduledAt(''); setNotes(''); await load() }
    finally { setSaving(false) }
  }
  const inputStyle: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', boxSizing: 'border-box' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px' }}>Upcoming Appointments</h3>
        {appointments.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No appointments scheduled.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Client</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Date and Time</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Notes</th>
              <th style={{ padding: 10 }}>Delete</th>
            </tr></thead>
            <tbody>{appointments.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 10, fontWeight: 600 }}>{a.clientName}</td>
                <td style={{ padding: 10 }}>{new Date(a.scheduledAt).toLocaleString()}</td>
                <td style={{ padding: 10, color: 'var(--color-text-muted)' }}>{a.notes || '-'}</td>
                <td style={{ padding: 10, textAlign: 'center' }}><button onClick={async () => { await (window as any).api.invoke(IPC_CHANNELS.APPOINTMENT_DELETE, a.id); load() }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Delete</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px' }}>Schedule New Appointment</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
          <div><label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Client Name *</label><input value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder='e.g. Ramesh Shah' style={inputStyle} /></div>
          <div><label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Date and Time *</label><input type='datetime-local' value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required style={inputStyle} /></div>
          <div><label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Notes</label><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Optional' style={inputStyle} /></div>
          <button type='submit' disabled={saving} style={{ padding: '10px 20px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', fontFamily: 'var(--font-sans)' }}>{saving ? 'Saving...' : 'Schedule Appointment'}</button>
        </form>
      </div>
    </div>
  )
}

// ---- ANALYTICS TAB ----
interface SessionLog { id: string; projectId: string; startedAt: string; endedAt?: string; sectionsViewed: string; unitsShortlisted: string; project?: { name: string } }
export function AnalyticsTab({ sessions }: { sessions: SessionLog[] }) {
  const completed = sessions.filter((s) => s.endedAt)
  const avgMin = completed.length > 0 ? Math.round(completed.reduce((a, s) => a + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()) / 60000, 0) / completed.length) : 0
  const pCount: Record<string, number> = {}; sessions.forEach((s) => { const n = s.project?.name || s.projectId; pCount[n] = (pCount[n] || 0) + 1 })
  const mCount: Record<string, number> = {}; sessions.forEach((s) => { try { (JSON.parse(s.sectionsViewed || '[]') as string[]).forEach((m) => { mCount[m] = (mCount[m] || 0) + 1 }) } catch {/* ignore */} })
  const uCount: Record<string, number> = {}; sessions.forEach((s) => { try { (JSON.parse(s.unitsShortlisted || '[]') as string[]).forEach((u) => { uCount[u] = (uCount[u] || 0) + 1 }) } catch {/* ignore */} })
  const topProj = Object.entries(pCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
  const topMod = Object.entries(mCount).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace('_', ' ') || 'N/A'
  const topUnits = Object.entries(uCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxP = Math.max(1, ...Object.values(pCount))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {([{ label: 'Total Sessions', value: String(sessions.length) }, { label: 'Avg Duration', value: avgMin + ' min' }, { label: 'Top Project', value: topProj }, { label: 'Top Module', value: topMod }] as const).map((c) => (
          <div key={c.label} style={{ ...cardStyle, textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Sessions by Project</h3>
        {Object.entries(pCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
          <div key={name} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{name}</span><span style={{ color: 'var(--color-text-muted)' }}>{count} sessions</span></div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--color-border)' }}><div style={{ height: '100%', borderRadius: 4, background: 'var(--color-accent)', width: ((count / maxP) * 100) + '%' }} /></div>
          </div>
        ))}
      </div>
      {topUnits.length > 0 && (
        <div style={cardStyle}><h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Most Shortlisted Units</h3>
          {topUnits.map(([unitId, count]) => (<div key={unitId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}><span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{unitId.slice(0, 24)}...</span><span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{count}x</span></div>))}
        </div>
      )}
    </div>
  )
}

// ---- BACKUP AND SYNC TAB ----
export function BackupSyncTab() {
  const [syncStatus, setSyncStatus] = useState<{ configured: boolean; lastSyncedAt?: string | null; contentVersion?: string } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const loadStatus = () => { (window as any).api.invoke(IPC_CHANNELS.SYNC_STATUS).then((s: any) => setSyncStatus(s)).catch(() => {}) }
  useEffect(() => { loadStatus() }, [])
  const handleExport = async () => {
    setExporting(true)
    try { const r = await (window as any).api.invoke(IPC_CHANNELS.EXPORT_USB_PACKAGE) as any; if (r.success) alert('Backup saved to: ' + r.filePath); else if (r.reason !== 'Cancelled') alert('Export failed: ' + r.reason) }
    finally { setExporting(false) }
  }
  const handleImport = async () => {
    if (!confirm('ShowcaseOS will auto-backup your current data before importing. Proceed?')) return
    setImporting(true)
    try { const r = await (window as any).api.invoke(IPC_CHANNELS.IMPORT_USB_PACKAGE) as any; if (r.success) alert('Import complete! ' + r.message + '\n\nPlease restart the app.'); else if (r.reason !== 'Cancelled') alert('Import failed: ' + r.reason) }
    finally { setImporting(false) }
  }
  const handleSync = async () => {
    setSyncing(true); setSyncResult(null)
    try {
      const r = await (window as any).api.invoke(IPC_CHANNELS.SYNC_NOW) as any
      setSyncResult(r.success ? '\u2713 Sync complete: ' + (r.message || '') : '\u26A0 Sync failed: ' + r.reason)
      loadStatus()
    } finally { setSyncing(false) }
  }
  const handlePublish = async () => {
    setPublishing(true); setSyncResult(null)
    try {
      const r = await (window as any).api.invoke(IPC_CHANNELS.SYNC_PUBLISH_NOW) as any
      setSyncResult(r.success ? '\u2713 Cloud publish complete. Version: ' + r.contentVersion : '\u26A0 Publish failed: ' + r.reason)
      loadStatus()
    } finally { setPublishing(false) }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 8px' }}>Local Backup (USB or File)</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>Export a complete backup ZIP (database + all media) to USB or local storage. Import is always safe - your current data is auto-backed up before any overwrite.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleExport} disabled={exporting} style={{ padding: '12px 24px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'var(--font-sans)' }}>{exporting ? 'Exporting...' : 'Export Backup ZIP'}</button>
          <button onClick={handleImport} disabled={importing} style={{ padding: '12px 24px', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'var(--font-sans)' }}>{importing ? 'Importing...' : 'Import from Backup'}</button>
        </div>
      </div>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 8px' }}>Cloud Sync & Publishing</h3>
        {syncStatus != null && (
          <div style={{ fontSize: 13, marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: syncStatus.configured ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: '1px solid ' + (syncStatus.configured ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)') }}>
            {syncStatus.configured ? (<span style={{ color: '#16a34a' }}>VPS Configured. Version: {syncStatus.contentVersion || '0'}. Last synced: {syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt).toLocaleString() : 'Never'}</span>) : (<span style={{ color: '#d97706' }}>Cloud sync not configured. Add VPS URL in Settings to enable.</span>)}
          </div>
        )}
        {syncResult && <div style={{ fontSize: 13, marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>{syncResult}</div>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSync} disabled={syncing || !syncStatus?.configured} style={{ padding: '12px 24px', background: syncStatus?.configured ? 'var(--color-accent)' : 'var(--color-surface)', color: syncStatus?.configured ? '#fff' : 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 700, cursor: (syncing || !syncStatus?.configured) ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'var(--font-sans)' }}>{syncing ? 'Syncing...' : 'Sync (Pull Client)'}</button>
          <button onClick={handlePublish} disabled={publishing || !syncStatus?.configured} style={{ padding: '12px 24px', background: syncStatus?.configured ? 'var(--color-accent)' : 'var(--color-surface)', color: syncStatus?.configured ? '#fff' : 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 700, cursor: (publishing || !syncStatus?.configured) ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'var(--font-sans)' }}>{publishing ? 'Publishing...' : 'Publish (Push Admin)'}</button>
        </div>
      </div>
    </div>
)
}
