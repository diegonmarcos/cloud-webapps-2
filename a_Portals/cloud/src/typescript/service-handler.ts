import type { ServiceId, ServiceUrls } from './types';
import { showNotification } from './notification';
import { parseSSHUrl, showSSHModal } from './ssh-modal';

const serviceUrls: ServiceUrls = {
    // Product & Services
    'analytics': 'https://analytics.diegonmarcos.com',  // matomo-app
    'cloud-dashboard': '#pending',                       // Cloud_Dashboard
    'mail': '#pending',                                  // mailserver
    'terminal': '#pending',                              // Web_Shell_Terminal
    'agentic-dashboard': '#pending',                     // Agentic_Dashboard
    'gitea': '#pending',                                 // Gitea git server
    'openvpn': '#pending',                               // OpenVPN server

    // Cloud Providers (Management)
    'vps-oracle': 'https://cloud.oracle.com/',           // OCloud-Management
    'vps-gcloud': 'https://console.cloud.google.com/',   // Gcloud_Management

    // SSH VMs (Management)
    'vm-servicesserver1': 'ssh://ubuntu@129.151.228.66', // SSH-VM-Oracle_Services_Serv
    'vm-webserver1': 'ssh://ubuntu@130.110.251.193',     // SSH-VM-Oracle_Web_Server_1
    'vm-gcloud': 'ssh://diego@pending',                  // SSH-VM-GCloud_microe2Linux_1

    // NPMs (Infra Services)
    'npm-services': 'http://129.151.228.66:81',          // NPM-VM-Oracle_Services_Serv
    'npm-web': 'http://130.110.251.193:81',              // NPM-VM-Oracle_Web_Server_1
    'npm-gcloud': '#pending',                            // NPM-VM-Gcloud

    // Databases (Infra Services)
    'matomo-db': '#internal',                            // matomo-db
    'mail-db': '#pending',                               // mail-db

    // Others (Infra Services)
    'n8n-infra': 'https://n8n.diegonmarcos.com',         // n8n-server (Infra)
    'flask-server': '#pending',                          // Flask-server
    'flask-cloud-dashboard': '#pending',                 // Flask-Cloud_Dashboard
    'linktree': 'https://linktree.diegonmarcos.com'      // Linktree
};

// VPS CLI install commands
const vpsCliCommands: Record<string, { install: string; connect?: string }> = {
    'vps-oracle': {
        install: 'bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"',
        connect: 'oci compute instance list --compartment-id $OCI_COMPARTMENT_ID'
    },
    'vps-gcloud': {
        install: 'curl https://sdk.cloud.google.com | bash && exec -l $SHELL && gcloud init',
        connect: 'gcloud compute instances list'
    }
};

export function handleCardClick(service: ServiceId): void {
    const url = serviceUrls[service];
    if (!url) return;

    console.log(`Navigating to ${service}: ${url}`);

    if (url.startsWith('ssh://')) {
        handleSSH(url);
    } else if (url === '#pending') {
        showNotification('This service is under development.');
    } else if (url.startsWith('http')) {
        window.open(url, '_blank');
    } else {
        window.location.href = url;
    }
}

function handleSSH(sshUrl: string): void {
    const sshInfo = parseSSHUrl(sshUrl);
    if (!sshInfo) return;

    if (sshInfo.host === 'pending' || sshInfo.host.includes('pending')) {
        showNotification('This VM is not yet configured. IP address pending.');
        return;
    }

    showSSHModal(sshInfo);
}

export function showVPSModal(vpsId: 'vps-oracle' | 'vps-gcloud'): void {
    const cli = vpsCliCommands[vpsId];
    const consoleUrl = serviceUrls[vpsId];
    const vpsName = vpsId === 'vps-oracle' ? 'Oracle Cloud' : 'Google Cloud';

    const overlay = document.createElement('div');
    overlay.className = 'ssh-modal-overlay';
    overlay.innerHTML = `
        <div class="ssh-modal vps-modal">
            <h3>${vpsName} Access</h3>

            <div class="vps-section">
                <h4>Console</h4>
                <button class="vps-action-btn" data-action="console">Open ${vpsName} Console</button>
            </div>

            <div class="vps-section">
                <h4>CLI Installation</h4>
                <div class="ssh-command">
                    <code>${cli.install}</code>
                    <button class="copy-btn" data-action="copy-install">Copy</button>
                </div>
            </div>

            ${cli.connect ? `
            <div class="vps-section">
                <h4>List Instances</h4>
                <div class="ssh-command">
                    <code>${cli.connect}</code>
                    <button class="copy-btn" data-action="copy-connect">Copy</button>
                </div>
            </div>
            ` : ''}

            <button class="close-modal-btn" data-action="close">Close</button>
        </div>
    `;

    overlay.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).dataset.action;
        if (e.target === overlay || action === 'close') {
            overlay.remove();
        } else if (action === 'console') {
            window.open(consoleUrl, '_blank');
        } else if (action === 'copy-install') {
            navigator.clipboard.writeText(cli.install).then(() => {
                showNotification('CLI install command copied!');
            });
        } else if (action === 'copy-connect') {
            navigator.clipboard.writeText(cli.connect || '').then(() => {
                showNotification('Connect command copied!');
            });
        }
    });

    document.body.appendChild(overlay);
}
