// Radial press-menus for the 3 decorative stars (#star-sirius/-canopus/-centauri).
//
// Replicates the real Android app's press-and-drag radial widgets:
//   - Sirius  -> CircularMenu: recursive drill-down (data.stars.sirius.nodes).
//   - Canopus -> ArcMenu: single-level fan built from a fixed section's .pages.
//   - Centauri -> ArcMenu: single-level fan of inert "recent app" labels.
//
// All three share one overlay (#radial-menu, see the DOM contract below) and
// one small interaction state machine. Pragmatic, not pixel-exact physics:
// Pointer Events alone (not a separate touch-event set) cover mouse/touch/pen
// uniformly in every supported browser, so a plain tap and a press-drag both
// funnel through the same pointerdown/pointermove/pointerup handlers.
import type { PageEntry, PortalData, RadialNode } from '../core/types';
import { resolveTarget, routeHref } from '../core/nav';
import { getData } from '../core/data';

type StarKind = 'sirius' | 'canopus' | 'centauri';

// Registered by app/main.ts (which may import app/overlays/overlays; this
// lib/ module never can) — see the action:check_updates branch in
// commitIndex() below.
let onCheckUpdatesHandler: (() => void) | null = null;

export function setOnCheckUpdates(handler: () => void): void {
  onCheckUpdatesHandler = handler;
}

interface RadialItem {
  id: string;
  label: string;
  href: string | null;
  inert: boolean;
  node?: RadialNode;
  icon?: string;
}

// Centauri's recentApps (../core/types.ts's StarsConfig, a shared type this
// module isn't allowed to extend) stays a plain string[] — it's also read
// directly by scripts/generate-pages.mjs's avatarTileHtml() for the Recent
// Apps grid page, which expects a bare string name, so widening it to
// {name,icon} objects here would break that unrelated build step. Icons for
// known recent-app labels are looked up locally instead.
const RECENT_APP_ICONS: Record<string, string> = {
  Mail: 'mail',
  Brave: 'browser',
  Mattermost: 'chat',
  Obsidian: 'brain',
  Calendar: 'calendar',
  Vault: 'lock',
  Claude: 'sparkles',
  Settings: 'settings',
};

// Sirius (circular drill-down): base ring radius, plus each nested
// child-level ring growing outward by SIRIUS_SUBLEVEL_STEP_PX.
const SIRIUS_RADIUS_PX = 130;
const SIRIUS_SUBLEVEL_STEP_PX = 120;
// Canopus/Centauri (half-arc fan): single fixed ring radius.
const ARC_RADIUS_PX = 200;
const DEAD_ZONE_PX = 28;
const MOVE_THRESHOLD_PX = 6;
// Dual-mode gesture split (matches the real Android app): a quick tap that
// releases within TAP_MAX_MS of pointerdown AND never travels past
// TAP_MAX_MOVE_PX from the press point opens the menu PERSISTENTLY (stays
// on screen, hover-to-highlight, click-to-activate) instead of evaluating a
// drag-release commit. Anything slower/farther is a real press-drag and
// keeps the existing behavior untouched.
//
// Sized for touch, not mouse: a real finger tap routinely takes longer than
// the 300ms a mouse click does (the pointerup can land behind compositor /
// gesture-disambiguation work) and jitters much further than a mouse does
// over the same "stationary" press. At 300ms/10px an ordinary thumb tap fell
// out of the tap window and was scored as a press-drag, so it committed
// whatever node happened to be highlighted instead of opening persistently.
const TAP_MAX_MS = 450;
const TAP_MAX_MOVE_PX = 16;
// After a tap's pointerup, the browser still dispatches the tap's synthetic
// `click` — hit-tested against the DOM as it exists AFTER our pointerup
// handler ran. By then renderItems() has inserted the full-bleed
// .radial-menu__scrim over the star, so that click lands on the scrim and the
// delegated close-on-scrim handler below would shut the menu again instantly
// (the menu appears never to open at all). Swallow exactly one click if it
// arrives inside this window after entering persistent mode. Touch-sized:
// a phone's synthetic click trails its touchend far more than a mouse's
// does (legacy click-delay, gesture disambiguation), and 400ms was close
// enough to that delay that the ghost click sometimes escaped the window and
// closed the menu on the scrim — the exact "the menu never opened" symptom.
const GHOST_CLICK_MS = 700;
const FLASH_MS = 220;
const TWO_PI = Math.PI * 2;
// Follow-finger arrow (Sirius only) — arrowhead geometry.
const ARROW_HEAD_LENGTH_PX = 10;
const ARROW_HEAD_ANGLE_RAD = Math.PI / 7;
const SVG_NS = 'http://www.w3.org/2000/svg';

// Pointer capture is what keeps a touch drag bound to the star it started
// on: without it, once the finger leaves the star's own (tiny) box the
// browser retargets pointermove/pointerup at whatever is underneath and the
// gesture silently dies. It has to be guarded though — setPointerCapture
// throws NotFoundError if the pointer is already gone by the time the
// handler runs, which on touch happens far more readily than with a mouse,
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

// Sirius: full circle, n items 360°/n apart, starting straight up.
// Canopus/Centauri: half-moon arc from 180° to 360° (i.e. centered on "up"),
// so the fan opens away from the bottom-nav rather than into it.
function computeAngles(count: number, kind: StarKind): number[] {
  if (count <= 0) return [];
  if (kind === 'sirius') {
    const start = -Math.PI / 2;
    return Array.from({ length: count }, (_, i) => start + (i * TWO_PI) / count);
  }
  if (count === 1) return [Math.PI + Math.PI / 2];
  const step = Math.PI / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.PI + i * step);
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

function siriusItems(nodes: RadialNode[]): RadialItem[] {
  return nodes.map((n): RadialItem => {
    if (n.children && n.children.length > 0) {
      return { id: n.id, label: n.label, href: null, inert: false, node: n };
    }
    const href = resolveTarget(n.target).href;
    // node is kept for leaf items too (not just parents) so commitIndex()
    // below can still see the raw target string — needed to recognize the
    // action:check_updates special target, which resolveTarget() deliberately
    // maps to a null href (see nav.ts).
    return { id: n.id, label: n.label, href, inert: href === null, node: n };
  });
}

function pageEntryItem(entry: PageEntry, sectionId: string): RadialItem {
  if (typeof entry === 'string') {
    return { id: entry, label: entry, href: routeHref([sectionId, entry]), inert: false };
  }
  const href = entry.target ? resolveTarget(entry.target).href : routeHref([sectionId, entry.id]);
  return { id: entry.id, label: entry.label, href, inert: href === null };
}

function canopusItems(): RadialItem[] {
  const live = getData();
  const sectionId = live.stars.canopus.fixedSection;
  const pages = live.sections[sectionId]?.pages ?? [];
  return pages.map((entry) => pageEntryItem(entry, sectionId));
}

function centauriItems(recentApps: string[]): RadialItem[] {
  return recentApps.map((label, i): RadialItem => ({ id: `recent-${i}`, label, href: null, inert: true, icon: RECENT_APP_ICONS[label] }));
}

// Same absolute, root-anchored icon path drawer.ts/fan-menu.ts use — the
// shared script.js runs unmodified at every route nesting depth, so a
// build-time-relative path would 404 on any non-root page.
function iconSrc(icon: string): string {
  return `/cloud-superapp/public/icons/${icon}.svg`;
}

export function initStars(data: PortalData): void {
  // Stars are decorative "home screen" widgets only — the real Android app
  // never shows them outside Home. The build-time HTML currently bakes
  // #star-sirius/-canopus/-centauri and #radial-menu into every generated
  // page (see generate-pages.mjs's renderShell()), so detection has to
  // happen here at runtime. Same marker home-swipes.ts already uses: the
  // decorative .home-cube element, server-rendered only into home.html.
  if (!document.querySelector('.home-cube')) return;

  const menuRoot = document.getElementById('radial-menu');
  if (!menuRoot) return;
  // Rebind to a non-nullable const: narrowing from the guard above doesn't
  // cross into the nested function declarations below, but a genuinely
  // non-nullable declared type does, so every closure sees HTMLElement
  // directly with no re-checking needed (matches drawer.ts's guard style,
  // just hoisted once instead of repeated in every helper).
  const menuEl: HTMLElement = menuRoot;
  // #radial-menu is positioned absolute within .shell (see _radial-menu.scss
  // — .shell is "the screen", a centered 480px mockup on desktop rather than
  // the true browser viewport), but getBoundingClientRect() always returns
  // viewport-relative coordinates regardless of an element's own position
  // scheme. shellOffset() converts a viewport point into .shell's own
  // coordinate space so the visual dot lines up with the star that opened
  // it instead of drifting toward the browser's true left edge on desktop.
  const shellEl = menuEl.closest<HTMLElement>('.shell');

  const starEls: Array<{ el: HTMLElement; kind: StarKind }> = [];
  const siriusEl = document.getElementById('star-sirius');
  const canopusEl = document.getElementById('star-canopus');
  const centauriEl = document.getElementById('star-centauri');
  if (siriusEl) starEls.push({ el: siriusEl, kind: 'sirius' });
  if (canopusEl) starEls.push({ el: canopusEl, kind: 'canopus' });
  if (centauriEl) starEls.push({ el: centauriEl, kind: 'centauri' });
  if (starEls.length === 0) return;

  // Shared overlay state — only one menu (and one #radial-menu) exists at a
  // time, so this lives at initStars scope and every star funnels into it.
  let isOpen = false;
  // Persistent mode: entered by a quick tap (see TAP_MAX_MS/TAP_MAX_MOVE_PX
  // above) instead of a press-drag. The menu stays open after release;
  // hovering highlights a node (reusing the same .is-highlighted class the
  // drag path already toggles via setHighlight()) and a click/tap on a node
  // activates it through the same commitIndex()/goBack() paths the
  // drag-release commit already uses.
  let persistent = false;
  // Timestamp before which one incoming click is a tap's ghost click (see
  // GHOST_CLICK_MS) and must be ignored rather than treated as a real
  // scrim/node activation.
  let suppressClickUntil = 0;
  let originX = 0;
  let originY = 0;
  let currentItems: RadialItem[] = [];
  let currentAngles: number[] = [];
  let nodeEls: HTMLDivElement[] = [];
  let highlightIndex = -1;
  let siriusStack: RadialNode[][] = [];
  let arrowLineEl: SVGLineElement | null = null;
  let arrowHeadEl: SVGPolygonElement | null = null;

  function setHighlight(index: number): void {
    if (index === highlightIndex) return;
    const prev = nodeEls[highlightIndex];
    if (prev) prev.classList.remove('is-highlighted');
    highlightIndex = index;
    const next = nodeEls[highlightIndex];
    if (next) next.classList.add('is-highlighted');
  }

  function buildNodeClass(item: RadialItem, kindClass: string, highlighted: boolean): string {
    let cls = `radial-menu__node radial-menu__node--${kindClass}`;
    if (highlighted) cls += ' is-highlighted';
    if (item.inert) cls += ' radial-menu__node--inert';
    return cls;
  }

  // Sirius rings grow outward one SIRIUS_SUBLEVEL_STEP_PX per nested level
  // (so a drilled-in child fan reads as "further out" than its parent);
  // Canopus/Centauri are always a single flat arc.
  function ringRadius(depth: number, kind: StarKind): number {
    if (kind === 'sirius') return SIRIUS_RADIUS_PX + SIRIUS_SUBLEVEL_STEP_PX * depth;
    return ARC_RADIUS_PX;
  }

  function renderItems(items: RadialItem[], depth: number, kind: StarKind): void {
    currentItems = items;
    currentAngles = computeAngles(items.length, kind);
    nodeEls = [];
    arrowLineEl = null;
    arrowHeadEl = null;

    menuEl.innerHTML = '';

    const kindClass = kind === 'sirius' ? 'circle' : 'arc';
    const radius = ringRadius(depth, kind);

    const scrim = document.createElement('div');
    scrim.className = `radial-menu__scrim radial-menu__scrim--${kindClass}`;
    menuEl.appendChild(scrim);

    const center = document.createElement('div');
    center.className = 'radial-menu__center';
    const shellRect = shellEl?.getBoundingClientRect();
    center.style.left = `${originX - (shellRect?.left ?? 0)}px`;
    center.style.top = `${originY - (shellRect?.top ?? 0)}px`;

    if (depth > 0) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'radial-menu__back';
      back.textContent = '‹ Back';
      center.appendChild(back);
    }

    items.forEach((item, i) => {
      const { tx, ty } = polar(currentAngles[i] ?? 0, radius);
      const nodeEl = document.createElement('div');
      nodeEl.className = buildNodeClass(item, kindClass, i === highlightIndex);
      nodeEl.dataset.id = item.id;
      nodeEl.dataset.index = String(i);
      nodeEl.style.setProperty('--tx', `${tx}px`);
      nodeEl.style.setProperty('--ty', `${ty}px`);

      if (item.icon) {
        const iconEl = document.createElement('img');
        iconEl.className = 'radial-menu__node-icon';
        iconEl.src = iconSrc(item.icon);
        iconEl.alt = '';
        nodeEl.appendChild(iconEl);
      }

      const labelEl = document.createElement('span');
      labelEl.className = 'radial-menu__node-label';
      labelEl.textContent = item.label;
      nodeEl.appendChild(labelEl);

      center.appendChild(nodeEl);
      nodeEls.push(nodeEl);
    });

    menuEl.appendChild(center);

    // Follow-finger arrow — Sirius (circular drill-down) only.
    if (kind === 'sirius') {
      const arrowSvg = document.createElementNS(SVG_NS, 'svg');
      arrowSvg.setAttribute('class', 'radial-menu__arrow');
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'radial-menu__arrow-line');
      const head = document.createElementNS(SVG_NS, 'polygon');
      head.setAttribute('class', 'radial-menu__arrow-head');
      arrowSvg.appendChild(line);
      arrowSvg.appendChild(head);
      menuEl.appendChild(arrowSvg);
      arrowLineEl = line;
      arrowHeadEl = head;
    }

    menuEl.hidden = false;
    menuEl.classList.add('is-open');
    menuEl.setAttribute('aria-hidden', 'false');
    isOpen = true;
  }

  // Draws the follow-finger arrow from the star's origin to the current
  // pointer position, in .shell's own coordinate space (same conversion as
  // the --tx/--ty node placement and .radial-menu__center above). No-op
  // unless the currently open menu is Sirius's circular drill-down.
  function updateArrow(clientX: number, clientY: number): void {
    if (!arrowLineEl || !arrowHeadEl) return;
    const shellRect = shellEl?.getBoundingClientRect();
    const offsetX = shellRect?.left ?? 0;
    const offsetY = shellRect?.top ?? 0;
    const x1 = originX - offsetX;
    const y1 = originY - offsetY;
    const x2 = clientX - offsetX;
    const y2 = clientY - offsetY;
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

  function renderSiriusLevel(): void {
    const level = siriusStack[siriusStack.length - 1] ?? [];
    renderItems(siriusItems(level), siriusStack.length - 1, 'sirius');
  }

  function enterPersistentMode(): void {
    persistent = true;
    suppressClickUntil = Date.now() + GHOST_CLICK_MS;
  }

  function closeMenu(): void {
    isOpen = false;
    persistent = false;
    suppressClickUntil = 0;
    siriusStack = [];
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

  // No destination: leave the pill highlighted for a beat (its existing
  // .is-highlighted scale/color treatment reads as a "flash") instead of
  // vanishing instantly, then close without navigating.
  function flashThenClose(): void {
    window.setTimeout(() => closeMenu(), FLASH_MS);
  }

  function drillInto(children: RadialNode[]): void {
    siriusStack.push(children);
    highlightIndex = 0;
    renderSiriusLevel();
  }

  function goBack(): void {
    if (siriusStack.length <= 1) {
      closeMenu();
      return;
    }
    siriusStack.pop();
    highlightIndex = 0;
    renderSiriusLevel();
  }

  function commitIndex(index: number): void {
    if (!isOpen) return;
    const item = currentItems[index];
    if (!item) {
      closeMenu();
      return;
    }
    if (item.node?.children && item.node.children.length > 0) {
      drillInto(item.node.children);
      return;
    }
    // Any sirius leaf can carry the same action:check_updates target the
    // long-press fan menu handles (see fan-menu.ts's handleSelect) —
    // resolveTarget() has no web href for it, so it must be special-cased
    // here too, ahead of the plain href branch below. Dispatched through
    // onCheckUpdatesHandler (see setOnCheckUpdates()) rather than a direct
    // import of the app-chrome overlays module — lib/ is forbidden from
    // importing app/ (see src/README.md); main.ts registers the real
    // overlay-opening handler since it already legitimately imports both.
    const actionTarget = item.node?.target;
    if (actionTarget === 'action:check_updates') {
      closeMenu();
      onCheckUpdatesHandler?.();
      return;
    }
    if (item.href) {
      const href = item.href;
      closeMenu();
      location.href = href;
      return;
    }
    flashThenClose();
  }

  function openFor(kind: StarKind, starEl: HTMLElement): void {
    closeMenu();
    const rect = starEl.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
    highlightIndex = 0;

    if (kind === 'sirius') {
      siriusStack = [data.stars.sirius.nodes];
      renderSiriusLevel();
    } else if (kind === 'canopus') {
      renderItems(canopusItems(), 0, 'canopus');
    } else {
      renderItems(centauriItems(data.stars.centauri.recentApps), 0, 'centauri');
    }
  }

  function updateHighlightFromPointer(clientX: number, clientY: number): void {
    const dx = clientX - originX;
    const dy = clientY - originY;
    if (Math.hypot(dx, dy) < DEAD_ZONE_PX) return;
    setHighlight(nearestIndexByAngle(Math.atan2(dy, dx), currentAngles));
  }

  function attachStar(starEl: HTMLElement, kind: StarKind): void {
    let pointerId: number | null = null;
    let moved = false;
    let downTime = 0;
    let downX = 0;
    let downY = 0;

    starEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pointerId = e.pointerId;
      moved = false;
      downTime = Date.now();
      downX = e.clientX;
      downY = e.clientY;
      openFor(kind, starEl);
      capturePointer(starEl, e.pointerId);
    });

    starEl.addEventListener('pointermove', (e) => {
      if (pointerId === null || e.pointerId !== pointerId || !isOpen) return;
      if (Math.hypot(e.clientX - originX, e.clientY - originY) > MOVE_THRESHOLD_PX) moved = true;
      updateHighlightFromPointer(e.clientX, e.clientY);
      updateArrow(e.clientX, e.clientY);
    });

    starEl.addEventListener('pointerup', (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      releasePointer(starEl, pointerId);
      pointerId = null;
      if (!isOpen) return;
      // Dual-mode split: a quick tap (fast release, never traveled past
      // TAP_MAX_MOVE_PX) OR a press that never crossed the drag
      // move-threshold at all (moved stays false, the same signal the old
      // single-mode code checked) both mean "this was not a press-drag" —
      // open the menu PERSISTENTLY instead of evaluating a drag-release
      // commit. Node clicks/hover are handled by the persistent-mode
      // listeners below (menuEl 'pointermove' for hover, existing menuEl
      // 'click' delegation for activation).
      const elapsedMs = Date.now() - downTime;
      const totalMovePx = Math.hypot(e.clientX - downX, e.clientY - downY);
      const wasQuickTapOrNoDrag = !moved || (elapsedMs <= TAP_MAX_MS && totalMovePx <= TAP_MAX_MOVE_PX);
      if (wasQuickTapOrNoDrag) {
        enterPersistentMode();
        return;
      }
      if (Math.hypot(e.clientX - originX, e.clientY - originY) < DEAD_ZONE_PX) {
        // Pulling back into the dead zone pops one level of the circular
        // drill-down (goBack() itself falls back to a full close at the
        // top level, and for Canopus/Centauri — which never push a level —
        // it always closes).
        goBack();
        return;
      }
      commitIndex(highlightIndex);
    });

    // A cancel means the browser (or the OS) took the gesture away mid-press
    // — a pan/pinch candidate won disambiguation, an edge/back gesture fired,
    // the app was backgrounded. The decisive part is that pointerup will
    // NEVER arrive, so none of the release logic above ever runs.
    //
    // What the old handler did: null out pointerId and nothing else. The menu
    // that pointerdown had already opened was therefore left in the worst
    // possible state — isOpen with persistent === false and no ghost-click
    // suppression armed — so the tap's synthetic click landed on the scrim
    // renderItems() had just inserted and the delegated scrim handler closed
    // it again within the same frame. On a phone that is indistinguishable
    // from "tapping the star does nothing".
    //
    // Cancel is not a close. Settle into exactly the persistent mode a clean
    // tap produces (menu stays up, ghost click swallowed), which is both
    // usable now and leaves no state wedged for the next gesture.
    starEl.addEventListener('pointercancel', (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      releasePointer(starEl, pointerId);
      pointerId = null;
      if (!isOpen) return;
      enterPersistentMode();
    });
  }

  starEls.forEach(({ el, kind }) => attachStar(el, kind));

  // Persistent-mode hover highlight — same setHighlight()/.is-highlighted
  // path the press-drag gesture already drives via updateHighlightFromPointer(),
  // just triggered by plain pointer movement over a node instead of an
  // active drag. No-op while a press-drag is in progress (that path already
  // owns highlighting via its own pointermove listener on the star).
  menuEl.addEventListener('pointermove', (e) => {
    if (!isOpen || !persistent) return;
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const nodeEl = target.closest<HTMLElement>('.radial-menu__node');
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
    if (target.closest('.radial-menu__scrim')) {
      closeMenu();
      return;
    }
    if (target.closest('.radial-menu__back')) {
      goBack();
      return;
    }
    const nodeEl = target.closest<HTMLElement>('.radial-menu__node');
    if (!nodeEl) return;
    const index = Number(nodeEl.dataset.index);
    if (!Number.isNaN(index)) commitIndex(index);
  });

  document.addEventListener('keydown', (e) => {
    if (isOpen && e.key === 'Escape') closeMenu();
  });
}
