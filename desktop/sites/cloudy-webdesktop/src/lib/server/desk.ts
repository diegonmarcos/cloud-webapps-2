// Desktop view models (#1321), built at prerender from the same GENERATED nav as /cloud-webapps (@cloudy/ui nav.json,
// routes.json, targets.json at the pinned commit). Routes are the mobile routes under /cloud-desktop/, so a link swaps
// between the sites by replacing the base. What a page shows:
//   home   : the Cloud apps grid (ui.sections[cloud].tile_groups), tiles resolved through targets.json
//   suite  : the desktop suite apps (Vue/React/vanilla, published at their own paths) in an in-shell window
//   mobile : everything else is the cloudy-webapps page itself, embedded (?embed=1 hides its chrome)
import nav from '@cloudy/ui/nav/nav.json';
import routesJson from '@cloudy/ui/nav/routes.json';
import targetsJson from '@cloudy/ui/nav/targets.json';
import { joinBase } from '@cloudy/ui/src/paths.ts';
import { resolveTarget } from '@cloudy/ui/src/lib/targets.ts';

export const BASE = '/cloud-desktop';
export const MOBILE = '/cloud-webapps';
type Page = { id: string; label?: string; icon?: string; hidden?: boolean; pages?: Page[] };
type Section = { id: string; label: string; icon?: string; pages?: Page[]; tile_groups?: { title: string; tiles: Tile[] }[] };
type Tile = { id?: string; label?: string; icon?: string; target?: string; separator?: boolean };
type App = { id: string; name: string; label: string; icon: string | null; kind: string; sections: Section[] };
type Route = { path: string; kind: string; section?: string; app?: string; page?: string[] };

const SA = nav.superapp as unknown as { bottom_nav: string[]; sections: Section[] };
const APPS = nav.apps as unknown as App[];
export const ROUTES = routesJson.routes as Route[];
const TARGETS = targetsJson.targets as Record<string, string>;

/** The desktop suite: published apps that are not rewritten (plan E), each on the fleet route it stands for. */
export const SUITE: Record<string, { title: string; src: string; icon: string }> = {
  'cloud-nav/explored/maps/': { title: 'Maps', src: '/mymaps-maps/', icon: 'map' },
  'cloud-nav/navigation/': { title: 'Navigation', src: '/mymaps-navigation/', icon: 'navigation' },
  'cloud-search/media/movies/': { title: 'Movies', src: '/movies/', icon: 'movie' },
  'cloud-news/media/': { title: 'Music', src: '/music/', icon: 'music_note' },
  'cloud-news/media/media/': { title: 'Music', src: '/music/', icon: 'music_note' },
  'cloud-news/feed/': { title: 'MyFeed', src: '/myfeed/', icon: 'rss_feed' },
  'cloud-news/feed/feed/': { title: 'MyFeed', src: '/myfeed/', icon: 'rss_feed' },
  'cloud-notes/canvas/': { title: 'Canvas', src: '/tldraw/', icon: 'draw' },
  'cloud-notes/canvas/boards/': { title: 'Canvas', src: '/tldraw/', icon: 'draw' },
  'cloud-me/health/culinary/': { title: 'Feed Yourself', src: '/myhealth-feedyourself/', icon: 'restaurant' },
  'cloud-me/health/shop/': { title: 'Feed Yourself', src: '/myhealth-feedyourself/', icon: 'restaurant' },
};

export type RailItem = { id: string; label: string; icon: string; href: string; selected: boolean };
export type TreeItem = { id: string; label: string; icon: string | null; depth: number; href: string; selected: boolean };
export type TileItem = { id: string; label: string; icon: string | null; href: string | null; external: boolean };
export type Content =
  | { kind: 'home'; groups: { title: string; tiles: TileItem[] }[] }
  | { kind: 'suite'; title: string; src: string; icon: string; mobileHref: string }
  | { kind: 'mobile'; src: string; mobileHref: string };
export type DeskView = { path: string; title: string; crumbs: { label: string; href: string | null }[]; rail: RailItem[]; tree: TreeItem[]; treeTitle: string; content: Content };

const labelOf = (p: { id: string; label?: string }) => p.label ?? p.id;
const visible = (pages: Page[] | undefined) => (pages ?? []).filter((p) => !p.hidden);
const href = (path: string) => joinBase(BASE, path);

function tree(prefix: string, pages: Page[] | undefined, depth: number, current: string, out: TreeItem[]) {
  for (const p of visible(pages)) {
    const path = `${prefix}${p.id}/`;
    out.push({ id: path, label: labelOf(p), icon: p.icon ?? null, depth, href: href(path), selected: current === path });
    tree(path, p.pages, depth + 1, current, out);
  }
}

function tile(t: Tile): TileItem | null {
  if (t.separator || !t.label) return null;
  const r = resolveTarget(t.target ?? t.id, TARGETS);
  if (r.kind === 'path') return { id: t.id ?? t.label, label: t.label, icon: t.icon ?? null, href: href(r.path), external: false };
  if (r.kind === 'url') return { id: t.id ?? t.label, label: t.label, icon: t.icon ?? null, href: r.url, external: true };
  return { id: t.id ?? t.label, label: t.label, icon: t.icon ?? null, href: null, external: false };
}

export function deskView(path: string): DeskView | null {
  const r = ROUTES.find((x) => x.path === path);
  if (!r) return null;
  const rail: RailItem[] = SA.bottom_nav.map((id) => SA.sections.find((s) => s.id === id)).filter((s): s is Section => !!s)
    .map((s) => ({ id: s.id, label: s.label, icon: s.icon ?? 'ic_home', href: href(s.id === 'home' ? '' : `${s.id}/`), selected: s.id === (r.kind === 'home' ? 'home' : r.app ? 'cloud' : r.section) }));
  const mobileHref = joinBase(MOBILE, path);
  const items: TreeItem[] = [];
  let treeTitle = '';
  const crumbs: DeskView['crumbs'] = [{ label: 'Cloud', href: href('') }];
  if (r.app) {
    const app = APPS.find((a) => a.id === r.app)!;
    treeTitle = app.name;
    crumbs.push({ label: app.name, href: href(`${app.id}/`) });
    for (const s of app.sections) {
      const sp = `${app.id}/${s.id}/`;
      items.push({ id: sp, label: s.label, icon: s.icon ?? null, depth: 0, href: href(sp), selected: path === sp });
      tree(sp, s.pages, 1, path, items);
    }
  } else if (r.section) {
    const s = SA.sections.find((x) => x.id === r.section)!;
    treeTitle = s.label;
    crumbs.push({ label: s.label, href: href(`${s.id}/`) });
    tree(`${s.id}/`, s.pages, 0, path, items);
  }
  // the trail: every tree entry on the way to this page (the last one is the page itself, not a link)
  for (const i of items) if (path.startsWith(i.id)) crumbs.push({ label: i.label, href: i.id === path ? null : i.href });
  // a hidden page is not in the tree: its own label still ends the trail
  const last = crumbs[crumbs.length - 1];
  if (r.page?.length && last.href !== null) crumbs.push({ label: r.page[r.page.length - 1], href: null });
  let content: Content;
  if (r.kind === 'home') {
    const cloud = SA.sections.find((s) => s.id === 'cloud');
    const groups = (cloud?.tile_groups ?? []).map((g) => ({ title: g.title, tiles: g.tiles.map(tile).filter((t): t is TileItem => !!t) }));
    content = { kind: 'home', groups };
  } else if (SUITE[path]) content = { kind: 'suite', ...SUITE[path], mobileHref };
  else content = { kind: 'mobile', src: `${mobileHref}?embed=1`, mobileHref };
  const title = [...crumbs].slice(1).reverse().map((c) => c.label).join(' · ');
  return { path, title: title ? `${title} · Cloud Desktop` : 'Cloud Desktop', crumbs, rail, tree: items, treeTitle, content };
}
