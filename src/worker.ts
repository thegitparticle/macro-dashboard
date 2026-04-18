import { handleDashboard } from '../functions/dashboard'
import { handleRandom } from '../functions/random'

type Env = {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/random') {
      return handleRandom(request)
    }

    if (url.pathname === '/api/dashboard') {
      return handleDashboard()
    }

    return env.ASSETS.fetch(request)
  },
}
