// src/app/launcher/fan-menu.ts — bottom-nav long-press fan menus.
//
// Replicates the real Android app's PopupWindow that appears when you hold
// a bottom-nav icon: press-and-hold for 380ms opens a small fan of
// shortcuts anchored above the icon, keyed by that item's data-longpress
// attribute. The fan is that section's own VISIBLE pages (sections-core.json
// / sections-content.json) — the single place those children are declared —
// falling back to an explicit shell.json longPress list for ids like `home`
// that are not a section at all. A quick tap must keep navigating
// exactly as it did before this module existed — this only ADDS the
// long-press branch on top of the existing <a href>, it never owns or
// replaces that navigation: pointerdown never calls preventDefault, and
// only the click that follows an *actually-fired* long-press is cancelled.
import type { LongPressItem, PortalData } from '../../lib/core/types';
import { resolveTarget } from '../../lib/core/nav';

const LONG_PRESS_MS = 380;
const MOVE_THRESHOLD_PX = 10;
const MENU_OFFSET_PX = 70; // vertical gap between the icon and the fan menu

// The shared script.js runs unmodified on every page regardless of nesting
// depth, so — like drawer.ts's own iconSrc — icons here always use this
// absolute, root-anchored path rather than a build-time-relative one.
function iconSrc(icon: string): string {
  return `/cloud-superapp/public/icons/${icon}.svg`;
}

function buildItemButton(item: LongPressItem, index: number): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'fan-menu__item';
  button.dataset.index = String(index);

  const iconWrap = document.createElement('span');
  iconWrap.className = 'fan-menu__item-icon';
  const iconEl = document.createElement('img');
  iconEl.src = iconSrc(item.icon);
  iconEl.alt = '';
  iconWrap.appendChild(iconEl);

  const labelEl = document.createElement('span');
  labelEl.className = 'fan-menu__item-label';
  labelEl.textContent = item.label;

  button.appendChild(iconWrap);
  button.appendChild(labelEl);
  return button;
}

// HomeFanMenu.kt lays items out as a triangle, not a flat row: one item
// centered above a row of up to 3 items below. Appends that shape straight
// onto rootEl — a lone bottom row for <=3 items (no top item to balance),
// top+bottom split for 4.
function appendFanMenuLayout(rootEl: HTMLElement, items: LongPressItem[]): void {
  if (items.length <= 3) {
    const rowEl = document.createElement('div');
    rowEl.className = 'fan-menu__row fan-menu__row--bottom';
    items.forEach((item, index) => rowEl.appendChild(buildItemButton(item, index)));
    rootEl.appendChild(rowEl);
    return;
  }

  const topRowEl = document.createElement('div');
  topRowEl.className = 'fan-menu__row fan-menu__row--top';
  topRowEl.appendChild(buildItemButton(items[0], 0));

  const bottomRowEl = document.createElement('div');
  bottomRowEl.className = 'fan-menu__row fan-menu__row--bottom';
  items.slice(1).forEach((item, index) => bottomRowEl.appendChild(buildItemButton(item, index + 1)));

  rootEl.appendChild(topRowEl);
  rootEl.appendChild(bottomRowEl);
}

export function initFanMenu(data: PortalData): void {
  const bottomNavEl = document.getElementById('bottom-nav');
  const fanMenuRoot = document.getElementById('fan-menu');
  if (!bottomNavEl || !fanMenuRoot) return;
  // Non-nullable alias so every closure below sees HTMLElement directly,
  // without re-checking — matches stars.ts's menuEl hoist.
  const fanMenuEl: HTMLElement = fanMenuRoot;
  // .fan-menu is positioned absolute within .shell now (see _fan-menu.scss),
  // but getBoundingClientRect() below always returns viewport-relative
  // coordinates — same shell-offset correction as stars.ts's radial menu,
  // needed so the popup anchors above the actual icon instead of drifting
  // toward the browser's true left edge on desktop.
  const shellEl = fanMenuEl.closest<HTMLElement>('.shell');

  // Optional: not every page ships this yet (see the HTML contract).
  // Dismissal works either way via the document-level click/Escape
  // listeners below, so this is only ever used opportunistically.
  const scrimEl = document.getElementById('fan-menu-scrim');

  // Overlay state — only one fan menu (and one #fan-menu) exists at a time.
  let menuOpen = false;
  let currentItems: LongPressItem[] = [];

  // Long-press-timer state for the pointer currently pressing a nav item.
  let pressTimer: number | null = null;
  let longPressFired = false;
  let activeItem: HTMLElement | null = null;
  let activeId: string | null = null;
  let activePointerId: number | null = null;
  let startX = 0;
  let startY = 0;

  function clearPressTimer(): void {
    if (pressTimer === null) return;
    window.clearTimeout(pressTimer);
    pressTimer = null;
  }

  function closeFanMenu(): void {
    menuOpen = false;
    currentItems = [];
    fanMenuEl.classList.remove('is-open');
    fanMenuEl.setAttribute('aria-hidden', 'true');
    fanMenuEl.hidden = true;
    fanMenuEl.innerHTML = '';
    fanMenuEl.style.transform = '';
    if (scrimEl) {
      scrimEl.classList.remove('is-open');
      scrimEl.hidden = true;
    }
  }

  // A bottom-nav id's fan: its section's visible pages, or the explicit
  // shell.json list when the id is not a section (only `home` today).
  function fanItems(id: string): LongPressItem[] {
    const pages = data.sections[id]?.pages;
    if (pages) {
      return pages.flatMap((page) => {
        if (typeof page === 'string' || page.hidden) return [];
        return [{
          id: page.id,
          label: page.label,
          icon: page.icon ?? data.sections[id].icon,
          target: page.target ?? `page:${id}/${page.id}`,
        }];
      });
    }
    return data.longPress[id] ?? [];
  }

  function openFanMenu(itemEl: HTMLElement, id: string): void {
    const items = fanItems(id);
    if (items.length === 0) return;

    closeFanMenu();
    currentItems = items;

    fanMenuEl.innerHTML = '';
    appendFanMenuLayout(fanMenuEl, items);

    // Centered above the icon: fixed left at the icon's horizontal center,
    // shifted back by half its own width via transform.
    const rect = itemEl.getBoundingClientRect();
    const shellRect = shellEl?.getBoundingClientRect();
    fanMenuEl.style.left = `${rect.left + rect.width / 2 - (shellRect?.left ?? 0)}px`;
    fanMenuEl.style.top = `${rect.top - MENU_OFFSET_PX - (shellRect?.top ?? 0)}px`;
    fanMenuEl.style.transform = 'translateX(-50%)';

    fanMenuEl.hidden = false;
    fanMenuEl.classList.add('is-open');
    fanMenuEl.setAttribute('aria-hidden', 'false');
    if (scrimEl) {
      scrimEl.hidden = false;
      scrimEl.classList.add('is-open');
    }
    menuOpen = true;
  }

  function handleSelect(button: HTMLButtonElement): void {
    const index = Number(button.dataset.index);
    const item = currentItems[index];
    closeFanMenu();
    if (!item) return;

    // Real target is action:check_updates (HomeFanMenu.kt) — it calls
    // Updater.checkNow(), which drives an OBSERVED UpdateProgress state
    // machine (MainActivity.kt's handleUpdateState): the overlay only
    // actually appears once that state leaves Idle (an update is really
    // in progress), otherwise checkNow() just toasts "up to date" and
    // nothing else shows. openUpdateOverlay() here is standing in for
    // that whole observed flow, not a direct "always open" trigger, but
    // the target string itself needs to match the real one. The Update
    // overlay lives in a sibling module built in parallel — a dynamic
    // import means this file never hard-depends on load order.
    if (item.target === 'action:check_updates') {
      import('../overlays/overlays').then((mod) => mod.openUpdateOverlay());
      return;
    }

    const { href } = resolveTarget(item.target);
    if (href) location.href = href;
  }

  function onPointerDown(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const itemEl = target.closest<HTMLElement>('.bottom-nav__item');
    if (!itemEl) return;
    const id = itemEl.dataset.longpress;
    if (!id || fanItems(id).length === 0) return;

    // Never preventDefault here — a plain quick tap must still navigate via
    // the real <a href> exactly as before.
    clearPressTimer();
    activeItem = itemEl;
    activeId = id;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    longPressFired = false;

    pressTimer = window.setTimeout(() => {
      pressTimer = null;
      longPressFired = true;
      if (activeItem && activeId) openFanMenu(activeItem, activeId);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(event: PointerEvent): void {
    if (pressTimer === null || event.pointerId !== activePointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.hypot(dx, dy) > MOVE_THRESHOLD_PX) clearPressTimer();
  }

  function onPointerEnd(event: PointerEvent): void {
    if (event.pointerId !== activePointerId) return;
    clearPressTimer(); // no-op if the long-press already fired
    activePointerId = null;
  }

  // Only cancels navigation for the specific click that follows an
  // already-fired long-press; every other click on a nav item is untouched
  // and proceeds to its real href exactly as before.
  function onBottomNavClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('.bottom-nav__item')) return;
    if (!longPressFired) return;
    longPressFired = false;
    event.preventDefault();
    // Keep this click from also reaching the outside-tap dismiss listener
    // below — otherwise the menu we just opened would close immediately.
    event.stopPropagation();
  }

  function onDocumentClick(event: MouseEvent): void {
    if (!menuOpen) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const itemBtn = target.closest<HTMLButtonElement>('.fan-menu__item');
    if (itemBtn) {
      handleSelect(itemBtn);
      return;
    }
    // Anywhere else — including the scrim, when present — dismisses.
    closeFanMenu();
  }

  function onDocumentKeydown(event: KeyboardEvent): void {
    if (menuOpen && event.key === 'Escape') closeFanMenu();
  }

  bottomNavEl.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerEnd);
  document.addEventListener('pointercancel', onPointerEnd);
  bottomNavEl.addEventListener('click', onBottomNavClick);
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
}
