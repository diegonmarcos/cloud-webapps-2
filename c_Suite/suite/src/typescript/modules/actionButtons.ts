export function updateActionButtons(): void {
  const activeTable = document.querySelector<HTMLElement>('.service-table.active');
  const activeService = activeTable ? activeTable.querySelector<HTMLElement>('.service-option.active') : null;
  const activeAuth = document.querySelector<HTMLElement>('.auth-btn.active');

  const serviceName = activeService ? activeService.dataset.name || 'Service' : 'Service';
  const serviceUrl = activeService ? activeService.dataset.url || '#' : '#';
  const configUrl = activeService ? activeService.dataset.config || '#' : '#';
  const authPrefix = activeAuth ? activeAuth.dataset.authPrefix || '' : '';
  const descEl = activeService ? activeService.querySelector<HTMLElement>('.service-desc') : null;
  const serviceDesc = descEl ? descEl.textContent || '' : '';

  const toolNameApp = document.getElementById('tool-name-app');
  const goAppBtn = document.getElementById('go-app-btn') as HTMLAnchorElement | null;
  const goConfigBtn = document.getElementById('go-config-btn') as HTMLAnchorElement | null;
  const infoAppName = document.getElementById('info-app-name');
  const infoAppDesc = document.getElementById('info-app-desc');

  if (toolNameApp) toolNameApp.textContent = serviceName;
  if (goAppBtn) goAppBtn.href = authPrefix ? authPrefix + encodeURIComponent(serviceUrl) : serviceUrl;
  if (goConfigBtn) goConfigBtn.href = authPrefix ? authPrefix + encodeURIComponent(configUrl) : configUrl;
  if (infoAppName) infoAppName.textContent = serviceName;
  if (infoAppDesc) infoAppDesc.textContent = serviceDesc;
}
