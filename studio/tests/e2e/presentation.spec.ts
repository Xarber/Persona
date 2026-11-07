// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from '@playwright/test';

test('dedicated landing is readable in both themes, responsive and available offline', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const shell = await page.request.get('/');
  expect(await shell.text()).toContain('An independent portfolio studio');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Your work.Your identity.Your web.',
  );
  await expect(page.getByRole('img', { name: /working visual editor/ })).toBeVisible();
  expect(
    await page
      .locator('.landing-preview img')
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => (document.documentElement.dataset.appearance = t), theme);
    // The actual inherited foreground/background values, rather than token string comparisons.
    const contrast = await page.locator('.landing-hero-bottom p').evaluate((el) => {
      const rgb = (s: string) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const lum = (c: number[]) =>
        c
          .map((n) => n / 255)
          .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
          .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
      const fg = lum(rgb(getComputedStyle(el).color));
      const bg = lum(
        rgb(getComputedStyle(document.querySelector('.landing-page')!).backgroundColor),
      );
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: `docs/reports/landing-${theme}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.landing-nav .landing-button')).toHaveCSS('transition-duration', '0s');
  await page.screenshot({ path: 'docs/reports/landing-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Open App', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create a website', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
  });
  await context.setOffline(true);
  await page.goto('/about/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your work.');
  expect(
    await page
      .locator('.landing-preview img')
      .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('studio dialog has an accessible name and Escape restores keyboard focus', async ({
  page,
}) => {
  await page.goto('/#app');
  const create = page.getByRole('button', { name: 'Create a website', exact: true });
  await create.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName(/./);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(create).toBeFocused();
});

test('first entry is remembered and logo/history preserve the mounted editor', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your work.');
  await page.getByRole('link', { name: 'Open App', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create a website', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Create a website', exact: true })).toBeVisible();
  await expect(page.locator('.landing-page')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create a website', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Still.*Minimal/ })
    .click();
  await page.getByLabel('Website name', { exact: true }).fill('Preserved entry project');
  await page.getByLabel('Your name').fill('Entry Test');
  await page.getByRole('button', { name: 'Open the editor' }).click();
  const canvas = page.frameLocator('iframe[title="Portfolio canvas"]');
  await page.getByRole('button', { name: 'Insert', exact: true }).click();
  await page
    .locator('.component-buttons')
    .getByRole('button', { name: 'Heading', exact: false })
    .click();
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toBeVisible();
  const editorURL = page.url();
  await page.getByRole('button', { name: 'Persona home', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your work.');
  expect(new URL(page.url()).pathname).toBe('/');
  expect(new URL(page.url()).hash).toBe('');
  await page.getByRole('link', { name: 'Open App', exact: true }).click();
  await expect(page).toHaveURL(editorURL);
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your work.');
  await page.goForward();
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toBeVisible();
  await page.reload();
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toBeVisible();
});

test('entry works when browser preference persistence is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
    Storage.prototype.setItem = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Open App', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create a website', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Persona home', exact: true }).click();
  await page.getByRole('link', { name: 'Open App', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create a website', exact: true })).toBeVisible();
});
