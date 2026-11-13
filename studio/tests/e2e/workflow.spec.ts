// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect, devices, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import sharp from 'sharp';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window === window.top) localStorage.setItem('persona-app-opened', 'true');
  });
});
async function createLocal(page: Page, name = 'Browser portfolio') {
  await page.getByRole('button', { name: 'Create a website', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Still.*Minimal/ })
    .click();
  await page.getByLabel('Website name', { exact: true }).fill(name);
  await page.getByLabel('Your name').fill('Jordan Lane');
  await page.getByRole('button', { name: 'Open the editor' }).click();
  await expect(page.getByTitle('Portfolio canvas')).toBeVisible();
}
async function saved(page: Page) {
  await expect(page.locator('.save-status')).toHaveText('Saved', { timeout: 15000 });
}
test('local workspace: visual editing, undo/redo, responsive styles, recovery and independent export', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await createLocal(page);
  const canvas = page.frameLocator('iframe[title="Portfolio canvas"]');
  const hero = canvas.locator('.n-hero h1 [data-edit]');
  await hero.dblclick();
  await canvas.locator('[contenteditable=true]').fill('A portfolio that persists.');
  await canvas.locator('[contenteditable=true]').press('Tab');
  await expect(canvas.getByRole('heading', { name: 'A portfolio that persists.' })).toBeVisible();
  await saved(page);
  await page.getByRole('button', { name: 'Insert', exact: true }).click();
  await page
    .locator('.component-buttons')
    .getByRole('button', { name: 'Heading', exact: false })
    .click();
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toHaveCount(1);
  await canvas.getByRole('heading', { name: 'A little more about me' }).click();
  await page.getByRole('button', { name: 'mobile preview', exact: true }).click();
  await expect(page.getByTitle('Portfolio canvas')).toHaveCSS('width', '390px');
  await page.getByLabel('Text size', { exact: true }).fill('30');
  await saved(page);
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toHaveCSS(
    'font-size',
    '30px',
  );
  await page.reload();
  await expect(page.getByTitle('Portfolio canvas')).toBeVisible();
  await expect(canvas.getByRole('heading', { name: 'A portfolio that persists.' })).toBeVisible();
  await page.getByRole('button', { name: 'mobile preview', exact: true }).click();
  await expect(canvas.getByRole('heading', { name: 'A little more about me' })).toHaveCSS(
    'font-size',
    '30px',
  );
  await page.getByRole('button', { name: 'Site styles', exact: true }).click();
  await page.getByLabel('Theme accent').fill('#9b3c32');
  await saved(page);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('dialog').getByTitle('Website preview')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project', exact: true }).click();
  const projectDownload = await downloadEvent;
  const project = await JSZip.loadAsync(await readFile((await projectDownload.path())!));
  expect(project.file('persona.json')).toBeTruthy();
  await page.getByRole('button', { name: 'Publish', exact: false }).click();
  await page.getByRole('button', { name: 'Export & own' }).click();
  const staticEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export ZIP', exact: true }).click();
  const dl = await staticEvent;
  const zip = await JSZip.loadAsync(await readFile((await dl.path())!));
  const directory = await mkdtemp(path.join(tmpdir(), 'persona-export-'));
  for (const f of Object.values(zip.files)) {
    if (f.dir) continue;
    const dest = path.join(directory, f.name);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, await f.async('nodebuffer'));
  }
  const server = createServer(async (req, res) => {
    try {
      const p = decodeURIComponent(new URL(req.url!, 'http://localhost').pathname);
      const filename = path.join(directory, p.endsWith('/') ? p + 'index.html' : p);
      const content = await readFile(filename);
      res.setHeader(
        'Content-Type',
        filename.endsWith('.html')
          ? 'text/html'
          : filename.endsWith('.js')
            ? 'application/javascript'
            : 'application/octet-stream',
      );
      res.end(content);
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const independent = await context.newPage();
  await independent.goto(`http://127.0.0.1:${address.port}/`);
  await expect(
    independent.getByRole('heading', { name: 'A portfolio that persists.' }),
  ).toBeVisible();
  await independent.getByRole('link', { name: 'View Common Ground' }).click();
  await expect(
    independent.getByRole('heading', { name: 'Common Ground', exact: true }),
  ).toBeVisible();
  await independent.setViewportSize({ width: 390, height: 844 });
  await independent.goto(`http://127.0.0.1:${address.port}/`);
  expect(await independent.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
    true,
  );
  await independent.screenshot({ path: 'docs/reports/export-mobile.png', fullPage: true });
  await independent.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await rm(directory, { recursive: true, force: true });
  expect(errors).toEqual([]);
});
test('connected workspace: image upload, keyboard reorder, publish, public form and rollback', async ({
  page,
  context,
}) => {
  const email = `browser-${Date.now()}@example.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in / create account', exact: true }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel(/^Password/).fill('browser-only-test-password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.locator('.header-status')).toContainText('Connected workspace');
  await createLocal(page, 'Connected browser portfolio');
  const canvas = page.frameLocator('iframe[title="Portfolio canvas"]');
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  const firstHandle = page.getByRole('button', { name: 'Reorder Navigation', exact: true });
  await firstHandle.focus();
  await firstHandle.press('Space');
  await expect(firstHandle).toHaveAttribute('aria-pressed', 'true');
  await firstHandle.press('ArrowDown');
  const targetId = await page.locator('.layer-row').nth(1).getAttribute('data-layer-id');
  await expect(page.locator('[id^="DndLiveRegion-"]')).toContainText(
    `was moved over droppable area ${targetId}`,
  );
  await firstHandle.press('Space');
  await saved(page);
  await expect(page.locator('.layer-label').first()).toContainText('Good work.');
  await page.getByRole('button', { name: 'Insert', exact: true }).click();
  await page.locator('.component-buttons').getByRole('button', { name: /Image/ }).click();
  await page
    .locator('.editor-inspector')
    .getByRole('button', { name: 'Content', exact: true })
    .click();
  await page.getByRole('button', { name: 'Choose from assets' }).click();
  const png = await sharp({
    create: { width: 100, height: 80, channels: 3, background: '#447755' },
  })
    .png()
    .toBuffer();
  await page
    .getByRole('dialog')
    .locator('input[type=file]')
    .setInputFiles({ name: 'test-cover.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByRole('button', { name: 'Use asset' })).toBeVisible();
  await page.getByRole('button', { name: 'Use asset' }).click();
  await saved(page);
  const image = canvas.locator('.n-image img');
  await canvas.locator('.n-image').scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Publish', exact: false }).click();
  await page.getByRole('button', { name: 'Publish website', exact: true }).click();
  await expect(page.getByText('Your website is live.', { exact: true })).toBeVisible({
    timeout: 20000,
  });
  const link = page.getByRole('dialog').locator('a[href*="/sites/"]');
  const url = (await link.getAttribute('href'))!;
  const publicPage = await context.newPage();
  await publicPage.goto(url);
  await expect(publicPage.getByRole('heading', { name: /Good work/ })).toBeVisible();
  await publicPage.getByLabel('Your name', { exact: true }).fill('A visitor');
  await publicPage.getByLabel('Email address').fill('visitor@example.test');
  await publicPage.getByLabel('Your message').fill('Hello from a browser integration test.');
  await publicPage.getByRole('button', { name: /Send your note/ }).click();
  await expect(publicPage.getByRole('status')).toContainText('Your note has been received');
  await publicPage.close();
  await page.getByRole('button', { name: 'Messages', exact: true }).click();
  await expect(
    page.getByText('Hello from a browser integration test.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.locator('.layer-label').filter({ hasText: 'Good work.' }).click();
  await page.getByRole('button', { name: 'Fit', exact: true }).click();
  await canvas.locator('.n-hero h1').scrollIntoViewIfNeeded();
  await expect(page.locator('.toast')).toHaveCount(0, { timeout: 6000 });
  await page.screenshot({ path: 'docs/reports/editor-desktop.png', fullPage: true });
});
test('developer ideas persist, safe import, developer access expires after inactivity and tab changes', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Developer options', exact: true })).toHaveCount(0);
  const version = page.getByRole('button', { name: /Persona 0\.1\.0/ });
  await version.click({ clickCount: 3 });
  await page.getByRole('button', { name: 'Ideas', exact: true }).click();
  await page.getByRole('button', { name: 'New idea' }).click();
  await page.getByLabel('Title', { exact: true }).fill('A persistent idea');
  await page
    .getByLabel('Description & reproduction steps')
    .fill('A thought captured while making a portfolio.');
  await page.getByRole('button', { name: 'Save idea' }).click();
  await expect(page.getByRole('heading', { name: 'A persistent idea' })).toBeVisible();
  await page.getByRole('button', { name: 'My websites 0' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ideas', exact: true })).toHaveCount(0);
  await version.click({ clickCount: 3 });
  await page.getByRole('button', { name: 'Ideas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A persistent idea' })).toBeVisible();
  await page.clock.fastForward(31000);
  await expect(page.getByRole('button', { name: 'Ideas', exact: true })).toHaveCount(0);
});
test('production PWA supports cold offline local editing and a responsive dashboard', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Make yourself at home.' }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/reports/dashboard-mobile.png', fullPage: true });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible();
  await createLocal(page, 'Offline portfolio');
  await expect(page.getByTitle('Portfolio canvas')).toBeVisible();
  await saved(page);
  await context.setOffline(false);
});

test.describe('compact touch editor', () => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = devices['iPhone 13'];
  test.use({ viewport, deviceScaleFactor, isMobile, hasTouch, userAgent });

  test('shows one panel at a time and saves an edit without horizontal workspace scroll', async ({
    page,
  }) => {
    await page.goto('/');
    await createLocal(page, 'Touch portfolio');
    const panels = page.getByRole('navigation', { name: 'Editor panels' });
    const workspace = page.locator('.editor-workspace');
    await expect(workspace.locator('.editor-left')).toBeHidden();
    await expect(workspace.locator('.editor-inspector')).toBeHidden();
    expect(await workspace.evaluate((el) => el.scrollWidth)).toBe(390);
    await page.getByRole('button', { name: 'Fit', exact: true }).tap();
    const sheet = await page.locator('.canvas-sheet').boundingBox();
    expect(sheet!.x + sheet!.width).toBeLessThanOrEqual(390);

    await panels.getByRole('button', { name: 'Structure' }).tap();
    await expect(page.getByTitle('Portfolio canvas')).toBeHidden();
    await page.getByRole('button', { name: 'Insert', exact: true }).tap();
    await page.locator('.component-buttons').getByRole('button', { name: 'Heading' }).tap();
    await panels.getByRole('button', { name: 'Style' }).tap();
    await page.getByLabel('Text size', { exact: true }).fill('30');
    await panels.getByRole('button', { name: 'Canvas' }).tap();
    const heading = page
      .frameLocator('[title="Portfolio canvas"]')
      .getByRole('heading', { name: 'A little more about me' });
    await expect(heading).toHaveCSS('font-size', '30px');
    await saved(page);
    await page.reload();
    await expect(heading).toHaveCSS('font-size', '30px');
  });
});

test('passkey registration and sign-in with a virtual authenticator', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in / create account', exact: true }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Email address').fill(`passkey-${Date.now()}@example.test`);
  await page.getByLabel(/^Password/).fill('passkey-browser-test-password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.locator('.header-status')).toContainText('Connected workspace');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Add passkey', exact: true }).click();
  await expect(page.getByText('Passkey added.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in / create account', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  await expect(page.locator('.header-status')).toContainText('Connected workspace');
  await cdp.detach();
});
