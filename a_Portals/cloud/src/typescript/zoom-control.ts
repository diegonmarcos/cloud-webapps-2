// Zoom levels from 100% down to 20% (more cards fit at lower zoom)
// Default is 60% (index 2)
const ZOOM_LEVELS = [100, 80, 60, 40, 30, 20];
const DEFAULT_ZOOM_INDEX = 2; // 60%
const ZOOM_STORAGE_KEY = 'cloud-dashboard-zoom';

let currentZoomIndex = DEFAULT_ZOOM_INDEX;

export function initZoomControl(): void {
    const zoomOut = document.getElementById('zoom-out');
    const zoomIn = document.getElementById('zoom-in');
    const zoomReset = document.getElementById('zoom-reset');
    const zoomLevel = document.getElementById('zoom-level');

    if (!zoomOut || !zoomIn || !zoomReset || !zoomLevel) return;

    // Load saved zoom level
    const savedZoom = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (savedZoom) {
        const savedIndex = ZOOM_LEVELS.indexOf(parseInt(savedZoom, 10));
        if (savedIndex !== -1) {
            currentZoomIndex = savedIndex;
        }
    }

    // Apply initial zoom
    applyZoom();
    updateUI();

    // Event listeners
    zoomOut.addEventListener('click', () => {
        if (currentZoomIndex < ZOOM_LEVELS.length - 1) {
            currentZoomIndex++;
            applyZoom();
            updateUI();
            saveZoom();
        }
    });

    zoomIn.addEventListener('click', () => {
        if (currentZoomIndex > 0) {
            currentZoomIndex--;
            applyZoom();
            updateUI();
            saveZoom();
        }
    });

    zoomReset.addEventListener('click', () => {
        currentZoomIndex = DEFAULT_ZOOM_INDEX;
        applyZoom();
        updateUI();
        saveZoom();
    });

    function updateUI(): void {
        const level = ZOOM_LEVELS[currentZoomIndex];
        zoomLevel!.textContent = `${level}%`;

        // Disable buttons at limits
        (zoomIn as HTMLButtonElement).disabled = currentZoomIndex === 0;
        (zoomOut as HTMLButtonElement).disabled = currentZoomIndex === ZOOM_LEVELS.length - 1;
        (zoomReset as HTMLButtonElement).disabled = currentZoomIndex === DEFAULT_ZOOM_INDEX;
    }

    function saveZoom(): void {
        localStorage.setItem(ZOOM_STORAGE_KEY, ZOOM_LEVELS[currentZoomIndex].toString());
    }
}

function applyZoom(): void {
    const level = ZOOM_LEVELS[currentZoomIndex];
    const scale = level / 100;
    const root = document.documentElement;
    const cardsView = document.getElementById('cards-view');

    // Calculate minimum card width based on zoom level
    // At 100%: 280px (blurred) / 220px (minimal)
    // At 40%: ~112px / ~88px - fitting many more cards
    const isBlurred = root.getAttribute('data-theme') === 'blurred';
    const baseMinWidth = isBlurred ? 280 : 220;
    const scaledMinWidth = Math.round(baseMinWidth * scale);

    // Calculate hover scale: smaller cards need bigger hover expansion
    // At 100% zoom: hover scale = 1.5x (small expansion)
    // At 20% zoom: hover scale = 3x (bigger expansion to be readable)
    const hoverScale = 1 + (1 - scale) * 2.5;

    // Apply CSS custom property for grid
    root.style.setProperty('--card-min-width', `${scaledMinWidth}px`);
    root.style.setProperty('--zoom-scale', scale.toString());
    root.style.setProperty('--hover-scale', hoverScale.toFixed(2));

    // Scale card content
    if (cardsView) {
        cardsView.style.setProperty('--card-content-scale', scale.toString());
    }
}

// Re-apply zoom when theme changes
export function onThemeChange(): void {
    applyZoom();
}
