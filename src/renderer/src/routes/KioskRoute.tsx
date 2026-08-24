import { Routes, Route } from 'react-router-dom'
import ProjectLauncher from '../pages/kiosk/ProjectLauncher'
import ProjectShowcase from '../pages/kiosk/ProjectShowcase'
import PresenterConsole from '../pages/kiosk/PresenterConsole'

export default function KioskRoute(): JSX.Element {
  return (
    <Routes>
      <Route index element={<ProjectLauncher />} />
      <Route path="project/:projectId" element={<ProjectShowcase />} />
      <Route path="presenter/:projectId" element={<PresenterConsole />} />
    </Routes>
  )
}

