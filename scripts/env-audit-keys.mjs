import { readFileSync } from 'node:fs'

function loadEnv(path) {
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    let v = line.slice(i + 1)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[line.slice(0, i)] = v
  }
  return out
}

for (const file of ['.env.mucolabs.prod', '.env.webpage.prod']) {
  console.log(`\n## ${file}`)
  const env = loadEnv(file)
  for (const k of Object.keys(env).sort()) {
    const v = env[k]
    const masked = v.includes('[SENSITIVE]') || v === ''
    console.log(`${k}\t${masked ? 'MASKED/EMPTY' : 'SET'}\tlen=${v.length}`)
  }
}
