// src/app/launcher/drawer.ts — slide-in nav drawer.
//
// The real Android app's drawer (HomeDrawerFragment) is a single
// NavigationView list, never tabs, and never horizontal strips: a prepend
// row ("Home Apps"), then build.json's ui.home_groups rendered as titled
// submenus, one continuous dense vertical list — Home, Cloud, Labs,
// Configs, and each Linktree group in turn. When a group's tile is
// `section:X` and that section declares .pages, each page renders as an
// indented child row directly beneath it (real: "      └─── {label}").
// This module only populates and wires the drawer markup the generated
// HTML shell already contains (see scripts/generate-pages.mjs); it never
// creates that markup itself, and it never navigates on its own — every
// link it builds is a real <a href>.

import type { PageEntry, PortalData, Section } from '../../lib/core/types';
import { resolveTarget, routeHref } from '../../lib/core/nav';
import { getLinktree } from '../../lib/core/data';
import { initLongPressMenu } from './long-press-menu';

// The shared script.js runs unmodified on every page regardless of nesting
// depth, so — unlike the build-time generator's per-page relative `rel`
// prefix — icons here always use this absolute, root-anchored path.
function iconSrc(icon: string): string {
  return `/cloud-superapp/public/icons/${icon}.svg`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// One drawer row: a real <a> when href resolves, otherwise a non-navigating
// <span> — mirrors the tile/page-list inert pattern used across the
// generated pages themselves. child=true is the real app's indented
// "└─── {label}" tree row (a section's own page, nested under its tile).
function buildNavRow(href: string | null, label: string, icon?: string, child = false): HTMLElement {
  let row: HTMLElement;
  if (href) {
    const anchor = document.createElement('a');
    anchor.href = href;
    row = anchor;
  } else {
    row = document.createElement('span');
  }
  row.classList.add('drawer__nav-item');
  if (child) row.classList.add('drawer__nav-item--child');
  if (!href) {
    row.classList.add('drawer__nav-item--inert');
    row.setAttribute('aria-disabled', 'true');
  }

  if (icon) {
    const iconEl = document.createElement('img');
    iconEl.src = iconSrc(icon);
    iconEl.alt = '';
    row.appendChild(iconEl);
  }

  const labelEl = document.createElement('span');
  labelEl.textContent = label;
  row.appendChild(labelEl);

  return row;
}

function buildGroupTitle(title: string): HTMLElement {
  const el = document.createElement('p');
  el.className = 'drawer__group-title';
  el.textContent = title;
  return el;
}

// Real app: mode switching (Apps/Admin) now lives in per-section tabs, not
// the drawer's user banner — the banner is display-only except for the
// avatar, which is a plain link to the profile/config page (see
// scripts/generate-pages.mjs's drawer markup, where it's already a real
// <a href>; nothing to wire here).
function fillBanner(data: PortalData): void {
  const setText = (id: string, text: string): void => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
  };
  setText('drawer-app-name', data.app.name);
  setText('drawer-app-build', data.app.build);
  setText('drawer-user-avatar', data.app.user.initials);
  setText('drawer-user-name', data.app.user.name);
  setText('drawer-user-email', data.app.user.email);
}

// A plain row descriptor shared by every group below (Cloud/Labs/Configs/
// Linktree tiles all reduce to this same {label, icon?, href} shape before
// becoming a row).
interface RowItem {
  label: string;
  icon?: string;
  href: string | null;
}

// Returns a named page of a section, or undefined — every drawer group below
// that reads a specific page (Cloud's Apps quickmarks, Labs' Lnktree tiles)
// goes through this rather than indexing the pages array by position.
function sectionPage(data: PortalData, sectionId: string, pageId: string): PageEntry | undefined {
  return data.sections[sectionId]?.pages?.find(
    (page) => typeof page !== 'string' && page.id === pageId,
  );
}

// Cloud's own section tiles all just point back at section:cloud (see
// cloud.tiles in sections-core.json) — the real per-app shortcuts live one
// level down, in the Apps page's tile groups, which is what the real app's
// Cloud group actually lists.
function cloudRowItems(data: PortalData): RowItem[] {
  const page = sectionPage(data, 'cloud', 'apps');
  const groups = (typeof page === 'object' && page.groups) || [];
  return groups
    .flatMap((group) => group.tiles)
    .map((tile) => ({ label: tile.label, icon: tile.icon, href: resolveTarget(tile.target).href }));
}

// Labs is no longer a section of its own — the APK folded it into Cloud's
// Lnktree page, whose tiles are exactly the old Labs list.
function labsRowItems(data: PortalData): RowItem[] {
  const page = sectionPage(data, 'cloud', 'lnktree');
  const tiles = (typeof page === 'object' && page.tiles) || [];
  return tiles.map((tile) => ({ label: tile.label, icon: tile.icon, href: resolveTarget(tile.target).href }));
}

// Configs has no .tiles of its own (only .pages) — same href derivation as
// the Home group's own Configs child rows below, minus the indentation:
// this is a separate, later "Configs" group in the same continuous list
// (deliberate duplication that mirrors the real app's own home_groups).
function configRowItems(data: PortalData): RowItem[] {
  const section = data.sections['config'];
  if (!section?.pages) return [];
  return section.pages.map((page) => {
    const label = typeof page === 'string' ? page : page.label;
    const pageId = typeof page === 'string' ? slugify(page) : page.id;
    const href = typeof page === 'object' && page.target
      ? resolveTarget(page.target).href
      : routeHref(['config', pageId]);
    return { label, icon: section.icon, href };
  });
}

function linktreeRowGroups(): [string, RowItem[]][] {
  return getLinktree().groups.map((group) => [
    group.label,
    group.tiles.map((tile) => ({ label: tile.label, icon: tile.icon, href: tile.href ?? null })),
  ]);
}

// Appends a group title + its rows, unless the group has no rows at all —
// mirrors the old strip-building guard (skip the whole group, title
// included, when empty).
function appendGroup(container: HTMLElement, title: string, items: RowItem[]): void {
  if (items.length === 0) return;
  container.appendChild(buildGroupTitle(title));
  items.forEach((item) => container.appendChild(buildNavRow(item.href, item.label, item.icon)));
}

// Real app: HomeDrawerFragment prepends build.json's ui.home_drawer_prepend
// (one entry: "Home Apps") above the first titled group, then renders every
// ui.home_groups entry — Home, Cloud, Labs, Configs, and each Linktree
// group — as one continuous dense vertical list, never tabs or horizontal
// strips. "Home" itself is deliberately excluded from the Home group's own
// rows (self-referential on a page reached from Home).
function fillDrawerList(container: HTMLElement, data: PortalData): void {
  container.innerHTML = '';

  const homeApps = data.longPress['home']?.find((item) => item.id === 'home-apps');
  if (homeApps) {
    const { href } = resolveTarget(homeApps.target);
    container.appendChild(buildNavRow(href, homeApps.label, homeApps.icon));
  }

  container.appendChild(buildGroupTitle('Home'));
  const groupIds = [...data.bottomNav.filter((id) => id !== 'home'), 'config'];
  groupIds.forEach((id) => {
    const section: Section | undefined = data.sections[id];
    if (!section) return;
    container.appendChild(buildNavRow(routeHref([id]), section.label, section.icon));

    // Real app: when a "Home" group tile is `section:X` and that section
    // declares .pages, each page renders as an indented child row directly
    // beneath it ("      └─── {label}"). Hidden pages are skipped: they stay
    // routable, they just are not advertised as children.
    section.pages?.forEach((page: PageEntry) => {
      if (typeof page === 'object' && page.hidden) return;
      const label = typeof page === 'string' ? page : page.label;
      const pageId = typeof page === 'string' ? slugify(page) : page.id;
      const href = typeof page === 'object' && page.target
        ? resolveTarget(page.target).href
        : routeHref([id, pageId]);
      container.appendChild(buildNavRow(href, label, undefined, true));
    });
  });

  appendGroup(container, 'Cloud', cloudRowItems(data));
  appendGroup(container, 'Labs', labsRowItems(data));
  appendGroup(container, 'Configs', configRowItems(data));
  linktreeRowGroups().forEach(([title, items]) => appendGroup(container, title, items));
}

// Open/close mechanics. Note: the Sirius star no longer opens the drawer —
// it now drives its own radial menu (see stars.ts) — so it is not wired here.
function wireOpenClose(): void {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const drawerEl = document.getElementById('drawer');
  const scrimEl = document.getElementById('drawer-scrim');
  if (!hamburgerBtn || !drawerEl || !scrimEl) return;

  const open = (): void => {
    drawerEl.classList.add('is-open');
    scrimEl.classList.add('is-open');
    drawerEl.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  };

  const close = (): void => {
    drawerEl.classList.remove('is-open');
    scrimEl.classList.remove('is-open');
    drawerEl.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  };

  hamburgerBtn.addEventListener('click', open);
  scrimEl.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

export function initDrawer(data: PortalData): void {
  const navEl = document.getElementById('drawer-nav');

  fillBanner(data);
  if (navEl) fillDrawerList(navEl, data);

  wireOpenClose();
  initLongPressMenu();
}
