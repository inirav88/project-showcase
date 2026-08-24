/**
 * patch-prisma-client.js
 *
 * Prisma v5 generates code with Node.js package subpath imports (# imports)
 * which Electron's ASAR virtual filesystem does NOT support, causing crashes.
 *
 * This script:
 * 1. Patches default.js to not use #main-entry-point
 * 2. Removes the `imports` field from package.json so Node never tries to
 *    resolve any # subpath from within this package scope
 *
 * Run this after every `prisma generate` as part of the build pipeline.
 */
const fs = require('fs')
const path = require('path')

const clientDir = path.join(__dirname, '../node_modules/@prisma/client/showcase-client')

// --- 1. Patch default.js ---
const defaultJsPath = path.join(clientDir, 'default.js')
if (!fs.existsSync(defaultJsPath)) {
  console.error('[patch-prisma] ERROR: default.js not found at', defaultJsPath)
  process.exit(1)
}
const defaultJs = fs.readFileSync(defaultJsPath, 'utf-8')
if (defaultJs.includes('#main-entry-point')) {
  fs.writeFileSync(defaultJsPath, defaultJs.replace("require('#main-entry-point')", "require('./index.js')"))
  console.log('[patch-prisma] Patched default.js')
} else {
  console.log('[patch-prisma] default.js already patched')
}

// --- 2. Remove `imports` from package.json ---
// The `imports` field defines Node.js package subpath imports (# imports).
// Electron ASAR cannot resolve these, so we remove the field entirely.
const pkgPath = path.join(clientDir, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
if (pkg.imports) {
  delete pkg.imports
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  console.log('[patch-prisma] Removed "imports" field from package.json')
} else {
  console.log('[patch-prisma] package.json already patched')
}

console.log('[patch-prisma] Done.')
