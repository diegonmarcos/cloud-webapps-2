/**
 * c3-reports.ts — Wave 2 Reports section (Deliverable 3).
 *
 * Data source is the PUBLIC GitHub repo diegonmarcos/cloud-data — deliberately
 * NOT c3-infra-api, so this section still works when the WireGuard-only API
 * is down. Renders each report family as structured c3Table/c3Stat/c3Badge/
 * c3Panel views (JSON mode) or via c3Markdown (Markdown mode).
 *
 * Also supports dispatching the `cloud-health-reports.yml` workflow using a
 * user-supplied GitHub token — the token is NEVER hardcoded/bundled/committed;
 * it lives only in localStorage under `c3-gh-token`, entered by the user at
 * runtime.
 */

import { c3Panel, c3Stat, c3Table, c3Badge, c3Markdown, C3Severity } from './c3-ui';

const REPORTS_BASE = 'https://raw.githubusercontent.com/diegonmarcos/cloud-data/main/reports/dist/';
const GH_TOKEN_KEY = 'c3-gh-token';
const GH_OWNER = 'diegonmarcos';
const GH_REPO = 'cloud';
const GH_WORKFLOW = 'cloud-health-reports.yml';
const WORKFLOW_URL = `https://github.com/${GH_OWNER}/${GH_REPO}/actions/workflows/${GH_WORKFLOW}`;

type ReportInput = 'all' | 'cloud' | 'mail' | 'url' | 'sec-network' | 'sec-data' | 'daily-mail';

interface ReportFamily {
    key: string;
    label: string;
    jsonFile: string;
    mdFile: string;
    dispatchInput: ReportInput;
}

const REPORT_FAMILIES: ReportFamily[] = [
    { key: 'daily', label: 'Cloud Health Daily', jsonFile: 'cloud_health_daily.json', mdFile: 'cloud_health_daily.md', dispatchInput: 'cloud' },
    { key: 'mail', label: 'Mail Full', jsonFile: 'cloud_mail_full.json', mdFile: 'cloud_mail_full.md', dispatchInput: 'mail' },
    { key: 'sec-data', label: 'Security Data', jsonFile: 'cloud_sec_data.json', mdFile: 'cloud_sec_data.md', dispatchInput: 'sec-data' },
    { key: 'sec-network', label: 'Security Network', jsonFile: 'cloud_sec_network.json', mdFile: 'cloud_sec_network.md', dispatchInput: 'sec-network' },
];

interface ReportState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    json?: any;
    md?: string;
    error?: string;
}

const state: Record<string, ReportState> = {};
let activeFamily = REPORT_FAMILIES[0].key;
let activeView: 'json' | 'markdown' = 'json';
let mounted = false;
let rootEl: HTMLElement | null = null;

function escapeHtml(v: unknown): string {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function fmtAge(ms: number): string {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

/** Reports use either a `generated` ISO timestamp, or a `date` + `time` pair (e.g. "2026-07-11" / "19:34 UTC"). */
function extractGeneratedAt(data: any): Date | null {
    if (!data || typeof data !== 'object') return null;
    if (typeof data.generated === 'string') {
        const d = new Date(data.generated);
        if (!isNaN(d.getTime())) return d;
    }
    if (typeof data.date === 'string' && typeof data.time === 'string') {
        const timePart = data.time.replace(/\s*UTC\s*$/i, 'Z');
        const d = new Date(`${data.date}T${timePart}`);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
}

async function loadFamily(key: string): Promise<void> {
    const family = REPORT_FAMILIES.find((f) => f.key === key);
    if (!family) return;
    state[key] = { status: 'loading' };
    render();
    try {
        const [jsonText, mdText] = await Promise.all([
            fetchText(REPORTS_BASE + family.jsonFile),
            fetchText(REPORTS_BASE + family.mdFile),
        ]);
        let json: any = null;
        try { json = JSON.parse(jsonText); } catch { /* leave null, still show md */ }
        state[key] = { status: 'ready', json, md: mdText };
    } catch (err) {
        state[key] = { status: 'error', error: err instanceof Error ? err.message : String(err) };
    }
    render();
}

function flattenRows(data: any): Array<Record<string, unknown>> {
    if (Array.isArray(data)) return data.filter((r) => r && typeof r === 'object');
    return [];
}

function renderJsonView(data: any): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'c3-reports-json';
    if (!data || typeof data !== 'object') {
        wrap.innerHTML = '<div class="c3-empty-state">No structured data available.</div>';
        return wrap;
    }

    // Summary block -> c3Stat grid.
    const summary = data.summary && typeof data.summary === 'object' ? data.summary : null;
    if (summary) {
        const statGrid = document.createElement('div');
        statGrid.className = 'c3-reports-stat-grid';
        Object.entries(summary).forEach(([k, v]) => {
            if (typeof v === 'object') return;
            let severity: C3Severity = 'info';
            const kl = k.toLowerCase();
            if (typeof v === 'number') {
                if ((kl.includes('fail') || kl.includes('critical')) && v > 0) severity = 'error';
                else if (kl.includes('warn') && v > 0) severity = 'warn';
                else if (kl.includes('pass') || kl.includes('ok')) severity = 'ok';
            }
            const stat = c3Stat({ label: k, value: v as any });
            if (severity !== 'info') stat.classList.add(`c3-stat--${severity}`);
            statGrid.appendChild(stat);
        });
        wrap.appendChild(c3Panel({ title: 'Summary', body: statGrid }));
    }

    // Every other top-level array/object -> table or key/value panel.
    const skipKeys = new Set(['summary', 'generated', 'date', 'time', 'duration_ms', 'generation_duration_ms']);
    Object.entries(data).forEach(([key, value]) => {
        if (skipKeys.has(key)) return;
        if (Array.isArray(value)) {
            const rows = flattenRows(value);
            if (!rows.length) return;
            const cols = Array.from(rows.reduce((set, row) => {
                Object.keys(row).forEach((c) => set.add(c));
                return set;
            }, new Set<string>())).slice(0, 8);
            const table = c3Table({
                columns: cols.map((c) => ({ key: c, label: c })),
                rows: rows.slice(0, 100).map((r) => {
                    const out: Record<string, unknown> = {};
                    cols.forEach((c) => {
                        const v = (r as any)[c];
                        out[c] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
                    });
                    return out;
                }),
            });
            wrap.appendChild(c3Panel({ title: `${key} (${rows.length})`, body: table }));
        } else if (value && typeof value === 'object') {
            const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => typeof v !== 'object');
            if (!entries.length) return;
            const table = c3Table({
                columns: [{ key: 'k', label: 'Key' }, { key: 'v', label: 'Value' }],
                rows: entries.map(([k, v]) => ({ k, v: v as any })),
            });
            wrap.appendChild(c3Panel({ title: key, body: table }));
        }
    });

    if (!wrap.children.length) {
        wrap.innerHTML = '<div class="c3-empty-state">No renderable fields in this report.</div>';
    }
    return wrap;
}

function renderFreshness(data: any): HTMLElement {
    const box = document.createElement('div');
    box.className = 'c3-reports-freshness';
    const generatedAt = extractGeneratedAt(data);
    if (!generatedAt) {
        box.appendChild(c3Badge('unknown age', 'unknown'));
        return box;
    }
    const ageMs = Date.now() - generatedAt.getTime();
    const stale = ageMs > 48 * 60 * 60 * 1000;
    const label = document.createElement('span');
    label.className = 'c3-reports-freshness-label';
    label.textContent = `Generated ${generatedAt.toLocaleString()} (${fmtAge(ageMs)})`;
    box.appendChild(label);
    box.appendChild(c3Badge(stale ? 'STALE (>48h)' : 'fresh', stale ? 'warn' : 'ok'));
    return box;
}

// ── GitHub Actions workflow dispatch (security-critical: no hardcoded token) ──

function getToken(): string | null {
    try { return localStorage.getItem(GH_TOKEN_KEY); } catch { return null; }
}

async function dispatchWorkflow(input: ReportInput, statusEl: HTMLElement): Promise<void> {
    const token = getToken();
    if (!token) {
        statusEl.textContent = 'No token stored — add one first.';
        return;
    }
    statusEl.textContent = 'Dispatching…';
    try {
        const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ref: 'main', inputs: { report: input } }),
        });
        if (res.status === 204) {
            statusEl.textContent = 'Dispatched. Polling run status…';
            pollRunStatus(statusEl);
        } else {
            statusEl.textContent = `Dispatch failed: HTTP ${res.status}`;
        }
    } catch (err) {
        statusEl.textContent = `Dispatch failed: ${err instanceof Error ? err.message : String(err)}`;
    }
}

async function pollRunStatus(statusEl: HTMLElement): Promise<void> {
    const token = getToken();
    if (!token) return;
    let attempts = 0;
    const poll = async () => {
        attempts++;
        try {
            const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/runs?per_page=1`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
            });
            if (res.ok) {
                const data = await res.json();
                const run = data.workflow_runs?.[0];
                if (run) {
                    statusEl.textContent = `Run #${run.run_number}: ${run.status}${run.conclusion ? ' / ' + run.conclusion : ''}`;
                    if (run.status === 'completed') return;
                }
            }
        } catch { /* keep polling */ }
        if (attempts < 30) setTimeout(poll, 10000);
    };
    poll();
}

function renderTriggerControl(): HTMLElement {
    const box = document.createElement('div');
    box.className = 'c3-reports-trigger';
    const token = getToken();
    const family = REPORT_FAMILIES.find((f) => f.key === activeFamily)!;

    const status = document.createElement('span');
    status.className = 'c3-reports-trigger-status';

    if (token) {
        const runBtn = document.createElement('button');
        runBtn.className = 'c3-action-btn';
        runBtn.type = 'button';
        runBtn.textContent = `Run report (${family.dispatchInput})`;
        runBtn.addEventListener('click', () => dispatchWorkflow(family.dispatchInput, status));
        box.appendChild(runBtn);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'c3-action-btn';
        clearBtn.type = 'button';
        clearBtn.textContent = 'Remove token';
        clearBtn.addEventListener('click', () => {
            try { localStorage.removeItem(GH_TOKEN_KEY); } catch { /* ignore */ }
            render();
        });
        box.appendChild(clearBtn);
    } else {
        const link = document.createElement('a');
        link.href = WORKFLOW_URL;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Run workflow on GitHub →';
        box.appendChild(link);

        const addBtn = document.createElement('button');
        addBtn.className = 'c3-action-btn';
        addBtn.type = 'button';
        addBtn.textContent = '+ add token';
        addBtn.title = 'Needs actions:write scope. Stored only in this browser’s localStorage — never sent anywhere but api.github.com.';
        addBtn.addEventListener('click', () => {
            const value = window.prompt('Paste a GitHub token with actions:write scope. It is stored only in this browser (localStorage) and never bundled or committed.');
            if (value) {
                try { localStorage.setItem(GH_TOKEN_KEY, value.trim()); } catch { /* ignore */ }
                render();
            }
        });
        box.appendChild(addBtn);
    }
    box.appendChild(status);
    return box;
}

function render(): void {
    if (!rootEl) return;
    rootEl.innerHTML = '';

    const subtabs = document.createElement('div');
    subtabs.className = 'c3-reports-subtabs';
    REPORT_FAMILIES.forEach((f) => {
        const btn = document.createElement('button');
        btn.className = 'view-btn' + (f.key === activeFamily ? ' active' : '');
        btn.type = 'button';
        btn.textContent = f.label;
        btn.addEventListener('click', () => {
            activeFamily = f.key;
            if (!state[f.key] || state[f.key].status === 'error') loadFamily(f.key);
            render();
        });
        subtabs.appendChild(btn);
    });
    rootEl.appendChild(subtabs);

    const toolbar = document.createElement('div');
    toolbar.className = 'c3-reports-toolbar';
    (['json', 'markdown'] as const).forEach((view) => {
        const btn = document.createElement('button');
        btn.className = 'view-btn' + (activeView === view ? ' active' : '');
        btn.type = 'button';
        btn.textContent = view === 'json' ? 'Rendered JSON' : 'Markdown';
        btn.addEventListener('click', () => { activeView = view; render(); });
        toolbar.appendChild(btn);
    });
    rootEl.appendChild(toolbar);
    rootEl.appendChild(renderTriggerControl());

    const current = state[activeFamily];
    const content = document.createElement('div');
    content.className = 'c3-reports-content';

    if (!current || current.status === 'loading') {
        content.innerHTML = '<div class="c3-state" role="status" aria-live="polite"><span class="c3-spinner" aria-hidden="true"></span> Loading…</div>';
    } else if (current.status === 'error') {
        const errBox = document.createElement('div');
        errBox.className = 'c3-state c3-state--error';
        errBox.setAttribute('role', 'alert');
        errBox.textContent = `Failed to load report: ${escapeHtml(current.error)}`;
        content.appendChild(errBox);
        const retry = document.createElement('button');
        retry.className = 'c3-action-btn';
        retry.type = 'button';
        retry.textContent = 'Retry';
        retry.addEventListener('click', () => loadFamily(activeFamily));
        content.appendChild(retry);
    } else if (current.status === 'ready') {
        content.appendChild(renderFreshness(current.json));
        if (activeView === 'json') {
            content.appendChild(renderJsonView(current.json));
        } else {
            content.appendChild(c3Markdown(current.md || ''));
        }
    }
    rootEl.appendChild(content);
}

/** Mounts (once) into the given container and kicks off the first fetch. Safe to call repeatedly — subsequent calls just re-render current state. */
export function initC3Reports(container: HTMLElement, family?: string): void {
    rootEl = container;
    // The left nav lists every report family as its own entry (`reports:<key>`),
    // so it can deep-link straight into one instead of landing on the section
    // and making you pick again.
    const target = family && REPORT_FAMILIES.some((f) => f.key === family) ? family : null;
    if (target && target !== activeFamily) {
        activeFamily = target;
        mounted = true;
        loadFamily(activeFamily);
        return;
    }
    if (!mounted) {
        mounted = true;
        loadFamily(activeFamily);
    } else {
        render();
    }
}
