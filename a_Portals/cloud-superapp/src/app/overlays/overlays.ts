// src/app/overlays/overlays.ts — the 2 shared ".overlay-sheet" modal chromes:
// Notification Center and the Update-progress overlay. Both live in the
// fixed, empty containers every generated page already carries
// (#notification-center / #update-overlay — see scripts/generate-pages.mjs);
// this module only populates and wires them, it never creates those
// containers itself.
//
// Notification Center owns its own trigger (#dynamic-island) directly. The
// Update overlay is instead opened from elsewhere entirely — the long-press
// fan menu and Sirius's radial menu, both driven by the special
// action:check_updates target string resolved by other modules — so it's
// exposed as a plain exported function for that other code to call:
//   import { openUpdateOverlay } from './overlays';

import type { PortalData } from '../../lib/core/types';

// Purely visual demo timings (no real download to track) — see
// buildUpdateOverlay(). Each constant is how long its phase's status text
// stays on screen before the state machine moves on to the next phase.
const CHECKING_DELAY_MS = 700;
const AVAILABLE_DELAY_MS = 500;
const DOWNLOAD_DURATION_MS = 2500;
const INSTALLING_DELAY_MS = 800;

// Mock download total + tick cadence for the determinate "downloading"
// phase's progress text (e.g. "12.3 MiB / 48.0 MiB").
const DOWNLOAD_TOTAL_MIB = 48.0;
const DOWNLOAD_TICK_MS = 100;
const DOWNLOAD_TICK_COUNT = DOWNLOAD_DURATION_MS / DOWNLOAD_TICK_MS;

// Closed state is native [hidden] (JS toggles the attribute), same
// contract as #radial-menu (see stars.ts + _radial-menu.scss's "Closed
// state is native [hidden]" comment) — .is-open alone would never become
// visible while [hidden] is still set, so both are always toggled together.
function show(el: HTMLElement): void {
  el.hidden = false;
  el.classList.add('is-open');
}

function hide(el: HTMLElement): void {
  el.classList.remove('is-open');
  el.hidden = true;
}

function buildScrim(): HTMLDivElement {
  const scrim = document.createElement('div');
  scrim.className = 'overlay-sheet__scrim';
  return scrim;
}

// Shared by all 3 sheets — just a title line, matching drawer.ts's own
// `<p class="drawer__title">` idiom for this kind of chrome label.
function buildHeader(title: string): HTMLDivElement {
  const header = document.createElement('div');
  header.className = 'overlay-sheet__header';
  const titleEl = document.createElement('p');
  titleEl.className = 'overlay-sheet__title';
  titleEl.textContent = title;
  header.appendChild(titleEl);
  return header;
}

// --- Notification Center ---------------------------------------------------
// Trigger lives here too (#dynamic-island) — nothing external ever needs to
// open this one, so unlike search/update there is no exported opener.

// One notification group — a header ("Cloud SA · Alerts") followed by its
// rows (title + optional subtitle), Android notification-shade parity.
function buildGroup(group: { title: string; items: { title: string; subtitle?: string }[] }): HTMLDivElement {
  const groupEl = document.createElement('div');
  groupEl.className = 'overlay-sheet__group';

  const titleEl = document.createElement('p');
  titleEl.className = 'overlay-sheet__group-title';
  titleEl.textContent = group.title;
  groupEl.appendChild(titleEl);

  for (const item of group.items) {
    const row = document.createElement('div');
    row.className = 'overlay-sheet__row';
    const rowTitle = document.createElement('span');
    rowTitle.className = 'overlay-sheet__row-title';
    rowTitle.textContent = item.title;
    row.appendChild(rowTitle);
    if (item.subtitle) {
      const rowSubtitle = document.createElement('span');
      rowSubtitle.className = 'overlay-sheet__row-subtitle';
      rowSubtitle.textContent = item.subtitle;
      row.appendChild(rowSubtitle);
    }
    groupEl.appendChild(row);
  }

  return groupEl;
}

function buildNotificationCenter(data: PortalData): void {
  const root = document.getElementById('notification-center');
  const triggerBtn = document.getElementById('dynamic-island');
  if (!root || !triggerBtn) return;

  const scrim = buildScrim();
  const panel = document.createElement('div');
  panel.className = 'overlay-sheet__panel';
  const header = buildHeader('Notifications');
  panel.appendChild(header);

  // Bold-ish first line (emptyTitle) + the body below it. emptyBody carries
  // real \n line breaks and overlay-sheet__empty already has
  // white-space:pre-line in CSS, so a plain textContent assignment on the
  // body paragraph is enough — no manual <br> insertion.
  function buildEmptyState(): HTMLDivElement {
    const empty = document.createElement('div');
    empty.className = 'overlay-sheet__empty';
    const titleLine = document.createElement('p');
    const titleStrong = document.createElement('strong');
    titleStrong.textContent = data.notificationCenter.emptyTitle;
    titleLine.appendChild(titleStrong);
    const bodyLine = document.createElement('p');
    bodyLine.textContent = data.notificationCenter.emptyBody;
    empty.appendChild(titleLine);
    empty.appendChild(bodyLine);
    return empty;
  }

  const groups = data.notificationCenter.groups;
  if (groups && groups.length > 0) {
    for (const group of groups) panel.appendChild(buildGroup(group));

    // Violet text action next to the title, matching the APK's Clear
    // action — clears the rendered groups in place and falls back to the
    // same empty state shown when there was never anything to clear.
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'overlay-sheet__action';
    clearBtn.style.color = '#B794F4';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
      for (const groupEl of panel.querySelectorAll('.overlay-sheet__group')) groupEl.remove();
      clearBtn.remove();
      panel.appendChild(buildEmptyState());
    });
    header.appendChild(clearBtn);
  } else {
    panel.appendChild(buildEmptyState());
  }

  root.appendChild(scrim);
  root.appendChild(panel);

  const open = (): void => show(root);
  const close = (): void => hide(root);

  triggerBtn.addEventListener('click', open);
  scrim.addEventListener('click', close);

  document.addEventListener('keydown', (event) => {
    if (root.classList.contains('is-open') && event.key === 'Escape') close();
  });

  document.addEventListener('click', (event) => {
    if (!root.classList.contains('is-open')) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target) || triggerBtn.contains(target)) return;
    close();
  });
}

// --- Update overlay ------------------------------------------------------

// Same "return an opener" shape as buildSearchSheet(), for the same reason
// (openUpdateOverlay() is called from other modules' event handlers).
function buildUpdateOverlay(data: PortalData): (() => void) | null {
  const root = document.getElementById('update-overlay');
  if (!root) return null;

  // Scrim is rendered for the dim backdrop only — intentionally never
  // wired to close, matching the real app not letting an in-progress
  // update be dismissed by an accidental outside tap.
  const scrim = buildScrim();
  const panel = document.createElement('div');
  panel.className = 'overlay-sheet__panel';
  panel.appendChild(buildHeader(data.updateOverlay.title));

  const progress = document.createElement('div');
  progress.className = 'overlay-sheet__progress';
  const progressBar = document.createElement('div');
  progressBar.className = 'overlay-sheet__progress-bar';
  progress.appendChild(progressBar);
  panel.appendChild(progress);

  const status = document.createElement('p');
  status.className = 'overlay-sheet__status';
  panel.appendChild(status);

  // Always present and functional from the start — no disabled-state
  // bookkeeping, there's no real update this could interrupt.
  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.className = 'overlay-sheet__action';
  dismissBtn.textContent = 'Dismiss';
  panel.appendChild(dismissBtn);

  root.appendChild(scrim);
  root.appendChild(panel);

  // Every pending timer/interval from the currently-running mock sequence —
  // close() (dismiss click, or a fresh opener run) clears all of them so
  // nothing keeps ticking after the sheet is gone.
  let pendingTimers: number[] = [];

  const clearPendingTimers = (): void => {
    for (const id of pendingTimers) {
      window.clearTimeout(id);
      window.clearInterval(id);
    }
    pendingTimers = [];
  };

  const setIndeterminate = (on: boolean): void => {
    progressBar.classList.toggle('overlay-sheet__progress-bar--indeterminate', on);
  };

  const close = (): void => {
    clearPendingTimers();
    hide(root);
  };
  dismissBtn.addEventListener('click', close);

  return (): void => {
    clearPendingTimers();
    dismissBtn.textContent = 'Dismiss';
    show(root);

    // Phase 1 — checking: indeterminate pulse while we "reach the server".
    status.textContent = data.updateOverlay.states.checking;
    setIndeterminate(true);

    const availableTimer = window.setTimeout(() => {
      // Phase 2 — available: brief pause, bar stays indeterminate.
      status.textContent = data.updateOverlay.states.available;

      const downloadStartTimer = window.setTimeout(() => {
        // Phase 3 — downloading: determinate, real-looking MiB/MiB progress.
        setIndeterminate(false);
        progressBar.style.width = '0%';
        let tick = 0;
        const downloadInterval = window.setInterval(() => {
          tick += 1;
          const downloadedMib = (DOWNLOAD_TOTAL_MIB * tick) / DOWNLOAD_TICK_COUNT;
          const pct = (tick / DOWNLOAD_TICK_COUNT) * 100;
          progressBar.style.width = `${pct}%`;
          status.textContent = `${downloadedMib.toFixed(1)} MiB / ${DOWNLOAD_TOTAL_MIB.toFixed(1)} MiB`;

          if (tick >= DOWNLOAD_TICK_COUNT) {
            window.clearInterval(downloadInterval);

            // Phase 4 — installing: back to indeterminate.
            setIndeterminate(true);
            status.textContent = data.updateOverlay.states.installing;

            const doneTimer = window.setTimeout(() => {
              // Phase 5 — done: determinate, full bar.
              setIndeterminate(false);
              progressBar.style.width = '100%';
              status.textContent = data.updateOverlay.states.done;
              dismissBtn.textContent = 'Close';
            }, INSTALLING_DELAY_MS);
            pendingTimers.push(doneTimer);
          }
        }, DOWNLOAD_TICK_MS);
        pendingTimers.push(downloadInterval);
      }, AVAILABLE_DELAY_MS);
      pendingTimers.push(downloadStartTimer);
    }, CHECKING_DELAY_MS);
    pendingTimers.push(availableTimer);
  };
}

// --- Public entry points -------------------------------------------------

let updateOpener: (() => void) | null = null;

export function openUpdateOverlay(): void {
  if (updateOpener) updateOpener();
}

export function initOverlays(data: PortalData): void {
  buildNotificationCenter(data);
  updateOpener = buildUpdateOverlay(data);
}
