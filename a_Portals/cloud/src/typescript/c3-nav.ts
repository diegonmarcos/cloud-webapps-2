/**
 * c3-nav.ts — Wave 2 left hamburger nav + declarative section->tabs taxonomy.
 *
 * C3_NAV_SECTIONS is the single source of truth for the Information Architecture.
 * Both the hamburger drawer (list mode, grouped by section) and the horizontal
 * tab bar (flat, with divider marks between sections) render from this one
 * structure — no duplicated tab lists.
 */

export interface C3NavTab {
    key: string;
    label: string;
}

export interface C3NavSection {
    id: string;
    label: string;
    /** Single-glyph monogram shown in the drawer next to the section header. */
    icon: string;
    tabs: C3NavTab[];
}

// ── Deliverable 2: professional IA. Every existing tab key is preserved —
// this only regroups/relabels which section each tab lives under. ──
export const C3_NAV_SECTIONS: C3NavSection[] = [
    { id: 'overview', label: 'Overview', icon: 'O', tabs: [
        { key: 'health', label: 'Overview' },
    ] },
    { id: 'infrastructure', label: 'Infrastructure', icon: 'I', tabs: [
        { key: 'topology', label: 'Topology' },
        { key: 'resources', label: 'Resources' },
        { key: 'apps', label: 'Apps' },
        { key: 'profiling', label: 'Profiling' },
    ] },
    { id: 'observability', label: 'Observability', icon: 'B', tabs: [
        { key: 'metrics', label: 'Metrics' },
        { key: 'alerts', label: 'Alerts' },
        { key: 'events', label: 'Events' },
        { key: 'slo', label: 'SLO' },
    ] },
    { id: 'security', label: 'Security', icon: 'S', tabs: [
        { key: 'security', label: 'Security' },
    ] },
    { id: 'network', label: 'Network', icon: 'N', tabs: [
        { key: 'infra', label: 'Network' },
    ] },
    { id: 'operations', label: 'Operations', icon: 'P', tabs: [
        { key: 'workflows', label: 'Workflows' },
        { key: 'audit', label: 'Audit' },
        { key: 'ops', label: 'Ops' },
    ] },
    { id: 'finops', label: 'FinOps', icon: 'F', tabs: [
        { key: 'cost', label: 'Cost' },
    ] },
    // Each published report family gets its own entry — the section is a list of
    // reports, not a single "Reports" door you have to open and then re-navigate.
    // Keys mirror REPORT_FAMILIES in c3-reports.ts; `reports:<family>` is routed
    // to the reports view with that family preselected.
    { id: 'reports', label: 'Reports', icon: 'R', tabs: [
        { key: 'reports', label: 'All Reports' },
        { key: 'reports:daily', label: 'Cloud Health Daily' },
        { key: 'reports:mail', label: 'Mail Full' },
        { key: 'reports:sec-data', label: 'Security Data' },
        { key: 'reports:sec-network', label: 'Security Network' },
    ] },
];

/** Flat lookup of every tab key -> label, derived from C3_NAV_SECTIONS (no separate list to keep in sync). */
export function allNavTabs(): C3NavTab[] {
    return C3_NAV_SECTIONS.flatMap((s) => s.tabs);
}

const DRAWER_STATE_KEY = 'c3-nav-drawer-open';

export interface C3NavOptions {
    sections: C3NavSection[];
    /** Container for the horizontal tab bar (existing `.nav-level2` element). Cleared and re-rendered. */
    tabBarEl: HTMLElement | null;
    getActive: () => string;
    onSelect: (tab: string) => void;
}

export interface C3NavHandle {
    setActive: (tab: string) => void;
}

function escapeHtml(v: unknown): string {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function initC3Nav(opts: C3NavOptions): C3NavHandle {
    const { sections, tabBarEl, getActive, onSelect } = opts;

    // ── Horizontal tab bar (flat, dividers between sections) ──
    if (tabBarEl) {
        tabBarEl.innerHTML = '';
        sections.forEach((section, si) => {
            if (si > 0) {
                const divider = document.createElement('span');
                divider.className = 'nav-divider';
                tabBarEl.appendChild(divider);
            }
            section.tabs.forEach((tab) => {
                const btn = document.createElement('button');
                btn.className = 'view-btn';
                btn.type = 'button';
                btn.dataset.c3Tab = tab.key;
                btn.textContent = tab.label;
                btn.addEventListener('click', () => onSelect(tab.key));
                tabBarEl.appendChild(btn);
            });
        });
    }

    // ── Hamburger button ──
    let hamburger = document.getElementById('c3-nav-hamburger') as HTMLButtonElement | null;
    if (!hamburger) {
        hamburger = document.createElement('button');
        hamburger.id = 'c3-nav-hamburger';
        hamburger.className = 'c3-nav-hamburger';
        hamburger.type = 'button';
        hamburger.setAttribute('aria-label', 'Open navigation menu');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-controls', 'c3-nav-drawer');
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        document.body.prepend(hamburger);
    }

    // ── Drawer + backdrop ──
    let backdrop = document.getElementById('c3-nav-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'c3-nav-backdrop';
        backdrop.className = 'c3-nav-backdrop';
        backdrop.hidden = true;
        document.body.appendChild(backdrop);
    }

    let drawer = document.getElementById('c3-nav-drawer');
    if (!drawer) {
        drawer = document.createElement('nav');
        drawer.id = 'c3-nav-drawer';
        drawer.className = 'c3-nav-drawer';
        drawer.setAttribute('role', 'navigation');
        drawer.setAttribute('aria-label', 'Main navigation');
        drawer.hidden = true;
        document.body.appendChild(drawer);
    }

    drawer.innerHTML = `
        <div class="c3-nav-drawer-header">
            <span class="c3-nav-drawer-title">Cloud Control</span>
            <button class="c3-nav-drawer-close" id="c3-nav-drawer-close" aria-label="Close navigation menu" type="button">&times;</button>
        </div>
        <div class="c3-nav-drawer-body">
            ${sections.map((section) => `
                <div class="c3-nav-section">
                    <div class="c3-nav-section-header">
                        <span class="c3-nav-section-icon" aria-hidden="true">${escapeHtml(section.icon)}</span>
                        <span>${escapeHtml(section.label)}</span>
                    </div>
                    <ul class="c3-nav-section-list" role="group" aria-label="${escapeHtml(section.label)}">
                        ${section.tabs.map((tab) => `
                            <li>
                                <button class="c3-nav-tab-btn" type="button" data-c3-nav-tab="${escapeHtml(tab.key)}" tabindex="-1">${escapeHtml(tab.label)}</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    `;

    const drawerEl = drawer;
    const backdropEl = backdrop;
    const hamburgerEl = hamburger;

    function drawerButtons(): HTMLButtonElement[] {
        return Array.from(drawerEl.querySelectorAll<HTMLButtonElement>('[data-c3-nav-tab]'));
    }

    function markActive(tab: string): void {
        document.querySelectorAll<HTMLButtonElement>('[data-c3-tab]').forEach((b) => {
            b.classList.toggle('active', b.dataset.c3Tab === tab);
        });
        drawerButtons().forEach((b) => {
            b.classList.toggle('active', b.dataset.c3NavTab === tab);
            b.setAttribute('aria-current', b.dataset.c3NavTab === tab ? 'true' : 'false');
        });
    }

    function setDrawerOpen(open: boolean): void {
        drawerEl.hidden = !open;
        backdropEl.hidden = !open;
        hamburgerEl.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('c3-nav-open', open);
        try { localStorage.setItem(DRAWER_STATE_KEY, open ? '1' : '0'); } catch { /* ignore */ }
        if (open) {
            const buttons = drawerButtons();
            buttons.forEach((b) => b.tabIndex = -1);
            const activeBtn = buttons.find((b) => b.dataset.c3NavTab === getActive()) || buttons[0];
            if (activeBtn) {
                activeBtn.tabIndex = 0;
                activeBtn.focus();
            }
        } else {
            hamburgerEl.focus();
        }
    }

    hamburgerEl.addEventListener('click', () => setDrawerOpen(drawerEl.hidden));
    backdropEl.addEventListener('click', () => setDrawerOpen(false));
    drawerEl.querySelector('#c3-nav-drawer-close')?.addEventListener('click', () => setDrawerOpen(false));

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && !drawerEl.hidden) setDrawerOpen(false);
    });

    // Arrow-key navigation within the drawer's flat tab list.
    drawerEl.addEventListener('keydown', (ev) => {
        const buttons = drawerButtons();
        const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (idx === -1) return;
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
            ev.preventDefault();
            const next = ev.key === 'ArrowDown' ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length;
            buttons.forEach((b) => b.tabIndex = -1);
            buttons[next].tabIndex = 0;
            buttons[next].focus();
        } else if (ev.key === 'Home') {
            ev.preventDefault();
            buttons.forEach((b) => b.tabIndex = -1);
            buttons[0].tabIndex = 0;
            buttons[0].focus();
        } else if (ev.key === 'End') {
            ev.preventDefault();
            buttons.forEach((b) => b.tabIndex = -1);
            buttons[buttons.length - 1].tabIndex = 0;
            buttons[buttons.length - 1].focus();
        }
    });

    drawerButtons().forEach((btn) => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.c3NavTab as string;
            onSelect(tab);
            setDrawerOpen(false);
        });
    });

    // Restore persisted open/collapsed state. Default is OPEN — the drawer is
    // the primary navigation, so it's only closed if you explicitly closed it
    // (stored '0'); an absent key means first visit, which opens.
    // Default open on desktop only, where the drawer docks (see _c3-nav.scss).
    // Below 780px it's a modal overlay, so opening it by default would bury the
    // dashboard behind a backdrop on every load.
    let open = window.matchMedia('(min-width: 781px)').matches;
    try {
        const v = localStorage.getItem(DRAWER_STATE_KEY);
        if (v !== null) open = v === '1';
    } catch { /* ignore */ }
    setDrawerOpen(open);

    markActive(getActive());

    return {
        setActive: (tab: string) => markActive(tab),
    };
}

// ============================================================
// Self-check — no test framework available; console.assert only.
// Verifies the nav taxonomy is well-formed: every section has tabs,
// every tab key is unique, and every previously-existing tab key
// (Wave 1 flat tab set) still exists somewhere in the taxonomy.
// ============================================================
export function demoNav(): void {
    const PRE_EXISTING_TAB_KEYS = [
        'topology', 'health', 'resources', 'profiling', 'security', 'cost',
        'workflows', 'audit', 'infra', 'apps', 'metrics', 'alerts', 'events',
        'slo', 'ops',
    ];

    console.assert(C3_NAV_SECTIONS.length > 0, '[c3-nav demo] no sections defined');

    const allTabs = allNavTabs();
    const keys = allTabs.map((t) => t.key);
    const uniqueKeys = new Set(keys);
    console.assert(uniqueKeys.size === keys.length, '[c3-nav demo] duplicate tab keys across sections');

    C3_NAV_SECTIONS.forEach((section) => {
        console.assert(!!section.label, `[c3-nav demo] section ${section.id} missing a label`);
        console.assert(!!section.icon, `[c3-nav demo] section ${section.id} missing an icon`);
        console.assert(section.tabs.length > 0, `[c3-nav demo] section ${section.id} has no tabs`);
    });

    PRE_EXISTING_TAB_KEYS.forEach((key) => {
        console.assert(uniqueKeys.has(key), `[c3-nav demo] pre-existing tab key "${key}" missing from new taxonomy`);
    });

    console.log(`[c3-nav demo] ${C3_NAV_SECTIONS.length} sections / ${keys.length} tabs verified`);
}
