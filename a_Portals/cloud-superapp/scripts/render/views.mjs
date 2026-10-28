// scripts/render/views.mjs — the page LAYOUTS every section's landing page
// is built from.
//
// There are only five, because the twenty landing pages differ in what their
// rows MEAN, not in how they are laid out: a mail folder list, a feed list, a
// vault entry list, a WireGuard peer list and a ledger are all "leading mark,
// title over subtitle, trailing figure". So they share one row component and
// declare which leading/trailing treatment they want:
//
//   list     — the shared row list (lead + title/subtitle + trail)
//   agenda   — a time-gutter day view (calendar)
//   cards    — payment-card-shaped tiles (wallet)
//   grid     — thumbnail cards in a grid (open tabs)
//   summary  — a KPI tile strip, optionally above one of the layouts above
//
// A page picks one in src/data/sections-content.json:
//
//   "view": { "type": "list", "lead": "monogram", "trail": "badge" }
//
// and its rows stay the plain {title, subtitle, meta} the data files already
// used, plus an optional per-row `tone` for status colouring.
import {
  leadHtml, trailHtml, groupHeadingHtml, emptyStateHtml, androidOnlyNoteHtml, monogram, leadColor,
} from './atoms.mjs';

// The one row every list-shaped view uses. `href` makes it a link, otherwise
// it is a non-navigating div — the same inert treatment tiles already get.
function rowHtml(item, view, ctx) {
  const lead = leadHtml(view.lead ?? 'accent', {
    label: item.title,
    icon: item.icon ?? view.icon,
    tone: item.tone,
    inlineIcon: ctx.inlineIcon,
  });
  const subtitle = item.subtitle ? `<span class="row__subtitle">${item.subtitle}</span>` : '';
  const trail = trailHtml(item.trail ?? view.trail ?? 'meta', item.meta, item.tone);
  const body = `${lead}
                    <span class="row__text">
                        <span class="row__title">${item.title}</span>${subtitle}
                    </span>
                    ${trail}`;

  const { href, external } = ctx.resolveTarget(item.target);
  if (href) {
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    return `<a class="row" href="${href}"${attrs}>${body}</a>`;
  }
  // No web destination: either the row is plain content (no target at all) or
  // its target is Android-only. The second case is marked so it reads as
  // deliberately non-actionable rather than broken.
  const inert = item.target ? ' row--android-only' : '';
  const title = item.target ? ' title="Android-only action"' : '';
  return `<div class="row${inert}"${title}>${body}</div>`;
}

function listView(items, view, ctx) {
  if (!items.length) return emptyStateHtml(view.emptyTitle ?? 'Nothing here yet.', view.emptyBody);
  // Rows may declare a `group`; consecutive rows sharing one get a heading.
  const out = [];
  let current = null;
  for (const item of items) {
    if (item.group && item.group !== current) {
      current = item.group;
      out.push(groupHeadingHtml(item.group));
    }
    out.push(rowHtml(item, view, ctx));
  }
  return `<div class="row-list">
                ${out.join('\n                ')}
            </div>`;
}

// Calendar day: a fixed left time gutter with the event card beside it, so
// the page reads as a schedule rather than as another flat list. Events
// without a time fall under an "All day" gutter label.
function agendaView(items, view, ctx) {
  if (!items.length) return emptyStateHtml('Nothing scheduled.', 'Events appear here once a CalDAV account is connected.');
  const rows = items.map((item) => `
                <div class="agenda__row">
                    <span class="agenda__time">${item.subtitle ?? 'All day'}</span>
                    <div class="agenda__event" style="border-left-color:${leadColor(item.title)}">
                        <span class="agenda__event-title">${item.title}</span>
                        ${item.meta ? `<span class="agenda__event-meta">${item.meta}</span>` : ''}
                    </div>
                </div>`).join('');
  return `<div class="agenda">${rows}
            </div>`;
}

// Wallet: the entries ARE cards, so they render as cards — brand strip, a
// masked number, and the holder line. Adding a card is a device action, so
// that row renders as an explicit non-actionable affordance.
function cardsView(items, view, ctx) {
  if (!items.length) return emptyStateHtml('No cards yet.', 'Cards are added on the phone.');
  const cards = items.map((item) => {
    if (item.action) {
      return `
                <div class="wallet-card wallet-card--add">
                    <span class="wallet-card__add-glyph" aria-hidden="true">+</span>
                    <span class="wallet-card__add-label">${item.title}</span>
                    <span class="wallet-card__add-sub">${item.subtitle ?? ''}</span>
                </div>`;
    }
    return `
                <div class="wallet-card" style="background:linear-gradient(135deg, ${leadColor(item.title)}, #0e0220)">
                    <span class="wallet-card__brand">${item.title}</span>
                    <span class="wallet-card__number">${item.subtitle ?? ''}</span>
                    ${item.meta ? `<span class="wallet-card__tag">${item.meta}</span>` : ''}
                </div>`;
  }).join('');
  return `<div class="wallet-deck">${cards}
            </div>${androidOnlyNoteHtml('Adding, scanning and paying with a card are device actions — available in the Cloud Wallet app.')}`;
}

// Open tabs: thumbnail cards in a grid, the way a browser's tab switcher
// shows them, rather than a text list.
function gridView(items, view, ctx) {
  if (!items.length) return emptyStateHtml('No open tabs.', 'Tabs opened in Cloud Browser appear here.');
  const cards = items.map((item) => {
    const { href, external } = ctx.resolveTarget(item.target);
    const inner = `
                    <span class="tab-card__thumb" style="background:${leadColor(item.title)}" aria-hidden="true">${monogram(item.title)}</span>
                    <span class="tab-card__title">${item.title}</span>
                    ${item.subtitle ? `<span class="tab-card__sub">${item.subtitle}</span>` : ''}`;
    return href
      ? `<a class="tab-card" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`
      : `<div class="tab-card tab-card--inert">${inner}</div>`;
  }).join('');
  return `<div class="tab-grid">${cards}
            </div>`;
}

// A KPI strip — four-ish figures across the top of a dashboard page. Values
// come from the data file; nothing is computed here, so nothing can silently
// drift from what the section actually declares.
function summaryView(stats) {
  const tiles = stats.map((s) => `
                <div class="stat-tile">
                    <span class="stat-tile__label">${s.label}</span>
                    <span class="stat-tile__value">${s.value}</span>
                </div>`).join('');
  return `<div class="stat-strip">${tiles}
            </div>`;
}

// Dispatch. `view` may be a bare string ("list") or the full object form.
export function renderView(items, view, ctx) {
  const v = typeof view === 'string' ? { type: view } : view;
  const parts = [];
  if (v.stats) parts.push(summaryView(v.stats));
  switch (v.type) {
    case 'agenda': parts.push(agendaView(items, v, ctx)); break;
    case 'cards': parts.push(cardsView(items, v, ctx)); break;
    case 'grid': parts.push(gridView(items, v, ctx)); break;
    case 'summary': break; // stats only
    case 'list':
    default: parts.push(listView(items, v, ctx)); break;
  }
  if (v.note) parts.push(androidOnlyNoteHtml(v.note));
  return parts.join('\n            ');
}
