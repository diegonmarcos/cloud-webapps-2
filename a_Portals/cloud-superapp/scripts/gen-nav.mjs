#!/usr/bin/env node
// gen-nav.mjs — generate src/data/nav.json FROM the Android apps' build.json
// `ui` declarations, so a SuperApp / fleet nav change flows into the web
// replica by re-running one command instead of hand-copying lists.
//
//   node scripts/gen-nav.mjs                     # source: cloud-u-android main via `gh api`
//   node scripts/gen-nav.mjs --android <dir>     # source: a local cloud-u-android checkout
//   node scripts/gen-nav.mjs --check             # exit 1 if src/data/nav.json is stale
//
// Reads (read-only):  aa_cloud-superapp/build.json  +  the fleet apps listed in
// src/data/nav-overlay.json `fleet_apps` (each <dir>/build.json).
// Writes:             src/data/nav.json   (GENERATED — never edit by hand)
// Hand-written companion: src/data/nav-overlay.json (icon map, aliases, density,
// the WebApps tab until the SuperApp declares it, which apps to mirror).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(HERE, '../src/data');
const OUT = join(DATA, 'nav.json');
const REPO = 'diegonmarcos/cloudy-u-android';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const li = args.indexOf('--android');
const LOCAL = li >= 0 ? resolve(args[li + 1]) : process.env.CLOUD_U_ANDROID || '';

const overlay = JSON.parse(readFileSync(join(DATA, 'nav-overlay.json'), 'utf8'));

function readRaw(rel) {
  if (LOCAL) return existsSync(join(LOCAL, rel)) ? readFileSync(join(LOCAL, rel), 'utf8') : null;
  try {
    return execFileSync(
      'gh', ['api', '-H', 'Accept: application/vnd.github.raw', `repos/${REPO}/contents/${rel}?ref=main`],
      { maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    ).toString('utf8');
  } catch (e) {
    if (/404|Not Found/.test(String(e.stderr ?? e.message))) return null;
    throw e;
  }
}
function readBuild(dir) {
  const raw = readRaw(`${dir}/build.json`);
  if (raw == null) throw new Error(`${dir}/build.json not found in ${REPO}`);
  return JSON.parse(raw);
}

// ── SuperApp drawables -> web SVGs ──────────────────────────────────────
// The Cloud page's tile_groups name Android vector drawables (ic_ide, ic_drive,
// …). Each is converted to a monochrome SVG in src/public/icons/sa/<name>.svg
// (GENERATED, same rule as nav.json) so the web replica carries the SuperApp's
// own unique glyphs instead of a lossy map onto the generic web icon set.
const SA_ICONS = resolve(HERE, '../src/public/icons/sa');
const DRAWABLE = 'aa_cloud-superapp/app/src/main/res/drawable';
const attr = (tag, name) => (new RegExp(`android:${name}="([^"]*)"`).exec(tag) ?? [])[1];
function vectorToSvg(xml) {
  const root = /<vector\b[^>]*>/.exec(xml)?.[0];
  if (!root) return null;
  const vw = attr(root, 'viewportWidth') ?? '24', vh = attr(root, 'viewportHeight') ?? '24';
  const paint = (c) => c && !/^#0{8}$|^#00[0-9a-fA-F]{6}$/.test(c) && c !== '@android:color/transparent';
  let body = '';
  const re = /<group\b[^>]*?(\/?)>|<\/group>|<path\b[\s\S]*?(?:\/>|<\/path>)/g;
  for (let m; (m = re.exec(xml));) {
    const t = m[0];
    if (t.startsWith('</group')) { body += '</g>'; continue; }
    if (t.startsWith('<group')) {
      const tx = attr(t, 'translateX') ?? 0, ty = attr(t, 'translateY') ?? 0;
      const sx = attr(t, 'scaleX') ?? 1, sy = attr(t, 'scaleY') ?? 1, r = attr(t, 'rotation');
      const px = attr(t, 'pivotX') ?? 0, py = attr(t, 'pivotY') ?? 0;
      const tf = `translate(${tx} ${ty})${r ? ` rotate(${r} ${px} ${py})` : ''} translate(${px} ${py}) scale(${sx} ${sy}) translate(${-px} ${-py})`;
      body += m[1] ? '' : `<g transform="${tf}">`;
      continue;
    }
    const d = attr(t, 'pathData');
    if (!d) continue;
    const fill = attr(t, 'fillColor') ?? (/<aapt:attr name="android:fillColor"/.test(t) ? '#fff' : null);
    const stroke = attr(t, 'strokeColor');
    const sw = attr(t, 'strokeWidth');
    const a = [`d="${d}"`, `fill="${paint(fill) ? 'currentColor' : 'none'}"`];
    if (paint(stroke)) a.push('stroke="currentColor"', `stroke-width="${sw ?? 1}"`);
    if (attr(t, 'fillType') === 'evenOdd') a.push('fill-rule="evenodd"');
    if (attr(t, 'strokeLineCap')) a.push(`stroke-linecap="${attr(t, 'strokeLineCap')}"`);
    if (attr(t, 'strokeLineJoin')) a.push(`stroke-linejoin="${attr(t, 'strokeLineJoin')}"`);
    body += `<path ${a.join(' ')}/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="24" height="24" fill="none">${body}</svg>\n`;
}
function sourceRef() {
  try {
    if (LOCAL) return execFileSync('git', ['-C', LOCAL, 'rev-parse', 'HEAD']).toString().trim();
    return execFileSync('gh', ['api', `repos/${REPO}/commits/main`, '--jq', '.sha']).toString().trim();
  } catch { return 'unknown'; }
}

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined && o[k] !== null).map((k) => [k, o[k]]));
const tileOf = (t) => pick(t, ['id', 'label', 'icon', 'target', 'separator']);
const PAGE_KEYS = ['id', 'label', 'icon', 'hidden', 'facet', 'group', 'subgroup', 'action', 'is_action', 'mirror_section', 'mirror_page', 'actions_from_section', 'tabs', 'url', 'mode'];

function superapp(build) {
  const ui = build.ui;
  const sections = ui.sections.map((s) => {
    const pages = (s.pages ?? []).map((p) => {
      const out = pick(p, PAGE_KEYS);
      const tiles = s[`tiles_${p.id}`];
      const stack = s[`stack_${p.id}`];
      if (Array.isArray(tiles)) out.tiles = tiles.map(tileOf);
      if (Array.isArray(stack)) out.stack = stack.map((c) => pick(c, ['kind', 'title', 'subtitle']));
      return out;
    });
    const out = { ...pick(s, ['id', 'label', 'icon', 'tabs', 'is_aggregator', 'grid_columns']), pages };
    if (Array.isArray(s.tile_groups)) {
      out.tile_groups = s.tile_groups.map((g) => ({ title: g.title, tiles: (g.tiles ?? []).map(tileOf) }));
    }
    return out;
  });
  return {
    default_section: ui.default_section,
    bottom_nav: ui.bottom_nav,
    top_orbs: ui.top_orbs ?? {},
    tile_columns: ui.tile_columns,
    home_apps_tabs: ui.home_apps_tabs ?? [],
    sections,
  };
}

function fleetApp(entry, build) {
  const ui = build.ui ?? {};
  return {
    id: entry.id,
    name: entry.name ?? build.name,
    dir: entry.dir,
    default_section: ui.default_section ?? ui.bottom_nav?.[0],
    bottom_nav: ui.bottom_nav ?? [],
    top_bar: pick(ui.top_bar ?? {}, ['drawer', 'ai', 'settings']),
    sections: (ui.sections ?? []).map((s) => ({
      ...pick(s, ['id', 'label', 'icon', 'background']),
      pages: (s.pages ?? []).map((p) => pick(p, ['id', 'label', 'icon', 'action'])),
    })),
  };
}

const sa = superapp(readBuild('aa_cloud-superapp'));
// Cloud page tile groups: point every tile at its generated SuperApp glyph.
const icons = new Map();
for (const s of sa.sections) for (const g of s.tile_groups ?? []) for (const t of g.tiles) {
  if (!t.icon || t.separator) continue;
  if (!icons.has(t.icon)) {
    const xml = readRaw(`${DRAWABLE}/${t.icon}.xml`);
    icons.set(t.icon, xml ? vectorToSvg(xml) : null);
  }
  if (icons.get(t.icon)) t.web_icon = `sa/${t.icon}`;
}
// cloud-apps.json (GENERATED): the Cloud > App page exactly as the SuperApp
// declares it — groups, order, labels, separators, glyphs, targets. Read by
// generate-pages.mjs (static pages) and, via data-cloud-apps.json.js, by the
// client (search sheet). There is NO hand-written copy of this list any more.
const ICONS_DIR = resolve(HERE, '../src/public/icons');
const fallbackIcon = (n) => { const m = overlay.icon_map[n] ?? n; return existsSync(join(ICONS_DIR, `${m}.svg`)) ? m : 'suite'; };
const cloudSec = sa.sections.find((s) => s.id === 'cloud');
const cloudApps = {
  _generated: 'GENERATED by scripts/gen-nav.mjs from aa_cloud-superapp/build.json ui.sections[cloud].tile_groups — DO NOT EDIT BY HAND.',
  groups: (cloudSec?.tile_groups ?? []).map((g) => ({
    title: g.title,
    tiles: g.tiles.map((t) => (t.separator || t.label === '|'
      ? { separator: true }
      : pick({ id: t.id, label: t.label, icon: t.web_icon ?? fallbackIcon(t.icon), target: t.target }, ['id', 'label', 'icon', 'target']))),
  })),
};
const APPS_OUT = join(DATA, 'cloud-apps.json');
const appsText = JSON.stringify(cloudApps, null, 2) + '\n';
const fleet = overlay.fleet_apps.map((e) => fleetApp(e, readBuild(e.dir)));
const out = {
  _generated: 'GENERATED by scripts/gen-nav.mjs from the Android build.json ui declarations — DO NOT EDIT BY HAND. Re-run: node scripts/gen-nav.mjs',
  source: { repo: REPO, ref: sourceRef(), files: ['aa_cloud-superapp/build.json', ...overlay.fleet_apps.map((e) => `${e.dir}/build.json`)] },
  superapp: sa,
  fleet,
};
const text = JSON.stringify(out, null, 2) + '\n';

const svgs = new Map([...icons].filter(([, v]) => v).map(([k, v]) => [`${k}.svg`, v]));
if (CHECK) {
  const strip = (s) => s.replace(/"ref": "[^"]*"/, '"ref": "-"');
  const have = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  const stale = [];
  if (strip(have) !== strip(text)) stale.push('src/data/nav.json');
  if ((existsSync(APPS_OUT) ? readFileSync(APPS_OUT, 'utf8') : '') !== appsText) stale.push('src/data/cloud-apps.json');
  const onDisk = existsSync(SA_ICONS) ? readdirSync(SA_ICONS).filter((f) => f.endsWith('.svg')) : [];
  for (const [f, v] of svgs) if (!onDisk.includes(f) || readFileSync(join(SA_ICONS, f), 'utf8') !== v) stale.push(`icons/sa/${f}`);
  for (const f of onDisk) if (!svgs.has(f)) stale.push(`icons/sa/${f} (orphan)`);
  if (stale.length) {
    console.error(`cloud-superapp is OUT OF SYNC with the SuperApp (${REPO} main): ${stale.join(', ')}\nFix: node scripts/gen-nav.mjs`);
    process.exit(1);
  }
  console.log('nav.json + SuperApp icons are up to date');
} else {
  writeFileSync(OUT, text);
  writeFileSync(APPS_OUT, appsText);
  mkdirSync(SA_ICONS, { recursive: true });
  for (const f of readdirSync(SA_ICONS)) if (f.endsWith('.svg') && !svgs.has(f)) unlinkSync(join(SA_ICONS, f));
  for (const [f, v] of svgs) writeFileSync(join(SA_ICONS, f), v);
  console.log(`wrote ${OUT}: ${sa.sections.length} SuperApp sections, ${fleet.length} fleet apps (ref ${out.source.ref.slice(0, 9)})`);
}
