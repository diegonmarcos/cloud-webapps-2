// src/app/launcher/long-press-menu.ts — app-tile long-press context menu.
//
// Real Android launcher: holding a home-screen or drawer app icon opens a
// small PopupMenu (AppLongPressMenu.kt) that leads with a bold app-label
// header row, then App info / Uninstall — both real actions on the APK,
// but neither has a meaningful web destination, so they render as inert
// (visually enabled, aria-disabled, no action) rather than as disabled
// controls. This reuses the same long-press timing fan-menu.ts already
// established for the bottom-nav (380ms, 10px move-cancel threshold), but
// delegates from the document instead of one fixed container. Scoped to
// phone-app tiles only (`.tile--app`) — cloud/service/home tiles never get
// this menu on the real app.

const LONG_PRESS_MS = 380;
const MOVE_THRESHOLD_PX = 10;

export function initLongPressMenu(): void {
  const shellEl = document.querySelector<HTMLElement>('.shell');
  const hostEl: HTMLElement = shellEl ?? document.body;

  const menuEl = document.createElement('div');
  menuEl.className = 'long-press-menu';
  menuEl.hidden = true;
  menuEl.setAttribute('aria-hidden', 'true');

  const scrimEl = document.createElement('div');
  scrimEl.className = 'long-press-menu-scrim';
  scrimEl.hidden = true;

  hostEl.appendChild(scrimEl);
  hostEl.appendChild(menuEl);

  let menuOpen = false;

  // Long-press-timer state for the pointer currently pressing a tile.
  let pressTimer: number | null = null;
  let longPressFired = false;
  let pressTileEl: HTMLElement | null = null;
  let activePointerId: number | null = null;
  let startX = 0;
  let startY = 0;

  function clearPressTimer(): void {
    if (pressTimer === null) return;
    window.clearTimeout(pressTimer);
    pressTimer = null;
  }

  function closeMenu(): void {
    menuOpen = false;
    menuEl.classList.remove('is-open');
    menuEl.setAttribute('aria-hidden', 'true');
    menuEl.hidden = true;
    menuEl.innerHTML = '';
    scrimEl.classList.remove('is-open');
    scrimEl.hidden = true;
  }

  // Bold app-label header row — not a control, just identifies which tile
  // the popup below belongs to (AppLongPressMenu.kt's title row).
  function buildHeaderRow(label: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'long-press-menu__header';
    row.textContent = label;
    return row;
  }

  function buildDivider(): HTMLElement {
    const divider = document.createElement('div');
    divider.className = 'long-press-menu__divider';
    return divider;
  }

  // Inert row: visually a normal, enabled-looking menu row (App info /
  // Uninstall are real actions on the APK), but no web destination exists
  // for either, so it's aria-disabled and does nothing beyond its own
  // brief press flash — never a literal disabled <button>, which would
  // read as visually greyed-out and break the "looks enabled" contract.
  function buildInertRow(label: string): HTMLElement {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'long-press-menu__row';
    row.textContent = label;
    row.setAttribute('aria-disabled', 'true');
    row.addEventListener('click', (event) => {
      event.preventDefault();
    });
    return row;
  }

  function openMenu(tileEl: HTMLElement): void {
    closeMenu();

    const label = tileEl.querySelector('.tile__label')?.textContent?.trim() ?? '';

    menuEl.appendChild(buildHeaderRow(label));
    menuEl.appendChild(buildDivider());
    menuEl.appendChild(buildInertRow('App info'));
    menuEl.appendChild(buildInertRow('Uninstall'));

    // Anchored just below the tile, host-relative — same shell-offset
    // correction fan-menu.ts uses for its own popup.
    const rect = tileEl.getBoundingClientRect();
    const hostRect = hostEl.getBoundingClientRect();
    menuEl.style.left = `${rect.left - hostRect.left}px`;
    menuEl.style.top = `${rect.bottom - hostRect.top + 6}px`;

    menuEl.hidden = false;
    scrimEl.hidden = false;
    menuEl.classList.add('is-open');
    scrimEl.classList.add('is-open');
    menuEl.setAttribute('aria-hidden', 'false');
    menuOpen = true;
  }

  function onPointerDown(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const tileEl = target.closest<HTMLElement>('.tile--app');
    if (!tileEl) return;

    // Never preventDefault here — a plain quick tap must still navigate via
    // the tile's real <a href> exactly as before.
    clearPressTimer();
    pressTileEl = tileEl;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    longPressFired = false;

    pressTimer = window.setTimeout(() => {
      pressTimer = null;
      longPressFired = true;
      if (pressTileEl) openMenu(pressTileEl);
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

  // Cancels navigation only for the click that follows an already-fired
  // long-press on the pressed tile — every other tile click proceeds to its
  // real href exactly as before (same contract as fan-menu.ts). Capture
  // phase, since the click's default navigation must be stopped before it
  // reaches the anchor.
  function onDocumentClickCapture(event: MouseEvent): void {
    if (!longPressFired) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.tile--app') !== pressTileEl) return;
    longPressFired = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function onDocumentKeydown(event: KeyboardEvent): void {
    if (menuOpen && event.key === 'Escape') closeMenu();
  }

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerEnd);
  document.addEventListener('pointercancel', onPointerEnd);
  document.addEventListener('click', onDocumentClickCapture, true);
  scrimEl.addEventListener('click', closeMenu);
  document.addEventListener('keydown', onDocumentKeydown);
}
