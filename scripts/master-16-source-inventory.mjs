#!/usr/bin/env node
/**
 * MASTER 16 — source inventory & coarse domain classification (heuristic).
 * Does not move files; outputs JSON for the architecture report.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith('.') || name.name === 'node_modules' || name.name === 'dist') continue
    const full = path.join(dir, name.name)
    if (name.isDirectory()) walk(full, acc)
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(name.name)) acc.push(full)
  }
  return acc
}

function classify(rel) {
  const p = rel.replace(/\\/g, '/')
  if (p.startsWith('src/docs/')) return 'TOOLING'
  if (p.includes('.test.') || p.startsWith('tests/')) return 'TEST'
  if (p.startsWith('scripts/')) return 'TOOLING'
  if (p.startsWith('server/')) {
    if (p.includes('/auth/')) return 'SERVER:auth'
    if (p.includes('/admin') || p.includes('admin.')) return 'SERVER:admin'
    if (p.includes('/customer')) return 'SERVER:customer'
    if (p.includes('/freelancer')) return 'SERVER:freelancer'
    if (p.includes('/crm/')) return 'SERVER:crm'
    if (p.includes('/payments/')) return 'SERVER:payments'
    if (p.includes('/files/')) return 'SERVER:files'
    if (p.includes('/notifications/')) return 'SERVER:notifications'
    return 'SERVER:shared'
  }
  if (p.startsWith('src/config/domains/')) return 'CONFIG:domains'
  if (p.startsWith('src/config/')) return 'CONFIG'
  if (p.startsWith('src/lib/auth/') || p.startsWith('src/contexts/auth')) return 'AUTH'
  if (p.startsWith('src/pages/portal/admin/') || p.includes('AdminSignIn')) return 'ADMIN'
  if (p.startsWith('src/pages/portal/customer/')) return 'CUSTOMER'
  if (p.startsWith('src/pages/portal/employee/')) return 'EMPLOYEE'
  if (p.startsWith('src/pages/portal/freelancer/')) return 'FREELANCER'
  if (p.startsWith('src/pages/portal/')) return 'SHARED'
  if (p.startsWith('src/pages/Auth') || p.startsWith('src/components/auth/')) return 'AUTH'
  if (p.startsWith('src/components/portal/')) return 'SHARED'
  if (p.startsWith('src/layouts/Admin')) return 'ADMIN'
  if (p.startsWith('src/layouts/Customer')) return 'CUSTOMER'
  if (p.startsWith('src/layouts/Employee')) return 'EMPLOYEE'
  if (p.startsWith('src/layouts/Freelancer')) return 'FREELANCER'
  if (p.startsWith('src/layouts/')) return 'PUBLIC'
  if (p.startsWith('src/pages/')) return 'PUBLIC'
  if (p.startsWith('src/components/')) return 'SHARED'
  if (p.startsWith('src/lib/portal/')) return 'SHARED'
  if (p.startsWith('src/lib/')) return 'SHARED'
  if (p.startsWith('src/app/')) return 'SHARED'
  return 'UNCLASSIFIED'
}

const buckets = {}
for (const area of ['src', 'server', 'scripts', 'tests']) {
  const base = path.join(root, area)
  for (const file of walk(base)) {
    const rel = path.relative(root, file)
    const domain = classify(rel)
    buckets[domain] = (buckets[domain] ?? 0) + 1
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  master: 'MASTER-16',
  fileCountsByDomain: buckets,
  totalClassified: Object.values(buckets).reduce((a, b) => a + b, 0),
  notes: [
    'Heuristic paths only; ambiguous modules may be SHARED until phased file moves.',
    'Server remains single API; counts reflect folder naming not separate deployables.',
  ],
}

const outPath = path.join(root, 'src/docs/master-16-inventory.json')
fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
console.log(`\nWrote ${outPath}`)
