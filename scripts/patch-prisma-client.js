/**
 * patch-prisma-client.js
 *
 * Prisma v5 generates a package.json with `exports` and `imports` fields.
 * Both of these trigger Node.js ESM-style resolution code paths that
 * Electron's ASAR virtual filesystem does NOT support, causing a crash.
 *
 * Without `exports`/`imports`, Node falls back to the `main` field which
 * goes through the normal CJS require path that Electron DOES patch correctly.
 *
 * This script:
 * 1. Patches default.js to use ./index.js directly
 * 2. Removes `exports` AND `imports` from package.json
 */
const fs = require('fs')
const path = require('path')

const clientDir = path.join(__dirname, '../node_modules/@prisma/client/showcase-client')

// --- 1. Patch default.js ---
const defaultJsPath = path.join(clientDir, 'default.js')
if (!fs.existsSync(defaultJsPath)) {
  console.error('[patch-prisma] ERROR: default.js not found. Run prisma generate first.')
  process.exit(1)
}
const defaultJs = fs.readFileSync(defaultJsPath, 'utf-8')
if (defaultJs.includes('#main-entry-point')) {
  fs.writeFileSync(defaultJsPath, defaultJs.replace("require('#main-entry-point')", "require('./index.js')"))
  console.log('[patch-prisma] Patched default.js')
} else {
  console.log('[patch-prisma] default.js already patched')
}

// --- 2. Remove `exports` AND `imports` from package.json ---
// Both fields trigger ESM-style resolution (resolveExports/finalizeEsmResolution)
// that Electron's ASAR cannot handle. Without them, Node uses the `main` field
// which goes through the normal CJS path that Electron patches correctly.
const pkgPath = path.join(clientDir, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

let changed = false
if (pkg.exports) { delete pkg.exports; changed = true }
if (pkg.imports) { delete pkg.imports; changed = true }

if (changed) {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  console.log('[patch-prisma] Removed exports/imports from package.json')
} else {
  console.log('[patch-prisma] package.json already patched')
}

console.log('[patch-prisma] Done.')
