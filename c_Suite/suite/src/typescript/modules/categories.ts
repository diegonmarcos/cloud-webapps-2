import { updateActionButtons } from './actionButtons';

const THEME_CLASSES = [
  'theme-sheets', 'theme-docs', 'theme-slides', 'theme-photos',
  'theme-files', 'theme-notes', 'theme-lgtm', 'theme-powersheets', 'theme-videos'
];

function applyTheme(category: string): void {
  document.body.classList.remove(...THEME_CLASSES);
  document.body.classList.add('theme-' + category);
}

export function initCategories(): void {
  const categoryTabs = document.querySelectorAll<HTMLElement>(
    '.category-tabs .category-tab, .category-tabs-row2 .category-tab'
  );
  const serviceTables = document.querySelectorAll<HTMLElement>('.service-table');

  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function (this: HTMLElement) {
      const category = this.dataset.category;
      if (!category) return;

      // Update tabs (both rows)
      categoryTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // Update tables
      serviceTables.forEach(table => {
        table.classList.remove('active');
        if (table.dataset.category === category) {
          table.classList.add('active');
        }
      });

      applyTheme(category);
      updateActionButtons();
    });
  });

  // Service option selection within tables
  serviceTables.forEach(table => {
    const options = table.querySelectorAll<HTMLElement>('.service-option:not(.coming-soon):not(.not-deployed)');
    options.forEach(option => {
      option.addEventListener('click', function (this: HTMLElement) {
        options.forEach(o => o.classList.remove('active'));
        this.classList.add('active');
        updateActionButtons();
      });
    });
  });

  // Apply initial theme
  applyTheme('notes');
}
