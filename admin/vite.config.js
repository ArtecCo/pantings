import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const LOCAL_API = 'http://localhost/paintings/api'
const LOCAL_ORIGIN = 'http://localhost'
const PRODUCTION_API = 'https://api.arts.araha.co.in'
const PRODUCTION_ORIGIN = 'https://api.arts.araha.co.in'

function normalizeApiUrls(mode) {
  const api = mode === 'production' ? PRODUCTION_API : LOCAL_API
  const origin = mode === 'production' ? PRODUCTION_ORIGIN : LOCAL_ORIGIN

  return {
    name: 'normalize-ara-api-urls',
    enforce: 'pre',
    transform(code, id) {
      if (!/[.]jsx?$/.test(id) || id.includes('node_modules')) return null

      const normalized = code
        .replaceAll('http://localhost/paintings/api', api)
        .replaceAll('http://api.arts.araha.co.in', origin)
        .replaceAll('https://api.arts.araha.co.in', origin)
        .replaceAll('http://localhost', origin)

      return normalized === code ? null : { code: normalized, map: null }
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [normalizeApiUrls(mode), react()],
  define: {
    API: JSON.stringify(mode === 'production' ? PRODUCTION_API : LOCAL_API),
  },
}))
