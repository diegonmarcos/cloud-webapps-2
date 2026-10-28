// src/lib/onehand/edge-menu.ts — the one-hand "Sirius" edge-handle swipe
// menus (left + right vertical grab bars, 5 sectors each, swipe inward to
// fan open a small arc menu). Entirely self-mounting: unlike stars.ts's
// #radial-menu (baked into every generated page), no build-time HTML exists
// for this yet, so this module builds its own DOM and appends it to .shell
// on init instead of looking up pre-rendered elements.
import type { PortalData } from '../core/types';
import { getOnehandConfig, type OnehandHandle, type OnehandSector, type OnehandSectorKey } from './config';

const SECTOR_KEYS: OnehandSectorKey[] = ['top', 'top_middle', 'center', 'down_middle', 'down'];
const SWIPE_THRESHOLD_PX = 24;
const ARC_RADIUS_PX = 130;
const ARC_SPREAD_DEG = 45;
const DEAD_ZONE_PX = 20;
// Dual-mode gesture split (matches stars.ts / the real Android app): a quick
// tap on the edge handle — releases within TAP_MAX_MS of pointerdown and
// never travels past TAP_MAX_MOVE_PX — opens that sector's arc PERSISTENTLY
// instead of requiring the inward swipe. The existing inward-swipe-past-
// SWIPE_THRESHOLD_PX drag-to-open-and-select gesture is untouched.
//
// Touch-sized, same as stars.ts: a finger tap takes longer to release and
// jitters further than a mouse click, so 300ms/10px rejected ordinary thumb
// taps on the handle and the arc never opened at all.
const TAP_MAX_MS = 450;
const TAP_MAX_MOVE_PX = 16;
// After a tap's pointerup, the browser still dispatches the tap's synthetic
// `click` — hit-tested against the DOM as it exists AFTER our pointerup
// handler ran. By then openArc() has inserted the full-bleed
// .edge-menu__scrim over the handle, so that click lands on the scrim and the
// delegated close-on-scrim handler below would shut the arc again instantly
// (the arc appears never to open at all). Swallow exactly one click if it
// arrives inside this window after entering persistent mode. Touch-sized
// (see stars.ts): a phone's synthetic click trails its touchend far more than
// a mouse's does, and 400ms was tight enough that the ghost click sometimes
// escaped the window and closed the arc on the scrim.
const GHOST_CLICK_MS = 700;
const FLASH_MS = 220;
const ARROW_HEAD_LENGTH_PX = 10;
const ARROW_HEAD_ANGLE_RAD = Math.PI / 7;
const SVG_NS = 'http://www.w3.org/2000/svg';

interface ArcItem {
  key: OnehandSectorKey;
  label: string;
  action?: 'back';
}

function toArcItem(key: OnehandSectorKey, sector: OnehandSector): ArcItem {
  return { key, label: sector.label, action: sector.action };
}

// Center sector opens with its own two vertical neighbors (3-item arc);
// the two end sectors (top/down) only have one neighbor each, so those
// open a 2-item arc instead of reusing a neighbor twice.
function arcItemsFor(sectors: Partial<Record<OnehandSectorKey, OnehandSector>>, key: OnehandSectorKey): ArcItem[] {
  const self = sectors[key];
  if (!self) return [];
  const idx = SECTOR_KEYS.indexOf(key);
  const prevKey = SECTOR_KEYS[idx - 1];
  const nextKey = SECTOR_KEYS[idx + 1];
  const prev = prevKey ? sectors[prevKey] : undefined;
  const next = nextKey ? sectors[nextKey] : undefined;
  const items: ArcItem[] = [];
  if (prev && prevKey) items.push(toArcItem(prevKey, prev));
  items.push(toArcItem(key, self));
  if (next && nextKey) items.push(toArcItem(nextKey, next));
  return items;
}

function offsetsFor(count: number): number[] {
  if (count === 3) return [-ARC_SPREAD_DEG, 0, ARC_SPREAD_DEG];
  if (count === 2) return [-ARC_SPREAD_DEG, ARC_SPREAD_DEG];
  return [0];
}

// Capture keeps an inward swipe bound to the 32px-wide sector it started on
// — the gesture leaves that box almost immediately by definition, and without
// capture the browser retargets pointermove/pointerup at whatever is beneath
// the finger, so the swipe dies one frame after it starts. Guarded because
// setPointerCapture throws NotFoundError when the pointer is already gone,
// and an unguarded throw aborts the rest of the pointerdown handler.
function capturePointer(el: HTMLElement, pointerId: number): void {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    // Pointer already released; implicit capture still covers the gesture.
  }
}

function releasePointer(el: HTMLElement, pointerId: number): void {
  try {
    if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
  } catch {
    // Nothing to release.
  }
}

function polar(angle: number, radius: number): { tx: number; ty: number } {
  return { tx: Math.cos(angle) * radius, ty: Math.sin(angle) * radius };
}

function angularDistance(a: number, b: number): number {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function nearestIndexByAngle(angle: number, angles: number[]): number {
  let bestIndex = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < angles.length; i++) {
    const delta = angularDistance(angle, angles[i]);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function initEdgeMenu(data: PortalData): void {
  const config = getOnehandConfig(data);
  if (!config) return;
  const shellRoot = document.querySelector<HTMLElement>('.shell');
  if (!shellRoot) return;
  // Non-nullable alias so every closure below (shellOffset() in particular)
  // sees HTMLElement directly — narrowing from the guard above doesn't
  // cross into nested function declarations (same pattern as stars.ts's
  // own menuEl hoist).
  const shellEl: HTMLElement = shellRoot;

  const handlesRoot = document.createElement('div');
  handlesRoot.className = 'edge-menu-handles';
  shellEl.appendChild(handlesRoot);

  const menuEl = document.createElement('div');
  menuEl.className = 'edge-menu';
  menuEl.hidden = true;
  menuEl.setAttribute('aria-hidden', 'true');
  shellEl.appendChild(menuEl);

  let isOpen = false;
  // Persistent mode: entered by a quick tap on the edge handle (see
  // TAP_MAX_MS/TAP_MAX_MOVE_PX above) instead of an inward swipe-drag. The
  // arc stays open after release; hovering highlights a node (reusing the
  // same .is-highlighted class the swipe-drag path already toggles via
  // setHighlight()) and a click/tap on a node activates it through the same
  // commitIndex() path the swipe-release commit already uses.
  let persistent = false;
  // Timestamp before which one incoming click is a tap's ghost click (see
  // GHOST_CLICK_MS) and must be ignored rather than treated as a real
  // scrim/node activation.
  let suppressClickUntil = 0;
  let originX = 0;
  let originY = 0;
  let currentItems: ArcItem[] = [];
  let currentAngles: number[] = [];
  let nodeEls: HTMLDivElement[] = [];
  let highlightIndex = -1;
  let arrowLineEl: SVGLineElement | null = null;
  let arrowHeadEl: SVGPolygonElement | null = null;

  function shellOffset(): { x: number; y: number } {
    const rect = shellEl.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  function setHighlight(index: number): void {
    if (index === highlightIndex) return;
    const prev = nodeEls[highlightIndex];
    if (prev) prev.classList.remove('is-highlighted');
    highlightIndex = index;
    const next = nodeEls[highlightIndex];
    if (next) next.classList.add('is-highlighted');
  }

  function enterPersistentMode(): void {
    persistent = true;
    suppressClickUntil = Date.now() + GHOST_CLICK_MS;
  }

  function closeMenu(): void {
    isOpen = false;
    persistent = false;
    suppressClickUntil = 0;
    currentItems = [];
    currentAngles = [];
    nodeEls = [];
    highlightIndex = -1;
    arrowLineEl = null;
    arrowHeadEl = null;
    menuEl.classList.remove('is-open');
    menuEl.setAttribute('aria-hidden', 'true');
    menuEl.hidden = true;
    menuEl.innerHTML = '';
  }

  // No web destination for this sector — leave the pill highlighted for a
  // beat (same "flash" treatment stars.ts uses for its own inert leaves)
  // instead of vanishing instantly, then close without navigating.
  function flashThenClose(): void {
    window.setTimeout(() => closeMenu(), FLASH_MS);
  }

  function openArc(originEl: HTMLElement, items: ArcItem[], swipeAngle: number): void {
    currentItems = items;
    const offsets = offsetsFor(items.length);
    currentAngles = offsets.map((deg) => swipeAngle + (deg * Math.PI) / 180);
    nodeEls = [];
    arrowLineEl = null;
    arrowHeadEl = null;

    menuEl.innerHTML = '';

    const rect = originEl.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
    highlightIndex = 0;

    const scrim = document.createElement('div');
    scrim.className = 'edge-menu__scrim';
    menuEl.appendChild(scrim);

    const offset = shellOffset();
    const center = document.createElement('div');
    center.className = 'edge-menu__center';
    center.style.left = `${originX - offset.x}px`;
    center.style.top = `${originY - offset.y}px`;

    items.forEach((item, i) => {
      const { tx, ty } = polar(currentAngles[i] ?? 0, ARC_RADIUS_PX);
      const nodeEl = document.createElement('div');
      nodeEl.className = `edge-menu__node${i === highlightIndex ? ' is-highlighted' : ''}`;
      nodeEl.dataset.index = String(i);
      nodeEl.style.setProperty('--tx', `${tx}px`);
      nodeEl.style.setProperty('--ty', `${ty}px`);

      const labelEl = document.createElement('span');
      labelEl.className = 'edge-menu__node-label';
      labelEl.textContent = item.label;
      nodeEl.appendChild(labelEl);

      center.appendChild(nodeEl);
      nodeEls.push(nodeEl);
    });

    menuEl.appendChild(center);

    const arrowSvg = document.createElementNS(SVG_NS, 'svg');
    arrowSvg.setAttribute('class', 'edge-menu__arrow');
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 'edge-menu__arrow-line');
    const head = document.createElementNS(SVG_NS, 'polygon');
    head.setAttribute('class', 'edge-menu__arrow-head');
    arrowSvg.appendChild(line);
    arrowSvg.appendChild(head);
    menuEl.appendChild(arrowSvg);
    arrowLineEl = line;
    arrowHeadEl = head;

    menuEl.hidden = false;
    menuEl.classList.add('is-open');
    menuEl.setAttribute('aria-hidden', 'false');
    isOpen = true;
  }

  function updateArrow(clientX: number, clientY: number): void {
    if (!arrowLineEl || !arrowHeadEl) return;
    const offset = shellOffset();
    const x1 = originX - offset.x;
    const y1 = originY - offset.y;
    const x2 = clientX - offset.x;
    const y2 = clientY - offset.y;
    arrowLineEl.setAttribute('x1', String(x1));
    arrowLineEl.setAttribute('y1', String(y1));
    arrowLineEl.setAttribute('x2', String(x2));
    arrowLineEl.setAttribute('y2', String(y2));

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const hx1 = x2 - ARROW_HEAD_LENGTH_PX * Math.cos(angle - ARROW_HEAD_ANGLE_RAD);
    const hy1 = y2 - ARROW_HEAD_LENGTH_PX * Math.sin(angle - ARROW_HEAD_ANGLE_RAD);
    const hx2 = x2 - ARROW_HEAD_LENGTH_PX * Math.cos(angle + ARROW_HEAD_ANGLE_RAD);
    const hy2 = y2 - ARROW_HEAD_LENGTH_PX * Math.sin(angle + ARROW_HEAD_ANGLE_RAD);
    arrowHeadEl.setAttribute('points', `${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}`);
  }

  function updateHighlightFromPointer(clientX: number, clientY: number): void {
    const dx = clientX - originX;
    const dy = clientY - originY;
    if (Math.hypot(dx, dy) < DEAD_ZONE_PX) return;
    setHighlight(nearestIndexByAngle(Math.atan2(dy, dx), currentAngles));
  }

  function commitIndex(index: number): void {
    if (!isOpen) return;
    const item = currentItems[index];
    if (!item) {
      closeMenu();
      return;
    }
    if (item.action === 'back') {
      closeMenu();
      history.back();
      return;
    }
    flashThenClose();
  }

  function attachSector(sectorEl: HTMLElement, handle: OnehandHandle, key: OnehandSectorKey): void {
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let opened = false;

    sectorEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      closeMenu();
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
      opened = false;
      capturePointer(sectorEl, e.pointerId);
    });

    sectorEl.addEventListener('pointermove', (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      if (!opened) {
        const dx = e.clientX - startX;
        const inward = handle.edge === 'left' ? dx : -dx;
        if (inward < SWIPE_THRESHOLD_PX) return;
        const items = arcItemsFor(handle.sectors, key);
        if (items.length === 0) return;
        opened = true;
        const swipeAngle = Math.atan2(e.clientY - startY, e.clientX - startX);
        openArc(sectorEl, items, swipeAngle);
        updateArrow(e.clientX, e.clientY);
        return;
      }
      if (!isOpen) return;
      updateHighlightFromPointer(e.clientX, e.clientY);
      updateArrow(e.clientX, e.clientY);
    });

    sectorEl.addEventListener('pointerup', (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      releasePointer(sectorEl, pointerId);
      pointerId = null;
      if (!opened) {
        // Never crossed SWIPE_THRESHOLD_PX — this wasn't an inward-swipe
        // drag. A quick tap/click still opens the arc, just persistently
        // (see enterPersistentMode()) instead of via drag-release commit.
        // No real swipe direction exists yet, so the arc opens along the
        // handle's own inward axis (left handle -> pointing right into the
        // screen, right handle -> pointing left), matching what an actual
        // inward swipe from this edge would have produced.
        const elapsedMs = Date.now() - startTime;
        const totalMovePx = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (elapsedMs > TAP_MAX_MS || totalMovePx > TAP_MAX_MOVE_PX) return;
        const items = arcItemsFor(handle.sectors, key);
        if (items.length === 0) return;
        const inwardAngle = handle.edge === 'left' ? 0 : Math.PI;
        openArc(sectorEl, items, inwardAngle);
        enterPersistentMode();
        return;
      }
      if (!isOpen) return;
      if (Math.hypot(e.clientX - originX, e.clientY - originY) < DEAD_ZONE_PX) {
        closeMenu();
        return;
      }
      commitIndex(highlightIndex);
    });

    // Cancel means the gesture was taken away mid-swipe and pointerup will
    // never arrive. The edge handles are precisely where Android wants to run
    // its own back-navigation swipe, so this is the *likeliest* outcome of a
    // real edge drag, not an edge case.
    //
    // The old handler closed the arc outright, which is the one thing it must
    // not do: the user had already swiped far enough to open it, the arc had
    // been on screen, and it vanished the instant the system gesture won —
    // "the edge menu doesn't work". Treat cancel like a tap instead and hand
    // the already-open arc over to persistent mode (ghost click swallowed, so
    // the synthetic click can't immediately close it on the scrim).
    sectorEl.addEventListener('pointercancel', (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      releasePointer(sectorEl, pointerId);
      pointerId = null;
      if (opened && isOpen) enterPersistentMode();
    });
  }

  function buildHandle(handle: OnehandHandle): void {
    const handleEl = document.createElement('div');
    handleEl.className = `edge-menu__handle edge-menu__handle--${handle.edge}`;
    handlesRoot.appendChild(handleEl);
    SECTOR_KEYS.forEach((key) => {
      const sectorEl = document.createElement('div');
      sectorEl.className = 'edge-menu__sector';
      sectorEl.dataset.sector = key;
      handleEl.appendChild(sectorEl);
      if (handle.sectors[key]) attachSector(sectorEl, handle, key);
    });
  }

  config.handles.forEach((handle) => buildHandle(handle));

  // Persistent-mode hover highlight — same setHighlight()/.is-highlighted
  // path the swipe-drag gesture already drives via updateHighlightFromPointer(),
  // just triggered by plain pointer movement over a node instead of an
  // active drag. No-op while a swipe-drag is in progress (that path already
  // owns highlighting via its own pointermove listener on the sector).
  menuEl.addEventListener('pointermove', (e) => {
    if (!isOpen || !persistent) return;
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const nodeEl = target.closest<HTMLElement>('.edge-menu__node');
    if (!nodeEl) return;
    const index = Number(nodeEl.dataset.index);
    if (!Number.isNaN(index)) setHighlight(index);
  });

  menuEl.addEventListener('click', (e) => {
    if (!isOpen) return;
    if (Date.now() < suppressClickUntil) {
      suppressClickUntil = 0;
      return;
    }
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.edge-menu__scrim')) {
      closeMenu();
      return;
    }
    const nodeEl = target.closest<HTMLElement>('.edge-menu__node');
    if (!nodeEl) return;
    const index = Number(nodeEl.dataset.index);
    if (!Number.isNaN(index)) commitIndex(index);
  });

  document.addEventListener('keydown', (e) => {
    if (isOpen && e.key === 'Escape') closeMenu();
  });
}
