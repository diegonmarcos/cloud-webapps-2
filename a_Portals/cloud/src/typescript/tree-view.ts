/**
 * Tree View functionality for Cloud Dashboard
 */

const validViews = ['cards-front', 'cards-back', 'list-front', 'list-back', 'tree', 'architecture', 'ai-architecture', 'backlog', 'resources'] as const;
type ViewName = typeof validViews[number];

function getViewFromHash(): ViewName {
    const hash = window.location.hash.slice(1);
    return validViews.includes(hash as ViewName) ? (hash as ViewName) : 'cards-front';
}

function switchToView(viewName: ViewName, pushState: boolean = true): void {
    // Only target buttons with data-view attribute
    const viewButtons = document.querySelectorAll<HTMLButtonElement>('.view-btn[data-view]');
    const views: Record<string, HTMLElement | null> = {
        'cards-front': document.getElementById('cards-front-view'),
        'cards-back': document.getElementById('cards-back-view'),
        'tree': document.getElementById('tree-view'),
        'architecture': document.getElementById('architecture-view'),
        'ai-architecture': document.getElementById('ai-architecture-view'),
        'backlog': document.getElementById('backlog-view'),
        'list-front': document.getElementById('list-front-view'),
        'list-back': document.getElementById('list-back-view'),
        'resources': document.getElementById('resources-view')
    };

    // Update button states
    viewButtons.forEach(b => {
        if (b.dataset.view === viewName) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    // Toggle views
    Object.keys(views).forEach(key => {
        const viewElement = views[key];
        if (viewElement) {
            if (key === viewName) {
                viewElement.classList.add('active');
            } else {
                viewElement.classList.remove('active');
            }
        }
    });

    // Update URL hash (push to history for back button support)
    if (pushState) {
        window.history.pushState({ view: viewName }, '', `#${viewName}`);
    }
}

export function initViewToggle(): void {
    // Only work with buttons that have data-view attribute (not data-page)
    const viewButtons = document.querySelectorAll<HTMLButtonElement>('.view-btn[data-view]');

    // Skip if no view buttons with data-view exist (products page uses data-page instead)
    if (viewButtons.length === 0) return;

    // Set initial view from hash
    const initialView = getViewFromHash();
    switchToView(initialView, false);
    window.history.replaceState({ view: initialView }, '', `#${initialView}`);

    // Handle button clicks
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view as ViewName;
            if (viewName && validViews.includes(viewName)) {
                switchToView(viewName);
            }
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state?.view && validViews.includes(event.state.view)) {
            switchToView(event.state.view, false);
        } else {
            switchToView(getViewFromHash(), false);
        }
    });
}

export function initTreeExpand(): void {
    const expandableNodes = document.querySelectorAll<HTMLElement>('.tree-node[data-expanded]');

    expandableNodes.forEach(node => {
        const header = node.querySelector('.node-header');
        const expandIcon = node.querySelector('.expand-icon');
        // Get the next sibling that is a tree-children element
        const children = node.nextElementSibling;

        if (header && children?.classList.contains('tree-children')) {
            header.addEventListener('click', (e) => {
                e.stopPropagation();

                const isExpanded = node.dataset.expanded === 'true';

                if (isExpanded) {
                    // Collapse
                    node.dataset.expanded = 'false';
                    expandIcon?.classList.remove('expanded');
                    children.classList.remove('expanded');
                } else {
                    // Expand
                    node.dataset.expanded = 'true';
                    expandIcon?.classList.add('expanded');
                    children.classList.add('expanded');
                }
            });
        }
    });
}

export function initTreeServiceClick(): void {
    const serviceNodes = document.querySelectorAll<HTMLElement>('.tree-node.service-node.clickable');

    serviceNodes.forEach(node => {
        node.addEventListener('click', () => {
            const service = node.dataset.service;
            if (service) {
                // Trigger the same click handler as cards
                const event = new CustomEvent('service-click', { detail: { service } });
                document.dispatchEvent(event);
            }
        });
    });
}

export function expandAllTreeNodes(): void {
    const nodes = document.querySelectorAll<HTMLElement>('.tree-node[data-expanded]');
    nodes.forEach(node => {
        node.dataset.expanded = 'true';
        node.querySelector('.expand-icon')?.classList.add('expanded');
        const children = node.nextElementSibling;
        if (children?.classList.contains('tree-children')) {
            children.classList.add('expanded');
        }
    });
}

export function collapseAllTreeNodes(): void {
    const nodes = document.querySelectorAll<HTMLElement>('.tree-node[data-expanded]');
    nodes.forEach(node => {
        node.dataset.expanded = 'false';
        node.querySelector('.expand-icon')?.classList.remove('expanded');
        const children = node.nextElementSibling;
        if (children?.classList.contains('tree-children')) {
            children.classList.remove('expanded');
        }
    });
}

export function initTreeControls(): void {
    const expandAllBtn = document.getElementById('expand-all');
    const collapseAllBtn = document.getElementById('collapse-all');

    expandAllBtn?.addEventListener('click', expandAllTreeNodes);
    collapseAllBtn?.addEventListener('click', collapseAllTreeNodes);
}

export function initTreeFilter(): void {
    const filterBtns = document.querySelectorAll<HTMLButtonElement>('.tree-filter-btn');
    const treeContainer = document.querySelector<HTMLElement>('.tree-container');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply filter to tree container
            const filter = btn.dataset.filter || 'all';
            if (treeContainer) {
                treeContainer.dataset.filter = filter;
            }
        });
    });
}
