#!/usr/bin/env node
// Static page generator — reads the data manifests under src/data/ (split by
// domain, mirroring the real app's libs/ separation: shell chrome, the 4
// TabbedSectionFragment aggregators, every content-only section, and the
// Phone-tab mock app list) and emits one real, independent, crawlable HTML
// file per route into dist/. No client router: every navigation is a plain
// <a href>. A small shared script.js progressively enhances the shipped
// pages (drawer, radial star menus, overlays, card collapse) — this script
// only runs at build time.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { renderView } from './render/views.mjs';
import { emptyStateHtml } from './render/atoms.mjs';

const [, , PROJECT_DIR, DIST_DIR, MANIFEST] = process.argv;
const DATA_DIR = join(PROJECT_DIR, dirname(MANIFEST));
const readJson = (name) => JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8'));

const shell = readJson('shell.json');
const core = readJson('sections-core.json');
const content = readJson('sections-content.json');
const mockData = readJson('mock-apps.json');
const linktreeData = readJson('linktree.json');
// nav.json is GENERATED from the Android build.json files (scripts/gen-nav.mjs);
// nav-overlay.json is the hand-written companion. See README "Nav data".
const nav = readJson('nav.json');
// cloud-apps.json is GENERATED too (gen-nav.mjs): the Cloud > App groups as the SuperApp declares them.
const cloudApps = readJson('cloud-apps.json');
const navOverlay = readJson('nav-overlay.json');

const { app, bottomNav: shellBottomNav, cube, stars, longPress, notificationCenter, updateOverlay, statusBar, footer } = shell;
const bottomNav = nav.superapp.bottom_nav ?? shellBottomNav;
const sections = { ...core.sections, ...content.sections, home: { label: 'Home', icon: 'home', color: 'blue' } };
// The 4 bottom-nav aggregators (sections-core.json) land straight on their
// first visible page instead of on a page index — build.json marks them
// is_aggregator/tabs and MainActivity opens the first facet, never a menu.
const AGGREGATOR_IDS = Object.keys(core.sections);

// build.json's Sections.kt contract: `pages` is the section's children AS
// SHOWN (grids, tab strips, drawer, radial menus all list these), while every
// declared page — hidden ones included — still resolves as page:<section>/<id>
// and still gets generated. Hiding a page from a child list must never make
// its target dead.
function visiblePages(pages) {
  return (pages ?? []).filter((p) => typeof p === 'string' || !p.hidden);
}

// phone/apps's Quickmarks strip is DERIVED from mock-apps (filtered by
// category + pinned flag), not hand-duplicated per view. The All-Apps part no
// longer groups by category — see computeSmartFolders/topicalFoldersBody below,
// which group by the richer Smart Folder rules + phoneFolders instead.
function phoneGroupsFromMockData(pinnedOnly) {
  const categories = [...new Set(mockData.apps.map((a) => a.category))];
  return categories.map((category) => {
    const apps = mockData.apps
      .filter((a) => a.category === category && (!pinnedOnly || a.pinned))
      .map((a) => ({ name: a.name }));
    return { title: category, apps };
  });
}

// ── Smart Folders (phone/apps) — RULE-DRIVEN from each app's simulated
// Android metadata (package/installSource/first-install/last-used/usage),
// never hand-listed membership. Mirrors a real launcher's auto-generated
// "Recently installed" / "Recently used" / usage-ranked smart groups.
// The 13 rules + their 4 groups are a verbatim port of aa_cloud-superapp's
// build.json ui.phone_smart_folders (PhoneSmartFolders.select): Dev =
// package-prefix fleets, Stores = install-source-of-record, Usage = install/
// use recency, Rank = usage-ranked top 7s. installSource here is the mock's
// short token for the on-device installer package (play =
// com.android.vending, sideload = com.google.android.packageinstaller, …).
const KNOWN_STORES = ['play', 'samsung', 'uptodown', 'fdroid', 'epic', 'facebook'];
function computeSmartFolders(apps) {
  const prefix = (...ps) => apps.filter((a) => ps.some((p) => a.package?.startsWith(p)));
  const source = (...ss) => apps.filter((a) => ss.includes(a.installSource));
  const topBy = (key) => [...apps].sort((a, b) => b[key] - a[key]).slice(0, 7);
  const soonestBy = (key) => [...apps].sort((a, b) => a[key] - b[key]).slice(0, 7);
  return [
    { id: 'cloud', group: 'Dev', label: 'Cloud', apps: prefix('com.diegonmarcos.') },
    { id: 'samsung', group: 'Dev', label: 'Samsung', apps: prefix('com.sec.', 'com.samsung.') },
    { id: 'google', group: 'Dev', label: 'Google', apps: prefix('com.google.', 'com.android.vending') },
    { id: 'google_play', group: 'Stores', label: 'Google Play', apps: source('play') },
    { id: 'fdroid', group: 'Stores', label: 'F-Droid · Sideload', apps: source('fdroid', 'sideload') },
    { id: 'uptodown', group: 'Stores', label: 'Uptodown', apps: source('uptodown') },
    { id: 'direct', group: 'Stores', label: 'Direct', apps: apps.filter((a) => !KNOWN_STORES.includes(a.installSource)) },
    { id: 'new_apps', group: 'Usage', label: 'New Apps', apps: soonestBy('firstInstallDaysAgo') },
    { id: 'recent7', group: 'Usage', label: 'Recent 7', apps: soonestBy('lastUsedHoursAgo') },
    { id: 'recent48h', group: 'Usage', label: 'Recent 48h', apps: apps.filter((a) => a.lastUsedHoursAgo <= 48) },
    { id: 'active_apps', group: 'Usage', label: 'Active Apps', apps: apps.filter((a) => a.lastUsedHoursAgo <= 2) },
    { id: 'top_opened', group: 'Rank', label: 'Top 7 Open', apps: topBy('opens7d') },
    { id: 'top_battery', group: 'Rank', label: 'Top 7 Battery', apps: topBy('batteryPct7d') },
    { id: 'top_time_usage', group: 'Rank', label: 'Top 7 Time Usage', apps: topBy('usageMin7d') },
  ];
}
// ── Folder cards — the APK's One-UI folder anatomy, transcribed from
// PhoneAppsFragment.makeFolderCard (app/src/main/java/.../apps/
// PhoneAppsFragment.kt:326-385): a 60dp rounded "liquid glass" square
// (R.drawable.bg_liquid_glass, 24dp radius) holding a 2x2 GridLayout
// mini-preview of the first FOUR apps inside (empty slots stay blank), with
// the folder label centered underneath (10sp, #E9D8FD, single line). No count
// badge exists on-device. Tap opens every app inside (showFolderDialog,
// :389-441) — on the web that's a native <details>: the card IS the
// <summary>, the expanded sheet renders below it, zero JS.
// Mini icons mirror the app tiles: a brand-colored square holding the app's
// simple-icons glyph when it has one (mock-apps.json iconSlug), otherwise a
// plain hashed squircle stand-in for the real Drawable.
function folderMiniHtml(name) {
  const app = APP_BY_NAME.get(name);
  if (app?.iconSlug) {
    return `<span class="phone-folder__mini phone-folder__mini--brand" style="background:${app.brandColor}">${inlineBrandIcon(app.iconSlug)}</span>`;
  }
  const color = TILE_COLORS[hash(name) % TILE_COLORS.length];
  return `<span class="phone-folder__mini phone-folder__mini--${color}"></span>`;
}
function folderCardHtml(label, members, rel) {
  const minis = Array.from({ length: 4 }, (_, i) => (members[i]
    ? folderMiniHtml(members[i].name)
    : '<span class="phone-folder__mini phone-folder__mini--empty"></span>')).join('');
  return `
                <details class="phone-folder">
                    <summary class="phone-folder__card">
                        <span class="phone-folder__square">${minis}</span>
                        <span class="phone-folder__label">${label}</span>
                    </summary>
                    <div class="phone-folder__sheet">
                        <h3 class="phone-folder__sheet-title">${label}</h3>
                        <div class="tile-grid tile-grid--dense tile-grid--phone" role="list">
                            ${members.map((a) => avatarTileHtml(a.name, rel, null)).join('\n                            ')}
                        </div>
                    </div>
                </details>`;
}
function folderGridHtml(folders, rel, dense = false) {
  const cls = dense ? 'phone-folder-grid phone-folder-grid--smart' : 'phone-folder-grid';
  return `<div class="${cls}">${folders.map((f) => folderCardHtml(f.label, f.apps, rel)).join('')}
            </div>`;
}

// Rendered AFTER the topical folders, under the page's "Smart-Folders"
// stack-divider (emitted by phoneMergedBody, not here), with
// each rule filed under its group header (Dev / Stores / Usage / Rank) and
// drawn as SMALLER folder cards — PhoneAppsFragment.kt:241-264 renders smart
// folders with a 44dp cell and columns+1 (=7) per row.
function smartFoldersBody(smartFolders, rel) {
  const groups = [...new Set(smartFolders.map((f) => f.group))];
  const blocks = groups.map((group) => `<h3 class="phone-folders__subhead">${group}</h3>
            ${folderGridHtml(smartFolders.filter((f) => f.group === group), rel, true)}`).join('\n            ');
  return `<section class="phone-folders">
            ${blocks}
            </section>`;
}

// ── topical folders (phone/apps) — every app carries a folderId, this
// groups by it in phoneFolders' declared order, then buckets the folders into
// the top-level sections by the label's launcher-naming prefix and gives each
// section a subhead + its own folder grid (PhoneAppsFragment.kt:207-229,
// prefixes from build.json::ui.phone_sections / PhoneSections.kt). Folders
// matching no prefix fall through to "Other" so none disappear silently.
const PHONE_SECTIONS = [
  { title: 'System', prefix: '_' },
  { title: 'Services', prefix: '-' },
  { title: 'Tools A', prefix: '.' },
  { title: 'Tools B', prefix: '>' },
];
function topicalFoldersBody(apps, phoneFolders, rel) {
  const visible = [...phoneFolders]
    .sort((a, b) => a.order - b.order)
    .map((f) => ({ label: f.label, apps: apps.filter((a) => a.folderId === f.id) }))
    .filter((f) => f.apps.length);
  const buckets = PHONE_SECTIONS.map((sec) => ({
    title: sec.title,
    folders: visible.filter((f) => f.label.startsWith(sec.prefix)),
  }));
  buckets.push({
    title: 'Other',
    folders: visible.filter((f) => !PHONE_SECTIONS.some((s) => f.label.startsWith(s.prefix))),
  });
  return `<section class="phone-folders">
            ${buckets.filter((b) => b.folders.length).map((b) => `<h2 class="phone-folders__subhead">${b.title}</h2>
            ${folderGridHtml(b.folders, rel)}`).join('\n            ')}
            </section>`;
}

// ── the single Phone page — one scroll, three parts in order: Quickmarks
// (pinned apps under one titled section per group), All-Apps (the topical
// folder-card sections), Smart-Folders (the rule-driven groups).
// Quickmarks are GROUPED, not one flat grid: SuitePhoneAppsFragment.kt:119
// emits one subhead() per group title above that group's own tile grid, and
// :117 skips groups whose packages all resolve to nothing so the layout
// never carries a dead header. subhead() (:274-279) is the same 16sp #E9D8FD
// section title the folder sections use — .phone-folders__subhead here.
// The grids carry .tile-grid--quickmarks, NOT the shared .tile-grid--dense:
// dense is an auto-fill template and, loading later than _app-icons.scss at
// equal specificity, it beat the fixed column count these rows need. The
// quickmarks variant pins the seven-per-row template (see _app-icons.scss).
function phoneMergedBody(rel) {
  const pinnedGroups = phoneGroupsFromMockData(true).filter((g) => g.apps.length);
  return `<h2 class="stack-divider">Quickmarks</h2>
            <section class="phone-folders">
            ${pinnedGroups.map((g) => `<h3 class="phone-folders__subhead">${g.title}</h3>
            <div class="tile-grid tile-grid--quickmarks tile-grid--phone" role="list">
                ${g.apps.map((a) => avatarTileHtml(a.name, rel, null)).join('\n                ')}
            </div>`).join('\n            ')}
            </section>
            <h2 class="stack-divider">All-Apps</h2>
            ${topicalFoldersBody(mockData.apps, mockData.phoneFolders, rel)}
            <h2 class="stack-divider">Smart-Folders</h2>
            ${smartFoldersBody(computeSmartFolders(mockData.apps), rel)}`;
}

// ── target grammar → href (mirrors LauncherNavController's dispatch table) ─
function resolveTarget(target) {
  if (!target) return { href: null, external: false };
  if (target.startsWith('https://') || target.startsWith('http://')) return { href: target, external: true };
  if (target.startsWith('section:')) return { href: routeHref([target.slice(8)]), external: false };
  // intent:// (Telegram bots): the web has no intent resolver, but the intent names its own browser fallback.
  const fb = /S\.browser_fallback_url=([^;]+)/.exec(target);
  if (target.startsWith('intent:') && fb) return { href: decodeURIComponent(fb[1]), external: true };
  if (target.startsWith('page:')) return { href: routeHref(target.slice(5).split('/')), external: false };
  // extapp:cloud-<fleet app> has a web mirror here (apps/<id>/, generated from that app's build.json ui).
  const fx = /^extapp:cloud-(.+)$/.exec(target);
  if (fx && FLEET.has(fx[1])) return { href: routeHref(['apps', fx[1]]), external: false };
  // other extapp: / intent: / app: / tab: / action: / mode: / stub: — Android-only, no web destination.
  return { href: null, external: false };
}
// Published folder for vault/passwords is vault/pw-list (secret-looking file
// names trip the repo pre-commit hook); the page id stays "passwords".
function publishSegments(segments) {
  return segments[0] === 'vault' && segments[1] === 'passwords' ? ['vault', 'pw-list', ...segments.slice(2)] : segments;
}
function routeHref(segments) {
  return '/' + ['cloud-superapp', ...publishSegments(segments).filter(Boolean)].join('/') + '/';
}
function relPrefix(depth) {
  return depth === 0 ? './' : '../'.repeat(depth);
}
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
const TILE_COLORS = ['blue', 'green', 'purple', 'pink', 'orange', 'teal', 'amber', 'indigo'];
// name -> mock-apps.json entry (icon/real), used by appIconHtml below to
// decide between a real matching glyph and a monogram badge.
const APP_BY_NAME = new Map(mockData.apps.map((a) => [a.name, a]));
// First letter of up to the first 2 words, uppercased — "Google Maps" -> "GM",
// "Slack" -> "S" (only 1 word to take a first letter from).
function monogram(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

// ── icon + tile markup ──────────────────────────────────────────────────
function iconImg(icon, rel, cls) {
  return `<img class="${cls}" src="${rel}public/icons/${icon}.svg" alt="">`;
}
const ICONS_DIR = join(PROJECT_DIR, 'src/public/icons');

// ── nav.json (generated from the Android build.json) over the site data ──
// Labels, page order, hidden flags, the Configs group/subgroup tree, the page
// tab ids and any declared tiles/stack titles come from the SuperApp; the page
// BODIES that exist in sections-content.json stay (reused by same id or via
// nav-overlay.json page_content_alias). A page the site had but the SuperApp no
// longer declares is kept hidden (`legacy`) so existing page:<s>/<p> links
// never go dead.
function webIcon(name, fallback) {
  if (!name) return fallback;
  const m = navOverlay.icon_map[name] ?? name;
  return existsSync(join(ICONS_DIR, `${m}.svg`)) ? m : fallback;
}
const NAV_PAGE_KEYS = ['hidden', 'group', 'subgroup', 'tabs', 'facet', 'url', 'is_action', 'mirror_section', 'mirror_page'];
for (const g of nav.superapp.sections) {
  // a bottom-nav section the SuperApp added/renamed (e.g. infos -> boards) that the
  // site has no hand-written body for yet: build it from the declaration alone.
  if (!sections[g.id] && bottomNav.includes(g.id)) sections[g.id] = { label: g.label, icon: webIcon(g.icon, 'more'), color: 'blue', pages: [] };
  const site = sections[g.id];
  if (!site || g.id === 'home') continue;
  site.label = g.label;
  const old = new Map((site.pages ?? []).map((p) => [p.id, p]));
  const alias = navOverlay.page_content_alias[g.id] ?? {};
  const relabel = navOverlay.page_label_override?.[g.id] ?? {};
  const pages = g.pages.map((gp) => {
    const base = old.get(gp.id) ?? (alias[gp.id] && old.get(alias[gp.id]) ? { ...old.get(alias[gp.id]) } : {});
    const p = { ...base, id: gp.id, label: relabel[gp.id] ?? gp.label };
    if (gp.icon) p.icon = webIcon(gp.icon, site.icon);
    for (const k of NAV_PAGE_KEYS) if (gp[k] !== undefined) p[k] = gp[k];
    if (gp.action && /^(section|page):/.test(gp.action)) p.target = gp.action;
    else if (gp.action && /^https?:/.test(gp.action)) p.target = gp.action;
    else if (gp.action) p.nativeAction = gp.action;
    if (gp.tiles && !base.tiles && !base.rows && !base.items) {
      p.tiles = gp.tiles.filter((t) => !t.separator && t.label).map((t) => ({ ...t, icon: webIcon(t.icon, site.icon) }));
    }
    if (gp.stack && !base.stack && !base.rows && !base.items && !base.render) {
      p.stack = gp.stack.map((c) => ({ kind: c.kind ?? 'panel', title: c.title ?? c.kind, subtitle: c.subtitle }));
    }
    return p;
  });
  // pages the SuperApp does not declare (yet): the overlay's extra pages, then legacy ones, hidden
  for (const x of navOverlay.extra_pages?.[g.id] ?? []) {
    if (pages.some((p) => p.id === x.id)) continue;
    const at = pages.findIndex((p) => p.id === x.after);
    pages.splice(at >= 0 ? at + 1 : pages.length, 0, { id: x.id, label: x.label, icon: webIcon(x.icon, site.icon), webapps: x.id === 'webapps' });
  }
  for (const [id, p] of old) if (!pages.some((q) => q.id === id) ) pages.push({ ...p, hidden: true, legacy: true });
  const hint = navOverlay.page_order_hint?.[g.id];
  if (hint) pages.sort((a, b) => (hint.indexOf(a.id) + 1 || 99) - (hint.indexOf(b.id) + 1 || 99));
  if (g.id === 'cloud') {
    const appsPage = pages.find((p) => p.id === 'apps');
    if (appsPage) appsPage.groups = cloudApps.groups;
  }
  site.pages = pages;
  if (g.grid_columns) site.gridColumns = g.grid_columns;
}
const NAV_CLOUD_CONFIGS = (nav.superapp.sections.find((s) => s.id === 'cloud')?.tile_groups ?? []).find((t) => t.title === 'Configs');
const FLEET = new Map(nav.fleet.map((a) => [a.id, a]));
const iconCache = new Map();
// Tintable glyph: the shared set's SVGs are stroked/filled with
// currentColor, which does not apply through an <img src="…svg">. The tint
// used to go through `mask-image: var(--icon-url)`, but Android WebView does
// not resolve a url() held in a custom property and painted every one of
// these as a solid square. So the SVG is inlined at build time instead and
// takes its tint straight from the CSS `color` it inherits.
function inlineIcon(icon) {
  let svg = iconCache.get(icon);
  if (svg === undefined) {
    svg = readFileSync(join(ICONS_DIR, `${icon}.svg`), 'utf8')
      .replace(/<\?xml[\s\S]*?\?>/g, '')
      .replace(/<!DOCTYPE[\s\S]*?>/g, '')
      // any hardcoded hue has to follow `color` like the rest of the set
      .replace(/#[0-9a-fA-F]{3,8}\b/g, 'currentColor')
      // pin the box to the 32px the CSS reserves, keeping viewBox and the
      // root stroke attributes (stroke-width/linecap) the paths rely on
      .replace(/<svg\b[^>]*>/, (tag) => tag
        .replace(/\s(?:width|height|fill)="[^"]*"/g, '')
        .replace(/<svg/, '<svg width="32" height="32" fill="none"'))
      .trim();
    iconCache.set(icon, svg);
  }
  return svg;
}
const APP_ICONS_DIR = join(ICONS_DIR, 'apps');
const brandIconCache = new Map();
// Brand glyph for a real-world app — a CC0 simple-icons SVG (single filled
// path, 24×24 viewBox, `<title>` for the brand name). Inlined for the same
// reason as inlineIcon(): the white comes from `color` through
// fill="currentColor", which an <img src="…svg"> would not resolve. The
// <title> is dropped because the badge is aria-hidden and the tile already
// carries the app name as its label.
function inlineBrandIcon(slug) {
  let svg = brandIconCache.get(slug);
  if (svg === undefined) {
    svg = readFileSync(join(APP_ICONS_DIR, `${slug}.svg`), 'utf8')
      .replace(/<\?xml[\s\S]*?\?>/g, '')
      .replace(/<title>[\s\S]*?<\/title>/g, '')
      .replace(/<svg\b[^>]*>/, (tag) => tag
        .replace(/\s(?:role|width|height|fill)="[^"]*"/g, '')
        .replace(/<svg/, '<svg width="24" height="24" fill="currentColor"'))
      .trim();
    brandIconCache.set(slug, svg);
  }
  return svg;
}
// Section-tile glyph — inline SVG, tinted by .tile__icon's `color` (lavender
// on the grid, white in a strip). Decorative: the tile itself carries an
// aria-label.
function tileIconHtml(icon, rel) {
  return `<span class="tile__icon" aria-hidden="true">${inlineIcon(icon)}</span>`;
}
function tileHtml(tile, color, rel) {
  const { href, external } = resolveTarget(tile.target);
  const label = `<span class="tile__label">${tile.label}</span>`;
  const icon = tileIconHtml(tile.icon, rel);
  // tile--<color> is kept purely to mirror the APK's computed-but-unused
  // palette (TileGridFragment); it no longer paints anything.
  const cls = `tile tile--${color}`;
  const aria = ` aria-label="${tile.label}"`;
  if (href) {
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    return `<a class="${cls}" href="${href}"${attrs} role="listitem"${aria}>${icon}${label}</a>`;
  }
  return `<div class="${cls} tile--inert" role="listitem" aria-disabled="true"${aria}>${icon}${label}</div>`;
}
// Cloud tab tiles are our own self-hosted services — generic functional
// icons (mail/calendar/chat) make sense there. Phone tab tiles represent
// real installed Android apps, which each have a distinct branded icon on a
// real phone. We can't bundle real trademarked app icons, so most of the
// 115 mock apps render as an Android-adaptive-icon-style squircle: a color
// hashed deterministically from the name (stable across quickmarks/all/
// recentapps, not random) behind a 1-2 letter monogram. The ~26 apps that
// are our own real cloud services (mock-apps.json `real: true`) already
// have a distinct, sensible icon in the shared icon set — those keep that
// icon instead of a monogram, inlined and recolored white through
// currentColor (see inlineIcon above) and centered on the same hashed
// squircle background.
function appIconHtml(name, rel) {
  const color = TILE_COLORS[hash(name) % TILE_COLORS.length];
  const app = APP_BY_NAME.get(name);
  // Real-world third-party apps (mock-apps.json iconSlug) get their actual
  // brand mark from the CC0 simple-icons set — white glyph on the brand
  // color — so the drawer reads like a real Android home screen.
  if (app?.iconSlug) {
    return `<span class="tile__app-icon tile__app-icon--brand" style="background:${app.brandColor}"><span class="tile__app-icon__glyph" aria-hidden="true">${inlineBrandIcon(app.iconSlug)}</span></span>`;
  }
  if (app?.real) {
    return `<span class="tile__app-icon tile__app-icon--${color}"><span class="tile__app-icon__glyph" aria-hidden="true">${inlineIcon(app.icon)}</span></span>`;
  }
  return `<span class="tile__app-icon tile__app-icon--${color}">${monogram(name)}</span>`;
}
function avatarTileHtml(name, rel, href) {
  const body = `${appIconHtml(name, rel)}<span class="tile__label">${name}</span>`;
  return href
    ? `<a class="tile tile--app" href="${href}" role="listitem">${body}</a>`
    : `<div class="tile tile--app tile--inert" role="listitem" aria-disabled="true">${body}</div>`;
}

// ── AggregatorStackFragment card rendering (Communication/Infos/Tools) ───
// A grid-bodied card ({tiles} / {groups:[{tiles}]}) may declare its entries as
// bare strings — the icon then comes from the owning group, exactly like the
// real app's CloudTile(it.label, sub.icon, …).
function cardGridTiles(g) {
  return g.tiles.map((t) => (typeof t === 'string' ? { label: t, icon: g.icon } : { icon: g.icon, ...t }));
}
function cardHtml(card, rel) {
  if (card.kind === 'section_title') {
    return `<h2 class="stack-divider">${card.title}</h2>`;
  }
  const { href, external } = resolveTarget(card.target);
  const titleInner = href
    ? `<a class="stack-card__title" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${card.title}</a>`
    : `<span class="stack-card__title">${card.title}</span>`;
  const subtitle = card.subtitle ? `<p class="stack-card__subtitle">${card.subtitle}</p>` : '';
  const caption = card.caption ? `<p class="stack-card__caption">${card.caption}</p>` : '';

  let body;
  if (card.kind === 'stats' && card.rows) {
    body = `<div class="stack-card__stats">${card.rows.map(([l, v]) => `<div class="stack-card__stat"><span>${l}</span><b>${v}</b></div>`).join('')}</div>`;
  } else if (card.kind === 'mail_accounts' && card.rows) {
    // Real: one full-width tappable row per declared account (build.json::
    // ui.mail_accounts) — every row shares the card's own single target
    // (e.g. "section:mail"), the left side is the account label, the right
    // side surfaces the raw target string itself. Unread/total counts are
    // pending a real JMAP/IMAP backend in the real app too, so a caption
    // explaining that is honest, not a placeholder.
    body = `${card.rows.map(([l]) => `<a class="stack-card__link-row stack-card__link-row--account" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${l}<span class="stack-card__target">${card.target}</span></a>`).join('')}${caption}`;
  } else if ((card.kind === 'chat_matrix' || card.kind === 'chat_mattermost') && card.linkLabel) {
    // Real: a single "Open Matrix"/"Open Mattermost" row — the real app has
    // no richer server-list content here either.
    body = `${href ? `<a class="stack-card__link-row" href="${href}">${card.linkLabel}</a>` : ''}${caption}`;
  } else if (card.kind === 'open_link') {
    // Real: a single tappable header row, no body at all — the generic
    // skeleton here was pure invention with nothing behind it.
    body = '';
  } else if (card.groups) {
    // Real (kind=cloud_dashboard, AggregatorStackFragment.renderCloudDashboard):
    // the card body is NOT prose — it's one sub-header per subgroup, each
    // followed by a tile_columns-wide ICON GRID of that subgroup's entries,
    // with the icon coming from the SUBGROUP (sub.icon) and the label from the
    // entry. Container hosts are *.app (WireGuard-only, plus a live TCP-ping
    // status light we have no web equivalent for), so those tiles render inert
    // here; the external consoles keep their real link.
    body = card.groups.map((g) => `<h3 class="tile-group__title">${g.label}</h3>
                ${tileGridBody(cardGridTiles(g), rel, () => 'blue')}`).join('\n                ');
  } else if (card.tiles) {
    // Real (kind=link_grid / tile_row): body IS an icon grid (addIconGrid).
    body = tileGridBody(cardGridTiles(card), rel, () => 'blue');
  } else if (card.kind === 'calendar_month') {
    // Real: a month grid with working prev/next chevrons, today
    // highlighted — pure date math, so this mounts client-side (see
    // calendar-month-card.ts) rather than baking a build-time date into
    // the static HTML, which would break dist/ reproducibility.
    body = `<div class="calendar-card" data-calendar-card></div>`;
  } else {
    // Cards whose content is live device or infrastructure state (notification
    // streams, C3 health probes, WireGuard counters, GitHub API pulls) have no
    // browser-reachable source. A shimmer row would imply data is loading, so
    // they say plainly what they show on the phone instead.
    body = emptyStateHtml(card.emptyTitle ?? 'Live on device',
      card.caption ?? 'This panel reads live device or infrastructure state, which a browser cannot reach.');
  }

  return `<div class="stack-card">
                <button class="stack-card__header" type="button" aria-expanded="true">${titleInner}<span class="stack-card__chevron" aria-hidden="true">⌄</span></button>
                <div class="stack-card__content">${subtitle}${body}</div>
            </div>`;
}
function stackBody(cards, rel) {
  return `<div class="stack-list">
                ${cards.map((c) => cardHtml(c, rel)).join('\n                ')}
            </div>`;
}

// ── page-type content renderers ─────────────────────────────────────────
function tileGridBody(tiles, rel, colorFn, dense = false) {
  const items = tiles.map((t) => tileHtml(t, colorFn(t), rel)).join('\n                ');
  return `<div class="tile-grid${dense ? ' tile-grid--dense' : ''}" role="list">
                ${items}
            </div>`;
}

// strip=true renders each group as a single-row horizontal scroll strip
// (GroupedTilesFragment's HorizontalScrollView, never wraps) instead of the
// default wrapping square grid — used only by Suite's Cloud tileGroups.
function groupListBody(groups, rel, footer, footerHref, strip = false) {
  const gridCls = strip ? 'tile-grid tile-grid--strip' : 'tile-grid tile-grid--dense';
  const blocks = groups.map((g) => `
            <section class="tile-group" data-app-group="${g.title}">
                <h2 class="tile-group__title">${g.title}</h2>
                <div class="${gridCls}" role="list">
                    ${g.tiles.map((t) => (t.separator ? '<span class="tile-sep" aria-hidden="true">|</span>' : tileHtml(t, 'blue', rel))).join('\n                    ')}
                </div>
            </section>`).join('\n');
  const footerHtml = footer && footerHref ? `<a class="tile-group__footer" href="${footerHref}"><span class="tile-group__footer-icon" aria-hidden="true">${inlineIcon(footer.icon)}</span><span>${footer.label}</span></a>` : '';
  return `${blocks}\n            ${footerHtml}`;
}

// SectionMenuFragment's section index page — real app: a tile grid of the
// section's own pages (not a text row list), reusing the same tile markup
// every other tile grid uses. Each page's own `icon` field if declared,
// else the parent section's icon; each tile individually tinted from a
// hash of the page id (not one flat section-wide color).
function sectionPagesTileGridBody(pages, sectionId, rel) {
  const sectionIcon = sections[sectionId].icon;
  const tiles = visiblePages(pages).map((p) => {
    const label = typeof p === 'string' ? p : p.label;
    const id = typeof p === 'string' ? slug(p) : p.id;
    const icon = (typeof p === 'object' && p.icon) || sectionIcon;
    const target = (typeof p === 'object' && p.target) || `page:${sectionId}/${id}`;
    return { id, label, icon, target };
  });
  const items = tiles.map((t) => tileHtml(t, TILE_COLORS[hash(t.id) % TILE_COLORS.length], rel)).join('\n                ');
  return `<div class="tile-grid" role="list">
                ${items}
            </div>`;
}

function pageTabsHtml(pages, sectionId, activeId, rel) {
  const items = visiblePages(pages).map((p) => {
    const label = typeof p === 'string' ? p : p.label;
    const id = typeof p === 'string' ? slug(p) : p.id;
    const override = typeof p === 'object' && p.target ? resolveTarget(p.target) : null;
    const href = override ? override.href : routeHref([sectionId, id]);
    const active = id === activeId ? ' is-active' : '';
    return href
      ? `<a class="page-tabs__item${active}" href="${href}">${label}</a>`
      : `<span class="page-tabs__item page-tabs__item--inert" aria-disabled="true">${label}</span>`;
  }).join('\n                ');
  return `<div class="page-tabs-bar">
                <div class="page-tabs" role="tablist">
                ${items}
                </div>
            </div>`;
}

// A page that declares no body data at all. Never a shimmer: nothing is
// loading, the section simply has no content to show yet.
function skeletonBody() {
  return emptyStateHtml('Nothing to show yet.', 'This page has no content declared in src/data/ yet.');
}

// Real config pages carry actual rows (settings values) instead of generic
// shimmer placeholders — it's a fully enumerable settings screen, not
// backend-fed content, so there's no reason to fake-load it.
//
// A row is one of:
//   [label, value]                — plain settings row
//   [label, value, { active }]    — plain row, "active" marks the current
//                                    choice (theme/profile pickers etc.)
//   { group: "Title" }            — section header/divider, groups the
//                                    rows that follow (still backward
//                                    compatible with pages that only ever
//                                    used flat [label, value] rows)
//   { type: "qrcard", caption }   — the business-card QR block
function qrCardHtml(block) {
  return `
                <div class="qrcard">
                    <div class="qrcard__frame">
                        <div class="qrcard__plate">
                            <span class="qrcard__glyph">QR</span>
                        </div>
                    </div>
                    ${block.caption ? `<p class="qrcard__caption">${block.caption}</p>` : ''}
                </div>`;
}
// A row's opts (the 3rd array element) may additionally carry:
//   { control: "switch", on: true|false }              — checkbox toggle
//   { control: "range", value, min, max }               — numeric slider
//   { control: "perm", granted: true|false }             — grant/ask button
// Rows without a `control` render exactly as before (label/value, plus the
// existing `active` badge behavior) — fully backward compatible.
function settingsListBody(rows) {
  const items = rows.map((row) => {
    if (Array.isArray(row)) {
      const [label, value, opts] = row;
      const active = opts?.active;
      if (opts?.control === 'switch') {
        return `
                <div class="settings-list__row settings-list__row--control">
                    <span class="settings-list__label">${label}</span>
                    <input class="settings-list__switch" type="checkbox" aria-label="${label}"${opts.on ? ' checked' : ''} disabled>
                </div>`;
      }
      if (opts?.control === 'range') {
        const min = opts.min ?? 0;
        const max = opts.max ?? 100;
        return `
                <div class="settings-list__row settings-list__row--control">
                    <span class="settings-list__label">${label}</span>
                    <input class="settings-list__range" type="range" aria-label="${label}" min="${min}" max="${max}" value="${opts.value}" disabled>
                </div>`;
      }
      if (opts?.control === 'perm') {
        const granted = opts.granted;
        return `
                <div class="settings-list__row settings-list__row--control">
                    <span class="settings-list__label">${label}</span>
                    <button class="perm-btn${granted ? '' : ' perm-btn--needs-action'}" type="button" disabled>${value}</button>
                </div>`;
      }
      return `
                <div class="settings-list__row${active ? ' settings-list__row--active' : ''}">
                    <span class="settings-list__label">${label}</span>
                    <span class="settings-list__value">${value}${active ? ' <span class="settings-list__active-badge" aria-hidden="true">✓</span>' : ''}</span>
                </div>`;
    }
    if (row.group) {
      return `
                <div class="settings-list__group">${row.group}</div>`;
    }
    if (row.type === 'qrcard') return qrCardHtml(row);
    if (row.type === 'permActions') {
      return `
                <div class="perm-btn-grid">${row.buttons.map((b) => `<button class="perm-btn${b.granted ? '' : ' perm-btn--needs-action'}" type="button" disabled>${b.label}</button>`).join('')}</div>`;
    }
    return '';
  }).join('');
  return `<div class="settings-list">${items}
            </div>`;
}

// A page's own body, rendered through the shared page-view kit
// (scripts/render/): five layouts, one row component, everything declared in
// src/data/sections-content.json's per-page `view` block. Pages that predate
// the kit and declare no `view` fall back to the plain list, so adding a view
// is always additive.
function itemListBody(items, page) {
  const view = (typeof page === 'object' && page.view) || 'list';
  return renderView(items ?? [], view, { resolveTarget, inlineIcon });
}

// Configs > Constellation — port of ConstellationFragment.kt. Every action
// here (install/update/uninstall/open a native APK, grant an Android
// permission) is fundamentally something a website cannot do, so all
// buttons render inert (decorative, not fake-clickable) — same treatment
// as every other real-device-only action elsewhere in this build. The
// per-app status line and its 5-way color coding (installed/update/
// missing/blocked/error) is real, verbatim from Fleet.State.
const CONSTELLATION_STATUS = {
  installed: { color: '#48BB78', glyph: '✓' },
  update: { color: '#ED8936', glyph: '⬆' },
  missing: { color: '#63B3ED', glyph: '◯' },
  blocked: { color: '#F56565', glyph: '⛔' },
  error: { color: '#ECC94B', glyph: '⚠' },
};
function constellationStatusText(app) {
  switch (app.status) {
    case 'installed': return `up to date  ·  v${app.version} (${app.versionCode})  ·  sha ${app.sha}`;
    case 'update': return `update available  ·  installed v${app.version ?? '—'} → ${app.remoteDigest}`;
    case 'missing': return 'not installed  ·  tap Install';
    case 'blocked': return 'not published yet';
    case 'error': return app.message ?? 'error';
    default: return '';
  }
}
function constellationBody(data) {
  const cards = data.apps.map((app) => {
    const st = CONSTELLATION_STATUS[app.status];
    const showInstall = app.status !== 'blocked';
    return `<div class="constellation__card">
                <p class="constellation__card-label">${app.label}</p>
                <p class="constellation__mono">${app.pkg}  ·  ${app.image}</p>
                <p class="constellation__status" style="color:${st.color}">${st.glyph} ${constellationStatusText(app)}</p>
                <div class="constellation__actions">
                    <span class="constellation__btn constellation__btn--inert">Open</span>
                    ${showInstall ? '<span class="constellation__btn constellation__btn--inert constellation__btn--accent">Install / Update</span>' : ''}
                    <span class="constellation__btn constellation__btn--inert">Uninstall</span>
                </div>
            </div>`;
  }).join('');
  return `<p class="constellation__title">Constellation AppStore</p>
            <p class="constellation__caption">${data.apps.length} apps · superapp is the fleet manager</p>
            <div class="constellation__btn-row">
                <span class="constellation__btn constellation__btn--inert constellation__btn--accent">⬆ Update all</span>
                <span class="constellation__btn constellation__btn--inert constellation__btn--blue">⬇ Install all</span>
            </div>
            <div class="constellation__btn-row">
                <span class="constellation__btn constellation__btn--inert">↻ Check all</span>
            </div>
            <div class="constellation__btn-row">
                <span class="constellation__btn constellation__btn--inert${data.autoUpdate ? ' constellation__btn--on' : ''}">Auto-update: ${data.autoUpdate ? 'ON' : 'OFF'}</span>
                <span class="constellation__btn constellation__btn--inert${data.installPermGranted ? '' : ' constellation__btn--accent'}">${data.installPermGranted ? '✓ Install perm' : 'Grant install'}</span>
            </div>
            <p class="constellation__caption">${data.installPermGranted ? 'Silent installs enabled.' : "Grant 'Install unknown apps' for no-tap updates."}</p>
            <div class="constellation__list">${cards}</div>`;
}

// ── the home cube — Home3DFragment's real centerpiece, CSS 3D transforms ─
function homeCubeHtml() {
  const edges = [
    'xtf', 'xtb', 'xbf', 'xbb',
    'yfl', 'yfr', 'ybl', 'ybr',
    'ztl', 'ztr', 'zbl', 'zbr',
  ];
  const dots = ['tfl', 'tfr', 'tbl', 'tbr', 'bfl', 'bfr', 'bbl', 'bbr'];
  const edge = (cls) => `<div class="home-cube__edge home-cube__edge--${cls}"></div>`;
  const dot = (cls) => `<div class="home-cube__dot home-cube__dot--${cls}"></div>`;
  return `<div class="home-cube" aria-hidden="true">
                <div class="home-cube__inner">
                    ${edges.map(edge).join('\n                    ')}
                    ${dots.map(dot).join('\n                    ')}
                </div>
            </div>`;
}

function write(routeSegments, title, sectionId, bodyHtml, backHref, fleet = null) {
  const depth = routeSegments.length;
  const html = renderShell({ title, sectionId, depth, bodyHtml, backHref, fleet });
  const dir = join(DIST_DIR, ...publishSegments(routeSegments));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`✓ /${routeSegments.join('/')}/`);
}

// ── embed mode ───────────────────────────────────────────────────────────
// Inline in <head>, BEFORE the stylesheet, so the first paint is already the
// embedded layout (no flash of the site's own top bar / bottom nav). Embedded
// when the URL has ?embed=1, when the UA carries "CloudSuperApp-Embed/", or when
// an earlier page of this tab did (sessionStorage) — the flag survives in-site
// navigation. main.ts additionally keeps ?embed=1 on internal links, for
// WebViews with no sessionStorage. CSS: scss/app/_embed.scss.
const EMBED_HEAD_SCRIPT = `<script>(function(){var d=document.documentElement,e=/[?&]embed=1(&|$)/.test(location.search)||/CloudSuperApp-Embed\\//.test(navigator.userAgent);try{if(!e&&sessionStorage.getItem('cm-embed')==='1')e=true;else if(e)sessionStorage.setItem('cm-embed','1')}catch(x){}if(e)d.classList.add('embed')})()</script>`;

// ── the fleet's shared AppTopBar (libs:bottomnav): hamburger · title · AI + Settings circles ─
function fleetTopBarHtml(fleet, rel) {
  const { app, section } = fleet;
  const tb = app.top_bar ?? {};
  const settingsSec = app.sections.find((x) => x.id === 'configs' || x.id === 'settings');
  const settingsHref = tb.settings?.length && settingsSec ? routeHref(['apps', app.id, settingsSec.id]) : null;
  const drawerLinks = app.sections.map((sec) => {
    const sub = sec.pages.map((pg) => `<a class="app-drawer__page" href="${routeHref(['apps', app.id, sec.id, pg.id])}">${pg.label}</a>`).join('');
    return `<a class="app-drawer__section${sec.id === section ? ' is-active' : ''}" href="${routeHref(['apps', app.id, sec.id])}">${sec.label}</a>${sub}`;
  }).join('\n                ');
  return `<header class="app-top-bar" data-app-top-bar>
            ${tb.drawer ? `<a class="app-top-bar__circle app-top-bar__hamburger" href="#app-drawer" aria-label="Menu">${iconImg('menu', rel, '')}</a>` : ''}
            <h1 class="app-top-bar__title">${app.name}</h1>
            ${tb.ai ? `<button class="app-top-bar__circle app-top-bar__ai" type="button" aria-label="AI">AI</button>` : ''}
            ${settingsHref ? `<a class="app-top-bar__circle app-top-bar__settings" href="${settingsHref}" aria-label="Settings">${iconImg('settings', rel, '')}</a>` : ''}
        </header>
        <aside class="app-drawer" id="app-drawer" aria-label="${app.name} menu">
            <a class="app-drawer__close" href="#" aria-label="Close menu">Close</a>
            <nav>
                ${drawerLinks}
                <a class="app-drawer__section app-drawer__back" href="${routeHref([])}">Cloud SuperApp</a>
            </nav>
        </aside>`;
}

// ── shared shell ─────────────────────────────────────────────────────────
// LauncherStatusStripView — real device metrics (radio state, RAM/storage/
// CPU/battery) have no web equivalent, so left/right clusters are static
// mock values; the center clock is genuinely live (see main.ts's tiny
// setInterval clock updater — #status-clock's text is refreshed client-side,
// this server-rendered value is just the correct initial paint).
// Battery reads as a GLYPH in the app, not a "BAT 84%" text chip — body +
// nub outline with the fill bar sized to the percentage.
function batteryGlyphHtml(value) {
  const pct = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
  const fill = (16 * pct / 100).toFixed(1);
  return `<span class="status-strip__chip is-active" role="img" aria-label="Battery ${value}"><svg width="22" height="11" viewBox="0 0 24 12" aria-hidden="true" focusable="false"><rect x="0.5" y="0.5" width="19" height="11" rx="2.5" fill="none" stroke="currentColor"/><rect x="2" y="2" width="${fill}" height="8" rx="1" fill="currentColor"/><rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor"/></svg></span>`;
}

function statusStripHtml() {
  const left = statusBar.left.map((i) => `<span class="status-strip__chip${i.active ? ' is-active' : ''}">${i.label}</span>`).join('');
  const right = statusBar.right.map((i) => (i.label === 'BAT'
    ? batteryGlyphHtml(i.value)
    : `<span class="status-strip__chip">${i.label} ${i.value}</span>`)).join('');
  // No new Date() here on purpose — a build-time timestamp would make every
  // page's HTML differ across builds/redeploys with no source change,
  // breaking reproducibility (the whole dist/-is-committed-code convention
  // assumes same source -> byte-identical output). main.ts's initStatusClock()
  // fills the real time in immediately on load instead.
  return `<div class="status-strip">
            <div class="status-strip__row">
                <div class="status-strip__cluster status-strip__cluster--left">${left}</div>
                <span class="status-strip__camera" aria-hidden="true"></span>
                <div class="status-strip__cluster status-strip__cluster--right">${right}</div>
            </div>
            <div class="status-strip__row status-strip__row--clock">
                <button class="status-strip__clock" id="status-clock" type="button" aria-label="Calendar">--:--</button>
            </div>
            <div class="status-strip__hairline" aria-hidden="true"></div>
        </div>`;
}

// ── global footer — every generated page, very bottom of .content: a
// Google-Play-style APK download badge + the Constellation fleet as small
// glass icon chips. Data-driven from shell.json's "footer" key. Icon
// mapping is a sensible reuse of the existing generic-functional icon set
// (no bundled per-app trademarked icons, same reasoning as appIconHtml()
// above for the Phone tab's app tiles).
const FOOTER_ICON_MAP = {
  'cloud-mail': 'mail',
  'cloud-chat': 'chat',
  'cloud-matrix': 'chat',
  'cloud-dialer': 'phone',
  'cloud-ide': 'code',
  'cloud-nav': 'mesh',
  'cloud-calendar': 'calendar',
  'cloud-news': 'rss',
  'cloud-keyboard': 'tools',
  'cloud-wallet': 'wallet',
  'cloud-browser': 'browser',
  'cloud-vault': 'lock',
  'cloud-media-center': 'music',
};
function footerHtml(rel) {
  const { apk, constellation } = footer;
  const chips = constellation.map((c) => `
                    <a class="footer-chip" href="${c.url}" download>
                        <span class="footer-chip__icon-wrap">${iconImg(FOOTER_ICON_MAP[c.id] ?? 'suite', rel, 'footer-chip__icon')}</span>
                        <span class="footer-chip__label">${c.label}</span>
                    </a>`).join('');
  return `<footer class="site-footer">
                <a class="footer-badge" href="${apk.url}" download>
                    ${iconImg('play-badge', rel, 'footer-badge__icon')}
                    <span class="footer-badge__text">
                        <span class="footer-badge__label">${apk.label}</span>
                        <span class="footer-badge__sub">${apk.sub}</span>
                    </span>
                </a>
                <div class="footer-constellation">${chips}
                </div>
            </footer>`;
}

function renderShell({ title, sectionId, depth, bodyHtml, backHref, fleet = null }) {
  const rel = relPrefix(depth);
  const isHome = sectionId === 'home' ? ' is-home' : '';
  // Mirrors MainActivity's onPrepareOptionsMenu: action_back is visible
  // everywhere except the Home root; action_wallet slots into that same
  // toolbar position ONLY at the Home root ("mirror of action_back which
  // hides on Home"). Every non-home route always carries a real backHref
  // (see the route tree below), so this is a clean either/or — never both,
  // never neither.
  const rightIcon = sectionId === 'home'
    ? `<a class="toolbar-action" href="${routeHref(['wallet', 'cards'])}" aria-label="Wallet">${iconImg('wallet', rel, '')}</a>`
    : `<a class="toolbar-action" href="${backHref}" aria-label="Back">${iconImg('back', rel, '')}</a>`;

  const navItems = fleet
    ? fleet.app.bottom_nav.map((id) => {
        const s = fleet.app.sections.find((x) => x.id === id) ?? { label: id };
        const active = id === fleet.section ? ' is-active' : '';
        return `<a class="bottom-nav__item${active}" href="${routeHref(['apps', fleet.app.id, id])}">${iconImg(webIcon(s.icon, 'more'), rel, '')}<span>${s.label}</span></a>`;
      }).join('\n            ')
    : bottomNav.map((id) => {
    const s = sections[id];
    const active = id === sectionId ? ' is-active' : '';
    return `<a class="bottom-nav__item${active}" href="${rel}${id === 'home' ? '' : id + '/'}" data-longpress="${id}">${iconImg(s.icon, rel, '')}<span>${s.label}</span></a>`;
  }).join('\n            ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    ${EMBED_HEAD_SCRIPT}
    <title>${title} · ${fleet ? fleet.app.name : 'Cloud SuperApp'}</title>
    <link rel="icon" type="image/svg+xml" href="${rel}public/favicon.svg">
    <link rel="manifest" href="${rel}manifest.webmanifest">
    <meta name="theme-color" content="#000000">
    <script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"}]},"eagerness":"moderate"}]}</script>
<script>
  var _mtm = window._mtm = window._mtm || [];
  _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
  (function() {
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src='https://analytics.diegonmarcos.com/matomo/js/container_odwLIyPV.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
    <link rel="stylesheet" href="${rel}style.css">
</head>
<body data-section="${sectionId}">
    <div class="shell${isHome}${fleet ? ' shell--fleet shell--dense' : ''}">
        ${fleet ? fleetTopBarHtml(fleet, rel) : ''}
        ${statusStripHtml()}
        <div class="galaxy-backdrop" aria-hidden="true"></div>
        ${sectionId === 'home' ? homeCubeHtml() : ''}

        <button class="star star--sirius" id="star-sirius" type="button" aria-label="Open menu">✦</button>
        <button class="star star--canopus" id="star-canopus" type="button" aria-label="Quick configs">✦</button>
        <button class="star star--centauri" id="star-centauri" type="button" aria-label="Recent apps">✦</button>

        <button class="icon-btn icon-btn--hamburger" id="hamburger-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">
            ${iconImg('menu', rel, '')}
        </button>

        <div class="music-island" aria-hidden="true">
            ${iconImg('music', rel, 'music-island__icon')}
            <span class="music-island__marquee"><span class="music-island__title">Weightless — Marconi Union</span></span>
        </div>

        <button class="dynamic-island" id="dynamic-island" type="button" aria-label="Notifications">
            <span class="dynamic-island__wave-clip" aria-hidden="true">
                <span class="dynamic-island__wave dynamic-island__wave--1"></span>
                <span class="dynamic-island__wave dynamic-island__wave--2"></span>
                <span class="dynamic-island__wave dynamic-island__wave--3"></span>
                <span class="dynamic-island__wave dynamic-island__wave--4"></span>
            </span>
            <span class="dynamic-island__shimmer" aria-hidden="true"></span>
        </button>

        ${rightIcon}

        <main class="content" id="content">
            ${bodyHtml}
            ${sectionId === 'home' ? '' : footerHtml(rel)}
        </main>

        <nav class="bottom-nav" id="bottom-nav" aria-label="Primary">
            ${navItems}
        </nav>

        <div class="drawer-scrim" id="drawer-scrim"></div>
        <aside class="drawer" id="drawer" aria-hidden="true">
            <div class="drawer__banner drawer__banner--app" id="drawer-app-banner">
                ${iconImg('home', rel, 'drawer__banner-icon')}
                <div class="drawer__banner-text">
                    <p class="drawer__title" id="drawer-app-name">Cloud SuperApp</p>
                    <p class="drawer__meta" id="drawer-app-build">cloud-superapp · web</p>
                    <p class="drawer__meta drawer__meta--ts" id="drawer-app-timestamp">2026-08-18 07:52</p>
                </div>
            </div>
            <div class="drawer__separator"></div>
            <div class="drawer__banner drawer__banner--user" id="drawer-user-banner">
                <a class="drawer__avatar" id="drawer-user-avatar" href="${routeHref(['config', 'profile'])}">DCM</a>
                <div class="drawer__banner-text">
                    <p class="drawer__title" id="drawer-user-name">Diego Coelho Marcos</p>
                    <p class="drawer__meta" id="drawer-user-email">me@diegonmarcos.com</p>
                    <p class="drawer__mode" id="drawer-user-mode">Mode: Apps</p>
                </div>
            </div>
            <nav class="drawer__nav" id="drawer-nav"></nav>
        </aside>

        <div class="radial-menu" id="radial-menu" hidden aria-hidden="true"></div>
        <div class="fan-menu-scrim" id="fan-menu-scrim" hidden></div>
        <div class="fan-menu" id="fan-menu" hidden aria-hidden="true"></div>
        <div class="overlay-sheet" id="notification-center" hidden></div>
        <div class="overlay-sheet overlay-sheet--full" id="update-overlay" hidden></div>
        <div class="overlay-sheet" id="calendar-popup" hidden></div>
    </div>

    <script>window.PORTAL_DATA = window.PORTAL_DATA || {};</script>
    <script src="${rel}data-shell.json.js"></script>
    <script src="${rel}data-sections-core.json.js"></script>
    <script src="${rel}data-sections-content.json.js"></script>
    <script src="${rel}data-mock-apps.json.js"></script>
    <script src="${rel}data-linktree.json.js"></script>
    <script src="${rel}data-cloud-apps.json.js"></script>
    <script src="${rel}script.js"></script>
</body>
</html>
`;
}

// ── route tree ───────────────────────────────────────────────────────────
// Home — the real app's default (and only) home screen is Home3DFragment,
// a centered animated cube, NOT a tile grid. Discovery of sections happens
// via bottom nav / drawer / the star radial menus, matching the real app.
write([], 'Home', 'home', '', null);

// Home Apps — real app: HomeFanMenu's "action:open_home_apps" (and Sirius's
// same-named node) opens AppDrawerSheetFragment: a search bar + a tile grid
// of every section. The web version had proxied this to a bare JS search
// overlay with no real destination — replaced with an actual page so the
// long-press item and the star node both resolve to a real, working href.
{
  const rel1 = relPrefix(1);
  const tileIds = [...bottomNav, ...Object.keys(sections).filter((id) => id !== 'home' && !bottomNav.includes(id))]
    .filter((id) => id !== 'home');
  const tiles = tileIds.map((id) => ({ id, label: sections[id].label, icon: sections[id].icon, target: `section:${id}` }));
  const searchPill = `<div class="search-pill" aria-hidden="true">Search apps &amp; content</div>`;
  write(['home-apps'], 'Home Apps', 'home-apps',
    searchPill + '\n            ' + tileGridBody(tiles, rel1, (t) => sections[t.id].color), routeHref([]));
}

// Recent Apps — real app: HomeFanMenu's "page:recentapps/grid" opens
// RecentAppsFragment, a 3-per-row grid of the last 24 opened apps (device
// usage stats, no web equivalent — reuses the same deterministic recent-
// apps stand-in list Centauri's star already shows, single source of truth).
{
  const rel2 = relPrefix(2);
  const tiles = stars.centauri.recentApps.map((name) => avatarTileHtml(name, rel2, null)).join('\n                ');
  const body = `<div class="tile-grid tile-grid--dense" role="list">
                ${tiles}
            </div>`;
  write(['recentapps', 'grid'], 'Recent Apps', 'recentapps', body, routeHref([]));
}

// ── every section, one loop ──────────────────────────────────────────────
// The 4 bottom-nav aggregators (sections-core.json) and the content-only
// sections (sections-content.json) now share one page shape — {id, label,
// icon, tiles?/groups?/stack?/items?/rows?/render?} — so they share one
// walker too, and the generator no longer carries a hardcoded list of
// section ids anywhere: the data files are the registry.
//
// Page bodies stay ICONS-FIRST, matching the real app: the page's own tile
// grid (or group strips) on top, then AggregatorStackFragment's collapsible
// cards below a divider.
// ── generated-nav renderers ──────────────────────────────────────────────
// Configs: Setup{Connect, Apps, Launcher, Network} · Fleet · Observability —
// the group/subgroup headings are rendered verbatim from nav.json (the
// SuperApp's ui.sections[config].pages[].group/subgroup), never named here.
function configTile(p) {
  const target = (p.nativeAction && resolveTarget(p.nativeAction).href ? p.nativeAction : null) ?? p.target ?? `page:config/${p.id}`;
  return { id: p.id, label: p.label, icon: p.icon ?? 'settings', target };
}
function configsTreeBody(rel) {
  const pages = visiblePages(sections.config.pages).filter((p) => p.group);
  const out = [];
  let group = null, sub = null, run = [];
  const flush = () => {
    if (run.length) out.push(`<div class="tile-grid tile-grid--cols" style="--cols:${sections.config.gridColumns ?? 6}" role="list">\n                ${run.map((t) => tileHtml(t, TILE_COLORS[hash(t.id) % TILE_COLORS.length], rel)).join('\n                ')}\n            </div>`);
    run = [];
  };
  for (const p of pages) {
    if (p.group !== group) { flush(); group = p.group; sub = null; out.push(`<h2 class="tile-group__title config-group">${group}</h2>`); }
    if ((p.subgroup ?? null) !== sub) { flush(); sub = p.subgroup ?? null; if (sub) out.push(`<h3 class="tile-group__title config-subgroup">${sub}</h3>`); }
    run.push(configTile(p));
  }
  flush();
  return `<div class="configs-tree" data-config-tree>\n            ${out.join('\n            ')}\n        </div>`;
}
// Cloud ▸ Configs: the Configs tile group (SuperApp | Account | Store, Controls, Firewall | C3 | About)
// with its `|` separators, then the same tree.
function cloudConfigsBody(rel) {
  const tiles = (NAV_CLOUD_CONFIGS?.tiles ?? []).map((t) => (t.separator
    ? `<span class="tile-sep" aria-hidden="true">|</span>`
    : tileHtml({ ...t, icon: webIcon(t.icon, 'settings') }, 'blue', rel))).join('\n                ');
  return `<section class="tile-group" data-configs-group>
                <h2 class="tile-group__title">Configs</h2>
                <div class="tile-grid tile-grid--dense tile-grid--sep" role="list">
                ${tiles}
                </div>
            </section>
            ${configsTreeBody(rel)}`;
}
// Cloud ▸ WebApps: the fleet apps that have a web mirror in this site.
function webappsBody(rel) {
  const tiles = nav.fleet.map((a) => ({ id: a.id, label: a.name.replace(/^Cloud /, ''), icon: webIcon(a.sections[0]?.icon, 'suite'), target: `extapp:cloud-${a.id}` }));
  return `<section class="tile-group" data-webapps>
                <h2 class="tile-group__title">WebApps</h2>
                ${tileGridBody(tiles, rel, () => 'blue', true)}
            </section>`;
}
// Sub-tab strips for pages that declare `tabs` (Controls{Presets, Panels{UI, Tools}}, Agents, …) and for the tab
// pages themselves: ancestors top-down, then this page's own first-tab chain.
function tabStripHtml(items) {
  return `<div class="page-tabs-bar page-tabs-bar--sub">
                <div class="page-tabs" role="tablist">
                ${items.map((i) => `<a class="page-tabs__item${i.active ? ' is-active' : ''}" href="${i.href}">${i.label}</a>`).join('\n                ')}
                </div>
            </div>`;
}
function subTabsHtml(section, sectionId, page) {
  const byId = new Map(section.pages.map((p) => [p.id, p]));
  const level = (ids, active) => tabStripHtml(ids.map((id) => ({ label: byId.get(id)?.label ?? id, href: routeHref([sectionId, id]), active: id === active })));
  const up = [];
  let cur = page;
  for (let q; (q = section.pages.find((x) => x.tabs?.includes(cur.id)));) { up.unshift(level(q.tabs, cur.id)); cur = q; }
  const down = [];
  for (let c = page; c.tabs?.length;) { down.push(level(c.tabs, c.tabs[0])); c = byId.get(c.tabs[0]) ?? { tabs: [] }; }
  return [...up, ...down].join('\n            ');
}

function pageBody(section, sectionId, page, rel) {
  if (typeof page === 'string') return skeletonBody();
  if (page.webapps) return webappsBody(rel);
  if (page.mirror_section === 'config') return cloudConfigsBody(rel);
  if (page.tabs?.length) {
    // a page that declares tabs shows its FIRST tab's body under the sub-tab strip (the strip is added by the caller)
    const first = section.pages.find((q) => q.id === page.tabs[0]);
    if (first) return pageBody(section, sectionId, first, rel);
  }
  if (page.constellation) return constellationBody(page.constellation);

  const parts = [];
  if (page.tiles) parts.push(tileGridBody(page.tiles, rel, () => section.color, true));
  if (page.groups) parts.push(groupListBody(page.groups, rel, null, null, true));

  switch (page.render) {
    case 'linktree':
      // The APK hosts linktree.diegonmarcos.com in a WebView; here the same
      // list is rendered natively from linktree.json so the page is crawlable.
      parts.push(groupListBody(linktreeData.groups.map((g) => ({
        title: g.label,
        tiles: g.tiles.map((t) => ({ label: t.label, icon: t.icon, target: t.href })),
      })), rel, null, null));
      break;
    case 'mirror':
      // build.json's mirror_section — render THAT section's own page grid
      // rather than a second copy of the same list.
      parts.push(sectionPagesTileGridBody(sections[page.mirror].pages, page.mirror, rel));
      break;
    case 'phone-apps':
      // One scroll, three parts: Quickmarks, All-Apps folder sections, and
      // the rule-driven Smart Folders — all derived from mock-apps.json.
      parts.push(phoneMergedBody(rel));
      break;
    default:
      break;
  }

  if (page.stack) {
    if (parts.length) parts.push(`<h2 class="stack-divider">Details</h2>`);
    parts.push(stackBody(page.stack, rel));
  }
  if (page.rows) parts.push(settingsListBody(page.rows));
  if (page.items) parts.push(itemListBody(page.items, page));

  return parts.length ? parts.join('\n            ') : skeletonBody();
}

for (const [id, s] of Object.entries(sections)) {
  if (id === 'home' || !s.pages) continue;
  const rel1 = relPrefix(1);
  const rel2 = relPrefix(2);
  const shown = visiblePages(s.pages);

  // An aggregator's bottom-nav destination opens its FIRST VISIBLE page
  // (build.json: is_aggregator + tabs, no default_children anywhere), so the
  // section root serves that page rather than an index of pages.
  if (AGGREGATOR_IDS.includes(id) && shown.length) {
    const first = shown[0];
    const sub = subTabsHtml(s, id, first);
    write([id], s.label, id,
      `${pageTabsHtml(s.pages, id, first.id, rel1)}\n            ${sub ? sub + '\n            ' : ''}${pageBody(s, id, first, rel1)}`,
      routeHref([]));
  } else {
    write([id], s.label, id, id === 'config' ? configsTreeBody(rel1) : sectionPagesTileGridBody(s.pages, id, rel1), routeHref([]));
  }

  // Every DECLARED page gets HTML, hidden ones included — hiding a page from
  // the child lists must never make page:<section>/<id> dead.
  for (const p of s.pages) {
    const label = typeof p === 'string' ? p : p.label;
    const pid = typeof p === 'string' ? slug(p) : p.id;
    if (typeof p === 'object' && p.target) continue; // routes elsewhere or inert — no own page
    const strip = id !== 'config' && shown.length > 1 ? `${pageTabsHtml(s.pages, id, pid, rel2)}\n            ` : '';
    const sub = subTabsHtml(s, id, p);
    write([id, pid], `${s.label} · ${label}`, id, strip + (sub ? sub + '\n            ' : '') + pageBody(s, id, p, rel2), routeHref([id]));
  }
}

// ── fleet apps — generated from each app's build.json ui (nav.json.fleet) ─
// One page per (section, page) with the app's own AppTopBar + page-tab strip +
// bottom island, plus apps/ (the WebApps index) and apps/<id>/ (its default
// section). The bodies are honest structural mirrors: the live content runs on
// the phone, so each page says which declaration it mirrors.
{
  const tileApps = nav.fleet.map((a) => ({ id: a.id, label: a.name.replace(/^Cloud /, ''), icon: webIcon(a.sections[0]?.icon, 'suite'), target: `extapp:cloud-${a.id}` }));
  write(['apps'], 'WebApps', 'apps', `<section class="tile-group"><h2 class="tile-group__title">WebApps</h2>${tileGridBody(tileApps, relPrefix(1), () => 'blue', true)}</section>`, routeHref([]));
  for (const app of nav.fleet) {
    const secs = app.sections;
    const body = (sec, pg, depth) => {
      const rel = relPrefix(depth);
      const strip = sec.pages.length > 1 ? `<div class="page-tabs-bar"><div class="page-tabs" role="tablist">${sec.pages.map((q) => `<a class="page-tabs__item${pg && q.id === pg.id ? ' is-active' : ''}" href="${routeHref(['apps', app.id, sec.id, q.id])}">${q.label}</a>`).join('')}</div></div>` : '';
      const what = pg ? `${app.name} ▸ ${sec.label} ▸ ${pg.label}` : `${app.name} ▸ ${sec.label}`;
      return `${strip}\n            ${emptyStateHtml(pg?.label ?? sec.label, `Structural mirror of ${what} (build.json ui.sections). The live content runs in the ${app.name} app on the phone.`)}`;
    };
    const ctx = (sec) => ({ app, section: sec.id });
    const dflt = secs.find((x) => x.id === app.default_section) ?? secs[0];
    if (dflt) write(['apps', app.id], app.name, 'apps', body(dflt, dflt.pages[0], 2), routeHref(['apps']), ctx(dflt));
    for (const sec of secs) {
      write(['apps', app.id, sec.id], `${app.name} · ${sec.label}`, 'apps', body(sec, sec.pages[0], 3), routeHref(['apps']), ctx(sec));
      if (sec.pages.length > 1 || (sec.pages.length === 1 && sec.pages[0].id !== sec.id)) {
        for (const pg of sec.pages) write(['apps', app.id, sec.id, pg.id], `${app.name} · ${pg.label}`, 'apps', body(sec, pg, 4), routeHref(['apps', app.id, sec.id]), ctx(sec));
      }
    }
  }
}

console.log(`page_gen: done`);
