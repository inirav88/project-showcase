import { Routes, Route } from 'react-router-dom'
import ProjectLauncher from '../pages/kiosk/ProjectLauncher'
import ProjectShowcase from '../pages/kiosk/ProjectShowcase'

export default function KioskRoute(): JSX.Element {
  return (
    <Routes>
      <Route index element={<ProjectLauncher />} />
      <Route path="project/:projectId" element={<ProjectShowcase />} />
    </Routes>
  )
}
