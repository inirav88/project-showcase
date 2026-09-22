import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import KioskRoute from './routes/KioskRoute'
import AdminRoute from './routes/AdminRoute'
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner'
import { ErrorBoundary } from './components/ErrorBoundary'
import './assets/index.css'
import './assets/accessibility-fixes.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="ShowcaseOS Application Error">
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary fallbackTitle="Software Update Banner Error">
          <UpdateNotificationBanner />
        </ErrorBoundary>
        <Routes>
          <Route path="/kiosk/*" element={<ErrorBoundary fallbackTitle="Kiosk View Error"><KioskRoute /></ErrorBoundary>} />
          <Route path="/admin/*" element={<ErrorBoundary fallbackTitle="Admin Panel Error"><AdminRoute /></ErrorBoundary>} />
          <Route path="*" element={<ErrorBoundary fallbackTitle="Kiosk View Error"><KioskRoute /></ErrorBoundary>} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
