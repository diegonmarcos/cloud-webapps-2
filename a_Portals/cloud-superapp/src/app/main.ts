// Main entry point for the Cloud Mobile application.
//
// Every route is now a real, independent, server-rendered (build-time
// generated) HTML page — see scripts/generate-pages.mjs. This script is
// pure progressive enhancement: it never owns navigation. It only wires
// UI-state widgets (drawer open/close, the three radial star menus) and
// registers the service worker.

import { getData } from '../lib/core/data';
import { initDrawer } from './launcher/drawer';
import { initStars, setOnCheckUpdates } from '../lib/onehand/stars';
import { initEdgeMenu } from '../lib/onehand/edge-menu';
import { initHomeSwipes } from '../lib/onehand/home-swipes';
import { initOverlays, openUpdateOverlay } from './overlays/overlays';
import { initFanMenu } from './launcher/fan-menu';
import { initStackCards } from './launcher/stack-cards';
import { initCalendarPopup } from './cloud/calendar-popup';
import { initCalendarMonthCards } from './cloud/calendar-month-card';
import { initSearchSheet } from './search/search-sheet';
import { initGalaxyBackdrop } from './ui/galaxy-backdrop';

// document.currentScript is only valid synchronously while this script is
// the one executing — capture it now, before any async boundary, for use
// inside the deferred SW-registration callback below.
const SELF_SCRIPT_URL = (document.currentScript as HTMLScriptElement | null)?.src ?? '';

// Status strip's clock is the one genuinely live piece of that readout (RAM/
// battery/radio state have no web equivalent, so those stay static) — server
// render already painted the correct value, this just keeps it ticking.
function initStatusClock(): void {
  const el = document.getElementById('status-clock');
  if (!el) return;
  const pad = (n: number): string => String(n).padStart(2, '0');
  const tick = (): void => {
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });
    el.textContent = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())} ${weekday}`;
  };
  tick();
  window.setInterval(tick, 15000);
}

// Embed mode (html.embed, set by the inline <head> script in every page): keep
// ?embed=1 on same-origin links so the flag survives in-site navigation even
// where sessionStorage is unavailable. Capture phase + click time, so links
// the drawer / fan menu / radial menu create later are covered too. The UA
// marker and sessionStorage need no help; programmatic location.href jumps
// rely on those two.
function initEmbedLinks(): void {
  if (!document.documentElement.classList.contains('embed')) return;
  document.addEventListener('click', (ev) => {
    const a = (ev.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.origin !== location.origin || a.hasAttribute('download')) return;
    if (a.hash && a.pathname === location.pathname && a.search === location.search) return;
    const u = new URL(a.href);
    if (u.searchParams.get('embed') === '1') return;
    u.searchParams.set('embed', '1');
    a.href = u.href;
  }, true);
}

// Embed mode fits ONE screen with no scrolling: the content is wrapped in #embed-fit, which is scaled
// (CSS transform, width compensated so the tiles reflow at the scaled width) by the largest factor whose
// height still fits window.innerHeight. Measured, not guessed, so it holds on any screen; re-run on resize.
function initEmbedFit(): void {
  const root = document.documentElement;
  const content = document.querySelector<HTMLElement>('.content');
  if (!root.classList.contains('embed') || !content) return;
  const wrap = document.createElement('div');
  wrap.id = 'embed-fit';
  while (content.firstChild) wrap.appendChild(content.firstChild);
  content.appendChild(wrap);
  const heightAt = (scale: number): number => {
    root.style.setProperty('--embed-fit-scale', String(scale));
    return wrap.getBoundingClientRect().height;
  };
  const fit = (): void => {
    wrap.style.marginBottom = '0px';
    const room = window.innerHeight - content.getBoundingClientRect().top - 12; // 12 = .content bottom padding
    let lo = 0.3;
    let hi = 1.6;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (heightAt(mid) <= room) lo = mid;
      else hi = mid;
    }
    root.style.setProperty('--embed-fit-scale', String(lo));
    // The transform does not shrink the layout box: give back the difference so nothing is left to scroll.
    wrap.style.marginBottom = `${wrap.getBoundingClientRect().height - wrap.offsetHeight}px`;
  };
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
}

// Every widget below is independent progressive enhancement, so one of them
// throwing must never take the others down with it — without this isolation a
// single failure (a missing canvas 2d context, a malformed data section, an
// API absent on some in-app WebView) would abort the whole DOMContentLoaded
// handler and silently kill every init registered after it. Matches the real
// Android app, where one broken view can't blank the launcher.
function runInit(name: string, init: () => void): void {
  try {
    init();
  } catch (error) {
    console.error(`[cloud-superapp] init failed: ${name}`, error);
  }
}

function initApp(): void {
  const data = getData();
  runInit('embed-links', () => initEmbedLinks());
  runInit('embed-fit', () => initEmbedFit());
  runInit('drawer', () => initDrawer(data));
  // lib/onehand/stars.ts can never import app/overlays/overlays.ts itself
  // (see src/README.md's module boundary) — this registers the actual
  // handler before the star menus can be interacted with.
  setOnCheckUpdates(openUpdateOverlay);
  runInit('stars', () => initStars(data));
  runInit('edge-menu', () => initEdgeMenu(data));
  runInit('home-swipes', () => initHomeSwipes());
  runInit('overlays', () => initOverlays(data));
  runInit('fan-menu', () => initFanMenu(data));
  runInit('stack-cards', () => initStackCards());
  runInit('status-clock', () => initStatusClock());
  runInit('calendar-popup', () => initCalendarPopup());
  runInit('calendar-month-cards', () => initCalendarMonthCards());
  runInit('search-sheet', () => initSearchSheet(data));
  runInit('galaxy-backdrop', () => initGalaxyBackdrop());
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Register the Service Worker after first paint — never blocks startup.
  // Skipped on file:// (no SW support). The registration path is resolved
  // against THIS script's own URL (not the page's), because pages live at
  // arbitrary nesting depth (e.g. /cloud/lnktree/) while
  // script.js and script-service-worker.js both always sit at the site
  // root — a plain relative './script-service-worker.js' would resolve
  // against the *page* URL and 404 on any nested route.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    requestAnimationFrame(() => {
      const swUrl = SELF_SCRIPT_URL ? new URL('script-service-worker.js', SELF_SCRIPT_URL).href : './script-service-worker.js';
      navigator.serviceWorker.register(swUrl).catch(() => undefined);
    });
  }
});

export { initApp };
