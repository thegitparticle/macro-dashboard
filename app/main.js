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
  const narratives = dashboard?.overview?.narratives || { trendingCoins: [] }
  const sourceStatuses = dashboard?.sourceStatuses || []
  const fallbackCount = sourceStatuses.filter((status) => status.usedFallback).length

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

          <${RegimeCard} label="Growth" value=${regime.growth} />
          <${RegimeCard} label="Inflation" value=${regime.inflation} />
          <${RegimeCard} label="Perp risk tone" value=${regime.riskTone} />
          <${RegimeCard} label="Policy" value=${regime.policy} />
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
            <div className="muted mono">Stablecoin ecosystem concentration</div>
            ${onchain.topChains.map(
              (item, index) => html`
                <div className="card-actions" key=${`${item.chain}-${index}`}>
                  <span className="mono">${item.chain}</span>
                  <span className="muted mono">${formatNumber(item.mcap, 0)}</span>
                </div>
              `
            )}
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
            <div className="card-label mono">Narrative movers (CoinGecko)</div>
            <div className="muted mono">Trending crypto topics proxy</div>
            ${narratives.trendingCoins.map(
              (coin, index) => html`
                <div className="card-actions" key=${`${coin.symbol}-${index}`}>
                  <span className="mono">${coin.name} (${coin.symbol})</span>
                  <span className="muted mono">Rank #${coin.marketCapRank ?? '—'} • Score ${formatNumber(coin.score)}</span>
                </div>
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
