require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3004
const API_KEY = process.env.API_KEY || 'salesstudio-secret-key-2026'
const DATA_FILE = path.join(__dirname, 'store.json')

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Middleware to verify API key
function authMiddleware(req, res, next) {
  const reqKey = req.headers['x-api-key']
  if (API_KEY && reqKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' })
  }
  next()
}

// Load in-memory catalog store
function loadStore() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    } catch (e) {
      console.error('Error reading store.json, re-initializing:', e.message)
    }
  }
  return {
    contentVersion: '0',
    changedSince: new Date().toISOString(),
    projects: [],
    towers: [],
    units: [],
    modules: [],
    highlights: [],
    amenities: []
  }
}

// Save catalog store
function saveStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

let store = loadStore()

// 1. GET /api/manifest -> Returns current version
app.get('/api/manifest', authMiddleware, (req, res) => {
  res.json({
    contentVersion: store.contentVersion,
    changedSince: store.changedSince
  })
})

// 2. GET /api/sync -> Returns published delta/full catalog
app.get('/api/sync', authMiddleware, (req, res) => {
  res.json({
    projects: store.projects || [],
    towers: store.towers || [],
    units: store.units || [],
    modules: store.modules || [],
    highlights: store.highlights || [],
    amenities: store.amenities || []
  })
})

// 3. POST /api/publish -> Master admin pushes new catalog updates
app.post('/api/publish', authMiddleware, (req, res) => {
  const { projects, towers, units, modules, highlights, amenities, contentVersion } = req.body
  const newVersion = contentVersion || Date.now().toString()

  store = {
    contentVersion: newVersion,
    changedSince: new Date().toISOString(),
    projects: projects || [],
    towers: towers || [],
    units: units || [],
    modules: modules || [],
    highlights: highlights || [],
    amenities: amenities || []
  }

  saveStore(store)
  console.log(`[Publish] Received update from admin. New version: ${newVersion}`)

  res.json({
    success: true,
    contentVersion: newVersion,
    message: 'Catalog published to VPS successfully'
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'ShowcaseOS Sync VPS Server', version: store.contentVersion })
})

app.listen(PORT, () => {
  console.log(`🚀 ShowcaseOS VPS Sync Server running on port ${PORT}`)
  console.log(`🔑 Configured API Key: ${API_KEY}`)
})
