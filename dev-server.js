const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')

const port = process.env.PORT ? Number(process.env.PORT) : 5173
const rootDir = __dirname

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

const FALLBACK_CROSS_ASSET = [
  { key: 'spx', label: 'S&P 500', symbol: '^GSPC', latest: 5235, d1: 0.4, d5: 1.2, m1: 2.9, m3: 4.8 },
  { key: 'ndx', label: 'Nasdaq 100', symbol: '^NDX', latest: 18340, d1: 0.6, d5: 1.5, m1: 3.4, m3: 5.1 },
  { key: 'nifty', label: 'Nifty 50', symbol: '^NSEI', latest: 22480, d1: 0.2, d5: 0.9, m1: 1.1, m3: 3.2 },
  { key: 'sensex', label: 'Sensex', symbol: '^BSESN', latest: 73860, d1: 0.2, d5: 1.0, m1: 1.4, m3: 3.6 },
  { key: 'ftse', label: 'FTSE 100', symbol: '^FTSE', latest: 8045, d1: 0.1, d5: 0.7, m1: 1.3, m3: 2.8 },
  { key: 'csi300', label: 'CSI 300', symbol: '000300.SS', latest: 3595, d1: -0.3, d5: -0.4, m1: -1.1, m3: 0.4 },
  { key: 'sse', label: 'SSE Composite', symbol: '000001.SS', latest: 3040, d1: -0.2, d5: -0.3, m1: -0.9, m3: 0.5 },
  { key: 'hsi', label: 'Hang Seng', symbol: '^HSI', latest: 16590, d1: -0.1, d5: 0.5, m1: 1.2, m3: 2.1 },
  { key: 'eem', label: 'EEM (EM Proxy)', symbol: 'EEM', latest: 41.7, d1: 0.3, d5: 0.8, m1: 1.0, m3: 2.5 },
  { key: 'dxy', label: 'DXY', symbol: 'DX-Y.NYB', latest: 104.2, d1: -0.2, d5: -0.4, m1: -1.0, m3: 0.2 },
  { key: 'gold', label: 'Gold', symbol: 'GC=F', latest: 2375, d1: 0.5, d5: 1.8, m1: 3.1, m3: 6.2 },
  { key: 'oil', label: 'WTI Oil', symbol: 'CL=F', latest: 82.4, d1: -0.6, d5: -1.1, m1: 0.7, m3: 2.4 },
  { key: 'copper', label: 'Copper', symbol: 'HG=F', latest: 4.24, d1: 0.3, d5: 1.2, m1: 2.0, m3: 4.5 },
  { key: 'natgas', label: 'Natural Gas', symbol: 'NG=F', latest: 1.92, d1: -1.4, d5: -2.1, m1: -5.4, m3: -8.0 },
  { key: 'btc', label: 'BTC', symbol: 'BTC-USD', latest: 84500, d1: 1.1, d5: 2.9, m1: 5.2, m3: 14.8 },
  { key: 'eth', label: 'ETH', symbol: 'ETH-USD', latest: 4100, d1: 1.4, d5: 3.5, m1: 6.0, m3: 18.2 },
]

const FALLBACK_MACRO = [
  { id: 'DGS2', label: 'US 2Y Yield', unit: '%', frequency: 'daily', dates: ['2026-04-14', '2026-04-15', '2026-04-16'], values: [4.41, 4.38, 4.36] },
  { id: 'DGS10', label: 'US 10Y Yield', unit: '%', frequency: 'daily', dates: ['2026-04-14', '2026-04-15', '2026-04-16'], values: [4.32, 4.29, 4.27] },
  { id: 'DGS30', label: 'US 30Y Yield', unit: '%', frequency: 'daily', dates: ['2026-04-14', '2026-04-15', '2026-04-16'], values: [4.51, 4.49, 4.47] },
  { id: 'CPIAUCSL', label: 'US CPI (Headline)', unit: 'idx', frequency: 'monthly', dates: ['2026-01-01', '2026-02-01', '2026-03-01'], values: [318.1, 318.7, 319.2] },
  { id: 'CPILFESL', label: 'US CPI (Core)', unit: 'idx', frequency: 'monthly', dates: ['2026-01-01', '2026-02-01', '2026-03-01'], values: [327.4, 328.0, 328.4] },
  { id: 'PAYEMS', label: 'US Nonfarm Payrolls', unit: 'k', frequency: 'monthly', dates: ['2026-01-01', '2026-02-01', '2026-03-01'], values: [159230, 159410, 159620] },
  { id: 'UNRATE', label: 'US Unemployment Rate', unit: '%', frequency: 'monthly', dates: ['2026-01-01', '2026-02-01', '2026-03-01'], values: [4.1, 4.1, 4.0] },
]

function nowIso() {
  return new Date().toISOString()
}

function safeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function pctChange(latest, prior) {
  if (!prior) return 0
  return ((latest - prior) / Math.abs(prior)) * 100
}

function nthFromEnd(values, n) {
  if (values.length < n) return null
  return values[values.length - n] ?? null
}

async function getJson(apiUrl, init) {
  const response = await fetch(apiUrl, init)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function getText(apiUrl) {
  const response = await fetch(apiUrl)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

function withStatus(source, fallback, task) {
  return task()
    .then((data) => ({ data, status: { source, ok: true, usedFallback: false, message: 'live', updatedAt: nowIso() } }))
    .catch((error) => ({
      data: fallback,
      status: { source, ok: false, usedFallback: true, message: error instanceof Error ? error.message : 'unknown error', updatedAt: nowIso() },
    }))
}

async function fetchYahooSeries(symbol) {
  const encoded = encodeURIComponent(symbol)
  const payload = await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=6mo`)
  const result = payload?.chart?.result?.[0]
  const closes = (result?.indicators?.quote?.[0]?.close ?? []).map(safeNumber).filter((x) => x !== null)
  if (closes.length < 70) throw new Error('insufficient candles')
  const latest = nthFromEnd(closes, 1)
  const previous = nthFromEnd(closes, 2)

  return {
    symbol,
    latest,
    previous,
    oneDay: pctChange(latest, previous),
    fiveDay: pctChange(latest, nthFromEnd(closes, 6)),
    oneMonth: pctChange(latest, nthFromEnd(closes, 22)),
    threeMonth: pctChange(latest, nthFromEnd(closes, 66)),
  }
}

function parseFredCsv(csv, id, label, unit) {
  const rows = csv
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.split(','))
    .filter((parts) => parts.length >= 2)
    .map(([date, value]) => ({ date, value: safeNumber(value) }))
    .filter((row) => row.value !== null)

  if (!rows.length) throw new Error('empty series')
  const tail = rows.slice(-6)
  return {
    id,
    label,
    unit,
    frequency: id.startsWith('DG') ? 'daily' : 'monthly',
    dates: tail.map((row) => row.date),
    values: tail.map((row) => row.value),
  }
}

function parseBlsSeries(payload, seriesId, id, label, unit) {
  const series = (payload?.Results?.series ?? []).find((row) => String(row?.seriesID ?? '') === seriesId)
  const rows = series?.data ?? []
  const observations = rows
    .map((item) => ({
      date: `${String(item?.year ?? '')}-${String(item?.period ?? '').replace('M', '')}-01`,
      value: safeNumber(item?.value),
      period: String(item?.period ?? ''),
    }))
    .filter((row) => row.value !== null && /^M\d{2}$/.test(row.period) && row.period !== 'M13')
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!observations.length) throw new Error(`empty series: ${id}`)
  const tail = observations.slice(-6)
  return {
    id,
    label,
    unit,
    frequency: 'monthly',
    dates: tail.map((row) => row.date),
    values: tail.map((row) => row.value),
  }
}

function nextReleaseDate(series) {
  const last = new Date(series.dates[series.dates.length - 1])
  if (series.frequency === 'daily') {
    const d = new Date(last)
    d.setUTCDate(d.getUTCDate() + 1)
    return d.toISOString().slice(0, 10)
  }
  const d = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1))
  return d.toISOString().slice(0, 10)
}

function mapMacroCards(series) {
  return series.map((item) => {
    const latest = nthFromEnd(item.values, 1)
    const previous = nthFromEnd(item.values, 2)
    const trend = item.values.length >= 3 ? item.values[item.values.length - 1] - item.values[item.values.length - 3] : 0
    return {
      id: item.id,
      label: item.label,
      latest,
      previous,
      delta: latest !== null && previous !== null ? latest - previous : null,
      trend,
      lastDate: item.dates[item.dates.length - 1] ?? null,
      nextRelease: nextReleaseDate(item),
      why: `Tracks ${item.label.toLowerCase()} as a regime input for crypto perps.`,
    }
  })
}

function deriveRegime(macro, cross) {
  const byId = Object.fromEntries(macro.map((item) => [item.id, item]))
  const twoY = nthFromEnd(byId.DGS2?.values ?? [], 1)
  const tenY = nthFromEnd(byId.DGS10?.values ?? [], 1)
  const curve = twoY !== null && tenY !== null ? tenY - twoY : null
  const cpi = byId.CPIAUCSL?.values ?? []
  const cpiTrend = cpi.length > 1 ? cpi[cpi.length - 1] - cpi[cpi.length - 2] : 0
  const spxM1 = cross.find((x) => x.key === 'spx')?.m1 ?? 0
  const dxyM1 = cross.find((x) => x.key === 'dxy')?.m1 ?? 0
  const oilM1 = cross.find((x) => x.key === 'oil')?.m1 ?? 0

  return {
    growth: spxM1 > 0 ? 'Risk-on bias' : 'Risk-off / defensive',
    inflation: cpiTrend > 0 ? 'Inflation pressure rising' : 'Disinflation bias',
    policy: curve !== null && curve < 0 ? 'Restrictive / inverted curve' : 'Normalizing curve',
    dollar: dxyM1 > 0 ? 'Dollar tightening' : 'Dollar easing',
    commodity: oilM1 > 0 ? 'Energy pressure up' : 'Commodity pressure moderate',
    riskTone: spxM1 > 0 ? 'Risk-on bias' : 'Risk-off / defensive',
    keyRisk: curve !== null && curve < -0.3 ? 'Deep curve inversion vs growth-sensitive risk assets' : 'Watch macro event volatility and dollar reversal',
  }
}

function tagFromM1(m1) {
  if (m1 > 2) return 'Strong'
  if (m1 < -2) return 'Weak'
  return 'Neutral'
}

function fallbackEvents() {
  return [
    { event: 'US CPI', date: '2026-05-12T12:30:00.000Z', category: 'Inflation', previous: '3.2%', consensus: '3.1%', actual: null, status: 'upcoming' },
    { event: 'FOMC Rate Decision', date: '2026-05-06T18:00:00.000Z', category: 'Policy', previous: '4.50%', consensus: '4.50%', actual: null, status: 'upcoming' },
    { event: 'US Nonfarm Payrolls', date: '2026-05-01T12:30:00.000Z', category: 'Labor', previous: '175K', consensus: '182K', actual: null, status: 'upcoming' },
  ]
}

async function fetchEventCalendar() {
  const now = new Date()
  const from = now.toISOString().slice(0, 10)
  const inSeven = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const items = await getJson(
    `https://api.tradingeconomics.com/calendar/country/united%20states?f=json&c=guest:guest&d1=${from}&d2=${inSeven}`
  )

  return items
    .filter((item) => ['High', 'Medium'].includes(String(item.Importance ?? '')))
    .slice(0, 10)
    .map((item) => ({
      event: item.Event,
      date: item.Date,
      category: item.Category,
      actual: item.Actual,
      previous: item.Previous,
      consensus: item.Forecast,
      status: new Date(String(item.Date)).getTime() > Date.now() ? 'upcoming' : 'released',
    }))
}

function fallbackPerp() {
  return [
    { name: 'BTC', funding: 0.00012, openInterest: 1890000000, dayVolume: 4520000000, markPx: 84510, oraclePx: 84500, tag: 'Balanced', link: 'https://app.hyperliquid.xyz/trade/BTC' },
    { name: 'ETH', funding: 0.00018, openInterest: 930000000, dayVolume: 2610000000, markPx: 4102, oraclePx: 4098, tag: 'Balanced', link: 'https://app.hyperliquid.xyz/trade/ETH' },
    { name: 'SOL', funding: 0.00071, openInterest: 410000000, dayVolume: 1220000000, markPx: 188, oraclePx: 187.8, tag: 'Crowded longs', link: 'https://app.hyperliquid.xyz/trade/SOL' },
  ]
}

async function fetchPerpStructure() {
  const response = await getJson('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  })

  const universe = response?.[0]?.universe ?? []
  const contexts = response?.[1] ?? []

  return universe
    .map((asset, index) => {
      const ctx = contexts[index] || {}
      const funding = safeNumber(ctx.funding) ?? 0
      return {
        name: asset.name,
        funding,
        openInterest: safeNumber(ctx.openInterest) ?? 0,
        dayVolume: safeNumber(ctx.dayNtlVlm) ?? 0,
        markPx: safeNumber(ctx.markPx) ?? 0,
        oraclePx: safeNumber(ctx.oraclePx) ?? 0,
        tag: Math.abs(funding) > 0.0006 ? (funding > 0 ? 'Crowded longs' : 'Crowded shorts') : 'Balanced',
        link: `https://app.hyperliquid.xyz/trade/${asset.name}`,
      }
    })
    .slice(0, 20)
}

function fallbackOnchain() {
  return {
    topChains: [
      { chain: 'Ethereum', mcap: 109000000000 },
      { chain: 'Tron', mcap: 62000000000 },
      { chain: 'Solana', mcap: 9800000000 },
    ],
    bridgeTotals: [
      { chain: 'Ethereum', inflow24h: 142000000 },
      { chain: 'Arbitrum', inflow24h: 38000000 },
      { chain: 'Base', inflow24h: 29000000 },
    ],
  }
}

async function fetchOnchainSummary() {
  const [stablecoins, bridges] = await Promise.all([
    getJson('https://stablecoins.llama.fi/stablecoinchains'),
    getJson('https://bridges.llama.fi/overview?includeChains=true'),
  ])

  const chainArray = stablecoins?.chains ?? []
  const topChains = chainArray.slice(0, 5).map((chain) => ({
    chain: String(chain.name ?? 'Unknown'),
    mcap: safeNumber(chain.totalCirculatingUSD ?? chain.mcap) ?? 0,
  }))

  const bridgeArray = bridges?.chains ?? []
  const bridgeTotals = bridgeArray.slice(0, 5).map((item) => ({
    chain: String(item.name ?? 'Unknown'),
    inflow24h: safeNumber(item.dayChange) ?? 0,
  }))

  return { topChains, bridgeTotals }
}

function fallbackSpotPrices() {
  return {
    spotPrices: [
      { symbol: 'BTC', price: 84510, dayChangePct: 1.24 },
      { symbol: 'ETH', price: 4102, dayChangePct: 0.82 },
      { symbol: 'SOL', price: 188, dayChangePct: 2.11 },
    ],
  }
}

async function fetchSpotPrices() {
  const response = await getJson('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'spotMetaAndAssetCtxs' }),
  })

  const universe = (response?.[0]?.universe ?? []).slice(0, 15)
  const contexts = response?.[1] ?? []
  const spotPrices = universe
    .map((asset, index) => {
      const ctx = contexts[index] ?? {}
      const rawSymbol = String(asset?.name ?? asset?.coin ?? '').trim()
      const symbol = rawSymbol.split('/')[0] || rawSymbol || `ASSET-${index + 1}`
      const price = safeNumber(ctx?.midPx ?? ctx?.markPx ?? ctx?.oraclePx)
      const prevDayPx = safeNumber(ctx?.prevDayPx)
      return {
        symbol,
        price: price ?? 0,
        dayChangePct: price !== null && prevDayPx && prevDayPx > 0 ? ((price - prevDayPx) / prevDayPx) * 100 : null,
      }
    })
    .filter((row) => row.price > 0)
    .slice(0, 7)

  if (!spotPrices.length) throw new Error('no spot prices')
  return { spotPrices }
}

async function buildDashboardPayload() {
  const sourceStatuses = []

  const crossAssetResult = await withStatus('yahoo-finance', FALLBACK_CROSS_ASSET, async () => {
    const symbols = FALLBACK_CROSS_ASSET.map((asset) => ({ key: asset.key, label: asset.label, symbol: asset.symbol }))
    const entries = await Promise.all(
      symbols.map(async (asset) => {
        const point = await fetchYahooSeries(asset.symbol)
        return {
          ...asset,
          latest: point.latest,
          d1: point.oneDay,
          d5: point.fiveDay,
          m1: point.oneMonth,
          m3: point.threeMonth,
        }
      })
    )
    return entries
  })
  sourceStatuses.push(crossAssetResult.status)

  const macroResult = await withStatus('macro-open-data', FALLBACK_MACRO, async () => {
    const yieldDefs = [
      { id: 'DGS2', label: 'US 2Y Yield', unit: '%', remoteId: 'DGS2' },
      { id: 'DGS10', label: 'US 10Y Yield', unit: '%', remoteId: 'DGS10' },
      { id: 'DGS30', label: 'US 30Y Yield', unit: '%', remoteId: 'DGS30' },
    ]
    const blsDefs = [
      { id: 'CPIAUCSL', label: 'US CPI (Headline)', unit: 'idx', remoteId: 'CUSR0000SA0' },
      { id: 'CPILFESL', label: 'US CPI (Core)', unit: 'idx', remoteId: 'CUSR0000SA0L1E' },
      { id: 'PAYEMS', label: 'US Nonfarm Payrolls', unit: 'k', remoteId: 'CES0000000001' },
      { id: 'UNRATE', label: 'US Unemployment Rate', unit: '%', remoteId: 'LNS14000000' },
    ]

    const yieldValues = await Promise.all(
      yieldDefs.map(async (series) => {
        const csv = await getText(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(series.remoteId)}`)
        return parseFredCsv(csv, series.id, series.label, series.unit)
      })
    )

    const now = new Date().getUTCFullYear()
    const blsPayload = await getJson('https://api.bls.gov/publicAPI/v1/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: blsDefs.map((series) => series.remoteId),
        startyear: String(now - 5),
        endyear: String(now),
      }),
    })

    const blsValues = blsDefs.map((series) => parseBlsSeries(blsPayload, series.remoteId, series.id, series.label, series.unit))
    return [...yieldValues, ...blsValues]
  })
  sourceStatuses.push(macroResult.status)

  const eventsResult = await withStatus('tradingeconomics', fallbackEvents(), fetchEventCalendar)
  sourceStatuses.push(eventsResult.status)

  const perpResult = await withStatus('hyperliquid', fallbackPerp(), fetchPerpStructure)
  sourceStatuses.push(perpResult.status)

  const onchainResult = await withStatus('defillama', fallbackOnchain(), fetchOnchainSummary)
  sourceStatuses.push(onchainResult.status)

  const spotResult = await withStatus('hyperliquid-spot', fallbackSpotPrices(), fetchSpotPrices)
  sourceStatuses.push(spotResult.status)

  const crossAssetHeatStrip = crossAssetResult.data.map((row) => ({
    ...row,
    regimeTag: tagFromM1(row.m1),
    deepLink: `https://finance.yahoo.com/quote/${encodeURIComponent(row.symbol)}`,
  }))

  return {
    generatedAt: nowIso(),
    sourceStatuses,
    overview: {
      regime: deriveRegime(macroResult.data, crossAssetResult.data),
      crossAssetHeatStrip,
      macroCards: mapMacroCards(macroResult.data),
      events: eventsResult.data,
      perp: perpResult.data,
      onchain: onchainResult.data,
      spot: spotResult.data,
    },
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400)
    res.end('Bad request')
    return
  }

  const { pathname } = url.parse(req.url)

  if (pathname === '/api/random') {
    const payload = {
      value: Math.floor(Math.random() * 1000),
      generatedAt: new Date().toISOString(),
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(payload))
    return
  }

  if (pathname === '/api/dashboard') {
    try {
      const payload = await buildDashboardPayload()
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      })
      res.end(JSON.stringify(payload))
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
    }
    return
  }

  const safePath = pathname === '/' ? '/index.html' : pathname
  const filePath = path.join(rootDir, decodeURIComponent(safePath))

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }

    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' })
    res.end(data)
  })
})

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`)
})
