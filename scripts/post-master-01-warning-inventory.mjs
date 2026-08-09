/**
 * POST-MASTER 01 — warning source counts (no secret values).
 */
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const PATTERNS = [
  ['TODO', /\bTODO\b/g],
  ['FIXME', /\bFIXME\b/g],
  ['console.log', /console\.log\(/g],
  ['ts-ignore', /@ts-ignore|@ts-expect-error/g],
  ['eslint-disable', /eslint-disable|oxlint-disable/g],
]

const SKIP = new Set(['node_modules', 'dist', '.git', 'coverage'])

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, files)
    else if (/\.(ts|tsx|js|mjs|css)$/.test(name)) files.push(p)
  }
  return files
}

const files = walk('.')
const counts = Object.fromEntries(PATTERNS.map(([k]) => [k, 0]))

for (const file of files) {
  if (file.includes('post-master-01-warning-inventory.mjs')) continue
  const text = readFileSync(file, 'utf8')
  for (const [key, re] of PATTERNS) {
    const m = text.match(re)
    if (m) counts[key] += m.length
  }
}

console.log('POST-MASTER 01 — warning inventory counts')
for (const [k, v] of Object.entries(counts)) console.log(`${k}: ${v}`)

try {
  const lint = execSync('npm run lint', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  console.log('lint_exit: 0')
  if (lint.trim()) console.log('lint_output_lines:', lint.trim().split('\n').length)
} catch {
  console.log('lint_exit: non-zero')
}
