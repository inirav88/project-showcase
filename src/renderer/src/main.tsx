import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import KioskRoute from './routes/KioskRoute'
import AdminRoute from './routes/AdminRoute'
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner'
import './assets/index.css'
import './assets/accessibility-fixes.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UpdateNotificationBanner />
      <Routes>
        <Route path="/kiosk/*" element={<KioskRoute />} />
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="*" element={<KioskRoute />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
