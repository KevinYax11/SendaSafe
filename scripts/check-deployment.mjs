import assert from 'node:assert/strict'

const baseUrl = new URL(process.argv[2] ?? 'http://127.0.0.1:3000')

async function request(path, status = 200) {
  const response = await fetch(new URL(path, baseUrl), { signal: AbortSignal.timeout(5000) })
  assert.equal(response.status, status, path)
  return response
}

const home = await (await request('/')).text()
assert.match(home, /<title>SendaSafe/)
assert.match(home, /<option value="GT">Guatemala<\/option>/)
assert.match((await request('/icons/sendasafe.svg')).headers.get('content-type') ?? '', /image\/svg\+xml/)
assert.match((await request('/icons/sendasafe-180.png')).headers.get('content-type') ?? '', /image\/png/)
const stylesheet = home.match(/href="(\/_next\/static\/[^"]+\.css)"/)
assert.ok(stylesheet, 'The home page includes its stylesheet')
await request(stylesheet[1])

const manifest = await (await request('/manifest.webmanifest')).json()
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.start_url, '/')
for (const { src } of manifest.icons) {
  assert.match((await request(src)).headers.get('content-type') ?? '', /image\/png/)
}
assert.match(await (await request('/service-worker.js')).text(), /addEventListener\('fetch'/)
assert.match(home, /href="\/map"/)
assert.match(await (await request('/map')).text(), /Mapa de recursos/)
const world = await (await request('/geography/world.json')).json()
const community = await (await request('/community')).text()
assert.match(community, /href="\/#orientacion"/)
const admin = await request('/admin')
assert.match(admin.headers.get('cache-control') ?? '', /no-store/)
if (process.argv.includes('--read-only')) {
  assert.match(community, /comunidad está pendiente de configurar/)
  assert.doesNotMatch(await (await request('/community?country=GT')).text(), /Enviar de forma anónima/)
  assert.match(await admin.text(), /acceso administrativo todavía no está configurado/)
}

const { countries } = await (await request('/api/v1/countries')).json()
const covered = countries.filter(country => country.hasCoverage)
assert.ok(countries.length > 0)
assert.equal(covered.length, countries.length, 'Every selectable country has a directory')
for (const { code } of covered) {
  const path = `/api/v1/countries/${code}/resources`
  const { country, resources } = await (await request(path)).json()
  assert.equal(country.code, code, path)
  assert.ok(resources.length >= 45, path)
  assert.ok(world[code]?.[1]?.length, `Map boundary for ${code}`)
  const { places, references } = await (await request(`/geography/${code}.json`)).json()
  assert.ok(Object.keys(places).length > 50, `Municipalities for ${code}`)
  assert.ok(Object.keys(references).length > 0, `Mapped catalog areas for ${code}`)
  for (const id of Object.values(references)) {
    const [, , latitude, longitude] = places[id] ?? []
    assert.ok(Number.isFinite(latitude) && Math.abs(latitude) <= 90, `Latitude in ${code}/${id}`)
    assert.ok(Number.isFinite(longitude) && Math.abs(longitude) <= 180, `Longitude in ${code}/${id}`)
  }
}

await request('/api/v1/countries/ZZ/resources', 404)
const resourcesPath = '/api/v1/countries/GT/resources'
const filtered = await (await request(`${resourcesPath}?q=coban&category=migration-and-legal`)).json()
assert.ok(filtered.resources.length > 0, 'Filters find Cobán even without the accent')
assert.ok(filtered.resources.every(resource => resource.category === 'migration-and-legal'))
for (const query of ['category=invalid', 'q=a&q=b', 'category=emergency&category=protection', `q=${'x'.repeat(101)}`]) {
  const response = await (await request(`${resourcesPath}?${query}`, 400)).json()
  assert.match(response.error.code, /^invalid_(category|query)$/)
}
console.log(`SendaSafe responded successfully for ${covered.length} country catalogs.`)
