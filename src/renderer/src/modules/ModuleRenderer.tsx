import { Suspense, useEffect, useState } from 'react'
import { moduleRegistry, isRegisteredModule } from './registry'
import UnknownModule from './UnknownModule'
import { IPC_CHANNELS } from '../../../main/ipc/channels'

interface ModuleRecord {
  id: string
  moduleType: string
  config: string
  sortOrder: number
  isVisible: boolean
}

interface Props {
  projectId: string
}

export default function ModuleRenderer({ projectId }: Props): JSX.Element {
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.api
      .invoke(IPC_CHANNELS.MODULE_LIST, projectId)
      .then((data) => {
        const records = (data as ModuleRecord[]).filter((m) => m.isVisible)
        setModules(records)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return <div className="loading">Loading project components…</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {modules.map((mod) => {
        let config: Record<string, any> = {}
        try {
          config = JSON.parse(mod.config)
        } catch (e) {
          console.error(`Invalid JSON configuration for module ${mod.id}:`, e)
        }

        if (!isRegisteredModule(mod.moduleType)) {
          return <UnknownModule key={mod.id} type={mod.moduleType} />
        }

        const Component = moduleRegistry[mod.moduleType]
        return (
          <div id={`module-${mod.moduleType}`} key={mod.id}>
            <Suspense fallback={<div className="loading">Loading component…</div>}>
              <Component config={config} projectId={projectId} />
            </Suspense>
          </div>
        )
      })}
    </div>
  )
}
