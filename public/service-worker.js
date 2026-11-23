const shellCache = 'sendasafe-shell-v1'
const staticPath = '/_next/static/'
const iconPath = '/icons/'

async function saveHome(response) {
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return
  const html = await response.clone().text()
  const paths = [...new Set(Array.from(html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g), match => match[1]))]
  if (!paths.some(path => path.endsWith('.js'))) return
  const cache = await caches.open(shellCache)
  await cache.addAll([...paths, '/icons/sendasafe.svg'])
  await cache.put('/', response)
}

self.addEventListener('install', event => {
  event.waitUntil(fetch('/', { cache: 'reload' }).then(saveHome))
})

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('sendasafe-shell-') && key !== shellCache).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]))
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate' && url.pathname === '/') {
    const online = fetch(request)
    event.waitUntil(online.then(response => saveHome(response.clone())).catch(() => {}))
    event.respondWith((async () => {
      const response = await online.catch(() => undefined)
      if (response && response.status < 500) return response
      return (await caches.match('/', { cacheName: shellCache })) ?? response ?? Response.error()
    })())
  } else if (url.pathname.startsWith(staticPath) || url.pathname.startsWith(iconPath)) {
    event.respondWith((async () => {
      const cache = await caches.open(shellCache)
      return (await cache.match(request)) ?? fetch(request)
    })())
  } else if (request.mode === 'navigate' && ['/community', '/admin', '/map'].includes(url.pathname)) {
    event.respondWith(fetch(request).catch(() => new Response(
      '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión | SendaSafe</title><main><h1>Sin conexión</h1><p>Esta sección necesita internet.</p><a href="/">Volver al directorio</a></main></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
    )))
  }
})
