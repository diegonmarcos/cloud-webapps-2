export type ServiceId =
    // Product & Services
    | 'analytics'       // matomo-app
    | 'cloud-dashboard' // Cloud_Dashboard
    | 'mail'            // mailserver
    | 'terminal'        // Web_Shell_Terminal
    | 'agentic-dashboard' // Agentic_Dashboard
    | 'gitea'           // Gitea git server
    | 'openvpn'         // OpenVPN server
    // Cloud Providers (Management)
    | 'vps-oracle'      // OCloud-Management
    | 'vps-gcloud'      // Gcloud_Management
    // SSH VMs (Management)
    | 'vm-servicesserver1'  // SSH-VM-Oracle_Services_Serv
    | 'vm-webserver1'       // SSH-VM-Oracle_Web_Server_1
    | 'vm-gcloud'           // SSH-VM-GCloud_microe2Linux_1
    // NPMs (Infra Services)
    | 'npm-services'    // NPM-VM-Oracle_Services_Serv
    | 'npm-web'         // NPM-VM-Oracle_Web_Server_1
    | 'npm-gcloud'      // NPM-VM-Gcloud
    // Databases (Infra Services)
    | 'matomo-db'       // matomo-db
    | 'mail-db'         // mail-db
    // Others (Infra Services)
    | 'n8n-infra'       // n8n-server (Infra)
    | 'flask-server'    // Flask-server
    | 'flask-cloud-dashboard' // Flask-Cloud_Dashboard
    | 'linktree';       // Linktree

export type ServiceUrls = Record<ServiceId, string>;

export interface SSHConnectionInfo {
    username: string;
    host: string;
    command: string;
}

export interface VPSInfo {
    consoleUrl: string;
    sshCommand?: string;
    cliInstall: string;
}
