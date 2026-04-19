type JsonRecord = Record<string, unknown>

type SourceStatus = {
  source: string
  ok: boolean
  usedFallback: boolean
  message: string
  updatedAt: string
}

type MacroSeries = {
  id: string
  label: string
  unit: string
  dates: string[]
  values: number[]
  frequency: 'daily' | 'monthly'
}

type DashboardEnv = {
}

const FALLBACK_MACRO: MacroSeries[] = [
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

function safeNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function nthFromEnd(values: number[], n: number): number | null {
  if (values.length < n) return null
  return values[values.length - n] ?? null
}

async function getJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`timeout (${label} > ${timeoutMs}ms)`)), timeoutMs)
    promise
      .then((value) => {
        clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

function withStatus<T>(source: string, fallback: T, task: () => Promise<T>) {
  return withTimeout(task(), 3000, source)
    .then((data) => ({ data, status: { source, ok: true, usedFallback: false, message: 'live', updatedAt: nowIso() } as SourceStatus }))
    .catch((error) => ({
      data: fallback,
      status: { source, ok: false, usedFallback: true, message: error instanceof Error ? error.message : 'unknown error', updatedAt: nowIso() } as SourceStatus,
    }))
}

function parseFredCsv(csvText: string, id: string, label: string, unit: string): MacroSeries {
  const lines = csvText.trim().split('\n')
  const rows = lines
    .slice(1)
    .map((line) => line.split(','))
    .map(([date, value]) => ({ date, value: safeNumber(value) }))
    .filter((row) => row.date && row.value !== null)

  if (!rows.length) throw new Error(`empty series: ${id}`)

  const tail = rows.slice(-6)
  const frequency = id.startsWith('DG') ? 'daily' : 'monthly'
  return {
    id,
    label,
    unit,
    frequency,
    dates: tail.map((row) => row.date),
    values: tail.map((row) => row.value as number),
  }
}

function parseBlsSeries(payload: JsonRecord, seriesId: string, id: string, label: string, unit: string): MacroSeries {
  const seriesList = (((payload.Results as JsonRecord)?.series as JsonRecord[]) ?? []).filter((row) => String(row.seriesID ?? '') === seriesId)
  const rows = (seriesList[0]?.data as JsonRecord[]) ?? []
  const observations = rows
    .map((item) => ({
      date: `${String(item.year ?? '')}-${String(item.period ?? '').replace('M', '')}-01`,
      value: safeNumber(item.value),
      period: String(item.period ?? ''),
    }))
    .filter((row) => row.value !== null && /^M\d{2}$/.test(row.period) && row.period !== 'M13')
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!observations.length) throw new Error('empty series')

  const tail = observations.slice(-6)
  const frequency = id.startsWith('DG') ? 'daily' : 'monthly'

  return {
    id,
    label,
    unit,
    frequency,
    dates: tail.map((row) => row.date),
    values: tail.map((row) => row.value as number),
  }
}

function nextReleaseDate(series: MacroSeries): string {
  const last = new Date(series.dates[series.dates.length - 1])
  if (series.frequency === 'daily') {
    const d = new Date(last)
    d.setUTCDate(d.getUTCDate() + 1)
    return d.toISOString().slice(0, 10)
  }
  const d = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1))
  return d.toISOString().slice(0, 10)
}

function mapMacroCards(series: MacroSeries[]) {
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

function deriveRegime(macro: MacroSeries[], perp: { funding: number }[]) {
  const byId = Object.fromEntries(macro.map((item) => [item.id, item]))

  const twoY = nthFromEnd(byId.DGS2?.values ?? [], 1)
  const tenY = nthFromEnd(byId.DGS10?.values ?? [], 1)
  const curve = twoY !== null && tenY !== null ? tenY - twoY : null

  const cpi = byId.CPIAUCSL?.values ?? []
  const cpiTrend = cpi.length > 1 ? cpi[cpi.length - 1] - cpi[cpi.length - 2] : 0

  const unrate = byId.UNRATE?.values ?? []
  const unrateTrend = unrate.length > 1 ? unrate[unrate.length - 1] - unrate[unrate.length - 2] : 0

  const avgFunding = perp.length ? perp.reduce((sum, row) => sum + (row.funding ?? 0), 0) / perp.length : 0

  return {
    growth: unrateTrend <= 0 ? 'Labor stable / growth resilient' : 'Labor softening risk',
    inflation: cpiTrend > 0 ? 'Inflation pressure rising' : 'Disinflation bias',
    policy: curve !== null && curve < 0 ? 'Restrictive / inverted curve' : 'Normalizing curve',
    dollar: 'Tracked externally (removed paid/brittle feed)',
    commodity: 'Tracked externally (removed brittle feed)',
    riskTone: avgFunding > 0 ? 'Perp risk appetite elevated' : 'Perp positioning cautious',
    keyRisk:
      curve !== null && curve < -0.3
        ? 'Deep curve inversion vs risk assets'
        : avgFunding > 0.0005
          ? 'Crowded perp longs increase squeeze risk'
          : 'Watch macro event volatility around rates and labor data',
  }
}

function fallbackPerp() {
  return [
    { name: 'BTC', funding: 0.00012, openInterest: 1890000000, dayVolume: 4520000000, markPx: 84510, oraclePx: 84500, tag: 'Balanced', link: 'https://app.hyperliquid.xyz/trade/BTC' },
    { name: 'ETH', funding: 0.00018, openInterest: 930000000, dayVolume: 2610000000, markPx: 4102, oraclePx: 4098, tag: 'Balanced', link: 'https://app.hyperliquid.xyz/trade/ETH' },
    { name: 'SOL', funding: 0.00071, openInterest: 410000000, dayVolume: 1220000000, markPx: 188, oraclePx: 187.8, tag: 'Crowded longs', link: 'https://app.hyperliquid.xyz/trade/SOL' },
  ]
}

async function fetchPerpStructure() {
  const response = (await getJson('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  })) as unknown[]

  const universe = ((response?.[0] as JsonRecord)?.universe as JsonRecord[]) || []
  const contexts = (response?.[1] as JsonRecord[]) || []
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

  const chainArray = ((stablecoins as JsonRecord).chains as JsonRecord[]) ?? []
  const topChains = chainArray.slice(0, 5).map((chain) => ({
    chain: String(chain.name ?? 'Unknown'),
    mcap: safeNumber(chain.totalCirculatingUSD ?? chain.mcap) ?? 0,
  }))

  const bridgeArray = ((bridges as JsonRecord).chains as JsonRecord[]) ?? []
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
  const response = (await getJson('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'spotMetaAndAssetCtxs' }),
  })) as unknown[]

  const universe = (((response?.[0] as JsonRecord)?.universe as JsonRecord[]) ?? []).slice(0, 15)
  const contexts = (response?.[1] as JsonRecord[]) ?? []

  const spotPrices = universe
    .map((asset, index) => {
      const ctx = contexts[index] ?? {}
      const rawSymbol = String(asset.name ?? asset.coin ?? '').trim()
      const symbol = rawSymbol.split('/')[0] || rawSymbol || `ASSET-${index + 1}`
      const price = safeNumber(ctx.midPx ?? ctx.markPx ?? ctx.oraclePx)
      const prevDayPx = safeNumber(ctx.prevDayPx)
      const dayChangePct = price !== null && prevDayPx && prevDayPx > 0 ? ((price - prevDayPx) / prevDayPx) * 100 : null
      return {
        symbol,
        price: price ?? 0,
        dayChangePct,
      }
    })
    .filter((row) => row.price > 0)
    .slice(0, 7)

  if (!spotPrices.length) throw new Error('no spot prices')
  return { spotPrices }
}

async function fetchMacroSeries(_env: DashboardEnv) {
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
      const csv = await (await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(series.remoteId)}`)).text()
      return parseFredCsv(csv, series.id, series.label, series.unit)
    })
  )

  const now = new Date().getUTCFullYear()
  const blsPayload = (await getJson('https://api.bls.gov/publicAPI/v1/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid: blsDefs.map((series) => series.remoteId),
      startyear: String(now - 5),
      endyear: String(now),
    }),
  })) as JsonRecord

  const blsValues = blsDefs.map((series) => parseBlsSeries(blsPayload, series.remoteId, series.id, series.label, series.unit))
  return [...yieldValues, ...blsValues]
}

function emptyCacheSummary() {
  return {
    enabled: false,
    key: null,
    maxAgeSeconds: 300,
    staleAgeSeconds: null,
  }
}

export async function handleDashboard(env: DashboardEnv = {}) {
  try {
    const [macroResult, perpResult, onchainResult, spotResult] = await Promise.all([
      withStatus('macro-open-data', FALLBACK_MACRO, () => fetchMacroSeries(env)),
      withStatus('hyperliquid', fallbackPerp(), fetchPerpStructure),
      withStatus('defillama', fallbackOnchain(), fetchOnchainSummary),
      withStatus('hyperliquid-spot', fallbackSpotPrices(), fetchSpotPrices),
    ])

    const sourceStatuses: SourceStatus[] = [macroResult.status, perpResult.status, onchainResult.status, spotResult.status]

    const payload = {
      generatedAt: nowIso(),
      sourceStatuses,
      cache: emptyCacheSummary(),
      overview: {
        regime: deriveRegime(macroResult.data, perpResult.data),
        macroCards: mapMacroCards(macroResult.data),
        perp: perpResult.data,
        onchain: onchainResult.data,
        spot: spotResult.data,
      },
    }

    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    const sourceStatuses: SourceStatus[] = [
      { source: 'macro-open-data', ok: false, usedFallback: true, message: 'emergency fallback', updatedAt: nowIso() },
      { source: 'hyperliquid', ok: false, usedFallback: true, message: 'emergency fallback', updatedAt: nowIso() },
      { source: 'defillama', ok: false, usedFallback: true, message: 'emergency fallback', updatedAt: nowIso() },
      { source: 'hyperliquid-spot', ok: false, usedFallback: true, message: 'emergency fallback', updatedAt: nowIso() },
    ]

    const payload = {
      generatedAt: nowIso(),
      sourceStatuses,
      cache: emptyCacheSummary(),
      emergency: error instanceof Error ? error.message : 'unknown error',
      overview: {
        regime: deriveRegime(FALLBACK_MACRO, fallbackPerp()),
        macroCards: mapMacroCards(FALLBACK_MACRO),
        perp: fallbackPerp(),
        onchain: fallbackOnchain(),
        spot: fallbackSpotPrices(),
      },
    }

    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
}

export async function onRequest(context: { env?: DashboardEnv }) {
  return handleDashboard(context?.env ?? {})
}
