/**
 * Data Loader Module
 * Handles loading infrastructure data from either:
 * - Local mode: Uses LOCAL_DATA from cloud_control_data.js (exported by cloud_dash.py --export js)
 * - API mode: Fetches from Flask backend API
 */

// Types for infrastructure data
export interface VMData {
    id: string;
    name: string;
    provider: string;
    category: string;
    instanceType: string;
    specs: {
        cpu: string;
        ram: string;
        storage: string;
    };
    network: {
        publicIp: string;
        privateIp?: string;
    };
    ssh: {
        user: string;
        command: string;
    };
    services: string[];
    status: string;
    runtimeStatus?: {
        online: boolean;
        ping: boolean;
        ssh: boolean;
        ramPercent?: number;
        lastCheck?: string;
    };
}

export interface ServiceData {
    id: string;
    name: string;
    vm: string;
    mode: string;
    proxyAddress?: string;
    publicUrl?: string;
    port?: number;
    status: string;
}

export interface InfrastructureData {
    version: string;
    lastUpdated: string;
    providers: Record<string, any>;
    vmCategories: Record<string, any>;
    virtualMachines: Record<string, VMData>;
    services: Record<string, ServiceData>;
    domains?: Record<string, any>;
    costs?: Record<string, any>;
}

// Data source mode
type DataMode = 'local' | 'api';

// Current mode (default to local if LOCAL_DATA exists)
let currentMode: DataMode = 'local';

// API base URLs
const API_BASE = 'https://api.diegonmarcos.com/flask/api';
const RUST_API = 'https://api.diegonmarcos.com/api';

// Check if LOCAL_DATA is available
declare const LOCAL_DATA: InfrastructureData | undefined;
declare const LOCAL_DATA_TIMESTAMP: string | undefined;

/**
 * Check if local data is available
 */
export function hasLocalData(): boolean {
    return typeof LOCAL_DATA !== 'undefined' && LOCAL_DATA !== null;
}

/**
 * Get the current data mode
 */
export function getDataMode(): DataMode {
    return currentMode;
}

/**
 * Set the data mode
 */
export function setDataMode(mode: DataMode): void {
    currentMode = mode;
    console.log(`[DataLoader] Mode set to: ${mode}`);

    // Dispatch event for UI updates
    document.dispatchEvent(new CustomEvent('data-mode-changed', { detail: { mode } }));
}

/**
 * Toggle between local and API mode
 */
export function toggleDataMode(): DataMode {
    const newMode = currentMode === 'local' ? 'api' : 'local';
    setDataMode(newMode);
    return newMode;
}

/**
 * Get local data timestamp
 */
export function getLocalDataTimestamp(): string | null {
    if (typeof LOCAL_DATA_TIMESTAMP !== 'undefined') {
        return LOCAL_DATA_TIMESTAMP;
    }
    return null;
}

/**
 * Load infrastructure data based on current mode
 */
export async function loadInfrastructureData(): Promise<InfrastructureData | null> {
    console.log(`[DataLoader] loadInfrastructureData() mode=${currentMode}`);
    if (currentMode === 'local') {
        return loadLocalData();
    } else {
        return loadApiData();
    }
}

/**
 * Load data from LOCAL_DATA constant
 */
function loadLocalData(): InfrastructureData | null {
    if (!hasLocalData()) {
        console.warn('[DataLoader] LOCAL_DATA not available');
        return null;
    }
    console.log('[DataLoader] Loading from LOCAL_DATA');
    return LOCAL_DATA as InfrastructureData;
}

/**
 * Load data from API
 */
async function loadApiData(): Promise<InfrastructureData | null> {
    try {
        const url = `${API_BASE}/config`;
        console.log(`[DataLoader] Fetching API: ${url}`);
        const response = await fetch(url);
        console.log(`[DataLoader] API response: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        console.log(`[DataLoader] API data loaded:`, Object.keys(data));
        if (data.virtualMachines) {
            console.log(`[DataLoader] VMs: ${Object.keys(data.virtualMachines).join(', ')}`);
        }
        if (data.services) {
            console.log(`[DataLoader] Services: ${Object.keys(data.services).length} total`);
        }
        return data;
    } catch (error) {
        console.error('[DataLoader] API fetch failed:', error);
        return null;
    }
}

/**
 * Get all VMs
 */
export async function getVMs(): Promise<VMData[]> {
    const data = await loadInfrastructureData();
    if (!data) {
        console.warn('[DataLoader] getVMs(): no data');
        return [];
    }
    const vms = Object.values(data.virtualMachines || {});
    console.log(`[DataLoader] getVMs(): ${vms.length} VMs`);
    return vms;
}

/**
 * Get all services
 */
export async function getServices(): Promise<ServiceData[]> {
    const data = await loadInfrastructureData();
    if (!data) return [];
    return Object.values(data.services || {});
}

/**
 * Get VM by ID
 */
export async function getVM(vmId: string): Promise<VMData | null> {
    const data = await loadInfrastructureData();
    if (!data) return null;
    return data.virtualMachines?.[vmId] || null;
}

/**
 * Get service by ID
 */
export async function getService(serviceId: string): Promise<ServiceData | null> {
    const data = await loadInfrastructureData();
    if (!data) return null;
    return data.services?.[serviceId] || null;
}

/**
 * Get VM runtime metrics via Rust health API
 */
export async function getVMMetrics(vmId: string): Promise<any | null> {
    if (currentMode === 'local') {
        // Return cached runtime status from local data
        const vm = await getVM(vmId);
        console.log(`[DataLoader] getVMMetrics(${vmId}) local:`, vm?.runtimeStatus);
        return vm?.runtimeStatus || null;
    }

    try {
        const url = `${RUST_API}/health/status/${vmId}`;
        console.log(`[DataLoader] getVMMetrics fetching: ${url}`);
        const response = await fetch(url);
        console.log(`[DataLoader] getVMMetrics response: ${response.status}`);
        if (!response.ok) return null;
        const data = await response.json();
        console.log(`[DataLoader] getVMMetrics(${vmId}):`, data);
        // Map Rust health response to expected format
        return {
            online: data.health === 'online' || data.ping === true,
            ping: data.ping === true,
            ssh: data.ssh === true,
            providerState: data.provider_state,
            lastCheck: new Date().toISOString()
        };
    } catch (error) {
        console.error(`[DataLoader] getVMMetrics(${vmId}) failed:`, error);
        return null;
    }
}

/**
 * Initialize data loader
 */
export function initDataLoader(): void {
    // Default to local mode if LOCAL_DATA exists
    if (hasLocalData()) {
        currentMode = 'local';
        console.log('[DataLoader] Initialized with LOCAL_DATA');
    } else {
        currentMode = 'api';
        console.log('[DataLoader] LOCAL_DATA not found, using API mode');
    }
}

// Auto-initialize
initDataLoader();
