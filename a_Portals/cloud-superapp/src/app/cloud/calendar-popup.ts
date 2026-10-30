// src/app/cloud/calendar-popup.ts — port of the real app's
// CalendarAgendaPopup (cloud/CalendarAgendaPopup.kt), shown when tapping
// the status-strip's date/time. Two tabs built up-front and toggled via
// visibility (no rebuild, no flicker, matching the real "both views built
// up-front" comment): Agenda (today + next 6 days, "no events" placeholder
// rows — CalDAV hasn't landed in the real app either) and Calendar
// (current month grid, today highlighted). The header's stopwatch
// (elapsed mm:ss.t + play/pause toggle, long-press to reset) is a genuine
// working client-side timer, not a mock — nothing about it needs a real
// device API, unlike the rest of this app's device-state widgets.

function show(el: HTMLElement): void {
  el.hidden = false;
  el.classList.add('is-open');
}

function hide(el: HTMLElement): void {
  el.classList.remove('is-open');
  el.hidden = true;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const DAY_HEADER_FMT: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const MONTH_TITLE_FMT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

// Real: 7-day scrollable agenda list, today + next 6, today's row
// highlighted, every row a placeholder ("no events" — same CalDAV-not-
// landed-yet state the real app is in).
function buildAgendaView(): HTMLElement {
  const scroll = el('div', 'calendar-popup__agenda-scroll');
  const body = el('div', 'calendar-popup__agenda-body');
  const day = new Date();
  for (let i = 0; i < 7; i++) {
    const row = el('div', `calendar-popup__agenda-row${i === 0 ? ' is-today' : ''}`);
    const headerText = new Intl.DateTimeFormat(undefined, DAY_HEADER_FMT).format(day);
    row.appendChild(el('p', 'calendar-popup__agenda-date', i === 0 ? `Today · ${headerText}` : headerText));
    row.appendChild(el('p', 'calendar-popup__agenda-empty', 'no events'));
    body.appendChild(row);
    day.setDate(day.getDate() + 1);
  }
  body.appendChild(el('p', 'calendar-popup__footnote', 'Same placeholder shape as the real app — no CalDAV backend wired up on either side yet.'));
  scroll.appendChild(body);
  return scroll;
}

// Real: current month as a 7-column grid, weekday header row, today
// highlighted with a filled accent circle. Leading/trailing blank cells
// pad the first/last week to a full 7 columns.
function buildCalendarView(): HTMLElement {
  const col = el('div', 'calendar-popup__month');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  col.appendChild(el('p', 'calendar-popup__month-title', new Intl.DateTimeFormat(undefined, MONTH_TITLE_FMT).format(now)));

  const weekHeader = el('div', 'calendar-popup__week calendar-popup__week--header');
  // Locale-aware weekday initials, Sunday-first (matches the real app's
  // Calendar.firstDayOfWeek default for most locales).
  const sample = new Date(2023, 0, 1); // a known Sunday
  for (let i = 0; i < 7; i++) {
    const d = new Date(sample);
    d.setDate(sample.getDate() + i);
    const initial = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(d);
    weekHeader.appendChild(el('span', 'calendar-popup__day-cell calendar-popup__day-cell--header', initial));
  }
  col.appendChild(weekHeader);

  const firstOfMonth = new Date(year, month, 1);
  const leadingBlanks = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = leadingBlanks + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  let dayNum = 1;
  for (let r = 0; r < rows; r++) {
    const week = el('div', 'calendar-popup__week');
    for (let c = 0; c < 7; c++) {
      const cellIndex = r * 7 + c;
      if (cellIndex < leadingBlanks || dayNum > daysInMonth) {
        week.appendChild(el('span', 'calendar-popup__day-cell'));
      } else {
        const isToday = dayNum === today;
        week.appendChild(el('span', `calendar-popup__day-cell${isToday ? ' is-today' : ''}`, String(dayNum)));
        dayNum++;
      }
    }
    col.appendChild(week);
  }

  col.appendChild(el('p', 'calendar-popup__footnote', 'Event dots land with a real backend — the grid is the structure for now.'));
  return col;
}

function formatStopwatch(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${tenths}`;
}

// Real: elapsed-time stopwatch, Start/Stop toggle, long-press the time to
// reset. State lives in this closure (not module-level like the real
// static fields) since there's only ever one popup instance per page.
function buildStopwatch(): HTMLElement {
  const row = el('div', 'calendar-popup__stopwatch');
  const timeEl = el('span', 'calendar-popup__stopwatch-time', '0:00.0');
  const btn = el('button', 'calendar-popup__stopwatch-btn', '▶');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Start stopwatch');

  let running = false;
  let startedAt = 0;
  let accumulatedMs = 0;
  let tickId: number | null = null;

  const currentMs = (): number => (running ? accumulatedMs + (Date.now() - startedAt) : accumulatedMs);
  const render = (): void => { timeEl.textContent = formatStopwatch(currentMs()); };

  const tick = (): void => {
    render();
    tickId = window.setTimeout(tick, 100);
  };

  btn.addEventListener('click', () => {
    if (running) {
      accumulatedMs += Date.now() - startedAt;
      running = false;
      btn.textContent = '▶';
      btn.classList.remove('is-running');
      if (tickId !== null) { window.clearTimeout(tickId); tickId = null; }
      render();
    } else {
      startedAt = Date.now();
      running = true;
      btn.textContent = '■';
      btn.classList.add('is-running');
      tick();
    }
  });

  // Long-press (380ms hold, matching this app's other long-press
  // interactions — see fan-menu.ts) resets to 0.
  let holdTimer: number | null = null;
  const reset = (): void => {
    running = false;
    accumulatedMs = 0;
    startedAt = 0;
    if (tickId !== null) { window.clearTimeout(tickId); tickId = null; }
    btn.textContent = '▶';
    btn.classList.remove('is-running');
    render();
  };
  timeEl.addEventListener('pointerdown', () => {
    holdTimer = window.setTimeout(reset, 380);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => {
    timeEl.addEventListener(type, () => {
      if (holdTimer !== null) { window.clearTimeout(holdTimer); holdTimer = null; }
    });
  });

  row.appendChild(timeEl);
  row.appendChild(btn);
  return row;
}

export function initCalendarPopup(): void {
  const root = document.getElementById('calendar-popup');
  const triggerBtn = document.getElementById('status-clock');
  if (!root || !triggerBtn) return;

  const scrim = el('div', 'overlay-sheet__scrim');
  const panel = el('div', 'overlay-sheet__panel calendar-popup__panel');

  const headerRow = el('div', 'calendar-popup__header');
  const headerLeft = el('div', 'calendar-popup__header-left');
  headerLeft.appendChild(el('p', 'calendar-popup__label', 'Calendar'));
  const todayFmt: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
  headerLeft.appendChild(el('p', 'calendar-popup__today', new Intl.DateTimeFormat(undefined, todayFmt).format(new Date())));
  headerRow.appendChild(headerLeft);
  headerRow.appendChild(buildStopwatch());
  panel.appendChild(headerRow);

  const agendaView = buildAgendaView();
  const calendarView = buildCalendarView();
  calendarView.hidden = true;

  const tabAgenda = el('button', 'calendar-popup__tab is-active', 'Agenda');
  const tabCalendar = el('button', 'calendar-popup__tab', 'Calendar');
  tabAgenda.type = 'button';
  tabCalendar.type = 'button';
  const selectTab = (agenda: boolean): void => {
    tabAgenda.classList.toggle('is-active', agenda);
    tabCalendar.classList.toggle('is-active', !agenda);
    agendaView.hidden = !agenda;
    calendarView.hidden = agenda;
  };
  tabAgenda.addEventListener('click', () => selectTab(true));
  tabCalendar.addEventListener('click', () => selectTab(false));
  const tabRow = el('div', 'calendar-popup__tabs');
  tabRow.appendChild(tabAgenda);
  tabRow.appendChild(tabCalendar);
  panel.appendChild(tabRow);
  panel.appendChild(agendaView);
  panel.appendChild(calendarView);

  root.appendChild(scrim);
  root.appendChild(panel);

  const open = (): void => show(root);
  const close = (): void => hide(root);

  triggerBtn.addEventListener('click', open);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (root.classList.contains('is-open') && event.key === 'Escape') close();
  });
}
