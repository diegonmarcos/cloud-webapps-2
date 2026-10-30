// src/app/search/search-sheet.ts — universal search bottom sheet.
//
// Real app: AppDrawerSheetFragment's search bar (see generate-pages.mjs's
// /home-apps/ route) was a static decorative pill with no live index behind
// it. This wires that same .search-pill up to a liquid-glass bottom sheet
// that filters live across 3 scopes, each with its own group header:
//   - Cloud apps  — the cloud section's `apps` page groups (getData())
//   - Phone apps  — the mock installed-app list (data.ts's getMockApps()) —
//                   inert rows, same "no real device API" treatment every
//                   other Phone-tab tile gets elsewhere in this build.
//   - Configs     — the Configs section's own settings pages
// Rows reuse the same target-grammar resolver (nav.ts's resolveTarget) the
// build-time generator and every other client module already agree on, so
// results navigate to exactly the same hrefs those pages carry.
import type { PortalData } from '../../lib/core/types';
import { getMockApps } from '../../lib/core/data';
import { resolveTarget, routeHref } from '../../lib/core/nav';

interface ResultRow {
  label: string;
  icon: string;
  href: string | null;
}

interface ResultGroup {
  title: string;
  rows: ResultRow[];
}

// Same absolute, root-anchored icon path every other client module (drawer/
// fan-menu/stars) uses — script.js runs unmodified regardless of page depth.
function iconSrc(icon: string): string {
  return `/cloud-superapp/public/icons/${icon}.svg`;
}

function collectCloudApps(data: PortalData): ResultRow[] {
  const appsPage = data.sections.cloud?.pages?.find(
    (page) => typeof page !== 'string' && page.id === 'apps',
  );
  const tileGroups = (typeof appsPage === 'object' && appsPage.groups) || [];
  return tileGroups.flatMap((group) => group.tiles.filter((tile) => tile.label && !(tile as { separator?: boolean }).separator).map((tile) => ({
    label: tile.label,
    icon: tile.icon,
    href: resolveTarget(tile.target).href,
  })));
}

function collectPhoneApps(): ResultRow[] {
  return getMockApps().apps.map((app) => ({
    label: app.name,
    icon: app.icon,
    href: null, // Phone-app rows are always inert — no real device API to open them.
  }));
}

function collectConfigs(data: PortalData): ResultRow[] {
  const pages = data.sections.config?.pages ?? [];
  return pages.flatMap((page) => {
    if (typeof page === 'string') return [];
    const href = page.target ? resolveTarget(page.target).href : routeHref(['config', page.id]);
    return [{ label: page.label, icon: 'settings', href }];
  });
}

function matches(row: ResultRow, query: string): boolean {
  return row.label.toLowerCase().includes(query);
}

function buildRow(row: ResultRow): HTMLElement {
  const el = row.href ? document.createElement('a') : document.createElement('div');
  el.className = 'search-sheet__row';
  if (row.href && el instanceof HTMLAnchorElement) {
    el.href = row.href;
  } else {
    el.classList.add('search-sheet__row--inert');
    el.setAttribute('aria-disabled', 'true');
  }

  const icon = document.createElement('img');
  icon.className = 'search-sheet__row-icon';
  icon.src = iconSrc(row.icon);
  icon.alt = '';
  el.appendChild(icon);

  const label = document.createElement('span');
  label.className = 'search-sheet__row-label';
  label.textContent = row.label;
  el.appendChild(label);

  return el;
}

export function initSearchSheet(data: PortalData): void {
  const trigger = document.querySelector<HTMLElement>('.search-pill');
  if (!trigger) return;

  const groupSources: { title: string; rows: ResultRow[] }[] = [
    { title: 'Cloud apps', rows: collectCloudApps(data) },
    { title: 'Phone apps', rows: collectPhoneApps() },
    { title: 'Configs', rows: collectConfigs(data) },
  ];

  // All 3 scopes start active — chips only narrow the result set, they
  // never hide anything on first open. The last active chip can't be
  // switched off, so at least one scope is always visible (see toggle()).
  const activeScopes = new Set(groupSources.map((source) => source.title));

  const root = document.createElement('div');
  root.className = 'search-sheet';
  root.id = 'search-sheet';
  root.hidden = true;

  const scrim = document.createElement('div');
  scrim.className = 'search-sheet__scrim';
  root.appendChild(scrim);

  const panel = document.createElement('div');
  panel.className = 'search-sheet__panel';
  root.appendChild(panel);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'search-sheet__input';
  input.placeholder = 'Search apps & content';
  input.autocomplete = 'off';
  panel.appendChild(input);

  const chips = document.createElement('div');
  chips.className = 'search-sheet__chips';
  const chipEls = groupSources.map((source) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'search-sheet__chip';
    chip.textContent = source.title;
    chip.addEventListener('click', () => toggleScope(source.title));
    chips.appendChild(chip);
    return { title: source.title, el: chip };
  });
  panel.appendChild(chips);

  function renderChips(): void {
    for (const chip of chipEls) {
      chip.el.classList.toggle('is-active', activeScopes.has(chip.title));
    }
  }

  // Refuses to deactivate the last active chip — at least one scope must
  // always stay on, matching the APK's SearchSheetFragment behavior.
  function toggleScope(title: string): void {
    if (activeScopes.has(title)) {
      if (activeScopes.size === 1) return;
      activeScopes.delete(title);
    } else {
      activeScopes.add(title);
    }
    renderChips();
    render(input.value);
  }

  renderChips();

  const results = document.createElement('div');
  results.className = 'search-sheet__results';
  panel.appendChild(results);

  const shellEl = trigger.closest('.shell');
  (shellEl ?? document.body).appendChild(root);

  function firstResultHref(groups: ResultGroup[]): string | null {
    for (const group of groups) {
      for (const row of group.rows) {
        if (row.href) return row.href;
      }
    }
    return null;
  }

  function render(query: string): void {
    results.innerHTML = '';
    const q = query.trim().toLowerCase();
    if (!q) return;

    const groups: ResultGroup[] = groupSources
      .filter((source) => activeScopes.has(source.title))
      .map((source) => ({ title: source.title, rows: source.rows.filter((row) => matches(row, q)) }))
      .filter((group) => group.rows.length > 0);

    if (groups.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'search-sheet__empty';
      empty.textContent = 'No results';
      results.appendChild(empty);
      return;
    }

    for (const group of groups) {
      const groupEl = document.createElement('div');
      groupEl.className = 'search-sheet__group';
      const titleEl = document.createElement('p');
      titleEl.className = 'search-sheet__group-title';
      titleEl.textContent = group.title;
      groupEl.appendChild(titleEl);
      for (const row of group.rows) groupEl.appendChild(buildRow(row));
      results.appendChild(groupEl);
    }
  }

  function open(): void {
    root.hidden = false;
    root.classList.add('is-open');
    input.value = '';
    render('');
    // Focus after the sheet has actually become visible/interactive.
    requestAnimationFrame(() => input.focus());
  }

  function close(): void {
    root.classList.remove('is-open');
    root.hidden = true;
  }

  trigger.addEventListener('click', open);
  scrim.addEventListener('click', close);
  input.addEventListener('input', () => render(input.value));

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key !== 'Enter') return;
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const groups: ResultGroup[] = groupSources
      .filter((source) => activeScopes.has(source.title))
      .map((source) => ({ title: source.title, rows: source.rows.filter((row) => matches(row, q)) }))
      .filter((group) => group.rows.length > 0);
    const href = firstResultHref(groups);
    if (href) location.href = href;
  });

  document.addEventListener('keydown', (event) => {
    if (root.classList.contains('is-open') && event.key === 'Escape') close();
  });
}
