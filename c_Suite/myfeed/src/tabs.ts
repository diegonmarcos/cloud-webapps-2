// Tabs Module
// ====================================

export function initTabs(tabBarId: string, contentPrefix: string): void {
  const tabBar = document.getElementById(tabBarId);
  if (!tabBar) return;

  const tabs = tabBar.querySelectorAll('.tab-btn');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = (tab as HTMLButtonElement).dataset.tab;
      if (!tabId) return;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show/hide content
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(content => {
        const el = content as HTMLElement;
        if (el.id === `${contentPrefix}${tabId}`) {
          el.style.display = 'block';
        } else if (el.id.startsWith(contentPrefix)) {
          el.style.display = 'none';
        }
      });
    });
  });
}
