import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.2.0'
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client'
import htm from 'https://esm.sh/htm@3.1.1'

const html = htm.bind(React.createElement)

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${Number(value).toFixed(2)}%`
}

function formatCompact(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(Number(value))
}

function statusLabel(status) {
  if (!status) return 'unknown'
  if (status.ok && !status.usedFallback) return 'live'
  if (status.usedFallback) return 'fallback'
  return 'degraded'
}

function App() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error(`Dashboard fetch failed (${response.status})`)
      }
      const payload = await response.json()
      setDashboard(payload)
    } catch (fetchError) {
      console.error(fetchError)
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown dashboard error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const lastUpdated = useMemo(() => {
    if (!dashboard?.generatedAt) return '—'
    return new Date(dashboard.generatedAt).toLocaleString()
  }, [dashboard])

  const regime = dashboard?.overview?.regime || {}
  const macroCards = dashboard?.overview?.macroCards || []
  const perp = dashboard?.overview?.perp || []
  const onchain = dashboard?.overview?.onchain || { topChains: [], bridgeTotals: [] }
  const spot = dashboard?.overview?.spot || { spotPrices: [], spotHistory: [] }
  const sourceStatuses = dashboard?.sourceStatuses || []
  const fallbackCount = sourceStatuses.filter((status) => status.usedFallback).length
  const regimeCards = [
    { label: 'Growth', value: regime.growth },
    { label: 'Inflation', value: regime.inflation },
    { label: 'Perp risk tone', value: regime.riskTone },
    { label: 'Policy', value: regime.policy },
  ].filter((item) => typeof item.value === 'string' && item.value.trim().length > 0)

  return html`
    <div className="page">
      <div className="scanline" aria-hidden="true"></div>
      <${Header} />
      <main className="container">
        <div className="page-header">
          <p className="muted mono">Last updated: ${lastUpdated}</p>
        </div>

        <section className="card-row">
          <div className="card">
            <div className="card-label mono">Dashboard feed status</div>
            <div className="card-value">${loading ? 'Loading…' : error ? 'Attention needed' : 'Live feed active'}</div>
            <div className="card-actions">
              <span className="muted mono">${error || `${sourceStatuses.length} sources checked • ${fallbackCount} fallback`}</span>
              <button className="button button-orange" onClick=${fetchDashboard}>Refresh</button>
            </div>
          </div>

          <div className="card">
            <div className="card-label mono">Key macro risk this week</div>
            <div className="card-value">${regime.keyRisk || '—'}</div>
            <div className="muted mono">${regime.policy || '—'}</div>
          </div>
        </section>

        <section className="grid">
          <div className="card">
            <div className="card-label mono">Source health board (free-only)</div>
            ${sourceStatuses.map(
              (status, index) => html`
                <div className="card-actions" key=${`${status.source}-${index}`}>
                  <span className="mono">${status.source}</span>
                  <span className="muted mono">${statusLabel(status)} • ${status.message}</span>
                </div>
              `
            )}
          </div>

          ${regimeCards.map(
            (item) => html`<${RegimeCard} key=${item.label} label=${item.label} value=${item.value} />`
          )}
        </section>

        <section className="grid">
          <div className="card">
            <div className="card-label mono">Macro regime monitor (FRED)</div>
            ${macroCards.slice(0, 7).map(
              (item) => html`
                <div className="card-actions" key=${item.id}>
                  <span className="mono">${item.label}</span>
                  <span className="muted mono">
                    ${formatNumber(item.latest)} (Δ ${formatNumber(item.delta)}) • trend ${formatNumber(item.trend)} • next ${item.nextRelease || '—'}
                  </span>
                </div>
              `
            )}
            ${macroCards.length ? html`<div className="muted mono">${macroCards[0].why}</div>` : html``}
          </div>

          <div className="card">
            <div className="card-label mono">Perp structure (Hyperliquid)</div>
            ${perp.slice(0, 12).map(
              (row, index) => html`
                <div className="card-actions" key=${`${row.name}-${index}`}>
                  <a className="mono" href=${row.link} target="_blank" rel="noreferrer">${row.name}</a>
                  <span className="muted mono">Funding ${formatPercent((row.funding ?? 0) * 100)} | OI ${formatNumber(row.openInterest)} | ${row.tag}</span>
                </div>
              `
            )}
          </div>
        </section>

        <section className="grid">
          <div className="card">
            <div className="card-label mono">Onchain / flows confirmation (DefiLlama)</div>
            <div className="muted mono">Stablecoin market cap (daily)</div>
            <${MiniChart} points=${onchain.stablecoinMcapHistory || []} />
            <div className="muted mono">Stablecoin ecosystem concentration</div>
            ${onchain.topChains.map(
              (item, index) => html`
                <div className="card-actions" key=${`${item.chain}-${index}`}>
                  <span className="mono">${item.chain}</span>
                  <span className="muted mono">${formatNumber(item.mcap, 0)}</span>
                </div>
              `
            )}
            <div className="muted mono">Bridge flows (daily)</div>
            <${MiniChart} points=${onchain.bridgeFlowHistory || []} />
            <div className="muted mono">Bridge flow shifts (24h)</div>
            ${onchain.bridgeTotals.map(
              (item, index) => html`
                <div className="card-actions" key=${`${item.chain}-bridge-${index}`}>
                  <span className="mono">${item.chain}</span>
                  <span className="muted mono">${formatNumber(item.inflow24h)}</span>
                </div>
              `
            )}
          </div>

          <div className="card">
            <div className="card-label mono">Spot prices (Hyperliquid)</div>
            <div className="muted mono">Top spot pairs with 7-day charts</div>
            ${spot.spotPrices.map(
              (asset, index) => html`
                <div className="card-actions" key=${`${asset.symbol}-${index}`}>
                  <span className="mono">${asset.symbol}</span>
                  <span className="muted mono">
                    ${formatNumber(asset.price)} • 24h ${formatPercent(asset.dayChangePct)}
                  </span>
                </div>
                <${MiniChart}
                  points=${(spot.spotHistory || []).find((history) => history.symbol === asset.symbol)?.points || []}
                  lineClass="chart-line-price"
                />
              `
            )}
          </div>
        </section>
      </main>
      <${Footer} />
    </div>
  `
}

function Header() {
  return html`
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <h1>Dashboard</h1>
          <span className="muted mono">Industrial • Dense • Small</span>
        </div>
        <div className="controls">
          <${ThemeToggle} />
          <${CompactToggle} />
        </div>
      </div>
    </header>
  `
}

function Footer() {
  return html`
    <footer className="footer">
      <div className="container">
        <p className="muted mono">Built with Cloudflare Pages • Updated every hour</p>
      </div>
    </footer>
  `
}

function RegimeCard({ label, value }) {
  return html`
    <div className="card">
      <div className="card-label mono">${label}</div>
      <div className="card-value">${value || '—'}</div>
    </div>
  `
}

function MiniChart({ points, lineClass = 'chart-line' }) {
  if (!Array.isArray(points) || points.length < 2) {
    return html`<div className="muted mono chart-empty">No daily chart data</div>`
  }

  const width = 300
  const height = 86
  const padding = 10
  const values = points.map((point) => Number(point.value)).filter((value) => Number.isFinite(value))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const xStep = (width - padding * 2) / Math.max(points.length - 1, 1)

  const path = points
    .map((point, index) => {
      const x = padding + index * xStep
      const y = padding + (1 - (Number(point.value) - min) / range) * (height - padding * 2)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const firstDate = points[0]?.date || '—'
  const lastDate = points[points.length - 1]?.date || '—'

  return html`
    <div className="chart-wrap">
      <svg className="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="daily chart">
        <path className=${lineClass} d=${path} />
      </svg>
      <div className="chart-meta mono muted">
        <span>${firstDate}</span>
        <span>${formatCompact(min)} → ${formatCompact(max)}</span>
        <span>${lastDate}</span>
      </div>
    </div>
  `
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [theme])

  return html`
    <button className="button button-green" onClick=${() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  `
}

function CompactToggle() {
  const [dense, setDense] = useState(() => {
    try {
      return localStorage.getItem('dense') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (dense) {
      root.classList.add('dense')
      localStorage.setItem('dense', '1')
    } else {
      root.classList.remove('dense')
      localStorage.removeItem('dense')
    }
  }, [dense])

  return html`
    <button className="button button-orange" onClick=${() => setDense(!dense)}>Compact</button>
  `
}

const rootElement = document.getElementById('app')

if (!rootElement) {
  throw new Error('Root element #app not found')
}

const root = createRoot(rootElement)
root.render(html`<${App} />`)
