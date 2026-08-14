import React, { useState, useEffect } from 'react'
import { IPC_CHANNELS } from '../../../main/ipc/channels'

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
      backgroundColor: '#09090e',
      color: '#F8FAFC',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* SIDEBAR TABS SELECTOR */}
      <aside style={{
        width: '260px',
        borderRight: '1px solid #1E293B',
        backgroundColor: '#111119',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        gap: '24px',
        flexShrink: 0
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--project-accent)' }}>ShowcaseOS</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Control Center
          </p>
        </div>

        {/* Sidebar Nav Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {(['projects', 'modules', 'media', 'units', 'sessions', 'leads', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: activeTab === tab ? '#3B82F6' : 'transparent',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                textTransform: 'capitalize',
                transition: 'background-color 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Selected Project Quick Display */}
        {selectedProjectId && (
          <div style={{
            backgroundColor: '#1E293B',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ color: '#94A3B8', fontSize: '10px', textTransform: 'uppercase' }}>Active Project</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>{name || 'Loading...'}</span>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        
        {/* TOP BAR / PROJECT selector */}
        <header style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#111119'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, textTransform: 'capitalize' }}>
              {activeTab} Management
            </h2>
            <p style={{ margin: '2px 0 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Configure property databases and parameters
            </p>
          </div>

          {/* Project Selector (only for tabs that need a project context) */}
          {['projects', 'modules', 'media', 'units'].includes(activeTab) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>Select Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  const proj = projects.find((p) => p.id === e.target.value)
                  if (proj) selectProject(proj)
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
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
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          
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
            <div style={{ backgroundColor: '#111119', padding: '24px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Property Modules Registry Layout</h3>
              
              {!selectedProjectId ? (
                <div style={{ color: '#94A3B8', textAlign: 'center', padding: '24px' }}>Please select a project first</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {modules.map((mod, idx) => (
                    <div key={mod.id} style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--project-accent)' }}>{mod.moduleType}</span>
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sort Order: {mod.sortOrder}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <label style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="checkbox" checked={mod.isVisible} onChange={() => handleToggleModuleVisibility(mod)} />
                            Visible on Kiosk
                          </label>
                          <button onClick={() => handleMoveModule(idx, 'UP')} disabled={idx === 0} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>▲</button>
                          <button onClick={() => handleMoveModule(idx, 'DOWN')} disabled={idx === modules.length - 1} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>▼</button>
                          <button
                            onClick={() => {
                              if (editingModuleId === mod.id) {
                                setEditingModuleId('')
                              } else {
                                setEditingModuleId(mod.id)
                                setModuleConfigInput(mod.config)
                              }
                            }}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#2563EB',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            {editingModuleId === mod.id ? 'Cancel' : 'Edit Config'}
                          </button>
                        </div>
                      </div>

                      {editingModuleId === mod.id && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#94A3B8' }}>Configuration parameters (JSON string)</label>
                          <textarea
                            value={moduleConfigInput}
                            onChange={(e) => setModuleConfigInput(e.target.value)}
                            rows={4}
                            style={{
                              width: '100%', padding: '10px', borderRadius: '4px',
                              backgroundColor: '#09090e', color: '#fff', fontFamily: 'monospace', fontSize: '12px',
                              border: '1px solid #334155'
                            }}
                          />
                          <button
                            onClick={() => handleSaveModuleConfig(mod)}
                            style={{
                              padding: '8px 16px', backgroundColor: '#10B981', color: '#fff',
                              border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer',
                              alignSelf: 'flex-end'
                            }}
                          >
                            Save Config
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                          <img src={`file://${m.thumbnailPath}`} alt={m.originalName} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
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
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94A3B8' }}>Local File Path (Absolute)</label>
                  <input
                    value={uploadFilePath}
                    onChange={(e) => setUploadFilePath(e.target.value)}
                    placeholder="C:\path\to\file.jpg"
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#09090e', color: '#FFF', fontSize: '12px' }}
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
