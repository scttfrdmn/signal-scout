/**
 * Integration test: Scout → Pipeline
 *
 * Reads PIPELINE_API_URL and PIPELINE_API_SECRET from .env.local, then:
 *   1. POSTs a synthetic opportunity to /api/opportunities (Bearer token auth)
 *   2. Verifies the response shape and fields
 *
 * NOTE: DELETE requires a Clerk browser session, so the test record will remain
 * in the Pipeline database. Delete it manually from the Pipeline UI after the test.
 *
 * Usage:
 *   node scripts/test-integration.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // no .env.local — rely on environment
  }
}

loadEnv(resolve(__dirname, '../.env.local'))

// ── Config ───────────────────────────────────────────────────────────────────
const PIPELINE_URL = process.env.PIPELINE_API_URL
const PIPELINE_SECRET = process.env.PIPELINE_API_SECRET

if (!PIPELINE_URL || !PIPELINE_SECRET) {
  console.error('✗ Missing PIPELINE_API_URL or PIPELINE_API_SECRET in .env.local')
  process.exit(1)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
let passed = 0
let failed = 0

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

// ── Test payload (mirrors what pipeline.ts sends) ────────────────────────────
const testPayload = {
  companyName: '[TEST] Acme Rebrand Co',
  sector: 'Consumer Goods',
  sponsor: 'Test Runner',
  scoutSummary: 'Acme is undergoing a full brand refresh after acquiring two startups. High fit for ENSO.',
  decisionMaker: 'Jane Smith, Chief Marketing Officer',
  source: 'Fast Company — Acme signals major brand pivot\nhttps://example.com/acme-rebrand',
  entrySource: 'Signal Scout',
}

// ── Run ──────────────────────────────────────────────────────────────────────
console.log(`\nScout → Pipeline integration test`)
console.log(`Target: ${PIPELINE_URL}\n`)

console.log('1. POST /api/opportunities (Bearer token)')
let created
try {
  const res = await fetch(`${PIPELINE_URL}/api/opportunities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': PIPELINE_SECRET,
    },
    body: JSON.stringify(testPayload),
  })

  assert('HTTP 201', res.status === 201, `got ${res.status}`)

  const body = await res.json()
  created = body

  assert('Response has id',       typeof body.id === 'string' && body.id.length > 0)
  assert('companyName matches',   body.companyName === testPayload.companyName)
  assert('entrySource is Signal Scout', body.entrySource === 'Signal Scout')
  assert('stage defaults to Sparks',    body.stage === 'Sparks')
  assert('scoutSummary present',  body.scoutSummary === testPayload.scoutSummary)
  assert('decisionMaker present', body.decisionMaker === testPayload.decisionMaker)
  assert('source present',        body.source === testPayload.source)
  assert('sector present',        body.sector === testPayload.sector)
  assert('sponsor present',       body.sponsor === testPayload.sponsor)
} catch (e) {
  console.error(`  ✗ Request failed: ${e.message}`)
  failed++
}

console.log('\n2. Auth rejection (wrong token)')
try {
  const res = await fetch(`${PIPELINE_URL}/api/opportunities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': 'wrong-token',
    },
    body: JSON.stringify(testPayload),
  })
  assert('HTTP 401 on bad token', res.status === 401, `got ${res.status}`)
} catch (e) {
  console.error(`  ✗ Request failed: ${e.message}`)
  failed++
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`)
console.log(`${passed + failed} checks — ${passed} passed, ${failed} failed`)

if (created) {
  console.log(`\n⚠  Test record created in Pipeline DB:`)
  console.log(`   id: ${created.id}  company: ${created.companyName}`)
  console.log(`   Delete it manually from the Pipeline UI.`)
}

process.exit(failed > 0 ? 1 : 0)
