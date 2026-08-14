import React, { useState, useEffect } from 'react'

interface Project {
  id: string
  name: string
  developer: string
  reraNumber: string
  location: string
  description: string
  type: string
  status: string
  priceRangeMin: number
  priceRangeMax: number
  themeAccentColor: string
  themeFontPairing: string
}

export default function AdminRoute(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'projects' | 'units'>('projects')
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
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(0)
  const [accentColor, setAccentColor] = useState('#1A73E8')
  
  // CSV Import State
  const [csvContent, setCsvContent] = useState('')
  const [importStatus, setImportStatus] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const list = await (window as any).api.invoke('project:list')
      setProjects(list || [])
      if (list && list.length > 0 && !selectedProjectId) {
        selectProject(list[0])
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
    setPriceMin(project.priceRangeMin)
    setPriceMax(project.priceRangeMax)
    setAccentColor(project.themeAccentColor)
  }

  const startNewProjectMode = () => {
    setIsEditing(false)
    setName('')
    setDeveloper('')
    setReraNumber('')
    setLocation('')
    setDescription('')
    setPriceMin(0)
    setPriceMax(0)
    setAccentColor('#1A73E8')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name,
        developer,
        reraNumber,
        location,
        description,
        priceRangeMin: Number(priceMin),
        priceRangeMax: Number(priceMax),
        themeAccentColor: accentColor,
        type: 'RESIDENTIAL',
        status: 'ACTIVE',
        possessionStatus: 'UNDER_CONSTRUCTION'
      }

      if (isEditing) {
        await (window as any).api.invoke('project:update', {
          id: selectedProjectId,
          data: payload
        })
        alert('Project details updated successfully!')
      } else {
        await (window as any).api.invoke('project:create', payload)
        alert('New project created successfully!')
        startNewProjectMode()
      }
      loadProjects()
    } catch (err: any) {
      alert(`Error saving project: ${err.message}`)
    }
  }

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
      const res = await (window as any).api.invoke('unit:bulk-import', {
        projectId: selectedProjectId,
        csvContent
      })
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px'
    }}>
      {/* Header */}
      {!(window as any).api && (
        <div style={{ padding: '12px', backgroundColor: '#EF4444', color: '#FFF', fontWeight: 600, borderRadius: '6px', marginBottom: '16px', textAlign: 'center' }}>
          CRITICAL ERROR: Electron Preload Bridge (window.api) is not defined! Context isolation or preload configuration is failing.
        </div>
      )}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #334155',
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>ShowcaseOS Control Panel</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '14px' }}>Configure offline kiosk parameters and catalog data</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setActiveTab('projects')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'projects' ? '#3B82F6' : '#1E293B',
              border: 'none',
              borderRadius: '6px',
              color: '#FFF',
              cursor: 'pointer',
              fontWeight: 500
            }}>Projects</button>
          <button 
            onClick={() => setActiveTab('units')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'units' ? '#3B82F6' : '#1E293B',
              border: 'none',
              borderRadius: '6px',
              color: '#FFF',
              cursor: 'pointer',
              fontWeight: 500
            }}>CSV Unit Import</button>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
        {/* Sidebar Project List */}
        <div style={{
          width: '280px',
          backgroundColor: '#1E293B',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Projects List</h3>
            <button 
              onClick={startNewProjectMode}
              style={{
                padding: '4px 10px',
                backgroundColor: '#10B981',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}>+ New</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {projects.map(p => (
              <div 
                key={p.id}
                onClick={() => selectProject(p)}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: selectedProjectId === p.id && isEditing ? '#3B82F6' : '#334155',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#CBD5E1' }}>{p.developer}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div style={{
          flex: 1,
          backgroundColor: '#1E293B',
          borderRadius: '8px',
          padding: '24px',
          overflowY: 'auto'
        }}>
          {activeTab === 'projects' && (
            <div>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
                {isEditing ? `Edit Project: ${name}` : 'Create New Showcase Project'}
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94A3B8' }}>Project Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94A3B8' }}>Developer Name</label>
                  <input value={developer} onChange={e => setDeveloper(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94A3B8' }}>RERA Number</label>
                  <input value={reraNumber} onChange={e => setReraNumber(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94A3B8' }}>Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94A3B8' }}>Price Min (INR)</label>
                  <input type="number" value={priceMin} onChange={e => setPriceMin(Number(e.target.value))} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94A3B8' }}>Price Max (INR)</label>
                  <input type="number" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94A3B8' }}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94A3B8' }}>Accent Color</label>
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '60px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }} />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                    {isEditing ? 'Update Project Details' : 'Create Project Record'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'units' && (
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Bulk Unit CSV Import</h2>
              <p style={{ margin: '0 0 16px 0', color: '#94A3B8', fontSize: '14px' }}>
                Paste unit rows below. Format headers: <code>towerName,floor,unitNumber,configuration,carpetArea,builtUpArea,superBuiltUpArea,facing,price,priceLabel,status,notes</code>
              </p>
              <textarea 
                value={csvContent} 
                onChange={e => setCsvContent(e.target.value)} 
                placeholder={`Tower B,12,B-1204,3BHK,1150,1450,1600,North-East,9500000,OFFICIAL,AVAILABLE,Luxury view`}
                rows={12} 
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  backgroundColor: '#0F172A',
                  color: '#FFF',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  resize: 'vertical',
                  marginBottom: '16px'
                }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#38BDF8' }}>{importStatus}</span>
                <button 
                  onClick={handleCsvImport}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#2563EB',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>Start Transactional Import</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
