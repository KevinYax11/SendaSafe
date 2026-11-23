import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const compose = process.argv.includes('--compose')
const rotate = process.argv.includes('--rotate')
const path = compose ? '.env' : '.env.local'
let config = existsSync(path) ? readFileSync(path, 'utf8').trimEnd() + '\n' : ''

for (const [name, size] of [['SENDASAFE_ADMIN_PASSWORD', 24], ['SENDASAFE_SESSION_SECRET', 48]]) {
  const pattern = new RegExp(`^${name}=(.*)$`, 'm')
  const existing = pattern.exec(config)?.[1].trim()
  if (existing && !rotate) continue
  const setting = `${name}=${randomBytes(size).toString('base64url')}`
  config = pattern.test(config) ? config.replace(pattern, setting) : config + setting + '\n'
}

writeFileSync(path, config, { encoding: 'utf8', mode: 0o600 })
console.log(`Configuración guardada en ${path}. Consulta ahí tu contraseña. Reinicia SendaSafe si ya está ejecutándose.`)
