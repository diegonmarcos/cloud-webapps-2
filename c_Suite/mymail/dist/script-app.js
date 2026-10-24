/* MyMail — renderer + interactions
 * Reads MYMAIL global from script-data.js, renders all sections.
 * Zero hardcoded content — edit script-data.js instead.
 *
 * Page zones: TITLE → USER → CONFIG → DEV
 */

// ── SVG icon map ──
const ICONS = {
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    link: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
};

function svg(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

function copyBtn(val) {
    return `<button class="copy-btn" onclick="copyValue(this,'${val.replace(/'/g, "\\'")}')">${svg('copy')}</button>`;
}

function zoneDivider(zone, label, icon) {
    return `<div class="zone-divider zone-${zone}"><span class="zone-label">${svg(icon)} ${label}</span></div>`;
}

function collapseWrap(icon, title, body) {
    return `<div class="card">
        <button class="collapse-toggle" onclick="toggleCollapse(this)">${svg(icon)} ${title} <svg class="collapse-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS.chevron}</svg></button>
        <div class="collapse-body">${body}</div>
    </div>`;
}

// ══════════════════════════════════════════════════════
// TITLE
// ══════════════════════════════════════════════════════

function renderTitle(d) {
    return `<div class="card card-hero">
        <div class="hero">
            <div class="logo">${svg('mail')}</div>
            <h1 class="app-name">${d.branding.name}</h1>
            <p class="app-tagline">${d.branding.tagline}</p>
        </div>
        <div class="mail-primary">
            ${svg('at')}
            <span class="mail-primary-addr">${d.primaryEmail}</span>
            ${copyBtn(d.primaryEmail)}
        </div>
        <div class="security-badge">${svg('shield-check')} End-to-end encrypted</div>
    </div>`;
}

// ══════════════════════════════════════════════════════
// USER — access, accounts, auth
// ══════════════════════════════════════════════════════

function renderUserAccess(u) {
    return `<div class="card">
        <div class="section-label">${svg('monitor')} Front-end</div>
        <div class="quick-grid">
            ${u.frontends.map(q => `<a class="quick-btn ${q.css}" href="${q.href}">${svg(q.icon)} ${q.label}<br><span class="quick-btn-desc">${q.desc}</span></a>`).join('')}
        </div>

        <div class="section-label">${svg('database')} Back-end</div>
        <div class="quick-grid">
            ${u.backends.map(q => `<a class="quick-btn ${q.css}" href="${q.href}">${svg(q.icon)} ${q.label}<br><span class="quick-btn-desc">${q.desc}</span></a>`).join('')}
        </div>

        <div class="section-label">${svg('code')} APIs &amp; MCP</div>
        <div class="quick-grid-3">
            ${u.apis.map(q => `<a class="quick-btn quick-btn-sm ${q.css}" href="${q.href}">${svg(q.icon)} ${q.label}<br><span class="quick-btn-desc">${q.desc}</span></a>`).join('')}
        </div>

        <div class="section-label">${svg('user')} Accounts</div>
        ${u.accounts.map(a => `<div class="account-row">
            <span class="account-addr">${a.addr}</span>
            <div class="account-tags">${a.tags.map(t => `<span class="tag tag-${t}">${t}</span>`).join('')}</div>
            ${copyBtn(a.addr)}
        </div>`).join('')}

        <div class="section-label">${svg('lock')} Authentication</div>
        <div class="auth-grid">
            ${u.auth.map(a => `<button class="auth-btn${a.active ? ' active' : ''}" data-auth="${a.id}" data-auth-prefix="${a.prefix}">${svg(a.icon)} ${a.label}</button>`).join('')}
        </div>
    </div>`;
}

// ══════════════════════════════════════════════════════
// CONFIG — client settings, domains, security
// ══════════════════════════════════════════════════════

function renderServerPanel(key, srv, servers) {
    const rows = [];
    for (let i = 0; i < srv.ports.length; i += 2) {
        const pair = srv.ports.slice(i, i + 2);
        rows.push(`<div class="cfg-grid">${pair.map(p => {
            if (p.disabled) return `<div class="cfg-item cfg-disabled"><div class="cfg-label">${p.label}</div><div class="cfg-value cfg-na">${p.proto}</div></div>`;
            const hint = p.hint ? ` <span class="cfg-hint" title="${p.hint}">&#9432;</span>` : '';
            return `<div class="cfg-item"><div class="cfg-label">${p.label}${hint}</div><div class="cfg-value"><span>:${p.value} ${p.proto}</span>${copyBtn(p.value)}</div></div>`;
        }).join('')}</div>`);
    }
    return `<div class="server-panel${key === Object.keys(servers)[0] ? ' active' : ''}" id="panel-${key}">
        <div class="cfg-grid"><div class="cfg-item cfg-full"><div class="cfg-label">Server</div><div class="cfg-value"><span>${srv.host}</span>${copyBtn(srv.host)}</div></div></div>
        ${rows.join('')}
    </div>`;
}

function renderClientConfig(c) {
    const keys = Object.keys(c.servers);
    return `<div class="card" id="maddy-info">
        <div class="section-label">${svg('gear')} Email Client Settings</div>
        <div class="server-tabs">
            ${keys.map((k, i) => `<button class="server-tab${i === 0 ? ' active' : ''}" data-server="${k}">${c.servers[k].label}</button>`).join('')}
        </div>
        ${keys.map(k => renderServerPanel(k, c.servers[k], c.servers)).join('')}
        <div class="cfg-grid"><div class="cfg-item cfg-full"><div class="cfg-label">${c.calendar.label}</div><div class="cfg-value"><span>${c.calendar.host} :${c.calendar.port}</span>${copyBtn(c.calendar.host)}</div></div></div>
    </div>`;
}

function renderSendingDomains(c) {
    return `<div class="card">
        <div class="section-label">${svg('activity')} Sending Domains</div>
        ${c.sendingDomains.map(s => `<div class="domain-row"><span class="domain-name">${s.domain}</span><span class="tag tag-${s.tag}">${s.tag}</span><span class="domain-desc">${s.desc}</span></div>`).join('')}
    </div>`;
}

function renderPgp(c) {
    const body = `
        <div class="pgp-fingerprint"><div class="cfg-label">Fingerprint</div><div class="cfg-value dns-value-small"><span>${c.pgp.fingerprint}</span>${copyBtn(c.pgp.fingerprintRaw)}</div></div>
        <div class="pgp-meta">
            <div class="cfg-item"><div class="cfg-label">Algorithm</div><div class="cfg-value">${c.pgp.algorithm}</div></div>
            <div class="cfg-item"><div class="cfg-label">Expires</div><div class="cfg-value">${c.pgp.expires}</div></div>
        </div>
        <a href="${c.pgp.downloadFile}" download class="pgp-download">${svg('download')} Download Public Key (.asc)</a>`;
    return collapseWrap('key', 'PGP Public Key', body);
}

function renderDns(c) {
    const sections = Object.entries(c.dns).map(([domain, records]) => {
        const pairs = [];
        for (let i = 0; i < records.length; i += 2) {
            const chunk = records.slice(i, Math.min(i + 2, records.length));
            const items = chunk.map(r => {
                const cls = (r.full || chunk.length === 1) ? 'cfg-item cfg-full' : 'cfg-item';
                const valCls = r.values.length > 1 ? 'cfg-value dns-value-small dns-value-col' : 'cfg-value dns-value-small';
                return `<div class="${cls}"><div class="cfg-label">${r.label}</div><div class="${valCls}">${r.values.map(v => `<span>${v}</span>`).join('')}</div></div>`;
            });
            pairs.push(`<div class="cfg-grid">${items.join('')}</div>`);
        }
        return `<div class="dns-domain-label">${domain}</div>${pairs.join('')}`;
    }).join('');
    return collapseWrap('shield', 'DNS Signatures', sections);
}

// ══════════════════════════════════════════════════════
// DEV — infrastructure, URLs, flow
// ══════════════════════════════════════════════════════

function renderFlowDiagram(title, nodes, shadow) {
    let html = nodes.map(n => `<span class="flow-node ${n.css}">${n.label}</span>`).join('<span class="flow-arrow">&rarr;</span>');
    if (shadow) html += `<span class="flow-shadow-label">+ shadow &rarr;</span><span class="flow-node ${shadow.css}">${shadow.label}</span>`;
    return `<div class="flow-diagram"><div class="flow-title">${title}</div><div class="flow-line">${html}</div></div>`;
}

function renderMailFlow(dev) {
    const body = renderFlowDiagram('Inbound', dev.mailFlow.inbound, dev.mailFlow.inboundShadow)
               + renderFlowDiagram('Outbound', dev.mailFlow.outbound);
    return collapseWrap('terminal', 'Mail Flow', body);
}

function renderUrls(dev) {
    const groups = Object.entries(dev.urls).map(([title, rows]) => {
        const items = rows.map(r => {
            const parts = [];
            if (r.port && !r.desc) parts.push(`<span class="ref-port">${r.port}</span>`);
            parts.push(`<span class="ref-url">${r.url}</span>`);
            if (r.desc) parts.push(`<span class="ref-desc">${r.desc}</span>`);
            if (r.port && r.desc) parts.push(`<span class="ref-port">${r.port}</span>`);
            if (!r.desc && r.port && r.url.includes('.app')) parts.push(`<span class="ref-port">${r.port}</span>`);
            return `<div class="ref-row">${parts.join('')}</div>`;
        }).join('');
        return `<div class="ref-group"><div class="ref-group-title">${title}</div>${items}</div>`;
    }).join('');
    return collapseWrap('globe', 'URLs Reference', groups);
}

// ══════════════════════════════════════════════════════
// Footer
// ══════════════════════════════════════════════════════

function renderFooter(d) {
    return d.footer.map(f => {
        const cls = f.shimmer ? 'shimmer-btn' : 'footer-link';
        return `<a href="${f.href}" class="${cls}">${svg(f.icon)} ${f.label}</a>`;
    }).join('');
}

// ══════════════════════════════════════════════════════
// Render all zones
// ══════════════════════════════════════════════════════

function render(d) {
    document.getElementById('app').innerHTML = [
        // TITLE
        renderTitle(d),

        // USER
        zoneDivider('user', 'Access', 'link'),
        renderUserAccess(d.user),

        // CONFIG
        zoneDivider('config', 'Configuration', 'gear'),
        renderClientConfig(d.config),
        renderSendingDomains(d.config),
        renderPgp(d.config),
        renderDns(d.config),

        // DEV
        zoneDivider('dev', 'Infrastructure', 'database'),
        renderMailFlow(d.dev),
        renderUrls(d.dev),
    ].join('');
    document.getElementById('footer').innerHTML = renderFooter(d);
    bindEvents();
}

// ── Events ──
function bindEvents() {
    document.querySelectorAll('.server-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.server-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.server-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('panel-' + this.dataset.server).classList.add('active');
        });
    });
    document.querySelectorAll('.auth-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.auth-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function copyValue(btn, value) {
    navigator.clipboard.writeText(value).then(() => {
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1500);
    });
}

function toggleCollapse(toggle) {
    toggle.classList.toggle('open');
    const body = toggle.nextElementSibling;
    if (body.classList.contains('open')) {
        body.style.maxHeight = '0';
        body.classList.remove('open');
    } else {
        body.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
    }
}

// ── Particles ──
(function () {
    const c = document.getElementById('particles');
    const colors = ['#00d9ff', '#7b2ff7', '#f107a3', '#00ff88'];
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const col = colors[Math.floor(Math.random() * colors.length)];
        const s = Math.random() * 3 + 2;
        p.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;background:${col};box-shadow:0 0 ${s * 2}px ${col};animation-delay:-${Math.random() * 20}s;animation-duration:${15 + Math.random() * 15}s`;
        c.appendChild(p);
    }
})();

// ── Mesh parallax ──
document.addEventListener('mousemove', (e) => {
    const m = document.querySelector('.mesh-container');
    m.style.transform = `translate(-50%,-50%) rotateX(${(e.clientY / window.innerHeight - 0.5) * 20}deg) rotateY(${(e.clientX / window.innerWidth - 0.5) * 20}deg)`;
});

// ── Init ──
render(MYMAIL);
