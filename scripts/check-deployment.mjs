import assert from 'node:assert/strict'

const baseUrl = new URL(process.argv[2] ?? 'http://127.0.0.1:3000')

async function request(path, status = 200) {
  const response = await fetch(new URL(path, baseUrl), { signal: AbortSignal.timeout(5000) })
  assert.equal(response.status, status, path)
  return response
}

const home = await (await request('/')).text()
assert.match(home, /<title>SendaSafe/)
const stylesheet = home.match(/href="(\/_next\/static\/[^"]+\.css)"/)
assert.ok(stylesheet, 'The home page includes its stylesheet')
await request(stylesheet[1])

const { countries } = await (await request('/api/v1/countries')).json()
const covered = countries.filter(country => country.hasCoverage)
assert.ok(countries.length > 0)
assert.equal(covered.length, countries.length, 'Every selectable country has a directory')
for (const { code } of covered) {
  const path = `/api/v1/countries/${code}/resources`
  const { country, resources } = await (await request(path)).json()
  assert.equal(country.code, code, path)
  assert.ok(resources.length >= 45, path)
}

await request('/api/v1/countries/ZZ/resources', 404)
console.log(`SendaSafe responded successfully for ${covered.length} country catalogs.`)
