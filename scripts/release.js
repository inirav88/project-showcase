const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}`)
  return execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..'), ...options })
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag)
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1]
  }
  return null
}

async function main() {
  console.log('🚀 ShowcaseOS Automated Release Script\n')

  // Parse version from positional arg or --version flag
  let targetVersion = process.argv[2]
  if (!targetVersion || targetVersion.startsWith('--')) {
    targetVersion = getArg('--version') || getArg('-v')
  }

  if (!targetVersion || !/^\d+\.\d+\.\d+$/.test(targetVersion)) {
    console.error('❌ Error: Please specify a valid semver version (e.g. 0.0.2)')
    console.error('Usage: npm run release -- 0.0.2')
    process.exit(1)
  }

  const pkgPath = path.join(__dirname, '..', 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const currentVersion = pkg.version

  console.log(`Current Version : v${currentVersion}`)
  console.log(`Target Version  : v${targetVersion}\n`)

  if (currentVersion === targetVersion) {
    console.warn(`⚠️ Warning: Version is already v${targetVersion}. Proceeding with release packaging...`)
  }

  // 1. Run Tests
  console.log('Step 1/5: Running Vitest test suite...')
  try {
    run('npm run test')
    console.log('✅ Unit tests passed!')
  } catch (err) {
    console.error('❌ Unit tests failed. Release aborted.')
    process.exit(1)
  }

  // 2. Bump package.json version
  console.log('\nStep 2/5: Bumping package.json version...')
  pkg.version = targetVersion
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')

  // Patch prisma client if needed
  try {
    run('node scripts/patch-prisma-client.js')
  } catch (err) {
    console.warn('⚠️ Warning: Patch Prisma script skipped or warning:', err.message)
  }

  // 3. Git Commit, Merge, Tag & Push
  console.log('\nStep 3/5: Executing Git release pipeline...')
  try {
    run('git add package.json')
    try {
      run(`git commit -m "chore(release): bump version to v${targetVersion}"`)
    } catch (_) {
      console.log('ℹ️ Note: package.json version already committed.')
    }
    run('git push origin dev')
    run('git checkout main')
    run('git merge dev')
    try {
      run(`git tag -a v${targetVersion} -m "Release v${targetVersion}"`)
    } catch (_) {
      console.log(`ℹ️ Note: Tag v${targetVersion} already exists locally.`)
    }
    run('git push origin main --tags')
    run('git checkout dev')
    console.log('✅ Git branch merge & release tag pushed successfully!')
  } catch (err) {
    console.error('❌ Git operation failed. Ensure your working tree is clean.')
    console.error(err.message)
    // Switch back to dev safety net
    try { run('git checkout dev') } catch (_) {}
    process.exit(1)
  }

  // 4. Build Desktop Executable Package
  console.log('\nStep 4/5: Packaging Electron NSIS release...')
  try {
    run('npm run package')
    console.log('✅ Package built successfully!')
  } catch (err) {
    console.error('❌ Packaging failed.')
    process.exit(1)
  }

  // 5. Verify Build Outputs & Handle VPS Upload
  console.log('\nStep 5/5: Verifying release artifacts...')
  const distDir = path.join(__dirname, '..', 'dist')
  const manifestPath = path.join(distDir, 'latest.yml')

  if (!fs.existsSync(manifestPath)) {
    console.warn('⚠️ Manifest file latest.yml not found in dist/. Please check electron-builder output.')
  } else {
    console.log('✅ Manifest found: dist/latest.yml')
  }

  const files = fs.existsSync(distDir) ? fs.readdirSync(distDir) : []
  const installerFile = files.find((f) => f.endsWith('.exe'))

  if (installerFile) {
    console.log(`✅ Executable installer found: dist/${installerFile}`)
  } else {
    console.warn('⚠️ Installer .exe not found in dist/.')
  }

  // Optional Automated VPS SCP Upload
  const vpsHost = process.env.VPS_HOST
  const vpsUser = process.env.VPS_USER || 'salesstudio-showcase'
  const vpsTargetDir = process.env.VPS_TARGET_DIR || '~/htdocs/showcase.salesstudio.in/updates/'

  if (vpsHost) {
    console.log(`\n📡 Uploading release artifacts to VPS (${vpsUser}@${vpsHost}:${vpsTargetDir})...`)
    try {
      if (fs.existsSync(manifestPath)) {
        run(`scp "${manifestPath}" ${vpsUser}@${vpsHost}:${vpsTargetDir}`)
      }
      if (installerFile) {
        run(`scp "${path.join(distDir, installerFile)}" ${vpsUser}@${vpsHost}:${vpsTargetDir}`)
      }
      console.log('🎉 VPS Upload Complete!')
    } catch (err) {
      console.error('⚠️ VPS Upload via SCP failed. You can manually copy the files.')
    }
  } else {
    console.log('\nℹ️ VPS SCP config not detected in environment (VPS_HOST).')
    console.log('📌 Manual Upload Instructions:')
    console.log(`   Copy "dist/latest.yml" and "dist/${installerFile || '*.exe'}"`)
    console.log(`   to your VPS at: ${vpsTargetDir}\n`)
  }

  console.log(`✨ Release v${targetVersion} completed successfully! Client laptops will now auto-update!`)
}

main().catch((err) => {
  console.error('Fatal error during release:', err)
  process.exit(1)
})
