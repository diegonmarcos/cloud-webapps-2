/**
 * Data-driven Solutions/Admin/Apps card renderer for products.html.
 *
 * Card copy (titles/descriptions/icons/urls) comes from the curated override
 * file `c3-card-overrides.json` (never rewrite that copy). Where an override
 * entry names a `service`, live domain / wg_only status is resolved from the
 * `services` dataset (c3-api.ts) and used as a fallback link/badge; the
 * curated `url`, when present, always wins. Entries with neither a resolvable
 * service link nor a curated url render an Internal/VPN badge instead of a
 * dead link (never silently dropped).
 */

import { c3, onModeChange } from './c3-api';

function escapeHtml(v: unknown): string {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

interface ServiceEntry {
    name: string;
    prefix: string;
    description?: string;
    domain?: string | null;
    wg_only?: boolean;
}

interface CardOverride {
    id: string;
    title: string;
    description?: string;
    url?: string;
    service?: string;
    iconPath?: string;
    gradient?: string;
    badge?: string;
    badgeColor?: string;
    status?: string;
    iconColor?: string;
    toolsList?: string[];
    featuresList?: string[];
}

// Mini shape parser for the compact iconPath strings stored in the overrides
// JSON, e.g. "M.. |circle:12,12,4|line:1,2,3,4|rect:2,6,20,12,2|polyline:1 2 3 4|polygon:5 3 19 12 5 21 5 3"
function iconSvg(spec: string | undefined): string {
    if (!spec) return '';
    const parts = spec.split('|').map((p) => p.trim()).filter(Boolean);
    const shapes = parts.map((p) => {
        if (p.startsWith('circle:')) {
            const [cx, cy, r] = p.slice(7).split(',');
            return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
        }
        if (p.startsWith('rect:')) {
            const [x, y, w, h, rx, ry] = p.slice(5).split(',');
            return `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ''}${ry ? ` ry="${ry}"` : ''}/>`;
        }
        if (p.startsWith('line:')) {
            const [x1, y1, x2, y2] = p.slice(5).split(',');
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
        }
        if (p.startsWith('polyline:')) {
            return `<polyline points="${p.slice(9)}"/>`;
        }
        if (p.startsWith('polygon:')) {
            return `<polygon points="${p.slice(8)}"/>`;
        }
        return `<path d="${p}"/>`;
    });
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${shapes.join('')}</svg>`;
}

function resolveLink(o: CardOverride, services: ServiceEntry[]): { href: string | null; wgOnly: boolean } {
    if (o.url) return { href: o.url, wgOnly: false };
    const svc = o.service ? services.find((s) => s.name === o.service) : undefined;
    if (svc && svc.domain && !svc.wg_only) return { href: `https://${svc.domain}`, wgOnly: false };
    return { href: null, wgOnly: !!(svc && svc.wg_only) };
}

function renderSolutionCard(o: CardOverride, services: ServiceEntry[]): string {
    const { href, wgOnly } = resolveLink(o, services);
    const linkTag = href
        ? `<a class="card" href="${escapeHtml(href)}" target="_blank" rel="noopener" data-service="${escapeHtml(o.id)}">`
        : `<div class="card" data-service="${escapeHtml(o.id)}">`;
    const closeTag = href ? '</a>' : '</div>';
    return `
        ${linkTag}
            <div class="card-icon">${iconSvg(o.iconPath)}</div>
            <h3>${escapeHtml(o.title)}</h3>
            <p>${escapeHtml(o.description || '')}</p>
            ${!href ? `<p><span class="badge">${wgOnly ? 'VPN' : 'Internal'}</span></p>` : ''}
        ${closeTag}
    `;
}

function renderAdminCard(o: CardOverride, services: ServiceEntry[]): string {
    const { href, wgOnly } = resolveLink(o, services);
    const badgeStyle = o.badgeColor ? ` style="background: ${rgbaFromHex(o.badgeColor)}; color: ${o.badgeColor};"` : '';
    const iconStyle = o.gradient ? ` style="background: linear-gradient(135deg, ${o.gradient});"` : '';
    const body = `
            <div class="app-card-header">
                <div class="app-card-icon"${iconStyle}>${iconSvg(o.iconPath)}</div>
                <h3 class="app-card-title">${escapeHtml(o.title)}</h3>
            </div>
            <div class="app-card-footer">
                ${o.badge ? `<span class="app-card-badge"${badgeStyle}>${escapeHtml(o.badge)}</span>` : ''}
                <span class="app-card-status" style="color: rgba(255,255,255,0.5);">${href ? escapeHtml(o.status || '') : (wgOnly ? 'VPN' : 'Internal')}</span>
            </div>
    `;
    return href
        ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="app-card" data-service="${escapeHtml(o.id)}">${body}</a>`
        : `<div class="app-card" data-service="${escapeHtml(o.id)}">${body}</div>`;
}

function rgbaFromHex(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
}

async function renderAll(): Promise<void> {
    const productsRoot = document.getElementById('c3-solutions-suite');
    const productsMiscRoot = document.getElementById('c3-solutions-misc');
    const adminRoot = document.getElementById('c3-admin-sections');
    const appsRoot = document.getElementById('c3-apps-cards');
    if (!productsRoot && !productsMiscRoot && !adminRoot && !appsRoot) return;

    try {
        const [overridesData, servicesData] = await Promise.all([c3('card-overrides'), c3('services')]);
        const overrides = overridesData || {};
        // c3('services') / PORTAL_DATA['c3-services'] resolves to the bare array
        // (see data-c3-services.json.js), never a `{ services: [...] }` wrapper —
        // reading .services here silently discarded every entry.
        const services: ServiceEntry[] = Array.isArray(servicesData)
            ? servicesData
            : (servicesData && Array.isArray(servicesData.services)) ? servicesData.services : [];

        if (productsRoot && overrides.solutions?.Suite) {
            productsRoot.innerHTML = Object.entries(overrides.solutions.Suite).map(([cat, cards]) => `
                <div class="category-section">
                    <h3 class="category-title">${escapeHtml(cat)}</h3>
                    <div class="cards-grid">
                        ${(cards as CardOverride[]).map((o) => renderSolutionCard(o, services)).join('')}
                    </div>
                </div>
            `).join('');
        }
        if (productsMiscRoot && overrides.solutions?.Misc) {
            productsMiscRoot.innerHTML = Object.entries(overrides.solutions.Misc).map(([cat, cards]) => `
                <div class="category-section">
                    <h3 class="category-title">${escapeHtml(cat)}</h3>
                    <div class="cards-grid">
                        ${(cards as CardOverride[]).map((o) => renderSolutionCard(o, services)).join('')}
                    </div>
                </div>
            `).join('');
        }
        if (adminRoot && overrides.admin) {
            adminRoot.innerHTML = Object.entries(overrides.admin).map(([section, cards]) => `
                <div class="profile-section">
                    <h2 class="profile-title">${escapeHtml(section)}</h2>
                    <div class="apps-cards-grid">
                        ${(cards as CardOverride[]).map((o) => renderAdminCard(o, services)).join('')}
                    </div>
                </div>
            `).join('');
        }
        if (appsRoot && overrides.apps) {
            appsRoot.innerHTML = (overrides.apps as CardOverride[]).map((o) => `
                <a href="${escapeHtml(o.url || '#')}" target="_blank" rel="noopener" class="app-card">
                    <div class="app-card-header">
                        <div class="app-card-icon ${escapeHtml(o.iconColor || '')}">${iconSvg(o.iconPath)}</div>
                        <h3 class="app-card-title">${escapeHtml(o.title)}</h3>
                    </div>
                    <div class="app-card-body">
                        ${o.toolsList ? `<div class="app-card-section">
                            <h4 class="app-card-section-title">Tools</h4>
                            <ul class="app-card-list">
                                ${o.toolsList.map((t, i) => `<li><span class="app-card-dot app-card-dot--${['green', 'purple', 'cyan', 'blue', 'yellow'][i % 5]}"></span>${escapeHtml(t)}</li>`).join('')}
                            </ul>
                        </div>` : ''}
                        ${o.featuresList ? `<div class="app-card-section">
                            <h4 class="app-card-section-title">Features</h4>
                            <ul class="app-card-list">
                                ${o.featuresList.map((t, i) => `<li><span class="app-card-dot app-card-dot--${['blue', 'yellow', 'cyan', 'green', 'purple'][i % 5]}"></span>${escapeHtml(t)}</li>`).join('')}
                            </ul>
                        </div>` : ''}
                    </div>
                    <div class="app-card-footer">
                        <span class="app-card-badge app-card-badge--blue">${escapeHtml(o.badge || '')}</span>
                        <span class="app-card-status">${escapeHtml(o.status || '')}</span>
                    </div>
                </a>
            `).join('');
        }
    } catch (err) {
        const msg = escapeHtml(err instanceof Error ? err.message : String(err));
        [productsRoot, productsMiscRoot, adminRoot, appsRoot].forEach((el) => {
            if (el) el.innerHTML = `<div class="c3-empty-state">Render failed: ${msg}</div>`;
        });
    }
}

export function initProductsCards(): void {
    if (!document.getElementById('c3-solutions-suite') && !document.getElementById('c3-solutions-misc') && !document.getElementById('c3-admin-sections') && !document.getElementById('c3-apps-cards')) return;
    renderAll();
    onModeChange(() => renderAll());
}
