import { test, expect } from '@playwright/test'

const viewports = [
  { width: 375, height: 667 },
  { width: 393, height: 852 },
  { width: 430, height: 932 },
  { width: 820, height: 1180 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]

for (const viewport of viewports) {
  test(`geen horizontale scroll @ ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#/')
    await page.waitForSelector('text=Overzicht', { timeout: 15000 })
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
}
