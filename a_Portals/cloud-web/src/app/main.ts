// Cloud Web — the fleet's web edition.
//
// A grid of every constellation row that ships a Kotlin/Wasm page (its fleet row carries
// assets.wasm, a Cloud-<App>.wasm.zip on the cloud-u-android release). scripts/fetch-wasm.sh
// unzips each into apps/<slug>/ at ship time; a tile opens apps/<slug>/index.html in an iframe.
// The slug is the row's label (cloud-store), the same name the app's build.json calls portal_slug.

interface FleetRow {
  id: string;
  label?: string;
  kind?: string;
  version_name?: string;
  assets?: Record<string, string>;
}

interface PortalData {
  [key: string]: { apps?: FleetRow[] } | undefined;
}

export function webApps(rows: FleetRow[]): FleetRow[] {
  return rows.filter((r) => typeof r.assets?.wasm === 'string' && r.assets.wasm.length > 0);
}

export function slugOf(row: FleetRow): string {
  return row.label || row.id;
}

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`cloud-web: #${id} missing from index.html`);
  return node as T;
}

function open(slug: string): void {
  el<HTMLIFrameElement>('frame').src = `apps/${encodeURIComponent(slug)}/index.html`;
  el('viewer').hidden = false;
  el('app').hidden = true;
  if (location.hash !== `#${slug}`) history.replaceState(null, '', `#${slug}`);
}

function close(): void {
  el<HTMLIFrameElement>('frame').src = 'about:blank';
  el('viewer').hidden = true;
  el('app').hidden = false;
  history.replaceState(null, '', location.pathname + location.search);
}

// apps/available.json is written by scripts/fetch-wasm.sh: the slugs whose zip really was on the
// release. Absent (a local build before any fetch) = no filter, the grid shows every web row.
async function available(): Promise<string[] | null> {
  try {
    const res = await fetch('apps/available.json', { cache: 'no-cache' });
    return res.ok ? ((await res.json()) as string[]) : null;
  } catch {
    return null;
  }
}

async function init(): Promise<void> {
  const data = (globalThis as unknown as { PORTAL_DATA?: PortalData }).PORTAL_DATA;
  const have = await available();
  const rows = webApps(data?.['constellation-fleet']?.apps ?? []).filter(
    (r) => have === null || have.includes(slugOf(r))
  );
  const grid = el('grid');
  el('count').textContent = `${rows.length} app${rows.length === 1 ? '' : 's'} with a web page`;
  el('empty').hidden = rows.length > 0;

  for (const row of rows) {
    const slug = slugOf(row);
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.dataset.slug = slug;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = slug;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `${row.kind ?? 'app'} · ${row.version_name ?? '—'}`;
    tile.append(name, meta);
    tile.addEventListener('click', () => open(slug));
    grid.append(tile);
  }

  el('back').addEventListener('click', close);
  const wanted = decodeURIComponent(location.hash.slice(1));
  if (wanted && rows.some((r) => slugOf(r) === wanted)) open(wanted);
}

document.addEventListener('DOMContentLoaded', () => void init());
