type JsonRecord = Record<string, unknown>

type PricePoint = {
  symbol: string
  latest: number | null
  previous: number | null
  oneDay: number | null
  fiveDay: number | null
  oneMonth: number | null
  threeMonth: number | null
  currency?: string
}

type MacroSeries = {
  id: string
  label: string
  values: number[]
  dates: string[]
  unit: string
}

const YAHOO_SYMBOLS = [
  { key: 'spx', symbol: '^GSPC', label: 'S&P 500' },
  { key: 'ndx', symbol: '^NDX', label: 'Nasdaq 100' },
  { key: 'nifty', symbol: '^NSEI', label: 'Nifty 50' },
  { key: 'sensex', symbol: '^BSESN', label: 'Sensex' },
  { key: 'ftse', symbol: '^FTSE', label: 'FTSE 100' },
  { key: 'csi300', symbol: '000300.SS', label: 'CSI 300' },
  { key: 'sse', symbol: '000001.SS', label: 'SSE Composite' },
  { key: 'hsi', symbol: '^HSI', label: 'Hang Seng' },
  { key: 'eem', symbol: 'EEM', label: 'EEM (EM Proxy)' },
  { key: 'dxy', symbol: 'DX-Y.NYB', label: 'DXY' },
  { key: 'gold', symbol: 'GC=F', label: 'Gold' },
  { key: 'oil', symbol: 'CL=F', label: 'WTI Oil' },
  { key: 'copper', symbol: 'HG=F', label: 'Copper' },
  { key: 'natgas', symbol: 'NG=F', label: 'Natural Gas' },
  { key: 'btc', symbol: 'BTC-USD', label: 'BTC' },
  { key: 'eth', symbol: 'ETH-USD', label: 'ETH' },
]

const MACRO_SERIES = [
  { id: 'DGS2', label: 'US 2Y Yield', unit: '%' },
  { id: 'DGS10', label: 'US 10Y Yield', unit: '%' },
  { id: 'DGS30', label: 'US 30Y Yield', unit: '%' },
  { id: 'CPIAUCSL', label: 'US CPI (Headline)', unit: 'idx' },
  { id: 'CPILFESL', label: 'US CPI (Core)', unit: 'idx' },
  { id: 'PAYEMS', label: 'US Nonfarm Payrolls', unit: 'k' },
  { id: 'UNRATE', label: 'US Unemployment Rate', unit: '%' },
]

async function getJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`)
  }
  return response.json()
}

async function getText(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`)
  }
  return response.text()
}

function safeNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function percentChange(latest: number | null, prior: number | null): number | null {
  if (latest === null || prior === null || prior === 0) return null
  return ((latest - prior) / Math.abs(prior)) * 100
}

function nthFromEnd(values: number[], n: number): number | null {
  if (values.length < n) return null
  return values[values.length - n] ?? null
}

async function fetchYahooSeries(symbol: string): Promise<PricePoint> {
  const encoded = encodeURIComponent(symbol)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=6mo`
  const payload = (await getJson(url)) as JsonRecord
  const result = ((payload.chart as JsonRecord)?.result as JsonRecord[] | undefined)?.[0]
  const quote = ((result?.indicators as JsonRecord)?.quote as JsonRecord[] | undefined)?.[0]
  const closes = ((quote?.close as unknown[]) ?? []).map(safeNumber).filter((x): x is number => x !== null)

  const latest = nthFromEnd(closes, 1)
  const previous = nthFromEnd(closes, 2)
  const fiveAgo = nthFromEnd(closes, 6)
  const monthAgo = nthFromEnd(closes, 22)
  const threeMonthAgo = nthFromEnd(closes, 66)

  return {
    symbol,
    latest,
    previous,
    oneDay: percentChange(latest, previous),
    fiveDay: percentChange(latest, fiveAgo),
    oneMonth: percentChange(latest, monthAgo),
    threeMonth: percentChange(latest, threeMonthAgo),
  }
}

function parseFredCsv(csv: string, id: string, label: string, unit: string): MacroSeries {
  const lines = csv.trim().split('\n').slice(1)
  const rows = lines
    .map((line) => line.split(','))
    .filter((parts) => parts.length >= 2)
    .map(([date, value]) => ({ date, value: safeNumber(value) }))
    .filter((row) => row.value !== null)

  const tail = rows.slice(-13)
  return {
    id,
    label,
    unit,
    dates: tail.map((r) => r.date),
    values: tail.map((r) => r.value as number),
  }
}

async function fetchMacroSeries(seriesId: string, label: string, unit: string) {
  const csv = await getText(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`)
  return parseFredCsv(csv, seriesId, label, unit)
}

function deriveRegime(macro: MacroSeries[], prices: Record<string, PricePoint>) {
  const byId = Object.fromEntries(macro.map((item) => [item.id, item]))
  const twoY = nthFromEnd(byId.DGS2?.values ?? [], 1)
  const tenY = nthFromEnd(byId.DGS10?.values ?? [], 1)
  const cpi = byId.CPIAUCSL?.values ?? []
  const cpiTrend = cpi.length > 1 ? cpi[cpi.length - 1] - cpi[cpi.length - 2] : 0
  const curve = twoY !== null && tenY !== null ? tenY - twoY : null
  const dxy = prices.dxy?.oneMonth ?? null
  const spx = prices.spx?.oneMonth ?? null

  const riskTone = spx !== null && spx > 0 ? 'Risk-on bias' : 'Risk-off / defensive'
  const inflation = cpiTrend > 0 ? 'Inflation pressure rising' : 'Disinflation bias'
  const policy = curve !== null && curve < 0 ? 'Restrictive / inverted curve' : 'Normalizing curve'
  const dollar = dxy !== null && dxy > 0 ? 'Dollar tightening' : 'Dollar easing'

  return {
    growth: riskTone,
    inflation,
    policy,
    dollar,
    commodity: prices.oil?.oneMonth !== null && (prices.oil?.oneMonth as number) > 0 ? 'Energy pressure up' : 'Commodity pressure moderate',
    riskTone,
    keyRisk: curve !== null && curve < -0.3 ? 'Deep curve inversion vs growth-sensitive risk assets' : 'Watch macro event volatility and dollar reversal',
  }
}

function buildCrossAssetRows(prices: Record<string, PricePoint>) {
  return YAHOO_SYMBOLS.map(({ key, label, symbol }) => ({
    key,
    label,
    symbol,
    latest: prices[key]?.latest ?? null,
    d1: prices[key]?.oneDay ?? null,
    d5: prices[key]?.fiveDay ?? null,
    m1: prices[key]?.oneMonth ?? null,
    m3: prices[key]?.threeMonth ?? null,
    regimeTag:
      prices[key]?.oneMonth === null
        ? 'Unavailable'
        : (prices[key]?.oneMonth as number) > 2
          ? 'Strong'
          : (prices[key]?.oneMonth as number) < -2
            ? 'Weak'
            : 'Neutral',
    deepLink: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`,
  }))
}

async function fetchEventCalendar() {
  try {
    const now = new Date()
    const from = now.toISOString().slice(0, 10)
    const inSeven = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const url = `https://api.tradingeconomics.com/calendar/country/united%20states?f=json&c=guest:guest&d1=${from}&d2=${inSeven}`
    const items = ((await getJson(url)) as JsonRecord[]) || []
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
  } catch {
    return []
  }
}

async function fetchPerpStructure() {
  try {
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
        const funding = safeNumber(ctx.funding)
        const oi = safeNumber(ctx.openInterest)
        const change24h = safeNumber(ctx.dayNtlVlm)
        return {
          name: asset.name,
          funding,
          openInterest: oi,
          dayVolume: change24h,
          markPx: safeNumber(ctx.markPx),
          oraclePx: safeNumber(ctx.oraclePx),
          tag:
            funding !== null && Math.abs(funding) > 0.0006
              ? funding > 0
                ? 'Crowded longs'
                : 'Crowded shorts'
              : 'Balanced',
          link: `https://app.hyperliquid.xyz/trade/${asset.name}`,
        }
      })
      .slice(0, 20)
  } catch {
    return []
  }
}

async function fetchOnchainSummary() {
  try {
    const [stablecoins, bridges] = await Promise.all([
      getJson('https://stablecoins.llama.fi/stablecoinchains'),
      getJson('https://bridges.llama.fi/overview?includeChains=true'),
    ])

    const topChains = (((stablecoins as JsonRecord).peggedAssets as JsonRecord[]) ?? [])
      .slice(0, 5)
      .map((chain) => ({
        chain: chain.name,
        mcap: safeNumber(chain.circulating?.peggedUSD),
      }))

    const bridgeTotals = (((bridges as JsonRecord).chains as JsonRecord[]) ?? [])
      .slice(0, 5)
      .map((item) => ({
        chain: item.name,
        inflow24h: safeNumber(item.dayChange),
      }))

    return { topChains, bridgeTotals }
  } catch {
    return { topChains: [], bridgeTotals: [] }
  }
}

async function fetchNarratives() {
  try {
    const data = (await getJson(
      'https://api.coingecko.com/api/v3/search/trending?x_cg_demo_api_key=CG-demo-api-key'
    )) as JsonRecord

    const coins = ((data.coins as JsonRecord[]) ?? []).slice(0, 7).map((item) => ({
      name: (item.item as JsonRecord)?.name,
      symbol: (item.item as JsonRecord)?.symbol,
      marketCapRank: (item.item as JsonRecord)?.market_cap_rank,
      score: (item.item as JsonRecord)?.score,
    }))

    return { trendingCoins: coins }
  } catch {
    return { trendingCoins: [] }
  }
}

function mapMacroCards(series: MacroSeries[]) {
  return series.map((item) => {
    const latest = nthFromEnd(item.values, 1)
    const previous = nthFromEnd(item.values, 2)
    return {
      id: item.id,
      label: item.label,
      latest,
      previous,
      delta: latest !== null && previous !== null ? latest - previous : null,
      lastDate: nthFromEnd(item.dates, 1),
      why: `Tracks ${item.label.toLowerCase()} as a regime input for crypto perps.`,
    }
  })
}

export async function onRequest() {
  const priceEntries = await Promise.all(
    YAHOO_SYMBOLS.map(async ({ key, symbol }) => {
      try {
        const data = await fetchYahooSeries(symbol)
        return [key, data] as const
      } catch {
        return [key, { symbol, latest: null, previous: null, oneDay: null, fiveDay: null, oneMonth: null, threeMonth: null }] as const
      }
    })
  )

  const prices = Object.fromEntries(priceEntries)
  const macroSeries = await Promise.all(
    MACRO_SERIES.map(async (series) => {
      try {
        return await fetchMacroSeries(series.id, series.label, series.unit)
      } catch {
        return { id: series.id, label: series.label, unit: series.unit, dates: [], values: [] }
      }
    })
  )

  const [events, perp, onchain, narratives] = await Promise.all([
    fetchEventCalendar(),
    fetchPerpStructure(),
    fetchOnchainSummary(),
    fetchNarratives(),
  ])

  const payload = {
    generatedAt: new Date().toISOString(),
    overview: {
      regime: deriveRegime(macroSeries, prices),
      crossAssetHeatStrip: buildCrossAssetRows(prices),
      macroCards: mapMacroCards(macroSeries),
      events,
      perp,
      onchain,
      narratives,
    },
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
