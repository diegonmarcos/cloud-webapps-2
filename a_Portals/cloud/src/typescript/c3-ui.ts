/**
 * c3-ui.ts — Wave 1 reusable control-UI component library.
 *
 * Every c3* factory returns a plain HTMLElement (or a controller object that
 * exposes `.el` plus imperative methods, documented per-component). All
 * components accept a `state: 'loading' | 'error' | 'empty' | 'ready'`
 * (default 'ready') and render distinct, sensible markup for each.
 *
 * Style: matches src/typescript/main.ts / c3-control-center.ts conventions —
 * 4-space indent, semicolons, template-literal HTML assembled via
 * escapeHtml() for any untrusted text.
 */

export type C3State = 'loading' | 'error' | 'empty' | 'ready';
export type C3Severity = 'ok' | 'info' | 'warn' | 'error' | 'critical' | 'unknown';

function escapeHtml(v: unknown): string {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (className) e.className = className;
    return e;
}

/** Renders the shared loading/error/empty markup into `container`. Returns true if it handled the state (caller should render 'ready' content otherwise). */
function renderSharedState(container: HTMLElement, state: C3State | undefined, emptyText: string, errorText?: string): boolean {
    if (state === 'loading') {
        container.innerHTML = `<div class="c3-state" role="status" aria-live="polite"><span class="c3-spinner" aria-hidden="true"></span> Loading&hellip;</div>`;
        return true;
    }
    if (state === 'error') {
        container.innerHTML = `<div class="c3-state c3-state--error" role="alert">${escapeHtml(errorText || 'Failed to load data.')}</div>`;
        return true;
    }
    if (state === 'empty') {
        container.innerHTML = `<div class="c3-state c3-state--empty">${escapeHtml(emptyText)}</div>`;
        return true;
    }
    return false;
}

// ============================================================
// 1. c3Panel
// ============================================================
export interface C3PanelOptions {
    title: string;
    state?: C3State;
    /** Header action slot — arbitrary elements (buttons/icons) rendered top-right. */
    headerActions?: HTMLElement[];
    /** Body content when state is 'ready'. Element or plain text. */
    body?: HTMLElement | string;
    emptyText?: string;
    errorText?: string;
}

export function c3Panel(opts: C3PanelOptions): HTMLElement {
    const root = el('div', 'c3-panel c3');
    const header = el('div', 'c3-panel-header');
    const title = el('h3', 'c3-panel-title');
    title.textContent = opts?.title ?? '';
    header.appendChild(title);

    const actions = el('div', 'c3-panel-actions');
    (opts?.headerActions || []).forEach((a) => actions.appendChild(a));
    header.appendChild(actions);
    root.appendChild(header);

    const body = el('div', 'c3-panel-body');
    body.setAttribute('aria-live', 'polite');
    if (!renderSharedState(body, opts?.state, opts?.emptyText ?? 'No data.', opts?.errorText)) {
        if (opts?.body instanceof HTMLElement) {
            body.appendChild(opts.body);
        } else if (typeof opts?.body === 'string') {
            body.textContent = opts.body;
        }
    }
    root.appendChild(body);
    return root;
}

// ============================================================
// 2/3. c3Stat + c3Sparkline
// ============================================================
export function c3Sparkline(values: number[], opts: { width?: number; height?: number; color?: string } = {}): SVGSVGElement {
    const w = opts.width ?? 72;
    const h = opts.height ?? 24;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    svg.setAttribute('class', 'c3-sparkline');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const vals = Array.isArray(values) ? values.filter((v) => typeof v === 'number' && isFinite(v)) : [];
    if (vals.length < 2) return svg;

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const step = w / (vals.length - 1);
    const pts = vals.map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / span) * h).toFixed(2)}`);

    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('class', 'c3-sparkline-area');
    area.setAttribute('d', `M0,${h} L${pts.join(' L')} L${w},${h} Z`);
    svg.appendChild(area);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('class', 'c3-sparkline-line');
    line.setAttribute('points', pts.join(' '));
    if (opts.color) line.style.stroke = opts.color;
    svg.appendChild(line);
    return svg;
}

export interface C3StatOptions {
    label: string;
    value?: string | number;
    delta?: number; // signed; positive = up (green), negative = down (red)
    deltaLabel?: string;
    spark?: number[];
    state?: C3State;
    emptyText?: string;
    errorText?: string;
}

export function c3Stat(opts: C3StatOptions): HTMLElement {
    const root = el('div', 'c3-stat c3');
    const label = el('div', 'c3-stat-label');
    label.textContent = opts?.label ?? '';
    root.appendChild(label);

    const body = el('div', 'c3-panel-body');
    if (renderSharedState(body, opts?.state, opts?.emptyText ?? 'No data.', opts?.errorText)) {
        root.appendChild(body);
        return root;
    }

    const row = el('div', 'c3-stat-row');
    const value = el('div', 'c3-stat-value');
    value.textContent = opts?.value === undefined || opts?.value === null ? '—' : String(opts.value);
    row.appendChild(value);

    if (typeof opts?.delta === 'number' && isFinite(opts.delta)) {
        const delta = el('span', `c3-stat-delta ${opts.delta > 0 ? 'c3-stat-delta--up' : opts.delta < 0 ? 'c3-stat-delta--down' : 'c3-stat-delta--flat'}`);
        const arrow = opts.delta > 0 ? '↑' : opts.delta < 0 ? '↓' : '→';
        delta.textContent = `${arrow} ${Math.abs(opts.delta)}${opts.deltaLabel ? ' ' + opts.deltaLabel : ''}`;
        row.appendChild(delta);
    }

    if (Array.isArray(opts?.spark) && opts.spark.length > 1) {
        const sparkWrap = el('div', 'c3-stat-spark');
        sparkWrap.appendChild(c3Sparkline(opts.spark));
        row.appendChild(sparkWrap);
    }
    root.appendChild(row);
    return root;
}

// ============================================================
// 4. c3Timeseries
// ============================================================
export interface C3Series {
    name: string;
    color: string;
    points: number[]; // y-values, evenly spaced along x
}

export interface C3TimeseriesOptions {
    series?: C3Series[];
    xLabels?: string[];
    width?: number;
    height?: number;
    state?: C3State;
    emptyText?: string;
    errorText?: string;
}

export function c3Timeseries(opts: C3TimeseriesOptions): HTMLElement {
    const root = el('div', 'c3-timeseries c3');
    const container = el('div', 'c3-panel-body');
    if (renderSharedState(container, opts?.state, opts?.emptyText ?? 'No time series data.', opts?.errorText)) {
        root.appendChild(container);
        return root;
    }

    const series = (opts?.series || []).filter((s) => s && Array.isArray(s.points) && s.points.length);
    const w = opts?.width ?? 560;
    const h = opts?.height ?? 200;
    const padL = 36, padB = 20, padT = 8, padR = 8;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const wrap = el('div', 'c3-ts-wrap');
    wrap.style.position = 'relative';

    if (!series.length) {
        wrap.innerHTML = '<div class="c3-empty-state">No series to plot.</div>';
        root.appendChild(wrap);
        return root;
    }

    const allVals = series.flatMap((s) => s.points).filter((v) => typeof v === 'number' && isFinite(v));
    const min = allVals.length ? Math.min(0, ...allVals) : 0;
    const max = allVals.length ? Math.max(1, ...allVals) : 1;
    const span = max - min || 1;
    const n = Math.max(...series.map((s) => s.points.length));
    const xStep = n > 1 ? plotW / (n - 1) : plotW;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg') as SVGSVGElement;
    svg.setAttribute('class', 'c3-timeseries-svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Time series chart');

    const gGrid = document.createElementNS(svgNS, 'g');
    gGrid.setAttribute('class', 'c3-ts-grid');
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
        const y = padT + (plotH / gridLines) * i;
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(padL));
        line.setAttribute('x2', String(w - padR));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        gGrid.appendChild(line);
    }
    svg.appendChild(gGrid);

    const gAxis = document.createElementNS(svgNS, 'g');
    gAxis.setAttribute('class', 'c3-ts-axis');
    for (let i = 0; i <= gridLines; i++) {
        const y = padT + (plotH / gridLines) * i;
        const val = max - (span / gridLines) * i;
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', String(padL - 6));
        t.setAttribute('y', String(y + 3));
        t.setAttribute('text-anchor', 'end');
        t.textContent = Math.round(val).toString();
        gAxis.appendChild(t);
    }
    const axisLine = document.createElementNS(svgNS, 'line');
    axisLine.setAttribute('x1', String(padL));
    axisLine.setAttribute('x2', String(padL));
    axisLine.setAttribute('y1', String(padT));
    axisLine.setAttribute('y2', String(padT + plotH));
    gAxis.appendChild(axisLine);
    const baseLine = document.createElementNS(svgNS, 'line');
    baseLine.setAttribute('x1', String(padL));
    baseLine.setAttribute('x2', String(w - padR));
    baseLine.setAttribute('y1', String(padT + plotH));
    baseLine.setAttribute('y2', String(padT + plotH));
    gAxis.appendChild(baseLine);
    svg.appendChild(gAxis);

    const xToPx = (i: number) => padL + i * xStep;
    const yToPx = (v: number) => padT + plotH - ((v - min) / span) * plotH;

    series.forEach((s) => {
        const pts = s.points.map((v, i) => `${xToPx(i).toFixed(1)},${yToPx(v).toFixed(1)}`);
        const area = document.createElementNS(svgNS, 'path');
        area.setAttribute('class', 'c3-ts-area');
        area.setAttribute('fill', s.color || 'currentColor');
        area.setAttribute('d', `M${xToPx(0)},${padT + plotH} L${pts.join(' L')} L${xToPx(s.points.length - 1)},${padT + plotH} Z`);
        svg.appendChild(area);

        const line = document.createElementNS(svgNS, 'polyline');
        line.setAttribute('class', 'c3-ts-series');
        line.setAttribute('points', pts.join(' '));
        line.setAttribute('stroke', s.color || 'currentColor');
        svg.appendChild(line);
    });

    // Crosshair + hover overlay + tooltip
    const crosshair = document.createElementNS(svgNS, 'line');
    crosshair.setAttribute('class', 'c3-ts-crosshair');
    crosshair.setAttribute('y1', String(padT));
    crosshair.setAttribute('y2', String(padT + plotH));
    crosshair.style.display = 'none';
    svg.appendChild(crosshair);

    const dots: SVGCircleElement[] = series.map((s) => {
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('class', 'c3-ts-dot');
        c.setAttribute('r', '2.5');
        c.setAttribute('fill', s.color || 'currentColor');
        c.style.display = 'none';
        svg.appendChild(c);
        return c;
    });

    const tooltip = el('div', 'c3-ts-tooltip');
    tooltip.style.display = 'none';
    tooltip.setAttribute('role', 'status');
    wrap.appendChild(tooltip);

    const overlay = document.createElementNS(svgNS, 'rect');
    overlay.setAttribute('class', 'c3-ts-overlay');
    overlay.setAttribute('x', String(padL));
    overlay.setAttribute('y', String(padT));
    overlay.setAttribute('width', String(Math.max(plotW, 1)));
    overlay.setAttribute('height', String(Math.max(plotH, 1)));
    overlay.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = svg.getBoundingClientRect();
        const scaleX = w / rect.width;
        const localX = (e.clientX - rect.left) * scaleX;
        const idx = Math.max(0, Math.min(n - 1, Math.round((localX - padL) / xStep)));
        const px = xToPx(idx);
        crosshair.setAttribute('x1', String(px));
        crosshair.setAttribute('x2', String(px));
        crosshair.style.display = '';
        const lines: string[] = [];
        series.forEach((s, si) => {
            const v = s.points[idx];
            if (v === undefined) { dots[si].style.display = 'none'; return; }
            dots[si].setAttribute('cx', String(px));
            dots[si].setAttribute('cy', String(yToPx(v)));
            dots[si].style.display = '';
            lines.push(`${escapeHtml(s.name)}: ${v}`);
        });
        tooltip.innerHTML = `<strong>${escapeHtml(opts?.xLabels?.[idx] ?? `#${idx}`)}</strong><br>${lines.join('<br>')}`;
        tooltip.style.display = '';
        tooltip.style.left = `${Math.min(px + 8, w - 120)}px`;
        tooltip.style.top = `${padT}px`;
    });
    overlay.addEventListener('mouseleave', () => {
        crosshair.style.display = 'none';
        tooltip.style.display = 'none';
        dots.forEach((d) => (d.style.display = 'none'));
    });
    svg.appendChild(overlay);

    wrap.appendChild(svg);
    root.appendChild(wrap);

    const legend = el('div', 'c3-legend');
    legend.setAttribute('role', 'list');
    series.forEach((s) => {
        const item = el('span', 'c3-legend-item');
        item.setAttribute('role', 'listitem');
        const swatch = el('span', 'c3-legend-swatch');
        swatch.style.background = s.color || 'currentColor';
        item.appendChild(swatch);
        const label = document.createTextNode(s.name || '');
        item.appendChild(label);
        legend.appendChild(item);
    });
    root.appendChild(legend);
    return root;
}

// ============================================================
// 5. c3Gauge
// ============================================================
export interface C3GaugeOptions {
    value: number; // 0-100
    warnAt?: number; // threshold % where warn band starts
    critAt?: number; // threshold % where crit band starts
    label?: string;
    state?: C3State;
}

export function c3Gauge(opts: C3GaugeOptions): HTMLElement {
    const root = el('div', 'c3-gauge c3');
    const value = typeof opts?.value === 'number' && isFinite(opts.value) ? Math.max(0, Math.min(100, opts.value)) : 0;
    const warnAt = opts?.warnAt ?? 70;
    const critAt = opts?.critAt ?? 90;

    if (opts?.state === 'loading' || opts?.state === 'error' || opts?.state === 'empty') {
        const body = el('div', 'c3-panel-body');
        renderSharedState(body, opts.state, 'No metric.', 'Failed to load metric.');
        root.appendChild(body);
        return root;
    }

    const track = el('div', 'c3-gauge-track');
    track.setAttribute('role', 'meter');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(Math.round(value)));
    if (opts?.label) track.setAttribute('aria-label', opts.label);

    const fillClass = value >= critAt ? 'c3-gauge-fill--crit' : value >= warnAt ? 'c3-gauge-fill--warn' : '';
    const fill = el('span', `c3-gauge-fill ${fillClass}`.trim());
    fill.style.width = `${value}%`;
    track.appendChild(fill);

    const warnBand = el('span', 'c3-gauge-band c3-gauge-band--warn');
    warnBand.style.left = `${Math.min(100, Math.max(0, warnAt))}%`;
    track.appendChild(warnBand);

    const critBand = el('span', 'c3-gauge-band c3-gauge-band--crit');
    critBand.style.left = `${Math.min(100, Math.max(0, critAt))}%`;
    track.appendChild(critBand);

    root.appendChild(track);
    const val = el('span', 'c3-gauge-val');
    val.textContent = `${Math.round(value)}%`;
    root.appendChild(val);
    return root;
}

// ============================================================
// 6. c3Heatmap
// ============================================================
export interface C3HeatmapCell {
    id: string;
    status: C3Severity;
    tooltip?: string;
}

export interface C3HeatmapOptions {
    cells?: C3HeatmapCell[];
    state?: C3State;
    emptyText?: string;
    errorText?: string;
    onCellClick?: (cell: C3HeatmapCell) => void;
}

export function c3Heatmap(opts: C3HeatmapOptions): HTMLElement {
    const root = el('div', 'c3-panel-body');
    root.style.position = 'relative';
    if (renderSharedState(root, opts?.state, opts?.emptyText ?? 'No cells to display.', opts?.errorText)) return root;

    const cells = Array.isArray(opts?.cells) ? opts.cells.filter(Boolean) : [];
    const grid = el('div', 'c3-heatmap');
    grid.setAttribute('role', 'grid');

    const tooltip = el('div', 'c3-heatmap-tooltip');
    tooltip.style.display = 'none';
    root.appendChild(tooltip);

    if (!cells.length) {
        grid.innerHTML = '';
        root.innerHTML = '';
        root.appendChild(tooltip);
        const empty = el('div', 'c3-empty-state');
        empty.textContent = opts?.emptyText ?? 'No cells to display.';
        root.appendChild(empty);
        return root;
    }

    cells.forEach((cell) => {
        const status = cell?.status ?? 'unknown';
        const box = el('div', `c3-heatmap-cell c3-heatmap-cell--${status}`);
        box.setAttribute('role', 'gridcell');
        box.setAttribute('tabindex', '0');
        const label = `${cell?.id ?? 'unknown'}: ${status}${cell?.tooltip ? ' — ' + cell.tooltip : ''}`;
        box.setAttribute('aria-label', label);
        const show = () => {
            tooltip.textContent = label;
            tooltip.style.display = '';
            const r = box.getBoundingClientRect();
            const pr = root.getBoundingClientRect();
            tooltip.style.left = `${r.left - pr.left}px`;
            tooltip.style.top = `${r.bottom - pr.top + 4}px`;
        };
        const hide = () => { tooltip.style.display = 'none'; };
        box.addEventListener('mouseenter', show);
        box.addEventListener('mouseleave', hide);
        box.addEventListener('focus', show);
        box.addEventListener('blur', hide);
        box.addEventListener('click', () => opts?.onCellClick?.(cell));
        box.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts?.onCellClick?.(cell); }
        });
        grid.appendChild(box);
    });
    root.appendChild(grid);
    return root;
}

// ============================================================
// 7. c3Table
// ============================================================
export interface C3TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
}

export interface C3TableAction {
    label: string;
    onClick: (row: Record<string, unknown>) => void;
}

export interface C3TableOptions {
    columns?: C3TableColumn[];
    rows?: Array<Record<string, unknown>>;
    rowActions?: C3TableAction[];
    state?: C3State;
    emptyText?: string;
    errorText?: string;
}

export function c3Table(opts: C3TableOptions): HTMLElement {
    const root = el('div', 'c3');
    const cols = Array.isArray(opts?.columns) ? opts.columns.filter((c) => c && c.key) : [];
    const allRows = Array.isArray(opts?.rows) ? opts.rows.filter((r) => r && typeof r === 'object') : [];

    const container = el('div', 'c3-panel-body');
    if (renderSharedState(container, opts?.state, opts?.emptyText ?? 'No rows.', opts?.errorText)) {
        root.appendChild(container);
        return root;
    }

    if (!cols.length) {
        container.innerHTML = '<div class="c3-empty-state">No columns defined.</div>';
        root.appendChild(container);
        return root;
    }

    let sortKey: string | null = null;
    let sortDir: 1 | -1 = 1;
    let filterText = '';
    let density: 'compact' | 'comfortable' = 'comfortable';

    const toolbar = el('div', 'c3-table-toolbar');
    const filterInput = el('input', 'c3-table-filter');
    filterInput.type = 'search';
    filterInput.placeholder = 'Filter rows…';
    filterInput.setAttribute('aria-label', 'Filter table rows');
    toolbar.appendChild(filterInput);

    const densityToggle = el('div', 'c3-density-toggle');
    densityToggle.setAttribute('role', 'group');
    densityToggle.setAttribute('aria-label', 'Row density');
    const comfyBtn = el('button', 'c3-density-btn active');
    comfyBtn.type = 'button';
    comfyBtn.textContent = 'Comfortable';
    comfyBtn.setAttribute('aria-pressed', 'true');
    const compactBtn = el('button', 'c3-density-btn');
    compactBtn.type = 'button';
    compactBtn.textContent = 'Compact';
    compactBtn.setAttribute('aria-pressed', 'false');
    densityToggle.appendChild(comfyBtn);
    densityToggle.appendChild(compactBtn);
    toolbar.appendChild(densityToggle);
    root.appendChild(toolbar);

    const scroller = el('div', 'c3-table-scroll');
    const table = el('table', 'c3-table');
    table.setAttribute('role', 'table');
    const thead = el('thead');
    const headRow = el('tr');
    cols.forEach((c) => {
        const th = el('th');
        th.textContent = c.label ?? c.key;
        th.setAttribute('scope', 'col');
        if (c.sortable !== false) {
            th.tabIndex = 0;
            th.setAttribute('role', 'columnheader button');
            const icon = el('span', 'c3-sort-icon');
            icon.textContent = '↕';
            th.appendChild(icon);
            const doSort = () => {
                sortDir = sortKey === c.key ? (sortDir === 1 ? -1 : 1) : 1;
                sortKey = c.key;
                renderBody();
            };
            th.addEventListener('click', doSort);
            th.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort(); }
            });
        }
        headRow.appendChild(th);
    });
    if (opts?.rowActions?.length) {
        const th = el('th');
        th.textContent = 'Actions';
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = el('tbody');
    table.appendChild(tbody);
    scroller.appendChild(table);
    root.appendChild(scroller);

    function renderBody(): void {
        table.classList.toggle('c3-table--compact', density === 'compact');
        thead.querySelectorAll('.c3-sort-icon').forEach((icon, i) => {
            icon.classList.remove('active');
            icon.textContent = '↕';
        });

        let rows = allRows.slice();
        if (filterText.trim()) {
            const q = filterText.toLowerCase();
            rows = rows.filter((r) => cols.some((c) => String((r as any)[c.key] ?? '').toLowerCase().includes(q)));
        }
        if (sortKey) {
            rows.sort((a, b) => {
                const av = (a as any)[sortKey as string];
                const bv = (b as any)[sortKey as string];
                if (av === bv) return 0;
                const cmp = (av ?? '') > (bv ?? '') ? 1 : -1;
                return cmp * sortDir;
            });
            const idx = cols.findIndex((c) => c.key === sortKey);
            const th = headRow.children[idx] as HTMLElement | undefined;
            const icon = th?.querySelector('.c3-sort-icon');
            if (icon) { icon.classList.add('active'); icon.textContent = sortDir === 1 ? '↑' : '↓'; }
        }

        tbody.innerHTML = '';
        if (!rows.length) {
            const tr = el('tr');
            const td = el('td');
            td.colSpan = cols.length + (opts?.rowActions?.length ? 1 : 0);
            td.className = 'c3-empty-state';
            td.textContent = 'No matching rows.';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        rows.forEach((row) => {
            const tr = el('tr');
            cols.forEach((c) => {
                const td = el('td');
                td.textContent = String((row as any)[c.key] ?? '—');
                tr.appendChild(td);
            });
            if (opts?.rowActions?.length) {
                const td = el('td');
                const wrap = el('div', 'c3-table-row-actions');
                opts.rowActions.forEach((a) => {
                    const btn = el('button', 'vm-action-btn');
                    btn.type = 'button';
                    btn.textContent = a.label;
                    btn.addEventListener('click', () => a.onClick(row));
                    wrap.appendChild(btn);
                });
                td.appendChild(wrap);
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });
    }

    filterInput.addEventListener('input', () => { filterText = filterInput.value; renderBody(); });
    comfyBtn.addEventListener('click', () => {
        density = 'comfortable';
        comfyBtn.classList.add('active'); comfyBtn.setAttribute('aria-pressed', 'true');
        compactBtn.classList.remove('active'); compactBtn.setAttribute('aria-pressed', 'false');
        renderBody();
    });
    compactBtn.addEventListener('click', () => {
        density = 'compact';
        compactBtn.classList.add('active'); compactBtn.setAttribute('aria-pressed', 'true');
        comfyBtn.classList.remove('active'); comfyBtn.setAttribute('aria-pressed', 'false');
        renderBody();
    });

    renderBody();
    return root;
}

// ============================================================
// 8. c3Badge
// ============================================================
export function c3Badge(text: string, severity: C3Severity = 'unknown'): HTMLElement {
    const sev: C3Severity = (['ok', 'info', 'warn', 'error', 'critical', 'unknown'] as C3Severity[]).includes(severity) ? severity : 'unknown';
    const badge = el('span', `c3-badge c3-badge--${sev}`);
    badge.textContent = text ?? '';
    badge.setAttribute('role', 'status');
    return badge;
}

// ============================================================
// 9. c3Drawer
// ============================================================
export interface C3DrawerSection {
    title: string;
    content: HTMLElement | string;
}

export interface C3DrawerOptions {
    title: string;
    sections?: C3DrawerSection[];
    state?: C3State;
    emptyText?: string;
    errorText?: string;
    onClose?: () => void;
}

export interface C3DrawerHandle {
    backdrop: HTMLElement;
    drawer: HTMLElement;
    open: () => void;
    close: () => void;
}

export function c3Drawer(opts: C3DrawerOptions): C3DrawerHandle {
    const backdrop = el('div', 'c3-drawer-backdrop');
    const drawer = el('div', 'c3-drawer c3');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', opts?.title ?? 'Details');

    const header = el('div', 'c3-drawer-header');
    const title = el('h3', 'c3-drawer-title');
    title.textContent = opts?.title ?? '';
    header.appendChild(title);
    const closeBtn = el('button', 'c3-drawer-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close panel');
    closeBtn.textContent = '×';
    header.appendChild(closeBtn);
    drawer.appendChild(header);

    const body = el('div', 'c3-drawer-body');
    if (!renderSharedState(body, opts?.state, opts?.emptyText ?? 'No details.', opts?.errorText)) {
        (opts?.sections || []).forEach((s) => {
            const section = el('div', 'c3-drawer-section');
            const st = el('div', 'c3-drawer-section-title');
            st.textContent = s?.title ?? '';
            section.appendChild(st);
            if (s?.content instanceof HTMLElement) section.appendChild(s.content);
            else { const p = el('div'); p.textContent = String(s?.content ?? ''); section.appendChild(p); }
            body.appendChild(section);
        });
    }
    drawer.appendChild(body);

    function close(): void {
        backdrop.classList.remove('c3-drawer-open');
        drawer.classList.remove('c3-drawer-open');
        opts?.onClose?.();
    }
    function open(): void {
        backdrop.classList.add('c3-drawer-open');
        drawer.classList.add('c3-drawer-open');
        closeBtn.focus();
    }
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    drawer.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Escape') close(); });
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && drawer.classList.contains('c3-drawer-open')) close();
    });

    return { backdrop, drawer, open, close };
}

// ============================================================
// 10. c3Toolbar
// ============================================================
export type C3Range = '15m' | '1h' | '6h' | '24h' | '7d' | 'custom';

export interface C3ToolbarOptions {
    range?: C3Range;
    onRangeChange?: (r: C3Range) => void;
    autoRefreshOptions?: string[]; // e.g. ['off','10s','30s','1m']
    autoRefresh?: string;
    onAutoRefreshChange?: (v: string) => void;
    onRefresh?: () => void;
    liveMock?: 'live' | 'mock';
    onLiveMockChange?: (v: 'live' | 'mock') => void;
}

export function c3Toolbar(opts: C3ToolbarOptions = {}): HTMLElement {
    const root = el('div', 'c3-toolbar c3');
    root.setAttribute('role', 'toolbar');
    root.setAttribute('aria-label', 'Dashboard controls');

    const ranges: C3Range[] = ['15m', '1h', '6h', '24h', '7d', 'custom'];
    const rangeGroup = el('div', 'c3-toolbar-group');
    rangeGroup.setAttribute('role', 'group');
    rangeGroup.setAttribute('aria-label', 'Time range');
    let current: C3Range = opts?.range ?? '1h';
    ranges.forEach((r) => {
        const btn = el('button', `c3-range-btn${r === current ? ' active' : ''}`);
        btn.type = 'button';
        btn.textContent = r;
        btn.setAttribute('aria-pressed', String(r === current));
        btn.addEventListener('click', () => {
            current = r;
            rangeGroup.querySelectorAll('.c3-range-btn').forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            opts?.onRangeChange?.(r);
        });
        rangeGroup.appendChild(btn);
    });
    root.appendChild(rangeGroup);

    const refreshBtn = el('button', 'c3-refresh-btn');
    refreshBtn.type = 'button';
    refreshBtn.setAttribute('aria-label', 'Refresh now');
    refreshBtn.textContent = '↻ Refresh';
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        opts?.onRefresh?.();
        setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
    });
    root.appendChild(refreshBtn);

    const autoOptions = opts?.autoRefreshOptions?.length ? opts.autoRefreshOptions : ['off', '10s', '30s', '1m', '5m'];
    const autoSelect = el('select', 'c3-toolbar-select');
    autoSelect.setAttribute('aria-label', 'Auto-refresh interval');
    autoOptions.forEach((v) => {
        const o = el('option');
        o.value = v; o.textContent = v;
        if (v === opts?.autoRefresh) o.selected = true;
        autoSelect.appendChild(o);
    });
    autoSelect.addEventListener('change', () => opts?.onAutoRefreshChange?.(autoSelect.value));
    root.appendChild(autoSelect);

    const liveMockWrap = el('div', 'c3-livemock-toggle');
    liveMockWrap.setAttribute('role', 'group');
    liveMockWrap.setAttribute('aria-label', 'Data source');
    let lm: 'live' | 'mock' = opts?.liveMock ?? 'mock';
    const liveBtn = el('button', `c3-livemock-btn${lm === 'live' ? ' active--live' : ''}`);
    liveBtn.type = 'button'; liveBtn.textContent = 'Live';
    liveBtn.setAttribute('aria-pressed', String(lm === 'live'));
    const mockBtn = el('button', `c3-livemock-btn${lm === 'mock' ? ' active--mock' : ''}`);
    mockBtn.type = 'button'; mockBtn.textContent = 'Mock';
    mockBtn.setAttribute('aria-pressed', String(lm === 'mock'));
    const setLm = (v: 'live' | 'mock') => {
        lm = v;
        liveBtn.classList.toggle('active--live', v === 'live');
        mockBtn.classList.toggle('active--mock', v === 'mock');
        liveBtn.setAttribute('aria-pressed', String(v === 'live'));
        mockBtn.setAttribute('aria-pressed', String(v === 'mock'));
        opts?.onLiveMockChange?.(v);
    };
    liveBtn.addEventListener('click', () => setLm('live'));
    mockBtn.addEventListener('click', () => setLm('mock'));
    liveMockWrap.appendChild(liveBtn);
    liveMockWrap.appendChild(mockBtn);
    root.appendChild(liveMockWrap);

    return root;
}

// ============================================================
// 11. c3Tree
// ============================================================
export interface C3TreeNode {
    id: string;
    label: string;
    status?: C3Severity;
    meta?: string;
    children?: C3TreeNode[];
    expanded?: boolean;
}

export interface C3TreeOptions {
    nodes?: C3TreeNode[];
    state?: C3State;
    emptyText?: string;
    errorText?: string;
    onSelect?: (node: C3TreeNode) => void;
}

function statusDotClass(status?: C3Severity): string {
    if (status === 'warn') return 'c3-tree-status-dot--warn';
    if (status === 'error' || status === 'critical') return 'c3-tree-status-dot--error';
    if (status === 'unknown' || !status) return 'c3-tree-status-dot--unknown';
    return '';
}

function buildTreeNode(node: C3TreeNode, onSelect?: (n: C3TreeNode) => void): HTMLElement {
    const wrap = el('div', 'c3-tree-node');
    const row = el('div', 'c3-tree-row');
    row.tabIndex = 0;
    row.setAttribute('role', 'treeitem');

    const hasChildren = Array.isArray(node?.children) && node.children.length > 0;
    const toggle = el('button', `c3-tree-toggle${node?.expanded ? ' expanded' : ''}`);
    toggle.type = 'button';
    toggle.textContent = hasChildren ? '▸' : '';
    toggle.setAttribute('aria-label', hasChildren ? (node?.expanded ? 'Collapse' : 'Expand') : 'Leaf node');
    toggle.disabled = !hasChildren;
    row.appendChild(toggle);

    const dot = el('span', `c3-tree-status-dot ${statusDotClass(node?.status)}`.trim());
    row.appendChild(dot);

    const label = el('span', 'c3-tree-label');
    label.textContent = node?.label ?? node?.id ?? '(unnamed)';
    row.appendChild(label);

    if (node?.meta) {
        const meta = el('span', 'c3-tree-meta');
        meta.textContent = node.meta;
        row.appendChild(meta);
    }
    wrap.appendChild(row);

    let childrenWrap: HTMLElement | null = null;
    if (hasChildren) {
        childrenWrap = el('div', `c3-tree-children${node.expanded ? '' : ' c3-tree-children--collapsed'}`);
        node.children!.forEach((c) => childrenWrap!.appendChild(buildTreeNode(c, onSelect)));
        wrap.appendChild(childrenWrap);

        const doToggle = () => {
            const collapsed = childrenWrap!.classList.toggle('c3-tree-children--collapsed');
            toggle.classList.toggle('expanded', !collapsed);
            toggle.setAttribute('aria-label', collapsed ? 'Expand' : 'Collapse');
        };
        toggle.addEventListener('click', (e) => { e.stopPropagation(); doToggle(); });
    }

    row.addEventListener('click', () => onSelect?.(node));
    row.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(node); }
        if (e.key === 'ArrowRight' && hasChildren) toggle.click();
        if (e.key === 'ArrowLeft' && hasChildren && childrenWrap && !childrenWrap.classList.contains('c3-tree-children--collapsed')) toggle.click();
    });

    return wrap;
}

export function c3Tree(opts: C3TreeOptions): HTMLElement {
    const root = el('div', 'c3-panel-body');
    if (renderSharedState(root, opts?.state, opts?.emptyText ?? 'No topology data.', opts?.errorText)) return root;

    const container = el('div', 'c3-tree');
    container.setAttribute('role', 'tree');
    const nodes = Array.isArray(opts?.nodes) ? opts.nodes.filter(Boolean) : [];
    if (!nodes.length) {
        root.innerHTML = '';
        const empty = el('div', 'c3-empty-state');
        empty.textContent = opts?.emptyText ?? 'No topology data.';
        root.appendChild(empty);
        return root;
    }
    nodes.forEach((n) => container.appendChild(buildTreeNode(n, opts?.onSelect)));
    root.appendChild(container);
    return root;
}

// ============================================================
// 12. c3LogStream — virtualized, handles 10k+ lines
// ============================================================
export interface C3LogLine {
    ts?: string;
    level?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    text: string;
}

export interface C3LogStreamOptions {
    lines?: C3LogLine[];
    state?: C3State;
    emptyText?: string;
    errorText?: string;
    rowHeight?: number;
    viewportHeight?: number;
}

export interface C3LogStreamHandle {
    el: HTMLElement;
    push: (line: C3LogLine) => void;
    setPaused: (p: boolean) => void;
}

export function c3LogStream(opts: C3LogStreamOptions = {}): C3LogStreamHandle {
    const root = el('div', 'c3-logstream c3');
    const rowH = opts.rowHeight ?? 18;

    const body = el('div', 'c3-panel-body');
    if (renderSharedState(body, opts?.state, opts?.emptyText ?? 'No log lines.', opts?.errorText)) {
        root.appendChild(body);
        return { el: root, push: () => {}, setPaused: () => {} };
    }

    let lines: C3LogLine[] = Array.isArray(opts?.lines) ? opts.lines.filter((l) => l && typeof l.text === 'string') : [];
    let filterText = '';
    let paused = false;

    const toolbar = el('div', 'c3-logstream-toolbar');
    const filterInput = el('input', 'c3-logstream-filter');
    filterInput.type = 'search';
    filterInput.placeholder = 'Filter log lines…';
    filterInput.setAttribute('aria-label', 'Filter log lines');
    toolbar.appendChild(filterInput);
    const pauseBtn = el('button', 'c3-logstream-pause');
    pauseBtn.type = 'button';
    pauseBtn.textContent = '⏸ Pause';
    pauseBtn.setAttribute('aria-pressed', 'false');
    toolbar.appendChild(pauseBtn);
    root.appendChild(toolbar);

    const viewport = el('div', 'c3-logstream-viewport');
    viewport.setAttribute('role', 'log');
    viewport.setAttribute('aria-live', 'off');
    const viewH = opts.viewportHeight ?? 260;
    viewport.style.height = `${viewH}px`;
    const spacer = el('div', 'c3-logstream-spacer');
    viewport.appendChild(spacer);
    root.appendChild(viewport);

    function filtered(): C3LogLine[] {
        if (!filterText.trim()) return lines;
        const q = filterText.toLowerCase();
        return lines.filter((l) => l.text.toLowerCase().includes(q));
    }

    function renderVisible(): void {
        const rows = filtered();
        spacer.style.height = `${rows.length * rowH}px`;
        spacer.innerHTML = '';
        const scrollTop = viewport.scrollTop;
        const startIdx = Math.max(0, Math.floor(scrollTop / rowH) - 5);
        const visibleCount = Math.ceil(viewH / rowH) + 10;
        const endIdx = Math.min(rows.length, startIdx + visibleCount);
        const frag = document.createDocumentFragment();
        for (let i = startIdx; i < endIdx; i++) {
            const l = rows[i];
            const line = el('div', `c3-logstream-line c3-logstream-line--${l.level ?? 'info'}`);
            line.style.top = `${i * rowH}px`;
            line.textContent = `${l.ts ? l.ts + ' ' : ''}${l.text}`;
            frag.appendChild(line);
        }
        spacer.appendChild(frag);
    }

    viewport.addEventListener('scroll', () => renderVisible());
    filterInput.addEventListener('input', () => { filterText = filterInput.value; renderVisible(); });
    pauseBtn.addEventListener('click', () => {
        paused = !paused;
        pauseBtn.classList.toggle('paused', paused);
        pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
        pauseBtn.setAttribute('aria-pressed', String(paused));
    });

    renderVisible();
    root.appendChild(body); // stays empty for 'ready' state; kept for structural consistency

    return {
        el: root,
        push: (line: C3LogLine) => {
            if (paused || !line || typeof line.text !== 'string') return;
            lines.push(line);
            if (lines.length > 20000) lines = lines.slice(-20000);
            renderVisible();
        },
        setPaused: (p: boolean) => {
            paused = p;
            pauseBtn.classList.toggle('paused', paused);
            pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
            pauseBtn.setAttribute('aria-pressed', String(paused));
        },
    };
}

// ============================================================
// 13. c3CmdK — command palette (Cmd/Ctrl+K)
// ============================================================
export interface C3Command {
    id: string;
    label: string;
    hint?: string;
    onRun: () => void;
}

export interface C3CmdKHandle {
    backdrop: HTMLElement;
    open: () => void;
    close: () => void;
    destroy: () => void;
}

function fuzzyMatch(query: string, text: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    let qi = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) qi++;
    }
    return qi === q.length;
}

export function c3CmdK(commands: C3Command[] = []): C3CmdKHandle {
    const safeCommands = Array.isArray(commands) ? commands.filter((c) => c && typeof c.label === 'string') : [];
    const backdrop = el('div', 'c3-cmdk-backdrop');
    backdrop.style.display = 'none';
    const palette = el('div', 'c3-cmdk c3');
    palette.setAttribute('role', 'dialog');
    palette.setAttribute('aria-label', 'Command palette');

    const input = el('input', 'c3-cmdk-input');
    input.type = 'text';
    input.placeholder = 'Type a command…';
    input.setAttribute('aria-label', 'Command search');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'true');
    palette.appendChild(input);

    const list = el('div', 'c3-cmdk-list');
    list.setAttribute('role', 'listbox');
    palette.appendChild(list);
    backdrop.appendChild(palette);

    let selected = 0;
    let matches: C3Command[] = safeCommands.slice();

    function renderList(): void {
        matches = safeCommands.filter((c) => fuzzyMatch(input.value, c.label));
        selected = Math.max(0, Math.min(selected, matches.length - 1));
        list.innerHTML = '';
        if (!matches.length) {
            const empty = el('div', 'c3-cmdk-empty');
            empty.textContent = 'No matching commands.';
            list.appendChild(empty);
            return;
        }
        matches.forEach((c, i) => {
            const item = el('div', 'c3-cmdk-item');
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(i === selected));
            item.id = `c3-cmdk-item-${i}`;
            const label = document.createTextNode(c.label);
            item.appendChild(label);
            if (c.hint) {
                const hint = el('span', 'c3-cmdk-item-hint');
                hint.textContent = c.hint;
                item.appendChild(hint);
            }
            item.addEventListener('click', () => runSelected(i));
            list.appendChild(item);
        });
    }

    function runSelected(i: number): void {
        const cmd = matches[i];
        if (cmd) cmd.onRun();
        close();
    }

    function open(): void {
        backdrop.style.display = 'flex';
        input.value = '';
        selected = 0;
        renderList();
        input.focus();
    }
    function close(): void {
        backdrop.style.display = 'none';
    }

    input.addEventListener('input', renderList);
    input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); selected = Math.min(matches.length - 1, selected + 1); renderList(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); selected = Math.max(0, selected - 1); renderList(); }
        else if (e.key === 'Enter') { e.preventDefault(); runSelected(selected); }
        else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

    function globalKeydown(e: KeyboardEvent): void {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            open();
        } else if (e.key === 'Escape' && backdrop.style.display !== 'none') {
            close();
        }
    }
    document.addEventListener('keydown', globalKeydown);

    renderList();
    return {
        backdrop,
        open,
        close,
        destroy: () => document.removeEventListener('keydown', globalKeydown),
    };
}

// ============================================================
// 14. c3Toast
// ============================================================
export interface C3ToastOptions {
    title?: string;
    message: string;
    severity?: 'ok' | 'info' | 'warn' | 'error';
    timeoutMs?: number;
}

export interface C3ToastStackHandle {
    el: HTMLElement;
    show: (opts: C3ToastOptions) => void;
}

export function c3ToastStack(): C3ToastStackHandle {
    const stack = el('div', 'c3-toast-stack');
    stack.setAttribute('role', 'region');
    stack.setAttribute('aria-label', 'Notifications');
    stack.setAttribute('aria-live', 'polite');

    function show(opts: C3ToastOptions): void {
        const sev = opts?.severity ?? 'info';
        const toast = el('div', `c3-toast c3-toast--${sev}`);
        toast.setAttribute('role', 'status');
        const body = el('div', 'c3-toast-body');
        if (opts?.title) {
            const title = el('p', 'c3-toast-title');
            title.textContent = opts.title;
            body.appendChild(title);
        }
        const msg = el('p', 'c3-toast-msg');
        msg.textContent = opts?.message ?? '';
        body.appendChild(msg);
        toast.appendChild(body);

        const closeBtn = el('button', 'c3-toast-close');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Dismiss notification');
        closeBtn.textContent = '×';
        const dismiss = () => toast.remove();
        closeBtn.addEventListener('click', dismiss);
        toast.appendChild(closeBtn);

        stack.appendChild(toast);
        const timeout = opts?.timeoutMs ?? 4000;
        if (timeout > 0) setTimeout(dismiss, timeout);
    }

    return { el: stack, show };
}

// ============================================================
// 15. c3Markdown — minimal, dependency-free markdown -> HTML renderer.
// Treats input as untrusted (e.g. a report fetched from a public repo):
// ALL text is escaped via escapeHtml() before any markdown markup is
// applied, so no raw HTML from the source document ever reaches the DOM.
// Supports: headings h1-h4, tables, bullet/numbered lists, fenced code
// blocks, inline code, bold/italic, links, horizontal rules, blockquotes.
// ============================================================
function renderInline(text: string): string {
    let out = escapeHtml(text);
    // inline code first, so its contents are inert to the rest of the passes
    const codeSpans: string[] = [];
    out = out.replace(/`([^`]+)`/g, (_m, code) => {
        codeSpans.push(`<code>${code}</code>`);
        return ` ${codeSpans.length - 1} `;
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
    // links: [text](https://url) — only http(s) URLs are honored, everything else renders as plain text.
    out = out.replace(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    out = out.replace(/ (\d+) /g, (_m, i) => codeSpans[Number(i)]);
    return out;
}

export function c3Markdown(source: string): HTMLElement {
    const root = el('div', 'c3-markdown c3');
    const src = typeof source === 'string' ? source : '';
    if (!src.trim()) {
        root.innerHTML = '<div class="c3-empty-state">No content.</div>';
        return root;
    }

    const lines = src.replace(/\r\n/g, '\n').split('\n');
    const htmlParts: string[] = [];
    let i = 0;
    let listMode: 'ul' | 'ol' | null = null;

    const closeList = () => {
        if (listMode) {
            htmlParts.push(listMode === 'ul' ? '</ul>' : '</ol>');
            listMode = null;
        }
    };

    while (i < lines.length) {
        const line = lines[i];

        // fenced code block
        const fence = line.match(/^\s*```/);
        if (fence) {
            closeList();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !/^\s*```/.test(lines[i])) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing fence
            htmlParts.push(`<pre class="c3-markdown-code"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
            continue;
        }

        // horizontal rule
        if (/^\s*(---|\*\*\*|___)\s*$/.test(line) && line.trim().length >= 3) {
            closeList();
            htmlParts.push('<hr>');
            i++;
            continue;
        }

        // heading
        const heading = line.match(/^(#{1,4})\s+(.*)$/);
        if (heading) {
            closeList();
            const level = heading[1].length;
            htmlParts.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
            i++;
            continue;
        }

        // blockquote
        if (/^\s*>\s?/.test(line)) {
            closeList();
            const quoteLines: string[] = [];
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
                i++;
            }
            htmlParts.push(`<blockquote>${renderInline(quoteLines.join(' '))}</blockquote>`);
            continue;
        }

        // table (header row + separator row of dashes/pipes)
        if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
            closeList();
            const splitRow = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
            const headers = splitRow(line);
            i += 2;
            const bodyRows: string[][] = [];
            while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== '') {
                bodyRows.push(splitRow(lines[i]));
                i++;
            }
            htmlParts.push('<table class="c3-markdown-table"><thead><tr>' +
                headers.map((h) => `<th>${renderInline(h)}</th>`).join('') +
                '</tr></thead><tbody>' +
                bodyRows.map((r) => '<tr>' + r.map((c) => `<td>${renderInline(c)}</td>`).join('') + '</tr>').join('') +
                '</tbody></table>');
            continue;
        }

        // list items (bullet or numbered)
        const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
        const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
        if (bullet || numbered) {
            const wantMode: 'ul' | 'ol' = bullet ? 'ul' : 'ol';
            if (listMode !== wantMode) {
                closeList();
                htmlParts.push(wantMode === 'ul' ? '<ul>' : '<ol>');
                listMode = wantMode;
            }
            htmlParts.push(`<li>${renderInline((bullet || numbered)![1])}</li>`);
            i++;
            continue;
        }

        // blank line
        if (line.trim() === '') {
            closeList();
            i++;
            continue;
        }

        // paragraph (accumulate contiguous non-blank plain lines)
        closeList();
        const paraLines: string[] = [line];
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,4})\s+/.test(lines[i]) && !/^\s*```/.test(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !/^\s*>\s?/.test(lines[i])) {
            paraLines.push(lines[i]);
            i++;
        }
        htmlParts.push(`<p>${renderInline(paraLines.join(' '))}</p>`);
    }
    closeList();

    root.innerHTML = htmlParts.join('\n');
    return root;
}

// ============================================================
// Self-check — no test framework available; console.assert only.
// Calls each factory with empty/malformed/undefined-ish input and
// asserts a DOMElement is still returned without throwing.
// ============================================================
export function demo(): void {
    const checks: Array<[string, () => unknown]> = [
        ['c3Panel', () => c3Panel({} as any)],
        ['c3Panel(undefined body)', () => c3Panel({ title: undefined as any, state: 'error' })],
        ['c3Sparkline(empty)', () => c3Sparkline([])],
        ['c3Sparkline(malformed)', () => c3Sparkline([null, undefined, NaN] as any)],
        ['c3Stat', () => c3Stat({} as any)],
        ['c3Stat(empty state)', () => c3Stat({ label: 'x', state: 'empty' })],
        ['c3Timeseries(empty)', () => c3Timeseries({})],
        ['c3Timeseries(malformed)', () => c3Timeseries({ series: [{ name: '', color: '', points: [] }] } as any)],
        ['c3Gauge', () => c3Gauge({ value: undefined as any })],
        ['c3Gauge(NaN)', () => c3Gauge({ value: NaN })],
        ['c3Heatmap(empty)', () => c3Heatmap({})],
        ['c3Heatmap(malformed)', () => c3Heatmap({ cells: [null, {} as any] })],
        ['c3Table(empty)', () => c3Table({})],
        ['c3Table(malformed)', () => c3Table({ columns: [null as any, { key: 'a', label: 'A' }], rows: [null as any, { a: 1 }] })],
        ['c3Badge', () => c3Badge(undefined as any, 'bogus' as any)],
        ['c3Drawer', () => c3Drawer({ title: undefined as any }).drawer],
        ['c3Toolbar', () => c3Toolbar()],
        ['c3Tree(empty)', () => c3Tree({})],
        ['c3Tree(malformed)', () => c3Tree({ nodes: [null as any, { id: 'x', label: '' }] })],
        ['c3LogStream(empty)', () => c3LogStream({}).el],
        ['c3LogStream(malformed)', () => c3LogStream({ lines: [null as any, { text: 'ok' }] }).el],
        ['c3CmdK(empty)', () => c3CmdK([]).backdrop],
        ['c3CmdK(malformed)', () => c3CmdK([null as any, { id: '1', label: 'Run', onRun: () => {} }]).backdrop],
        ['c3ToastStack', () => c3ToastStack().el],
        ['c3Markdown(empty)', () => c3Markdown('')],
        ['c3Markdown(basic)', () => c3Markdown('# Title\n\nSome **bold** and *italic* text with `code`.\n\n- one\n- two\n\n| a | b |\n| - | - |\n| 1 | 2 |\n')],
        ['c3Markdown(XSS escaped)', () => {
            const out = c3Markdown('<img src=x onerror=alert(1)>');
            const raw = out.innerHTML;
            const escaped = !/<img/i.test(raw) && raw.includes('&lt;img');
            console.assert(escaped, '[c3-ui demo] c3Markdown did not escape an XSS payload');
            return out;
        }],
    ];

    let passed = 0;
    checks.forEach(([name, fn]) => {
        try {
            const result = fn();
            const ok = result instanceof HTMLElement || result instanceof SVGSVGElement;
            console.assert(ok, `[c3-ui demo] ${name} did not return a DOM element`);
            if (ok) passed++;
        } catch (err) {
            console.assert(false, `[c3-ui demo] ${name} threw: ${err instanceof Error ? err.message : String(err)}`);
        }
    });
    console.log(`[c3-ui demo] ${passed}/${checks.length} checks passed`);
}

// Expose a flat namespace for non-module consumers (e.g. c3_gallery.html
// loading the plain IIFE bundle without ES module imports).
declare global {
    interface Window {
        C3UI?: Record<string, unknown>;
    }
}

if (typeof window !== 'undefined') {
    window.C3UI = {
        c3Panel, c3Stat, c3Sparkline, c3Timeseries, c3Gauge, c3Heatmap, c3Table,
        c3Badge, c3Drawer, c3Toolbar, c3Tree, c3LogStream, c3CmdK, c3ToastStack, c3Markdown, demo,
    };
}
