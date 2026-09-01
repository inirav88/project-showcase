import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import KioskRoute from './routes/KioskRoute'
import AdminRoute from './routes/AdminRoute'
import './assets/index.css'
import './assets/accessibility-fixes.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/kiosk/*" element={<KioskRoute />} />
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="*" element={<KioskRoute />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
