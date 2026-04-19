import { handleDashboard } from '../functions/dashboard'
import { handleRandom } from '../functions/random'

type Env = {
  ASSETS: Fetcher
  FRED_API_KEY?: string
  COINGECKO_DEMO_API_KEY?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/random') {
      return handleRandom(request)
    }

    if (url.pathname === '/api/dashboard') {
      return handleDashboard(env)
    }

    return env.ASSETS.fetch(request)
  },
}
