import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

let gitSha = 'dev'
try {
  gitSha = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // sin git: usar 'dev'
}

const payload = {
  version: gitSha,
  builtAt: new Date().toISOString()
}

writeFileSync(resolve('dist/version.json'), JSON.stringify(payload, null, 2))
console.log('[detitular] version.json:', payload)
