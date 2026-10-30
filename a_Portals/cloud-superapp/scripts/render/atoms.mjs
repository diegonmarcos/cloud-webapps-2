// scripts/render/atoms.mjs — the smallest shared pieces every page view is
// built from.
//
// These are BUILD-TIME renderers: they run inside generate-pages.mjs and emit
// HTML strings. They deliberately do not live in src/lib/, which is the
// client-side TypeScript bundle — nothing here ships to the browser.
//
// Every atom is presentation-only and takes plain data. Anything app-specific
// (what a mail folder is, what a WireGuard peer is) belongs in the data files,
// not here — see src/data/sections-content.json's per-page `view` block.

// Deterministic 0..n-1 bucket from a string, so a given label always gets the
// same colour across every page it appears on. Same helper the tile grids and
// app icons already use.
export function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export const LEAD_COLORS = ['#1565C0', '#2E7D32', '#6A1B9A', '#C2185B', '#EF6C00', '#00695C', '#B28704', '#283593'];

export function leadColor(seed) {
  return LEAD_COLORS[hash(seed) % LEAD_COLORS.length];
}

// First letter of up to the first 2 words — "Hacker News" -> "HN". Strips the
// leading sigils real content carries (#ops -> O, •••• 4821 -> 4).
export function monogram(name) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '·';
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

// ── row leading slot ────────────────────────────────────────────────────
// One of: a tinted monogram square, an inline section icon, a status dot, or
// a thin colour accent bar. Decorative in every case — the row's own text is
// what the accessibility tree reads.
export function leadHtml(kind, { label, icon, tone, inlineIcon }) {
  switch (kind) {
    case 'monogram':
      return `<span class="row__lead row__lead--monogram" style="background:${leadColor(label)}" aria-hidden="true">${monogram(label)}</span>`;
    case 'icon':
      return `<span class="row__lead row__lead--icon" aria-hidden="true">${inlineIcon(icon)}</span>`;
    case 'dot':
      return `<span class="row__lead row__lead--dot row__lead--${tone ?? 'neutral'}" aria-hidden="true"></span>`;
    case 'accent':
      return `<span class="row__lead row__lead--accent" style="background:${leadColor(label)}" aria-hidden="true"></span>`;
    case 'none':
    default:
      return '';
  }
}

// ── row trailing slot ───────────────────────────────────────────────────
// badge  — an unread/count pill, hidden entirely when the count is absent
// pill   — a status word (green/amber/red/neutral by `tone`)
// amount — a signed currency figure, tinted by its own sign
// meta   — the plain monospace right-hand note the generic rows already used
export function trailHtml(kind, value, tone) {
  if (value === undefined || value === null || value === '') return '';
  switch (kind) {
    case 'badge':
      return `<span class="row__trail row__badge">${value}</span>`;
    case 'pill':
      return `<span class="row__trail row__pill row__pill--${tone ?? 'neutral'}">${value}</span>`;
    case 'amount': {
      const sign = String(value).trim().startsWith('-') ? 'down' : String(value).trim().startsWith('+') ? 'up' : 'flat';
      return `<span class="row__trail row__amount row__amount--${sign}">${value}</span>`;
    }
    case 'meta':
    default:
      return `<span class="row__trail row__meta">${value}</span>`;
  }
}

// ── page furniture ──────────────────────────────────────────────────────
export function groupHeadingHtml(text) {
  return `<h2 class="row-group__heading">${text}</h2>`;
}

// Shown instead of a body when a view has no rows at all — never a shimmer
// placeholder pretending data is on its way.
export function emptyStateHtml(title, body) {
  return `<div class="empty-state">
                <p class="empty-state__title">${title}</p>
                ${body ? `<p class="empty-state__body">${body}</p>` : ''}
            </div>`;
}

// A row whose action only exists on Android (extapp:/intent:/app:/action:).
// It must still be visible — the APK has that entry — but it must never look
// tappable, and it says why.
export function androidOnlyNoteHtml(text) {
  return `<p class="android-only-note">${text}</p>`;
}
