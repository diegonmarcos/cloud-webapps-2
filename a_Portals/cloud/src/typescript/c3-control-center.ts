/**
 * Cloud Control Center — data-driven rendering for cloud_control_center.html
 * Renders every tab from c3-api.ts (mock by default, live on demand).
 */

import {
    c3, c3All, c3Post, getCached, getMode, setMode, onModeChange, REGISTRY, lastErrors,
    c3ContainerInspect, c3ContainerStats, c3ContainerLogsMock, c3ContainerExec, EXEC_COMMAND_ALLOWLIST, C3_BASE,
} from './c3-api';
import { initC3Nav, C3_NAV_SECTIONS, demoNav } from './c3-nav';
import { initC3Reports } from './c3-reports';

const TAB_KEYS: Record<string, string[]> = {
    topology: ['topology', 'topology-network', 'topology-drift'],
    health: ['health-declared', 'health-deployed', 'health-drift', 'health-tier1', 'up-all'],
    resources: ['container-resources', 'services', 'specs'],
    profiling: ['profiling-all'],
    security: ['security-scan', 'security-docker', 'security-ssh', 'security-tokens', 'security-wireguard'],
    cost: ['cloud-summary', 'oci-costs', 'gcp-costs'],
    workflows: ['workflows', 'workflows-dagu'],
    audit: ['db-audit', 'db-deploy-history', 'db-health-history', 'db-uptime'],
    infra: ['caddy-routes', 'cloudflare-dns', 'firewall-rules', 'wireguard-peers', 'dns-services', 'backup-targets', 'home-manager'],
    apps: ['services'],
    metrics: ['metrics-top', 'metrics-series'],
    alerts: ['alerts-active', 'alerts-rules', 'alerts-history'],
    events: ['events'],
    slo: ['slo'],
};

let eventsRaw: any[] = [];
let eventsFilterWired = false;

function escapeHtml(v: unknown): string {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function flattenRows(data: any): Array<Record<string, unknown>> {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
        // Common shapes: { services: [...] }, { results: [...] }, { records: [...] }, { runs: [...] }, { dags: [...] }
        for (const field of ['services', 'results', 'records', 'runs', 'dags', 'routes', 'peers', 'targets', 'entries', 'deploys', 'history', 'report', 'checks', 'findings', 'exposed', 'containers']) {
            if (Array.isArray(data[field])) return data[field];
        }
        // { services: {name: {...}} } style maps
        for (const field of ['services', 'vms']) {
            if (data[field] && typeof data[field] === 'object' && !Array.isArray(data[field])) {
                return Object.entries(data[field] as Record<string, unknown>).map(([k, v]) => ({ key: k, ...(typeof v === 'object' && v !== null ? v as object : { value: v }) }));
            }
        }
    }
    return [];
}

function renderTable(container: HTMLElement, data: any): void {
    try {
        const rows = flattenRows(data);
        if (!rows.length) {
            container.innerHTML = '<div class="c3-empty-state">No data available.</div>';
            return;
        }
        const cols = Array.from(rows.reduce((set, row) => {
            Object.keys(row || {}).forEach((k) => set.add(k));
            return set;
        }, new Set<string>())).slice(0, 8);

        const thead = `<thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${rows.map((row) => `<tr>${cols.map((c) => {
            const v = (row as any)[c];
            const text = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
            return `<td>${escapeHtml(text)}</td>`;
        }).join('')}</tr>`).join('')}</tbody>`;

        container.innerHTML = `<table class="resources-table">${thead}${tbody}</table>`;
    } catch (err) {
        container.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

function renderContainerResources(container: HTMLElement, data: any): void {
    try {
        const rows = flattenRows(data);
        if (!rows.length) {
            container.innerHTML = '<div class="c3-empty-state">No data available.</div>';
            return;
        }
        const cols = Array.from(rows.reduce((set, row) => {
            Object.keys(row || {}).forEach((k) => set.add(k));
            return set;
        }, new Set<string>())).slice(0, 8);

        const thead = `<thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}<th>Action</th></tr></thead>`;
        const tbody = `<tbody>${rows.map((row) => {
            const svc = row as any;
            const vm = svc.vm ?? '';
            const containerName = Array.isArray(svc.containers) && svc.containers.length ? svc.containers[0] : (svc.key ?? '');
            return `<tr data-drawer-vm="${escapeHtml(vm)}" data-drawer-name="${escapeHtml(containerName)}">${cols.map((c) => {
                const v = svc[c];
                const text = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
                return `<td>${escapeHtml(text)}</td>`;
            }).join('')}<td><button class="c3-action-btn" data-drawer-open data-drawer-vm="${escapeHtml(vm)}" data-drawer-name="${escapeHtml(containerName)}" ${vm && containerName ? '' : 'disabled'}>Inspect</button></td></tr>`;
        }).join('')}</tbody>`;

        container.innerHTML = `<table class="resources-table">${thead}${tbody}</table>`;

        container.querySelectorAll<HTMLElement>('tr[data-drawer-vm]').forEach((tr) => {
            tr.addEventListener('click', (ev) => {
                if ((ev.target as HTMLElement).closest('button')) return; // let the explicit button handle its own click
                const vm = tr.dataset.drawerVm;
                const name = tr.dataset.drawerName;
                if (vm && name) openContainerDrawer(vm, name);
            });
        });
        container.querySelectorAll<HTMLButtonElement>('[data-drawer-open]').forEach((btn) => {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const vm = btn.dataset.drawerVm;
                const name = btn.dataset.drawerName;
                if (vm && name) openContainerDrawer(vm, name);
            });
        });
    } catch (err) {
        container.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

function renderApps(container: HTMLElement, data: any): void {
    try {
        const rows: any[] = flattenRows(data);
        if (!rows.length) {
            container.innerHTML = '<div class="c3-empty-state">No services available.</div>';
            return;
        }
        container.innerHTML = `<div class="card-container">${rows.map((s) => `
            <div class="card-box">
                <strong>${escapeHtml(s.name)}</strong>
                <div>${escapeHtml(s.description || '')}</div>
                <div>${s.domain ? `<a href="https://${escapeHtml(s.domain)}" target="_blank" rel="noopener">${escapeHtml(s.domain)}</a>` : (s.wg_only ? '<span class="badge">VPN</span>' : '<span class="badge">Internal</span>')}</div>
            </div>
        `).join('')}</div>`;
    } catch (err) {
        container.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

function sparklineSvg(points: Array<{ ts: string; value: number }>): string {
    if (!points.length) return '<div class="c3-empty-state">No series data.</div>';
    const w = 480;
    const h = 90;
    const pad = 6;
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = (w - pad * 2) / Math.max(1, points.length - 1);
    const coords = points.map((p, i) => {
        const x = pad + i * step;
        const y = h - pad - ((p.value - min) / range) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const last = points[points.length - 1];
    return `
        <svg class="c3-sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
            <polyline points="${coords.join(' ')}" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
        <div class="c3-sparkline-legend">min ${escapeHtml(min)} · max ${escapeHtml(max)} · latest ${escapeHtml(last.value)} @ ${escapeHtml(last.ts)}</div>
    `;
}

function renderMetricsSeries(container: HTMLElement, data: any): void {
    try {
        const points: Array<{ ts: string; value: number }> = Array.isArray(data?.points) ? data.points : [];
        if (!points.length) {
            container.innerHTML = '<div class="c3-empty-state">No data available.</div>';
            return;
        }
        container.innerHTML = `<div class="c3-series-label">${escapeHtml(data.target)} · ${escapeHtml(data.metric)}</div>${sparklineSvg(points)}`;
    } catch (err) {
        container.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

function renderAlertsActive(container: HTMLElement, data: any): void {
    try {
        const rows: any[] = flattenRows(data);
        if (!rows.length) {
            container.innerHTML = '<div class="c3-empty-state">No active alerts.</div>';
            return;
        }
        container.innerHTML = `<table class="resources-table"><thead><tr><th>Target</th><th>Metric</th><th>Value</th><th>Status</th><th>Since</th><th>Acked</th><th>Action</th></tr></thead><tbody>${rows.map((a) => `
            <tr>
                <td>${escapeHtml(a.target)}</td>
                <td>${escapeHtml(a.metric)}</td>
                <td>${escapeHtml(a.value)}</td>
                <td>${escapeHtml(a.status)}</td>
                <td>${escapeHtml(a.ts)}</td>
                <td>${a.acked ? 'yes' : 'no'}</td>
                <td>${a.acked ? '' : `<button class="c3-action-btn" data-ack-id="${escapeHtml(a.id)}">Ack</button>`}</td>
            </tr>
        `).join('')}</tbody></table>`;

        container.querySelectorAll<HTMLButtonElement>('[data-ack-id]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.ackId;
                if (!id) return;
                btn.disabled = true;
                const res = await c3Post(`/alerts/${id}/ack`, {});
                btn.textContent = res.mock ? 'Acked (simulated)' : (res.ok ? 'Acked' : 'Failed');
            });
        });
    } catch (err) {
        container.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

function renderEventsTimeline(container: HTMLElement, data: any, filterType: string): void {
    try {
        const rows: any[] = Array.isArray(data?.events) ? data.events : flattenRows(data);
        eventsRaw = rows;
        const filtered = filterType ? rows.filter((e) => e.type === filterType) : rows;
        const sorted = [...filtered].sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
        if (!sorted.length) {
            container.innerHTML = '<div class="c3-empty-state">No events available.</div>';
            return;
        }
        container.innerHTML = `<ul class="c3-timeline">${sorted.map((e) => `
            <li class="c3-timeline-item c3-timeline-item--${escapeHtml(e.type)}">
                <span class="c3-timeline-type">${escapeHtml(e.type)}</span>
                <span class="c3-timeline-ts">${escapeHtml(e.ts)}</span>
                <span class="c3-timeline-summary">${escapeHtml(e.summary)}</span>
            </li>
        `).join('')}</ul>`;
    } catch (err) {
        container.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

function renderSlo(container: HTMLElement, data: any): void {
    try {
        const rows: any[] = Array.isArray(data?.slos) ? data.slos : flattenRows(data);
        if (!rows.length) {
            container.innerHTML = '<div class="c3-empty-state">No SLO data available.</div>';
            return;
        }
        container.innerHTML = `<div class="c3-slo-grid">${rows.map((s) => {
            const pct = Math.max(0, Math.min(100, s.uptimePercent ?? 0));
            const breached = !!s.breached;
            return `
            <div class="c3-slo-card ${breached ? 'c3-slo-card--breached' : ''}">
                <div class="c3-slo-service">${escapeHtml(s.vm ?? s.service)}</div>
                <div class="c3-slo-uptime">${escapeHtml(pct)}% <span class="c3-slo-target">/ ${escapeHtml(s.target)}% target</span></div>
                <div class="c3-slo-bar"><div class="c3-slo-bar-fill" style="width:${pct}%"></div></div>
                <div class="c3-slo-budget">Error budget remaining: ${escapeHtml(s.errorBudgetRemainingPercent)}% (${escapeHtml(s.errorBudgetRemainingPercentOfBudget)}% of budget)${breached ? ' — BREACHED' : ''}</div>
            </div>
        `; }).join('')}</div>`;
    } catch (err) {
        container.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

async function renderTab(tab: string): Promise<void> {
    const keys = TAB_KEYS[tab] || [];
    for (const key of keys) {
        const data = getMode() === 'mock' ? await c3(key) : getCached(key);
        if (tab === 'apps') {
            const el = document.getElementById('c3-apps-cards');
            if (el) renderApps(el, data);
            continue;
        }
        if (key === 'metrics-series') {
            const el = document.getElementById('c3-metrics-series');
            if (el) renderMetricsSeries(el, data);
            continue;
        }
        if (key === 'alerts-active') {
            const el = document.getElementById('c3-alerts-active');
            if (el) renderAlertsActive(el, data);
            continue;
        }
        if (key === 'events') {
            const el = document.getElementById('c3-events-timeline');
            const select = document.getElementById('c3-events-type-filter') as HTMLSelectElement | null;
            if (el) renderEventsTimeline(el, data, select?.value || '');
            if (select && !eventsFilterWired) {
                eventsFilterWired = true;
                select.addEventListener('change', () => {
                    const timelineEl = document.getElementById('c3-events-timeline');
                    if (timelineEl) renderEventsTimeline(timelineEl, { events: eventsRaw }, select.value);
                });
            }
            continue;
        }
        if (key === 'slo') {
            const el = document.getElementById('c3-slo-view');
            if (el) renderSlo(el, data);
            continue;
        }
        if (key === 'container-resources') {
            const el = document.getElementById('c3-table-' + key);
            if (el) renderContainerResources(el, data);
            continue;
        }
        const el = document.getElementById('c3-table-' + key);
        if (!el) continue;
        renderTable(el, data);
    }
}

async function renderAllTabs(): Promise<void> {
    for (const tab of Object.keys(TAB_KEYS)) {
        await renderTab(tab);
    }
    renderOps();
}

function renderOps(): void {
    const el = document.getElementById('c3-ops-table');
    if (!el) return;
    try {
        const data = getCached('services') || {};
        const rows: any[] = flattenRows(data);
        if (!rows.length) {
            el.innerHTML = '<div class="c3-empty-state">No services available.</div>';
            return;
        }
        el.innerHTML = `<table class="resources-table"><thead><tr><th>Service</th><th>VM</th><th>Actions</th></tr></thead><tbody>${rows.map((s) => `
            <tr>
                <td>${escapeHtml(s.name)}</td>
                <td>${escapeHtml(s.vm)}</td>
                <td>
                    <button class="c3-action-btn" data-action="restart" data-vm="${escapeHtml(s.vm)}" data-name="${escapeHtml(s.name)}">Restart</button>
                    <button class="c3-action-btn" data-action="stop" data-vm="${escapeHtml(s.vm)}" data-name="${escapeHtml(s.name)}">Stop</button>
                    <button class="c3-action-btn" disabled title="not implemented in c3-infra-api yet">Update</button>
                    <button class="c3-action-btn" disabled title="not implemented in c3-infra-api yet">Backup</button>
                </td>
            </tr>
        `).join('')}</tbody></table>`;

        el.querySelectorAll<HTMLButtonElement>('.c3-action-btn[data-action]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                const vm = btn.dataset.vm;
                const name = btn.dataset.name;
                if (!vm || !name || !action) return;
                btn.disabled = true;
                const res = await c3Post(`/vms/${vm}/containers/${name}/${action}`, {});
                btn.disabled = false;
                btn.title = res.mock ? 'simulated (mock mode)' : (res.ok ? 'ok' : 'failed');
            });
        });
    } catch (err) {
        el.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

// ── Per-container drawer ──

let drawerVm: string | null = null;
let drawerName: string | null = null;
let drawerLogsTimer: ReturnType<typeof setInterval> | null = null;
let drawerEventSource: EventSource | null = null;

function stopDrawerLogs(): void {
    if (drawerLogsTimer !== null) {
        clearInterval(drawerLogsTimer);
        drawerLogsTimer = null;
    }
    if (drawerEventSource !== null) {
        drawerEventSource.close();
        drawerEventSource = null;
    }
}

function appendLogLine(body: HTMLElement, text: string): void {
    const line = document.createElement('div');
    line.className = 'c3-drawer-log-line';
    line.textContent = text;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
}

function startDrawerLogs(vm: string, name: string): void {
    const body = document.getElementById('c3-drawer-logs-body');
    if (!body) return;
    body.innerHTML = '';

    if (getMode() === 'mock') {
        // MOCK: never open an EventSource — replay the mock log array on a timer so it demos offline.
        const lines = c3ContainerLogsMock(name);
        if (!lines.length) {
            body.innerHTML = '<div class="c3-empty-state">No log data available.</div>';
            return;
        }
        let i = 0;
        appendLogLine(body, `[${lines[0].ts}] ${lines[0].line}`);
        i = 1;
        drawerLogsTimer = setInterval(() => {
            if (i >= lines.length) {
                i = 0; // loop the replay so the demo keeps showing activity
                return;
            }
            appendLogLine(body, `[${lines[i].ts}] ${lines[i].line}`);
            i += 1;
        }, 1500);
        return;
    }

    // LIVE: real EventSource against C3_BASE only. Closed on drawer close / container switch / mode change.
    try {
        const es = new EventSource(`${C3_BASE}/logs/stream/${encodeURIComponent(vm)}/${encodeURIComponent(name)}`);
        drawerEventSource = es;
        es.addEventListener('log', (ev) => appendLogLine(body, (ev as MessageEvent).data));
        es.addEventListener('stderr', (ev) => appendLogLine(body, '[stderr] ' + (ev as MessageEvent).data));
        es.addEventListener('close', (ev) => appendLogLine(body, '[closed] ' + (ev as MessageEvent).data));
        es.onerror = () => appendLogLine(body, '[error] log stream disconnected');
    } catch (err) {
        body.innerHTML = `<div class="c3-empty-state">Log stream failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

function renderInspectPanel(data: any): void {
    const el = document.getElementById('c3-drawer-panel-inspect');
    if (!el) return;
    if (!data) {
        el.innerHTML = '<div class="c3-empty-state">No inspect data available.</div>';
        return;
    }
    try {
        const envRows = Object.entries(data.env || {}).map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('');
        const mounts = Array.isArray(data.mounts) ? data.mounts : [];
        const mountRows = mounts.map((m: any) => `<tr><td>${escapeHtml(m.source)}</td><td>${escapeHtml(m.destination)}</td><td>${escapeHtml(m.mode)}</td></tr>`).join('');
        el.innerHTML = `
            <div class="c3-drawer-field"><strong>Image</strong> ${escapeHtml(data.image)}</div>
            <div class="c3-drawer-field"><strong>Digest</strong> ${escapeHtml(data.imageDigest ?? 'unknown')}</div>
            <div class="c3-drawer-field"><strong>State</strong> ${escapeHtml(data.state)}</div>
            <div class="c3-drawer-field"><strong>Ports</strong> ${escapeHtml(JSON.stringify(data.ports ?? {}))}</div>
            <div class="c3-drawer-subtitle">Mounts</div>
            <table class="resources-table">${mountRows ? `<thead><tr><th>Source</th><th>Destination</th><th>Mode</th></tr></thead><tbody>${mountRows}</tbody>` : ''}</table>
            ${mountRows ? '' : '<div class="c3-empty-state">No mounts.</div>'}
            <div class="c3-drawer-subtitle">Env (secrets redacted by the API)</div>
            <table class="resources-table">${envRows ? `<thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>${envRows}</tbody>` : ''}</table>
            ${envRows ? '' : '<div class="c3-empty-state">No env vars.</div>'}
        `;
    } catch (err) {
        el.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

async function renderStatsPanel(vm: string, name: string): Promise<void> {
    const el = document.getElementById('c3-drawer-stats-body');
    if (!el) return;
    const data = await c3ContainerStats(vm, name);
    if (!data) {
        el.innerHTML = '<div class="c3-empty-state">No stats available.</div>';
        return;
    }
    try {
        el.innerHTML = `
            <div class="c3-drawer-field"><strong>CPU</strong> ${escapeHtml(data.cpuPerc)}</div>
            <div class="c3-drawer-field"><strong>Mem</strong> ${escapeHtml(data.memUsage)} (${escapeHtml(data.memPerc)})</div>
            <div class="c3-drawer-field"><strong>Net I/O</strong> ${escapeHtml(data.netIO)}</div>
            <div class="c3-drawer-field"><strong>Block I/O</strong> ${escapeHtml(data.blockIO)}</div>
            <div class="c3-drawer-field"><strong>PIDs</strong> ${escapeHtml(data.pids)}</div>
        `;
    } catch (err) {
        el.innerHTML = `<div class="c3-empty-state">Render failed: ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
    }
}

function renderExecPanel(vm: string, name: string): void {
    const controls = document.getElementById('c3-drawer-exec-controls');
    const output = document.getElementById('c3-drawer-exec-output');
    if (!controls || !output) return;

    output.textContent = '';
    const mockGate = getMode() === 'mock';
    controls.innerHTML = `
        ${mockGate ? '<div class="c3-empty-state">Mock mode: exec is a simulated response, not a real command run.</div>' : ''}
        <div class="c3-drawer-exec-btns">
            ${EXEC_COMMAND_ALLOWLIST.map((cmd) => `<button class="c3-action-btn" data-exec-cmd="${escapeHtml(cmd)}">${escapeHtml(cmd)}</button>`).join('')}
        </div>
    `;

    controls.querySelectorAll<HTMLButtonElement>('[data-exec-cmd]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const cmd = btn.dataset.execCmd;
            if (!cmd) return;
            controls.querySelectorAll('button').forEach((b) => (b as HTMLButtonElement).disabled = true);
            output.textContent = 'Running...';
            const res = await c3ContainerExec(vm, name, cmd);
            output.textContent = (res.mock ? '(mock) ' : '') + res.output;
            controls.querySelectorAll('button').forEach((b) => (b as HTMLButtonElement).disabled = false);
        });
    });
}

async function openContainerDrawer(vm: string, name: string): Promise<void> {
    // Switching container while open must tear down the previous container's timer/EventSource first.
    stopDrawerLogs();
    drawerVm = vm;
    drawerName = name;

    const drawer = document.getElementById('c3-drawer');
    const backdrop = document.getElementById('c3-drawer-backdrop');
    const title = document.getElementById('c3-drawer-title');
    if (title) title.textContent = `${name} (${vm})`;
    drawer?.removeAttribute('hidden');
    backdrop?.removeAttribute('hidden');

    const inspectData = await c3ContainerInspect(vm, name);
    renderInspectPanel(inspectData);
    await renderStatsPanel(vm, name);
    startDrawerLogs(vm, name);
    renderExecPanel(vm, name);

    const refreshBtn = document.getElementById('c3-drawer-stats-refresh');
    if (refreshBtn && !refreshBtn.dataset.wired) {
        refreshBtn.dataset.wired = '1';
        refreshBtn.addEventListener('click', () => {
            if (drawerVm && drawerName) renderStatsPanel(drawerVm, drawerName);
        });
    }
}

function closeContainerDrawer(): void {
    stopDrawerLogs();
    drawerVm = null;
    drawerName = null;
    document.getElementById('c3-drawer')?.setAttribute('hidden', '');
    document.getElementById('c3-drawer-backdrop')?.setAttribute('hidden', '');
}

function wireDrawerChrome(): void {
    document.getElementById('c3-drawer-close')?.addEventListener('click', closeContainerDrawer);
    document.getElementById('c3-drawer-backdrop')?.addEventListener('click', closeContainerDrawer);
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && !document.getElementById('c3-drawer')?.hasAttribute('hidden')) {
            closeContainerDrawer();
        }
    });
    document.querySelectorAll<HTMLButtonElement>('[data-c3-drawer-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-c3-drawer-tab]').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.c3DrawerTab as string;
            document.querySelectorAll('.c3-drawer-panel').forEach((p) => p.classList.remove('active'));
            document.getElementById('c3-drawer-panel-' + tab)?.classList.add('active');
        });
    });
    // Tear down the SSE connection immediately on a mock/live mode flip — the old
    // connection (or timer) belongs to a mode that no longer applies.
    onModeChange(() => {
        if (drawerVm && drawerName && !document.getElementById('c3-drawer')?.hasAttribute('hidden')) {
            openContainerDrawer(drawerVm, drawerName);
        }
    });
}

function updateModeBadge(): void {
    const badge = document.getElementById('c3-mode-badge');
    if (!badge) return;
    const mode = getMode();
    if (mode === 'live') {
        badge.textContent = 'LIVE · ' + new Date().toLocaleTimeString();
        badge.className = 'c3-mode-badge live';
    } else {
        badge.textContent = 'MOCK';
        badge.className = 'c3-mode-badge mock';
    }
}

function showBanner(msg: string | null): void {
    const banner = document.getElementById('c3-banner');
    if (!banner) return;
    if (msg) {
        banner.textContent = msg;
        banner.classList.add('visible');
    } else {
        banner.classList.remove('visible');
    }
}

export function initC3ControlCenter(): void {
    const root = document.getElementById('c3-root');
    if (!root) return;

    updateModeBadge();
    onModeChange(updateModeBadge);

    const liveBtn = document.getElementById('c3-live-btn');
    const mockBtn = document.getElementById('c3-mock-btn');

    liveBtn?.addEventListener('click', async () => {
        setMode('live');
        showBanner(null);
        await c3All();
        const failures = Object.keys(lastErrors).length;
        if (failures > 0) {
            showBanner('Live fetch failed — c3-infra-api is WireGuard-only. Showing mock data.');
            setMode('mock');
        }
        await renderAllTabs();
    });

    mockBtn?.addEventListener('click', async () => {
        setMode('mock');
        showBanner(null);
        await renderAllTabs();
    });

    let currentTab = 'topology';

    function selectTab(tab: string): void {
        currentTab = tab;
        // The nav lists each report family as its own entry, keyed
        // `reports:<family>`. Those all share the one `reports` panel, so the
        // panel id uses the base key while the suffix selects the family.
        const [base, sub] = tab.split(':');
        document.querySelectorAll('.c3-tab-content').forEach((c) => c.classList.remove('active'));
        document.getElementById('c3-tab-' + base)?.classList.add('active');
        nav.setActive(tab);
        if (base === 'reports') {
            const reportsRoot = document.getElementById('c3-reports-root');
            if (reportsRoot) initC3Reports(reportsRoot, sub);
        }
    }

    // Deliverable 1 + 2: single declarative section->tabs taxonomy renders
    // BOTH the horizontal tab bar (#c3-tabbar) and the hamburger drawer.
    const nav = initC3Nav({
        sections: C3_NAV_SECTIONS,
        tabBarEl: document.getElementById('c3-tabbar'),
        getActive: () => currentTab,
        onSelect: (tab) => selectTab(tab),
    });
    demoNav();

    wireDrawerChrome();
    renderAllTabs();
    selectTab('topology');
}

// Keep the registry re-export around for the selfcheck script / debugging.
export { REGISTRY };
