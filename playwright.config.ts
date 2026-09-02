import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT ?? 3100)
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Escape hatch for environments that ship their own Chromium build rather
    // than the one `npx playwright install` would fetch. Leave unset normally.
    launchOptions: process.env.CIVICOS_CHROMIUM_PATH
      ? { executablePath: process.env.CIVICOS_CHROMIUM_PATH }
      : {},
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Tested against a production build: it exercises the same code path users
    // get, and avoids depending on the dev server's HMR socket.
    command: `npm run build && npx next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      // Speed the mock run engine up so the e2e suite doesn't wait on animation.
      CIVICOS_RUN_TICK_MS: '80',
      // Exercise the domain restriction; without this the allowlist is empty
      // and any address is accepted.
      NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS: 'gov.uk,london.gov.uk,nhs.net',
    },
  },
})
