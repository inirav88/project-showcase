import { Routes, Route } from 'react-router-dom'
import ProjectLauncher from '../pages/kiosk/ProjectLauncher'
import ProjectShowcase from '../pages/kiosk/ProjectShowcase'
import PresenterConsole from '../pages/kiosk/PresenterConsole'

import { StartupLockGate } from '../components/kiosk/StartupLockGate'

export default function KioskRoute(): JSX.Element {
  return (
    <Routes>
      <Route index element={<StartupLockGate><ProjectLauncher /></StartupLockGate>} />
      <Route path="project/:projectId" element={<StartupLockGate><ProjectShowcase /></StartupLockGate>} />
      <Route path="presenter/:projectId" element={<PresenterConsole />} />
    </Routes>
  )
}

