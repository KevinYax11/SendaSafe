import { randomBytes, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const url = 'http://127.0.0.1:3100'
const password = (process.env.SENDASAFE_TEST_PASSWORD ??= randomBytes(24).toString('hex'))

export default defineConfig({
  testDir: './tests',
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: { ...devices['Desktop Chrome'], baseURL: url, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm start -- --hostname 127.0.0.1 --port 3100',
    url,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
      SENDASAFE_DB_PATH: join(tmpdir(), `sendasafe-test-${randomUUID()}.sqlite`),
      SENDASAFE_ADMIN_PASSWORD: password,
      SENDASAFE_SESSION_SECRET: randomBytes(32).toString('hex'),
      TURSO_DATABASE_URL: '',
      TURSO_AUTH_TOKEN: '',
      VERCEL: '0',
    },
  },
})
