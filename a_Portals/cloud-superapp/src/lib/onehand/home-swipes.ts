// src/lib/onehand/home-swipes.ts — one-hand "Sirius" home-screen swipe
// gestures. Active only on the home page (detected the same way
// _home-cube.scss's own ".shell.is-home" styling is: presence of the
// decorative .home-cube element, server-rendered only into home.html —
// see generate-pages.mjs's `sectionId === 'home' ? homeCubeHtml() : ''`).
import { routeHref } from '../core/nav';

const SWIPE_THRESHOLD_PX = 60;

// Anything the user could plausibly mean to tap/drag on its own — a swipe
// starting here must not also fire a page-background navigation gesture.
const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"], .tile, .star, .edge-menu__handle';

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(INTERACTIVE_SELECTOR);
}

export function initHomeSwipes(): void {
  if (!document.querySelector('.home-cube')) return;

  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let active = false;

  function onPointerDown(e: PointerEvent): void {
    if (isInteractiveTarget(e.target)) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    active = true;
  }

  function onPointerUp(e: PointerEvent): void {
    if (!active || pointerId === null || e.pointerId !== pointerId) return;
    active = false;
    pointerId = null;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < SWIPE_THRESHOLD_PX) return;

    if (absX > absY) {
      if (dx > 0) history.forward();
      else history.back();
    } else if (dy < 0) {
      location.href = routeHref(['suite', 'phone', 'all']);
    } else {
      location.href = routeHref(['suite']);
    }
  }

  function onPointerCancel(e: PointerEvent): void {
    if (pointerId === null || e.pointerId !== pointerId) return;
    active = false;
    pointerId = null;
  }

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);
}
