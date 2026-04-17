# Macro Monitoring Dashboard Product Spec

## Purpose

Build a personal web app for `Core Structure 1: Perps Trading: Macro + Technical`.

The app should help answer one question repeatedly:

`What macro, cross-asset, derivatives, onchain, and narrative conditions matter right now for trading crypto perps?`

This is a `monitoring and context dashboard`, not a charting terminal and not a trading journal.

`Price charts, execution, account history, fills, PnL, and ledger workflows stay on TradingView / Hyperliquid.`

The app should instead own:

- macro regime monitoring
- global cross-asset context monitoring
- event-driven trading prep
- perp market structure and reflexivity signals
- onchain / flow confirmation
- narrative and launch monitoring
- alerts and watchlists

## Product Goal

Turn noisy monitoring into a repeatable operating loop:

`macro read -> cross-asset confirmation -> event watch -> perp structure read -> narrative / onchain confirmation -> attention ranking`

## Primary User

Single-user operator workflow.

This spec assumes:

- one main user
- no multi-user collaboration
- no requirement for tick-level updates
- free data sources are preferred even if updates are slower
- manual judgment remains central

## Non-Goals

- building full TradingView-style charting
- rebuilding Hyperliquid execution or account views
- storing trade ledger, fills, or PnL as a primary workflow
- individual stock research
- stock-specific earnings monitoring
- high-frequency automation
- dependence on paid APIs in v1 unless a free source is clearly inadequate

## Scope Boundaries

Included:

- U.S. macro
- global macro that affects crypto, commodities, and broad equity indexes
- commodities context
- U.S. and non-U.S. broad index context
- emerging market index context
- crypto market structure context excluding chart rendering

### V1 Index Universe

The `Cross-Asset Monitor` and `Overview` should explicitly track these equity index buckets in v1:

- `U.S.`: S&P 500 and Nasdaq 100
- `India`: Nifty 50 and Sensex
- `U.K.`: FTSE 100
- `China mainland`: CSI 300 and SSE Composite
- `Hong Kong`: Hang Seng Index
- `Emerging markets`: one broad EM proxy such as MSCI Emerging Markets / EEM

No other equity index families are required in v1 unless they materially improve the macro read.

Explicitly excluded:

- single-stock dashboards
- manual trade entry
- journal / review workflows
- account syncing
- full portfolio accounting

## Product Principles

- `Attention over exhaustiveness`: the best screen tells you what deserves attention in under 2 minutes.
- `Free-first architecture`: use official and free sources first; accept lower refresh frequency.
- `Context over raw feeds`: every module should explain why the signal matters for crypto perps.
- `Operator-first`: manual tags, overrides, notes, and watchlists are first-class.
- `Separation of layers`: slow macro, medium cross-asset, fast derivatives, and noisy narrative flows should be visible as separate layers.
- `Charts stay external`: every market and event should deep-link to TradingView, Hyperliquid, or the source release page.

## User Jobs

The product should help the user:

- understand whether the current regime is risk-on, risk-off, inflationary, disinflationary, liquidity-driven, or event-driven
- see what U.S. and global releases matter next
- monitor whether commodities, dollar, rates, and indexes are confirming or contradicting crypto moves
- detect crowded or reflexive perp positioning
- track whether onchain flows confirm the move
- track narratives and launch rotations without depending on charts inside the app
- decide what deserves attention now versus later

## Top-Level Navigation

1. `Overview`
2. `Macro Regime`
3. `Cross-Asset Monitor`
4. `Event Calendar`
5. `Perp Structure`
6. `Onchain / Flows`
7. `Narratives`
8. `Launch Radar`
9. `Alerts`
10. `Settings / Data Sources`

## Information Architecture

The product should have four monitoring layers:

1. `Slow Layer`
   U.S. and global macro regime, policy, inflation, growth, liquidity.
2. `Cross-Asset Layer`
   Rates, dollar, commodities, broad indexes, emerging markets, crypto beta context.
3. `Fast Market Layer`
   funding, open interest, liquidations, basis, venue context, watchlist stress.
4. `Narrative Layer`
   CT, launches, sector rotations, ecosystem mindshare, source monitoring.

## Screen Spec

### 1. Overview

The home screen should answer:

- what regime are we in?
- what is the key macro risk this week?
- what is cross-asset confirming or denying?
- where is perp positioning stretched?
- what narratives or launches need attention?

#### Widgets

- `Regime summary`
  - growth
  - inflation
  - policy direction
  - dollar pressure
  - commodity pressure
  - broad risk tone
- `Today / this week events`
  - next 5 to 10 relevant releases and policy meetings
- `Cross-asset heat strip`
  - U.S. rates direction
  - DXY
  - gold
  - oil
  - copper
  - S&P 500 / Nasdaq 100 state
  - Nifty / Sensex state
  - FTSE 100 state
  - CSI 300 / SSE Composite / Hang Seng state
  - EM broad index proxy
  - BTC and ETH context
- `Perp stress board`
  - highest funding
  - fastest OI expansion
  - biggest liquidation pockets
  - basis anomalies
- `Narrative movers`
  - rising topic clusters
  - HYPE / Hyperliquid mindshare
  - launch / meme acceleration
- `Onchain confirmation board`
  - stablecoin net changes
  - bridge flow anomalies
  - ecosystem activity shifts
- `Action queue`
  - events to prep
  - alerts not yet acknowledged
  - watchlist names with stacked signals

### 2. Macro Regime

This page is the slow-thinking layer.

#### Core sections

- `U.S. rates and curve`
  - 2Y, 10Y, 30Y
  - 2s10s and 3m10y
  - real yields later if useful
- `U.S. inflation`
  - CPI headline and core
  - PPI headline and core
- `U.S. growth`
  - GDP
  - retail sales
  - ISM manufacturing
  - ISM services
  - payrolls / unemployment
- `U.S. external balance`
  - trade balance
  - current account
- `Global growth and inflation monitor`
  - euro area inflation and growth proxies
  - India inflation / growth proxies
  - China activity proxies
  - major EM growth / inflation aggregates or selected country proxies
- `Global policy board`
  - Fed
  - ECB
  - BoE
  - RBI
  - PBOC
  - selected EM central banks later if needed
- `Liquidity / dollar board`
  - DXY or broad dollar proxy
  - reserves / liquidity proxies where feasible
  - financial conditions proxy

#### Required behavior

- show latest value, previous value, change versus prior release, and trailing trend
- show last release date and next scheduled release
- show a short `why this matters for crypto perps` explanation for each series
- support manual regime override

### 3. Cross-Asset Monitor

This page should connect macro to tradeable context without embedding charts.

#### Objective

Show whether crypto is moving with, ahead of, or against the broader macro tape.

#### Sections

- `Rates and FX`
  - U.S. yields
  - DXY
  - major FX proxies if useful for macro context
- `Commodities`
  - gold
  - silver
  - crude oil
  - natural gas
  - copper
  - broad commodity index
- `Broad equity indexes`
  - S&P 500
  - Nasdaq 100
  - Nifty 50
  - Sensex
  - FTSE 100
  - CSI 300
  - SSE Composite
  - Hang Seng
  - emerging market broad proxy
- `Crypto beta context`
  - BTC dominance
  - total crypto market cap proxy
  - stablecoin supply trend
  - spot ETF flow proxy later if free source is workable
- `Relative state board`
  - risk assets confirming
  - commodities warning
  - dollar tightening
  - rates pressure
  - EM under stress

#### Important design note

This page is not for detailed chart study. It is for `state`, `trend`, and `confirmation`.

Each row should support:

- latest level
- 1d / 5d / 1m / 3m change
- percentile or z-score versus trailing lookback
- regime tag
- deep link to chart

### 4. Event Calendar

This page supports event-driven trading.

#### Event families

- U.S. CPI
- U.S. PPI
- U.S. payrolls / unemployment
- FOMC and minutes
- U.S. GDP
- U.S. retail sales
- U.S. trade balance
- U.S. current account
- ISM manufacturing
- ISM services
- ECB meetings
- BoE meetings
- RBI events
- PBOC events
- major China releases where accessible through stable sources
- optional later: Treasury refunding, Beige Book, SLOOS, PMIs outside the U.S., token unlocks

#### Event row schema

- event name
- region
- release timestamp
- category
- source
- previous
- consensus if available
- actual
- surprise if available
- impacted watchlist assets
- prep note
- post-event note
- status: upcoming, released, reviewed

#### Event-driven workflow

- `T-7 to T-1`
  - prep attention note
  - define what assets to watch externally
  - define the likely macro path dependencies
- `T-0`
  - pin the event panel
  - ingest actual print
  - highlight surprise versus previous or consensus
- `T+0 / T+1`
  - store short reaction note
  - classify whether reaction was macro-led or reflexive spillover

### 5. Perp Structure

This page is the fast derivatives layer, excluding chart rendering.

#### Default watchlist

- BTC
- ETH
- SOL
- HYPE
- majors watchlist
- rotating narrative names
- hot launches that become perp-tradable

#### Metrics

- funding rate
- funding percentile or z-score
- open interest
- OI change over 1h / 24h / 7d
- liquidations over 1h / 24h
- basis or premium where available
- volume
- long / short ratio if reliable
- exchange or venue concentration if available from free sources
- Hyperliquid-specific context where relevant

#### Derived tags

- `crowded longs`
- `crowded shorts`
- `short squeeze risk`
- `long squeeze risk`
- `trend continuation`
- `mean reversion candidate`
- `event setup`
- `noise`

#### Required behavior

- sortable table
- anomaly badges
- market compare view
- pin to top
- external links to TradingView and Hyperliquid

### 6. Onchain / Flows

This page answers whether the move has flow confirmation.

#### Focus areas

- stablecoin supply growth / contraction
- chain-level stablecoin net flows
- bridge inflows / outflows
- exchange flow proxies where free data is reliable
- ecosystem activity for chains being traded
- venue usage context for Hyperliquid / HyperEVM where relevant

#### Modules

- `Stablecoin flow board`
  - USDC / USDT supply changes
  - chain-level stablecoin growth
- `Bridge flow board`
  - top chain inflows and outflows
  - 24h / 7d shifts
- `Ecosystem activity board`
  - DEX volume
  - fees
  - active addresses or tx counts where meaningful
- `Venue context`
  - Hyperliquid usage / activity proxies

### 7. Narratives

This page tracks CT, meme rotations, broad narratives, and HYPE / Hyperliquid mindshare.

#### Constraint

`X / CT data access is the weakest part of the stack if we stay free-first.`

So v1 should be `semi-automated`, not a full social firehose.

#### Narrative buckets

- AI
- memes
- stablecoins
- Hyperliquid / HYPE
- perp infrastructure
- onchain trading infra
- launchpads
- majors / beta rotation

#### Source types

- curated RSS feeds
- selected blogs / newsletters
- manually curated X account lists
- manual note entry

#### Metrics

- mention count
- unique source count
- change versus trailing average
- operator confidence
- source penetration across the curated list

#### Required behavior

- create and edit narrative buckets
- define keywords
- pin source accounts or feeds
- mark items as `signal`, `noise`, `copied`, `actionable`

### 8. Launch Radar

This page tracks new launches and attention rotations.

#### Use cases

- new perp listings
- new tokens with fast liquidity formation
- launch clusters around a narrative
- boosted attention names that may become tradable

#### Metrics

- first seen timestamp
- chain
- venue availability
- liquidity
- volume
- pair age
- perp listed or not
- narrative intensity
- unlock or supply risk if available

#### Outputs

- `too early`
- `watch`
- `tradable`
- `crowded reflexive`
- `avoid`

### 9. Alerts

The alert layer should be sparse and high-signal.

#### Alert types

- macro event in `7d / 24h / 1h`
- policy meeting upcoming
- actual release updated
- funding exceeds threshold
- OI expands beyond threshold
- liquidation spike
- stablecoin or bridge anomaly
- cross-asset divergence
- narrative velocity spike
- new launch crosses liquidity threshold

#### Alert delivery

For v1, alerts can live inside the app only.

Optional later:

- Telegram webhook

## Data Source Strategy

The stack should be `official and free first`.

Because this is a personal dashboard and not a public data product, `daily or a few-times-per-day refresh` is acceptable for most modules.

Suggested refresh bands:

- macro calendar and release values: on schedule plus 1 to 4 times daily
- macro time series: daily
- cross-asset levels: every 15 to 60 minutes if the free provider allows, otherwise daily
- onchain metrics: daily
- narratives: manual or scheduled every few hours
- launch radar: every 15 to 60 minutes if needed

## Data Source Plan

### A. U.S. macro time series and releases

Primary sources:

- `FRED API`
  - base warehouse for many U.S. macro series and market-linked macro proxies
- `BLS API`
  - CPI, PPI, jobs
- `BEA API`
  - GDP, current account, national accounts
- `U.S. Census Bureau economic indicator calendar`
  - retail sales, trade releases
- `ISM release calendar`
  - PMI release dates
- `Federal Reserve calendar`
  - FOMC, minutes, Beige Book, other Fed events

Reasoning:

- official
- free
- stable
- easy to cache

### B. Global macro and policy calendar

Primary sources:

- `IMF Data API`
  - cross-country macro datasets, WEO, current account, inflation, growth context
- `World Bank Indicators API`
  - broad cross-country macro series
- `ECB meeting calendar and policy pages`
  - euro area policy events
- `Bank of England policy calendar`
  - BoE policy events

Important note:

Global macro in v1 should be `selective`, not exhaustive. Use country and region proxies that actually matter for crypto and commodities.

Suggested v1 regions:

- U.S.
- euro area
- India
- China
- U.K.
- broad emerging markets

### C. Cross-asset market context

Free-first options:

- `Alpha Vantage`
  - broad index, commodity, FX, and economic indicator APIs with a free tier and rate limits
- `FRED`
  - some commodity and macro-linked financial proxies
- `IMF Primary Commodity Prices / PCPS`
  - broad commodity indices and monthly commodity context

Role in product:

- provide card-level and table-level state for broad indexes, commodities, dollar, and rates
- not meant to replace the user's charting tools

Design rule:

Do not depend on one free provider for everything. Use `official series where possible`, then use a general market data API only for broad asset monitoring rows.

### D. Perp market structure

Primary sources:

- `Hyperliquid API`
  - direct venue data, market metadata, funding, OI, asset contexts
- `CoinGecko`
  - broad crypto market context, derivatives and exchange reference endpoints where useful

Optional later:

- add another free derivatives aggregation source if needed
- add direct exchange APIs if cross-venue monitoring becomes necessary

Important constraint:

If a reliable free cross-exchange liquidations / OI aggregate is not available, keep v1 centered on `Hyperliquid + selected broad crypto context` rather than adding a brittle or paid dependency.

### E. Onchain / flows

Primary sources:

- `DefiLlama API`
  - chains, bridges, stablecoins, ecosystem overviews
- `Dune`
  - custom queries when a specific flow or ecosystem view matters
- `Hyperliquid historical data`
  - venue-specific historical studies if needed

### F. Narratives

Free-first approach:

- RSS feeds
- selected blogs / newsletters
- manual source entry
- optional lightweight X link capture done manually

Important constraint:

Do not make v1 depend on paid social APIs.

Narrative monitoring should start as:

- keyword buckets
- curated sources
- manual tagging
- velocity based on the small curated source graph

### G. Launch radar

Primary sources:

- `DEX Screener API`
  - new pairs, liquidity, pair age, early discovery
- `DefiLlama unlock and protocol datasets`
  - supply context and ecosystem overlays
- `Hyperliquid market metadata`
  - when names become perp-tradable

## Data Source Matrix

| Domain | Metrics / objects | Preferred source | Why |
| --- | --- | --- | --- |
| U.S. macro series | yields, spreads, inflation, GDP, retail sales, trade balance | FRED | free warehouse for many core U.S. series |
| U.S. releases | CPI, PPI, jobs | BLS | official releases |
| National accounts | GDP, current account | BEA | official source |
| U.S. economic schedule | retail sales, trade | Census | official release schedule |
| PMI schedule | manufacturing and services release dates | ISM | official schedule |
| Fed events | FOMC, minutes, Beige Book | Federal Reserve | official schedule |
| Global macro | country and region indicators | IMF / World Bank | free official cross-country data |
| ECB policy | meeting dates and decisions | ECB | official euro area policy source |
| BoE policy | MPC schedule and decisions | Bank of England | official U.K. policy source |
| Cross-asset context | broad indexes, FX, commodities | Alpha Vantage + official series | free-first broad market coverage |
| Commodity indices | broad commodity context | IMF PCPS / FRED | official or quasi-official series |
| Perp venue data | funding, OI, venue context | Hyperliquid API | direct source |
| Broad crypto context | market metadata, categories, exchange context | CoinGecko | broad free crypto coverage |
| Onchain aggregates | bridges, stablecoins, ecosystem overviews | DefiLlama | broad free onchain coverage |
| Custom onchain analytics | niche flow views | Dune | query flexibility |
| Launch discovery | new pairs, liquidity, pair age | DEX Screener | useful free-first launch radar |
| Narratives | curated source ingestion | RSS + manual tagging | robust and cheap |

## Derived Analytics

The dashboard should compute compact scores instead of only showing raw data.

### 1. Regime Score

Inputs:

- yield direction
- curve state
- inflation trend
- growth trend
- dollar direction
- commodity pressure

Output:

- regime label
- confidence
- change from prior week

### 2. Cross-Asset Confirmation Score

Inputs:

- dollar direction
- rates pressure
- gold / oil / copper state
- U.S. broad index state
- EM broad index state
- crypto relative strength

Output:

- confirming risk-on
- mixed
- confirming risk-off
- diverging

### 3. Event Importance Score

Inputs:

- event family
- time proximity
- regime sensitivity
- current market stress
- asset relevance

Output:

- low
- monitor
- prep
- high priority

### 4. Reflexivity Score

Inputs:

- funding extremity
- OI acceleration
- liquidation clustering
- basis dislocation

Output:

- calm
- building
- crowded
- squeeze risk

### 5. Narrative Velocity Score

Inputs:

- mention growth
- unique source count
- curated-source penetration
- operator confidence

Output:

- dormant
- emerging
- accelerating
- crowded

### 6. Launch Readiness Score

Inputs:

- listing age
- liquidity
- volume growth
- perp availability
- narrative intensity
- supply risk

Output:

- not ready
- watch
- tradable
- avoid

## Core Entities / Data Model

Suggested core tables:

- `macro_series`
- `macro_release_calendar`
- `macro_release_values`
- `global_policy_events`
- `cross_asset_watchlist`
- `cross_asset_metrics`
- `perp_market_watchlist`
- `perp_market_metrics`
- `onchain_metrics`
- `narrative_buckets`
- `narrative_sources`
- `narrative_mentions`
- `launch_candidates`
- `alerts`

## UX Notes

- default to dense tables and compact cards
- use strong filtering and pinning
- keep every row explainable
- optimize for desktop first
- use external chart links aggressively instead of building charting

## MVP Scope

### Must-have for v1

- overview page
- macro regime page
- cross-asset monitor page
- event calendar page
- perp structure page
- alerts
- manual narrative board
- basic onchain / flows summary

### Nice-to-have for v1.1

- richer global policy board
- launch radar automation
- more custom Dune queries
- narrative ingestion improvements

### Defer

- account sync
- journal / PnL / performance views
- mobile-first polish
- collaboration
- auto-execution

## Recommended Build Order

1. Build `Overview`, `Macro Regime`, `Cross-Asset Monitor`, and `Event Calendar`.
2. Add `Perp Structure`.
3. Add `Onchain / Flows`.
4. Add `Alerts`.
5. Add `Narratives`.
6. Add `Launch Radar`.

## Locked Decisions Before Build

- `Emerging markets` default proxy: `MSCI EM / EEM`
- `China` default mainland indexes: `CSI 300 + SSE Composite`
- `Notes`: no in-app note module in v1

## Current Recommendation

For the first implementation:

- keep it `monitoring only`
- go `free-first`
- prioritize `U.S. + key global proxies`
- use official data for macro and policy
- use external charting for price action
- treat narratives as a curated semi-manual workflow

That gives a useful operating dashboard without turning the first version into a data-engineering or social-scraping project.

## References

- FRED API: https://fred.stlouisfed.org/docs/api/fred/index.html
- BLS developers: https://www.bls.gov/developers/
- BEA open data: https://www.bea.gov/open-data
- U.S. Census economic indicators calendar: https://www.census.gov/economic-indicators/calendar-listview.html
- Federal Reserve calendar: https://www.federalreserve.gov/newsevents/calendar.htm
- IMF API: https://data.imf.org/en/Resource-Pages/IMF-API
- IMF WEO dataset: https://data.imf.org/Datasets/WEO
- IMF Primary Commodity Prices: https://www.imf.org/en/Research/commodity-prices
- IMF PCPS dataset: https://data.imf.org/Datasets/PCPS
- World Bank Indicators API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation
- ECB meeting calendar: https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html
- Bank of England MPC dates: https://www.bankofengland.co.uk/monetary-policy/upcoming-mpc-dates
- Alpha Vantage documentation: https://www.alphavantage.co/documentation/
- Hyperliquid API: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
- CoinGecko API docs: https://docs.coingecko.com/
- DefiLlama API docs: https://defillama.com/docs/api
- Dune API docs: https://docs.dune.com/api-reference
- DEX Screener API reference: https://docs.dexscreener.com/api/reference
