// src/app/cloud/calendar-month-card.ts — mounts a real month grid with
// working prev/next chevrons into every [data-calendar-card] element (the
// Infos·Apps "Calendar" stack card's body — see generate-pages.mjs's
// cardHtml(), kind="calendar_month"). Port of CalendarMonthFragment.kt's
// shiftMonth(±1): pure date math, no data source, so this renders
// client-side rather than baking a build-time date into the static HTML
// (which would make dist/ output differ on every rebuild with no source
// change — see the status-clock's own "no new Date() at build time" note).

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const MONTH_TITLE_FMT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

function renderMonth(container: HTMLElement, cursor: Date, onShift: (delta: number) => void): void {
  container.innerHTML = '';
  const today = new Date();
  const isCurrentMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();

  const header = el('div', 'calendar-card__header');
  const prevBtn = el('button', 'calendar-card__nav', '‹');
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous month');
  const title = el('p', 'calendar-card__title', new Intl.DateTimeFormat(undefined, MONTH_TITLE_FMT).format(cursor));
  const nextBtn = el('button', 'calendar-card__nav', '›');
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next month');
  prevBtn.addEventListener('click', () => onShift(-1));
  nextBtn.addEventListener('click', () => onShift(1));
  header.appendChild(prevBtn);
  header.appendChild(title);
  header.appendChild(nextBtn);
  container.appendChild(header);

  const weekHeader = el('div', 'calendar-card__week calendar-card__week--header');
  const sample = new Date(2023, 0, 1); // a known Sunday, for locale-aware weekday initials
  for (let i = 0; i < 7; i++) {
    const d = new Date(sample);
    d.setDate(sample.getDate() + i);
    weekHeader.appendChild(el('span', 'calendar-card__day-cell calendar-card__day-cell--header', new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(d)));
  }
  container.appendChild(weekHeader);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const leadingBlanks = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = leadingBlanks + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  let dayNum = 1;
  for (let r = 0; r < rows; r++) {
    const week = el('div', 'calendar-card__week');
    for (let c = 0; c < 7; c++) {
      const cellIndex = r * 7 + c;
      if (cellIndex < leadingBlanks || dayNum > daysInMonth) {
        week.appendChild(el('span', 'calendar-card__day-cell'));
      } else {
        const isToday = isCurrentMonth && dayNum === today.getDate();
        week.appendChild(el('span', `calendar-card__day-cell${isToday ? ' is-today' : ''}`, String(dayNum)));
        dayNum++;
      }
    }
    container.appendChild(week);
  }
}

export function initCalendarMonthCards(): void {
  const containers = document.querySelectorAll<HTMLElement>('[data-calendar-card]');
  containers.forEach((container) => {
    let cursor = new Date();
    const draw = (): void => {
      renderMonth(container, cursor, (delta) => {
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
        draw();
      });
    };
    draw();
  });
}
