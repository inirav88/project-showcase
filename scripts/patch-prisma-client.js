/**
 * patch-prisma-client.js
 *
 * Prisma v5 generates a package.json with `exports` and `imports` fields.
 * Both of these trigger Node.js ESM-style resolution code paths (resolveExports/finalizeEsmResolution)
 * that Electron's ASAR virtual filesystem does NOT support, causing a crash.
 *
 * This script:
 * 1. Patches default.js to use ./index.js directly
 * 2. Removes `exports` AND `imports` from showcase-client/package.json
 * 3. Removes `exports` from the parent @prisma/client/package.json to prevent Node
 *    from resolving showcase-client through the exports map, which bypasses ASAR filesystem patch.
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

// --- 2. Remove `exports` AND `imports` from showcase-client/package.json ---
const pkgPath = path.join(clientDir, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

let changed = false
if (pkg.exports) { delete pkg.exports; changed = true }
if (pkg.imports) { delete pkg.imports; changed = true }

if (changed) {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  console.log('[patch-prisma] Removed exports/imports from showcase-client/package.json')
} else {
  console.log('[patch-prisma] showcase-client/package.json already patched')
}

// --- 3. Remove `exports` from parent @prisma/client/package.json ---
const parentPkgPath = path.join(__dirname, '../node_modules/@prisma/client/package.json')
if (fs.existsSync(parentPkgPath)) {
  const parentPkg = JSON.parse(fs.readFileSync(parentPkgPath, 'utf-8'))
  if (parentPkg.exports) {
    delete parentPkg.exports
    fs.writeFileSync(parentPkgPath, JSON.stringify(parentPkg, null, 2))
    console.log('[patch-prisma] Removed exports from @prisma/client/package.json')
  } else {
    console.log('[patch-prisma] @prisma/client/package.json already patched')
  }
} else {
  console.warn('[patch-prisma] Parent @prisma/client/package.json not found')
}

console.log('[patch-prisma] Done.')
