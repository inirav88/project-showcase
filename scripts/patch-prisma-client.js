/**
 * patch-prisma-client.js
 *
 * Prisma v5 generates a `default.js` that uses Node.js package subpath imports
 * (`require('#main-entry-point')`). Electron's ASAR virtual filesystem does NOT
 * support package subpath imports, causing a "Cannot find module" crash at launch.
 *
 * This script patches the generated `default.js` to use a direct relative path
 * (`require('./index.js')`) instead, which works correctly inside an ASAR archive.
 *
 * Run this after every `prisma generate` as part of the build pipeline.
 */
const fs = require('fs')
const path = require('path')

const clientDir = path.join(__dirname, '../node_modules/@prisma/client/showcase-client')
const defaultJsPath = path.join(clientDir, 'default.js')

if (!fs.existsSync(defaultJsPath)) {
  console.error('[patch-prisma] ERROR: default.js not found at', defaultJsPath)
  console.error('[patch-prisma] Did you run `prisma generate` first?')
  process.exit(1)
}

const original = fs.readFileSync(defaultJsPath, 'utf-8')

if (original.includes('#main-entry-point')) {
  const patched = original.replace(
    "require('#main-entry-point')",
    "require('./index.js')"
  )
  fs.writeFileSync(defaultJsPath, patched, 'utf-8')
  console.log('[patch-prisma] ✅ Patched default.js — replaced #main-entry-point with ./index.js')
} else {
  console.log('[patch-prisma] ℹ️  default.js already patched, nothing to do.')
}
