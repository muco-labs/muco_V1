/**
 * MASTER 13 — repo secret exposure scan (reports paths only, no values).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const PATTERNS = [
  { id: 'service_role', re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { id: 'postgres_url', re: /postgresql:\/\/[^\s'"]+:[^\s'"]+@/ },
  { id: 'razorpay_live', re: /rzp_live_[A-Za-z0-9]+/ },
  { id: 'jwt_long', re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./ },
]

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.vercel',
  'coverage',
])

const ALLOW_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.json',
  '.md',
  '.sql',
  '.env.example',
])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (SKIP_DIRS.has(name)) continue
    let st
    try {
      st = statSync(p)
    } catch {
      continue
    }
    if (st.isDirectory()) walk(p, out)
    else {
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
      if (name === '.env.example' || ALLOW_EXT.has(ext)) out.push(p)
    }
  }
  return out
}

const hits = []
for (const file of walk('.')) {
  if (file.includes('.env.local') || file.endsWith('.env.mucolabs.prod')) continue
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  for (const { id, re } of PATTERNS) {
    if (re.test(text)) hits.push({ file: file.replace(/\\/g, '/'), pattern: id })
  }
}

// VITE_ misuse in src
for (const file of walk('src')) {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue
  const text = readFileSync(file, 'utf8')
  if (/import\.meta\.env\.VITE_.*(SECRET|SERVICE_ROLE|DATABASE|RAZORPAY|NVIDIA)/i.test(text)) {
    hits.push({ file: file.replace(/\\/g, '/'), pattern: 'vite_secret_reference' })
  }
}

console.log('MASTER 13 — secret exposure scan')
if (hits.length === 0) {
  console.log('SECRET EXPOSURE FOUND: NO (pattern scan)')
} else {
  console.log('SECRET EXPOSURE FOUND: YES (review paths)')
  for (const h of hits) console.log(`  ${h.pattern}: ${h.file}`)
}
console.log('ROTATION REQUIRED: only if real credentials were committed historically (operator verification)')
