import React, { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

const cardStyle: React.CSSProperties = { backgroundColor: 'var(--color-surface-raised)', padding: 24, borderRadius: 8, border: '1px solid var(--color-border)' }

// ---- STAFF TAB ----
interface StaffMember { id: string; name: string; isActive: boolean; createdAt: string }
export function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [saving, setSaving] = useState(false)
  const load = async () => { const list = await (window as any).api.invoke(IPC_CHANNELS.STAFF_LIST); setStaff((list as StaffMember[]) || []) }
  useEffect(() => { load() }, [])
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { alert('Name required and PIN must be exactly 4 digits'); return }
    setSaving(true)
    try { await (window as any).api.invoke(IPC_CHANNELS.STAFF_CREATE, { name: newName, pin: newPin }); setNewName(''); setNewPin(''); await load() }
    finally { setSaving(false) }
  }
  const inputStyle: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', boxSizing: 'border-box' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px' }}>Staff Members</h3>
        {staff.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No staff added yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Added</th>
              <th style={{ padding: 10 }}>Actions</th>
            </tr></thead>
            <tbody>{staff.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 10, fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: 10 }}><span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: s.isActive ? '#16a34a' : '#dc2626' }}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                <td style={{ padding: 10, color: 'var(--color-text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={async () => { await (window as any).api.invoke(IPC_CHANNELS.STAFF_TOGGLE_ACTIVE, s.id); load() }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>{s.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={async () => { if (!confirm('Delete this staff member?')) return; await (window as any).api.invoke(IPC_CHANNELS.STAFF_DELETE, s.id); load() }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px' }}>Add Staff Member</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
          <div><label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Full Name *</label><input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder='e.g. Raj Patel' style={inputStyle} /></div>
          <div><label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>4-Digit Staff PIN *</label><input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g,'').slice(0,4))} required type='password' maxLength={4} placeholder='- - - -' style={{ ...inputStyle, letterSpacing: 8 }} /></div>
          <button type='submit' disabled={saving} style={{ padding: '10px 20px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', fontFamily: 'var(--font-sans)' }}>{saving ? 'Saving...' : 'Add Staff Member'}</button>
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
