type Theme = 'minimalistic' | 'blurred';

const THEME_STORAGE_KEY = 'cloud-dashboard-theme';
const DEFAULT_THEME: Theme = 'blurred';

export function getCurrentTheme(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'minimalistic' || stored === 'blurred') {
        return stored;
    }
    return DEFAULT_THEME;
}

export function setTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    updateThemeLabel(theme);
}

export function toggleTheme(): void {
    const current = getCurrentTheme();
    const next: Theme = current === 'minimalistic' ? 'blurred' : 'minimalistic';
    setTheme(next);
}

function updateThemeLabel(theme: Theme): void {
    const label = document.querySelector('.theme-label');
    if (label) {
        label.textContent = theme === 'minimalistic' ? 'Blurred' : 'Minimalistic';
    }
}

export function initThemeSwitcher(): void {
    // Apply saved theme on load
    const savedTheme = getCurrentTheme();
    setTheme(savedTheme);

    // Set up toggle button
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}
