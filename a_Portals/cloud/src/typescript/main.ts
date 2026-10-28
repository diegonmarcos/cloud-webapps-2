import { initCardEffects, initAppCardEffects, initStatusPulse } from './card-effects';
import { handleCardClick } from './service-handler';
import { initViewToggle, initTreeExpand, initTreeServiceClick, initTreeControls, initTreeFilter } from './tree-view';
import { initThemeSwitcher } from './theme-switcher';
import { initZoomControl } from './zoom-control';
import { initAdminActions } from './admin-actions';
import { initC3ControlCenter } from './c3-control-center';
import { initProductsCards } from './products-cards';
import type { ServiceId } from './types';

// Architecture page modal info - global function for onclick handlers
declare global {
    interface Window {
        openModal: (modalId: string) => void;
        closeModal: () => void;
    }
}

// Modal info content for architecture diagrams
const modalContent: Record<string, { title: string; content: string }> = {
    ssh: {
        title: 'SSH Access (Port 22)',
        content: `<p><strong>Key-Only Authentication</strong></p>
            <ul>
                <li>Password auth disabled</li>
                <li>Root login disabled</li>
                <li>Ed25519/RSA keys only</li>
                <li>Fail2ban protection</li>
            </ul>`
    },
    http: {
        title: 'HTTP Redirect (Port 80)',
        content: `<p><strong>Automatic HTTPS Redirect</strong></p>
            <ul>
                <li>301 redirect to HTTPS</li>
                <li>HSTS headers enabled</li>
                <li>No plain HTTP content</li>
            </ul>`
    },
    https: {
        title: 'HTTPS Traffic (Port 443)',
        content: `<p><strong>TLS 1.3 Encryption</strong></p>
            <ul>
                <li>Let's Encrypt certificates</li>
                <li>Auto-renewal via certbot</li>
                <li>A+ SSL Labs rating</li>
                <li>OCSP stapling enabled</li>
            </ul>`
    },
    mail: {
        title: 'Mail Ports (25/587/993)',
        content: `<p><strong>Mailu Mail Server</strong></p>
            <ul>
                <li>SMTP: 25 (relay), 587 (submission)</li>
                <li>IMAPS: 993 (encrypted)</li>
                <li>SPF, DKIM, DMARC configured</li>
                <li>Rspamd anti-spam</li>
            </ul>`
    },
    firewall: {
        title: 'Cloud Firewall',
        content: `<p><strong>Defense in Depth</strong></p>
            <ul>
                <li>OCI/GCP Security Lists</li>
                <li>UFW on host</li>
                <li>Docker network isolation</li>
                <li>Default deny inbound</li>
            </ul>`
    },
    server: {
        title: 'Server Host',
        content: `<p><strong>Hardened Linux Host</strong></p>
            <ul>
                <li>Unattended security updates</li>
                <li>Minimal attack surface</li>
                <li>Docker isolation</li>
                <li>Log monitoring</li>
            </ul>`
    },
    nginx: {
        title: 'Nginx Proxy Manager',
        content: `<p><strong>Reverse Proxy</strong></p>
            <ul>
                <li>SSL termination</li>
                <li>Virtual hosts routing</li>
                <li>Rate limiting</li>
                <li>Security headers</li>
            </ul>`
    }
};

window.openModal = function(modalId: string) {
    const info = modalContent[modalId];
    if (!info) return;

    // Remove existing modal if any
    const existing = document.getElementById('info-modal');
    if (existing) existing.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'info-modal';
    modal.className = 'arch-modal';
    modal.innerHTML = `
        <div class="arch-modal-backdrop" onclick="closeModal()"></div>
        <div class="arch-modal-content">
            <button class="arch-modal-close" onclick="closeModal()">&times;</button>
            <h3>${info.title}</h3>
            ${info.content}
        </div>
    `;
    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => modal.classList.add('active'));
};

window.closeModal = function() {
    const modal = document.getElementById('info-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 200);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Theme initialization (first to prevent flash)
    initThemeSwitcher();

    // Zoom control initialization
    initZoomControl();

    // View group active state initialization
    initViewGroupActive();

    // Card view initialization
    initCardEffects();
    initAppCardEffects();
    initStatusPulse();

    const cards = document.querySelectorAll<HTMLElement>('.card');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const service = card.dataset.service as ServiceId;
            if (service) {
                handleCardClick(service);
            }
        });
    });

    // Tree view initialization
    initViewToggle();
    initTreeExpand();
    initTreeServiceClick();
    initTreeControls();
    initTreeFilter();

    // Admin actions (Flex server controls, etc.)
    initAdminActions();

    // Cloud Control Center (data-driven c3-infra-api dashboard, guarded by #c3-root presence)
    initC3ControlCenter();

    // Products/Admin service cards (data-driven, guarded by container presence)
    initProductsCards();

    // Listen for service clicks from tree view
    document.addEventListener('service-click', ((e: CustomEvent) => {
        const service = e.detail.service as ServiceId;
        if (service) {
            handleCardClick(service);
        }
    }) as EventListener);

    // Tree node copy buttons
    document.querySelectorAll<HTMLButtonElement>('.node-copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const copyText = btn.dataset.copy;
            if (copyText) {
                navigator.clipboard.writeText(copyText).then(() => {
                    btn.style.color = 'var(--accent-green)';
                    btn.style.borderColor = 'var(--accent-green)';
                    setTimeout(() => {
                        btn.style.color = '';
                        btn.style.borderColor = '';
                    }, 1000);
                });
            }
        });
    });

    // Tree node URL buttons
    document.querySelectorAll<HTMLButtonElement>('.node-url-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // Tree action buttons (new design)
    document.querySelectorAll<HTMLButtonElement>('.tree-action-btn.url-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // VM Card action buttons - URL
    document.querySelectorAll<HTMLButtonElement>('.vm-action-btn.btn-url').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // VM Card action buttons - SSH copy
    document.querySelectorAll<HTMLButtonElement>('.vm-action-btn.btn-ssh').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const copyText = btn.dataset.copy;
            if (copyText) {
                navigator.clipboard.writeText(copyText).then(() => {
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.classList.remove('copied');
                    }, 1000);
                });
            }
        });
    });

    // Wake-on-Demand Calculator
    initWakeCalculator();

    // Product filter initialization
    initProductFilter();
});

// Wake-on-Demand Usage Calculator
function initWakeCalculator() {
    const hoursInput = document.getElementById('wake-hours') as HTMLInputElement;
    const bandwidthInput = document.getElementById('wake-bandwidth') as HTMLInputElement;

    if (!hoursInput || !bandwidthInput) return;

    // OCI E4.Flex pricing
    const COMPUTE_RATE = 0.0096;  // $/hr per OCPU (1 OCPU, 16GB RAM)
    const STORAGE_COST = 2.55;    // Fixed: 100GB boot @ $0.0255/GB/mo
    const BANDWIDTH_RATE = 0.0085; // $/GB (after first 10TB free)

    function calculate() {
        const hours = parseFloat(hoursInput.value) || 0;
        const bandwidth = parseFloat(bandwidthInput.value) || 0;

        // Compute cost
        const computeCost = hours * COMPUTE_RATE;

        // Bandwidth cost (first 10TB free per month)
        const bandwidthCost = bandwidth * BANDWIDTH_RATE;

        // Total
        const totalCost = computeCost + STORAGE_COST + bandwidthCost;

        // Update display
        const hoursDisplay = document.getElementById('wake-hours-display');
        const bwDisplay = document.getElementById('wake-bw-display');
        const computeEl = document.getElementById('wake-compute-cost');
        const bandwidthEl = document.getElementById('wake-bandwidth-cost');
        const totalEl = document.getElementById('wake-total-cost');

        if (hoursDisplay) hoursDisplay.textContent = hours.toString();
        if (bwDisplay) bwDisplay.textContent = bandwidth.toString();
        if (computeEl) computeEl.textContent = `$${computeCost.toFixed(2)}`;
        if (bandwidthEl) bandwidthEl.textContent = `$${bandwidthCost.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${totalCost.toFixed(2)}`;
    }

    hoursInput.addEventListener('input', calculate);
    bandwidthInput.addEventListener('input', calculate);

    // Initial calculation
    calculate();
}

// Product Filter - filters cards by product category
function initProductFilter() {
    const filterBtns = document.querySelectorAll<HTMLButtonElement>('[data-product-filter]');
    const cards = document.querySelectorAll<HTMLElement>('.card[data-product-category]');

    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.productFilter;

            // Update active state on filter buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter cards
            cards.forEach(card => {
                const category = card.dataset.productCategory;
                const isPlaceholder = card.classList.contains('card-placeholder');

                if (filter === 'all') {
                    // Show all non-placeholder cards, hide placeholders
                    card.style.display = isPlaceholder ? 'none' : '';
                } else {
                    // Show only matching category
                    if (category === filter) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });
}

// View Group Active State - underlines all buttons in the active group
function initViewGroupActive() {
    const viewToggle = document.querySelector('.view-toggle');
    if (viewToggle) {
        const viewGroups = viewToggle.querySelectorAll<HTMLElement>('.view-group');

        // Add click listeners to all view buttons within groups
        viewGroups.forEach(group => {
            const buttons = group.querySelectorAll<HTMLElement>('.view-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove group-active from all groups
                    viewGroups.forEach(g => g.classList.remove('group-active'));
                    // Add group-active to this button's parent group
                    group.classList.add('group-active');
                });
            });
        });
    }

    // Two-level navigation toggle (Products vs Cloud Control Center) - always init
    initNavLevel1Toggle();
}

// Initialize Level 1 Navigation Toggle
function initNavLevel1Toggle() {
    const mainBtns = document.querySelectorAll<HTMLButtonElement>('.nav-main-btn');
    const navProducts = document.getElementById('nav-products');
    const navC3 = document.getElementById('nav-c3');

    if (!mainBtns.length) return;

    mainBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;

            // Update active state on main buttons
            mainBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle level 2 navigation visibility
            if (section === 'products') {
                if (navProducts) {
                    navProducts.classList.add('active');
                    navProducts.style.display = 'flex';
                }
                if (navC3) {
                    navC3.classList.remove('active');
                    navC3.style.display = 'none';
                }
            } else if (section === 'c3') {
                if (navC3) {
                    navC3.classList.add('active');
                    navC3.style.display = 'flex';
                }
                if (navProducts) {
                    navProducts.classList.remove('active');
                    navProducts.style.display = 'none';
                }
            }
        });
    });
}
