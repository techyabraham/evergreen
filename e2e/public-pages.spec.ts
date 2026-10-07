import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page exposes primary navigation and has no serious accessibility violations', async ({ page }) => {
  const response = await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Rent' })).toBeVisible();
  const headers = await response!.allHeaders();
  expect(headers['content-security-policy']).toContain('nonce-');
  expect(headers['x-frame-options']).toBe('DENY');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.filter(issue => issue.impact === 'critical' || issue.impact === 'serious')).toEqual([]);
});

test('request and safety pages are reachable', async ({ page }) => {
  for (const [path, heading] of [['/request', /tell us what you need/i], ['/safety', /safety/i]] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter(issue => issue.impact === 'critical' || issue.impact === 'serious')).toEqual([]);
  }
});

test('mobile navigation stays within the viewport and works by keyboard', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  const menu = page.locator('.mobile-menu summary');
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Mobile main navigation' }).getByRole('link', { name: 'Rent' })).toBeVisible();
});
