import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';

// #1321: the desktop site. Every route of the generated routes.json renders the desktop shell; the home is the Cloud apps
// grid; suite apps open in an in-shell window; everything else embeds the pinned mobile page (?embed=1).
const D = '/cloud-desktop';
const ui = '.vendor/cloudy-ui/nav';
const routes = (JSON.parse(readFileSync(`${ui}/routes.json`, 'utf8')).routes as { path: string }[]).map((r) => r.path);
const nav = JSON.parse(readFileSync(`${ui}/nav.json`, 'utf8')) as { superapp: { bottom_nav: string[] } };
const shot = (page: Page, info: TestInfo, name: string) => page.screenshot({ path: `tests/results/shots/${info.project.name}/${name}.png` });

// every route, grouped by its first segment (one test per app / section keeps the run short)
const groups = new Map<string, string[]>();
for (const p of routes) { const k = p.split('/')[0] || 'home'; groups.set(k, [...(groups.get(k) ?? []), p]); }
test.describe('every route', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'routes run once, on the desktop project'));
  for (const [k, paths] of groups) {
    test(`${k} (${paths.length})`, async ({ page }) => {
      await page.route('**/cloud-webapps/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>m</title>' }));
      for (const p of paths) {
        const r = await page.goto(`${D}/${p}`);
        expect(r?.status(), p).toBe(200);
        await expect(page.getByTestId('desk-rail'), p).toBeVisible();
        await expect(page.getByTestId('desk-content'), p).toBeVisible();
      }
    });
  }
});

test('home: the rail is the island sections in order, the grid is the Cloud tiles, search filters', async ({ page }, info) => {
  await page.goto(`${D}/`);
  await expect(page.locator('.rail-item')).toHaveCount(nav.superapp.bottom_nav.length);
  expect(await page.locator('.rail-item').evaluateAll((els) => els.map((e) => e.getAttribute('data-id')))).toEqual(nav.superapp.bottom_nav);
  const n = await page.locator('.tile').count();
  expect(n).toBeGreaterThan(20);
  await shot(page, info, 'home');
  await page.getByTestId('desk-search').fill('calc');
  expect(await page.locator('.tile').count()).toBeLessThan(n);
  await expect(page.locator(`a.tile[href="${D}/cloud-calc/"]`)).toBeVisible();
});

for (const [path, src, name] of [['cloud-search/media/movies/', '/movies/', 'movies'], ['cloud-news/media/media/', '/music/', 'music'], ['cloud-news/feed/feed/', '/myfeed/', 'myfeed']] as const) {
  test(`suite window: ${name}`, async ({ page }, info) => {
    await page.goto(`${D}/${path}`);
    const win = page.getByTestId('desk-window');
    await expect(win).toHaveAttribute('data-src', src);
    await expect(page.frameLocator('[data-testid="desk-window"] iframe').locator('body')).not.toBeEmpty({ timeout: 15_000 });
    await shot(page, info, `suite-${name}`);
  });
}

test('mobile embed: a fleet page is the pinned /cloud-webapps page, chrome hidden; links swap by base', async ({ page }, info) => {
  await page.goto(`${D}/cloud-calc/calculator/calc/`);
  const frame = page.frameLocator('[data-testid="desk-mobile"]');
  await expect(frame.getByTestId('fleet-shell')).toBeVisible({ timeout: 15_000 });
  await expect(frame.getByTestId('calc-pad')).toBeVisible();
  await expect(page.getByTestId('desk-mobile-link')).toHaveAttribute('href', '/cloud-webapps/cloud-calc/calculator/calc/');
  await expect(page.getByTestId('desk-tree').locator('[aria-current="page"]')).toHaveText(/Calc/);
  await shot(page, info, 'calc');
});

test('cloud-nav: maps and navigation open the two maps apps', async ({ page }, info) => {
  await page.goto(`${D}/cloud-nav/explored/maps/`);
  await expect(page.getByTestId('desk-window')).toHaveAttribute('data-src', '/mymaps-maps/');
  await shot(page, info, 'cloud-nav-maps');
  await page.goto(`${D}/cloud-nav/navigation/`);
  await expect(page.getByTestId('desk-window')).toHaveAttribute('data-src', '/mymaps-navigation/');
});
