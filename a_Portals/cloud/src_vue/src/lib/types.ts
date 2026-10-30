export type ServiceId =
  | 'analytics'
  | 'sync'
  | 'n8n'
  | 'vps-oracle'
  | 'vps-gcloud'
  | 'vm-webserver1'
  | 'vm-servicesserver1'
  | 'vm-arch1'
  | 'mail'
  | 'terminal'
  | 'dashboard';

export type ServiceStatus = 'online' | 'pending' | 'offline';

export interface Service {
  id: string;
  name: string;
  description?: string;
  url: string;
  status: ServiceStatus;
  icon: string;
  sshCommand?: string;
  cliInstall?: string;
  cliConnect?: string;
  proxyUrl?: string;
  firewallUrl?: string;
}

export interface ServiceSection {
  title: string;
  services: Service[];
}

export type ViewType = 'cards' | 'tree' | 'architecture' | 'ai-architecture';
export type Theme = 'minimalistic' | 'blurred';

export interface TreeService {
  id: string;
  type: 'section' | 'vps' | 'vm' | 'os' | 'service' | 'container'; // or more specific types
  label?: string; // For section divider
  title?: string;
  subtitle?: string;
  config?: string;
  port?: string;
  status?: ServiceStatus;
  icon?: string; // Or a specific icon component
  expanded?: boolean; // For initial state
  clickable?: boolean;
  url?: string; // For service nodes that can be clicked
  sshCommand?: string;
  // Nested structure
  children?: TreeService[];
  siblings?: TreeService[][]; // For sibling columns like in VPS IaaS
}
