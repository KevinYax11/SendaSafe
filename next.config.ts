import type { NextConfig } from 'next'

const sqliteNative = ['./node_modules/@libsql/*/*.node']

const config: NextConfig = {
  output: process.env.SENDASAFE_STANDALONE === '1' ? 'standalone' : undefined,
  outputFileTracingIncludes: {
    '/admin': sqliteNative,
    '/community': sqliteNative,
    '/api/v1/countries/*/resources': sqliteNative,
    '/api/v1/geography/*': ['./data/geography/*.json'],
  },
  async headers() {
    const privateHeaders = [
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
    ]
    return [
      { source: '/service-worker.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/admin', headers: privateHeaders },
      { source: '/community', headers: privateHeaders },
    ]
  },
}

export default config
