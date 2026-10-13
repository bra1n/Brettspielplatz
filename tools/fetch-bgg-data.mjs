#!/usr/bin/env node
// Fetches the board game list from the public Google Sheet, looks up each game on
// BoardGameGeek and writes player counts, playing time and complexity to a CSV file
// next to this script.
//
// Usage: node fetch-bgg-data.mjs [--limit N]   (N = only the first N sheet rows)
//
// Note: the HTML product pages on boardgamegeek.com are behind a Cloudflare JS
// challenge (403) and are rendered client-side, so this script requests the same
// JSON endpoints the product page itself loads its data from.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SHEET_ID = '15-zQLHHVvnLDGJsT0mfF4O7eM6E4VSF8NakVE_hEPh0'
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`
const BGG_ITEM_URL = (id) => `https://api.geekdo.com/api/geekitems?objectid=${id}&objecttype=thing`
const BGG_DYNAMIC_URL = (id) => `https://api.geekdo.com/api/dynamicinfo?objectid=${id}&objecttype=thing`

const OUTPUT_FILE = join(dirname(fileURLToPath(import.meta.url)), 'bgg-data.csv')

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,de;q=0.8',
  'Referer': 'https://boardgamegeek.com/',
}

const MIN_DELAY = 1000
const MAX_DELAY = 5000
const MAX_RETRIES = 3
const SAVE_EVERY = 25

const CSV_HEADER = [
  'BGG ID', 'Name (sheet)', 'Name (BGG, if different)', 'Min Players', 'Max Players',
  'Best Players', 'Min Time', 'Max Time', 'Complexity',
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let lastRequestEnd = 0
let requestCount = 0

// Fetch with a random 1-5s gap after the previous request, a log line per request
// and retries with backoff on 429 / 5xx responses.
async function politeFetch(url, label) {
  for (let attempt = 0; ; attempt++) {
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
    const wait = lastRequestEnd + delay - Date.now()
    if (wait > 0) await sleep(wait)

    const n = ++requestCount
    const start = Date.now()
    let res, body
    try {
      res = await fetch(url, { headers: HEADERS })
      body = await res.text()
    } catch (err) {
      lastRequestEnd = Date.now()
      console.log(`#${n} GET ${label} → network error: ${err.message} (${Date.now() - start}ms)`)
      if (attempt >= MAX_RETRIES) throw err
      await sleep(5000 * (attempt + 1))
      continue
    }
    lastRequestEnd = Date.now()
    console.log(`#${n} GET ${label} ${url} → ${res.status} ${res.statusText} ${body.length}B ${lastRequestEnd - start}ms`)

    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const backoff = retryAfter > 0 ? retryAfter * 1000 : 10000 * 2 ** attempt
      console.log(`   retrying in ${Math.round(backoff / 1000)}s (attempt ${attempt + 2}/${MAX_RETRIES + 1})`)
      await sleep(backoff)
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return body
  }
}

async function loadSheet() {
  const text = await politeFetch(SHEET_URL, 'sheet')
  // Response is wrapped: google.visualization.Query.setResponse({...});
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
  const cols = json.table.cols.map((c) => c.label)
  const nameIdx = cols.indexOf('Spiel')
  const idIdx = cols.indexOf('BGG ID')
  if (nameIdx < 0 || idIdx < 0) throw new Error(`Unexpected sheet columns: ${cols.join(', ')}`)

  // Keep every sheet row (including duplicate copies and rows without an ID) so the
  // CSV lines up 1:1 with the sheet and can be pasted back directly.
  const rows = json.table.rows.map((row) => ({
    name: String(row.c[nameIdx]?.v ?? '').trim(),
    id: parseInt(row.c[idIdx]?.v, 10) || null,
  }))
  const uniqueIds = new Set(rows.filter((r) => r.id).map((r) => r.id))
  const missing = rows.filter((r) => !r.id).length
  console.log(`Sheet: ${rows.length} rows, ${uniqueIds.size} unique BGG IDs, ${missing} rows without ID (kept empty)`)
  return rows
}

const toInt = (v) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : ''
}

const formatBest = (best = []) =>
  best.map(({ min, max }) => (max == null ? `${min}+` : min === max ? `${min}` : `${min}-${max}`)).join(', ')

async function fetchGame(id) {
  const item = JSON.parse(await politeFetch(BGG_ITEM_URL(id), `item ${id}`)).item
  const dynamic = JSON.parse(await politeFetch(BGG_DYNAMIC_URL(id), `stats ${id}`)).item
  if (!item) throw new Error('no item data')

  const bggName = String(item.name ?? '').trim()
  const weight = parseFloat(dynamic?.polls?.boardgameweight?.averageweight)
  return {
    bggName,
    minPlayers: toInt(item.minplayers),
    maxPlayers: toInt(item.maxplayers),
    bestPlayers: formatBest(dynamic?.polls?.userplayers?.best),
    minTime: toInt(item.minplaytime),
    maxTime: toInt(item.maxplaytime),
    complexity: Number.isFinite(weight) && weight > 0 ? Math.round(weight * 100) / 100 : '',
  }
}

const csvField = (v) => {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// One CSV line per sheet row; games not (yet) fetched or failed get empty values.
function writeCsv(sheetRows, results) {
  const rows = sheetRows.map(({ id, name }) => {
    const d = id && results.get(id)
    if (!d) return [id ?? '', name, '', '', '', '', '', '', '']
    const bggName = d.bggName.toLowerCase() !== name.toLowerCase() ? d.bggName : ''
    return [id, name, bggName, d.minPlayers, d.maxPlayers, d.bestPlayers, d.minTime, d.maxTime, d.complexity]
  })
  const lines = [CSV_HEADER, ...rows].map((r) => r.map(csvField).join(','))
  writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n')
}

async function main() {
  const startTime = Date.now()
  const limitArg = process.argv.indexOf('--limit')
  const limit = limitArg >= 0 ? parseInt(process.argv[limitArg + 1], 10) : Infinity

  let sheetRows = await loadSheet()
  if (Number.isFinite(limit)) sheetRows = sheetRows.slice(0, limit)

  // Fetch each BGG ID only once, even if the sheet lists several copies of a game
  const games = []
  for (const row of sheetRows) {
    if (row.id && !games.some((g) => g.id === row.id)) games.push(row)
  }

  const results = new Map()
  let ok = 0
  let failed = 0
  for (const [i, game] of games.entries()) {
    const copies = sheetRows.filter((r) => r.id === game.id).length
    console.log(`\n[${i + 1}/${games.length}] ${game.name} (BGG ${game.id})${copies > 1 ? ` – ${copies} copies` : ''}`)
    try {
      const d = await fetchGame(game.id)
      results.set(game.id, d)
      console.log(`   → players ${d.minPlayers}-${d.maxPlayers}, best ${d.bestPlayers || '?'}, time ${d.minTime}-${d.maxTime} min, complexity ${d.complexity}, BGG name "${d.bggName}"`)
      ok++
    } catch (err) {
      console.log(`   ✗ failed: ${err.message}`)
      failed++
    }
    if ((i + 1) % SAVE_EVERY === 0) writeCsv(sheetRows, results)
  }

  writeCsv(sheetRows, results)
  const minutes = ((Date.now() - startTime) / 60000).toFixed(1)
  console.log(`\nDone in ${minutes} min: ${ok} ok, ${failed} failed, ${requestCount} requests, ${sheetRows.length} CSV rows written to ${OUTPUT_FILE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
