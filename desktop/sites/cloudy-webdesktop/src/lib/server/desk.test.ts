import { describe, expect, it } from 'vitest';
import nav from '@cloudy/ui/nav/nav.json';
import { ROUTES, SUITE, deskView } from './desk';

describe('desktop view model (#1321)', () => {
  it('renders every route of the generated routes.json under /cloud-desktop/', () => {
    for (const r of ROUTES) {
      const v = deskView(r.path);
      expect(v, r.path).not.toBeNull();
      if (v!.content.kind !== 'home') expect(v!.content.mobileHref).toBe(`/cloud-webapps/${r.path}`);
    }
    expect(deskView('no/such/page/')).toBeNull();
  });
  it('the rail is the SuperApp island: same sections, same order', () => {
    expect(deskView('')!.rail.map((r) => r.id)).toEqual((nav.superapp as { bottom_nav: string[] }).bottom_nav);
  });
  it('every suite entry sits on a real fleet route', () => {
    const paths = new Set(ROUTES.map((r) => r.path));
    for (const p of Object.keys(SUITE)) expect(paths.has(p), p).toBe(true);
  });
  it('home tiles resolve extapp targets to desktop app URLs', () => {
    const v = deskView('')!;
    if (v.content.kind !== 'home') throw new Error('home');
    const all = v.content.groups.flatMap((g) => g.tiles);
    expect(all.find((t) => t.href === '/cloud-desktop/cloud-mail/')).toBeTruthy();
  });
  it('the trail ends on the page, links its ancestors', () => {
    const v = deskView('cloud-calc/calculator/calc/')!;
    expect(v.crumbs.at(-1)).toMatchObject({ href: null });
    expect(v.crumbs[1]).toMatchObject({ href: '/cloud-desktop/cloud-calc/' });
  });
});
