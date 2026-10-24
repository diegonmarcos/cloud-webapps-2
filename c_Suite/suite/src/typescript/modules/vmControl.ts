const CLOUD_API = 'https://api.diegonmarcos.com';
const VM_LABEL = 'oci-flex';

let vmId: string | null = null;
let vmStatusUrl: string | null = null;
let vmStartUrl: string | null = null;
let vmStopUrl: string | null = null;
let vmResetUrl: string | null = null;

let statusDot: HTMLElement | null = null;
let statusText: HTMLElement | null = null;
let wakeStatus: HTMLElement | null = null;

interface VmDiscoveryResponse {
  vms?: Record<string, { label?: string }>;
}

async function discoverVmId(): Promise<string | null> {
  if (vmId) return vmId;
  try {
    console.debug('[vmControl] discovering VM via /rust/health/ids ...');
    const res = await fetch(`${CLOUD_API}/rust/health/ids`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.debug('[vmControl] discovery HTTP', res.status); return null; }
    const data: VmDiscoveryResponse = await res.json();
    console.debug('[vmControl] discovered VMs:', Object.keys(data.vms || {}));
    for (const [id, vm] of Object.entries(data.vms || {})) {
      if (vm.label === VM_LABEL) {
        vmId = id;
        vmStatusUrl = `${CLOUD_API}/rust/health/up/${id}`;
        vmStartUrl = `${CLOUD_API}/rust/vms/${id}/start`;
        vmStopUrl = `${CLOUD_API}/rust/vms/${id}/stop`;
        vmResetUrl = `${CLOUD_API}/rust/vms/${id}/reset`;
        console.debug('[vmControl] matched VM:', id);
        return id;
      }
    }
    console.debug('[vmControl] no VM with label', VM_LABEL);
  } catch (e) {
    console.debug('[vmControl] discovery failed:', (e as Error).message);
  }
  return null;
}

// Indicator: green=online, red=offline, yellow=command running, blue=error/unknown
function setIndicator(color: 'green' | 'yellow' | 'red' | 'blue', message: string): void {
  if (!statusDot || !statusText) return;
  statusDot.className = 'status-dot';
  statusDot.classList.add(`status-${color}`);
  statusText.textContent = message;
}

async function checkServerStatus(): Promise<void> {
  setIndicator('yellow', 'Checking...');
  try {
    await discoverVmId();
    if (!vmStatusUrl) throw new Error('VM not discovered');
    console.debug('[vmControl] checking status:', vmStatusUrl);
    const t0 = performance.now();
    const res = await fetch(vmStatusUrl, { signal: AbortSignal.timeout(10000) });
    console.debug('[vmControl] status response:', res.status, `(${((performance.now() - t0) / 1000).toFixed(1)}s)`);

    if (res.ok) {
      const data = await res.json();
      console.debug('[vmControl] health data:', JSON.stringify(data));
      if (data.health === 'online') {
        setIndicator('green', 'Server Online');
        if (wakeStatus) wakeStatus.textContent = '';
      } else {
        setIndicator('red', 'Server Offline');
        if (wakeStatus) wakeStatus.textContent = 'Server is offline.';
      }
    } else {
      throw new Error(`API HTTP ${res.status}`);
    }
  } catch (error) {
    console.debug('[vmControl] status check failed:', (error as Error).message);
    setIndicator('blue', 'Status Unknown');
    if (wakeStatus) wakeStatus.textContent = 'Could not check server status.';
  }
}

async function vmAction(action: 'start' | 'stop' | 'reset'): Promise<void> {
  if (!vmId) await discoverVmId();
  if (!vmId) await discoverVmId();
  if (!vmId) {
    setIndicator('blue', 'VM not found');
    if (wakeStatus) wakeStatus.textContent = 'Could not discover VM.';
    return;
  }

  const urls: Record<string, string | null> = { start: vmStartUrl, stop: vmStopUrl, reset: vmResetUrl };
  const url = urls[action];
  if (!url) return;

  console.debug('[vmControl] action:', action, '→ POST', url);
  setIndicator('yellow', `Sending ${action}...`);
  if (wakeStatus) wakeStatus.textContent = `Sending ${action} command...`;

  try {
    const t0 = performance.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });
    console.debug('[vmControl] action response:', response.status, `(${((performance.now() - t0) / 1000).toFixed(1)}s)`);

    if (response.ok) {
      const data = await response.json();
      console.debug('[vmControl] action result:', JSON.stringify(data));
      const messages: Record<string, string> = { start: 'VM starting...', stop: 'VM stopping...', reset: 'VM resetting...' };
      setIndicator('yellow', messages[action]);
      if (wakeStatus) wakeStatus.textContent = messages[action];

      setTimeout(() => checkServerStatus(), 10000);
      setTimeout(() => checkServerStatus(), 30000);
      setTimeout(() => checkServerStatus(), 60000);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.debug('[vmControl] action failed:', response.status, errorData);
      setIndicator('red', `${action} failed`);
      if (wakeStatus) wakeStatus.textContent = (errorData as { message?: string }).message || `${action} failed`;
      await checkServerStatus();
    }
  } catch (e) {
    console.debug('[vmControl] action error:', (e as Error).message);
    setIndicator('blue', 'Could not reach API');
    if (wakeStatus) wakeStatus.textContent = 'Could not reach API.';
    await checkServerStatus();
  }
}

export function initVmControl(): void {
  statusDot = document.getElementById('status-dot');
  statusText = document.getElementById('status-text');
  wakeStatus = document.getElementById('wake-status');

  const startBtn = document.getElementById('vm-start-btn');
  const stopBtn = document.getElementById('vm-stop-btn');
  const resetBtn = document.getElementById('vm-reset-btn');
  const refreshBtn = document.getElementById('vm-refresh-btn');

  if (startBtn) startBtn.addEventListener('click', () => vmAction('start'));
  if (stopBtn) stopBtn.addEventListener('click', () => vmAction('stop'));
  if (resetBtn) resetBtn.addEventListener('click', () => vmAction('reset'));
  if (refreshBtn) refreshBtn.addEventListener('click', () => checkServerStatus());

  checkServerStatus();
  setInterval(checkServerStatus, 30000);
}
