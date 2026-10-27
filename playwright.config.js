import { defineConfig } from '@playwright/test'

console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase key aanwezig:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: process.env.PW_CHANNEL,
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
