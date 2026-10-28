import { showNotification } from './notification';
import type { SSHConnectionInfo } from './types';

export function parseSSHUrl(sshUrl: string): SSHConnectionInfo | null {
    const match = sshUrl.match(/ssh:\/\/(.+)@(.+)/);
    if (!match) return null;

    const username = match[1];
    const host = match[2];
    const command = `ssh -i ~/.ssh/matomo_key ${username}@${host}`;

    return { username, host, command };
}

export function showSSHModal(sshInfo: SSHConnectionInfo): void {
    const modal = document.createElement('div');
    modal.className = 'ssh-modal-overlay';
    modal.innerHTML = `
        <div class="ssh-modal">
            <h3>SSH Connection to ${sshInfo.host}</h3>
            <div class="ssh-command">
                <code>${sshInfo.command}</code>
                <button class="copy-btn" data-action="copy">Copy</button>
            </div>
            <p class="ssh-instruction">Choose how to connect:</p>
            <div class="ssh-options">
                <button class="ssh-option-btn" data-action="terminal">
                    Open in Terminal
                </button>
                <button class="ssh-option-btn" data-action="vscode">
                    Open in VS Code
                </button>
            </div>
            <button class="close-modal-btn" data-action="close">Close</button>
        </div>
    `;

    modal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const action = target.dataset.action;

        if (e.target === modal || action === 'close') {
            closeSSHModal();
        } else if (action === 'copy') {
            copyToClipboard(sshInfo.command);
        } else if (action === 'terminal') {
            openTerminalProtocol(sshInfo.command);
        } else if (action === 'vscode') {
            openVSCode(sshInfo);
        }
    });

    document.body.appendChild(modal);
}

export function closeSSHModal(): void {
    const modal = document.querySelector('.ssh-modal-overlay');
    if (modal) modal.remove();
}

function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('SSH command copied to clipboard!');
    });
}

function openTerminalProtocol(sshCommand: string): void {
    const isLinux = /Linux/.test(navigator.userAgent);
    const isMac = /Mac/.test(navigator.userAgent);

    if (isLinux) {
        window.location.href = `gnome-terminal://execute/${encodeURIComponent(sshCommand)}`;
    } else if (isMac) {
        window.location.href = `terminal://execute/${encodeURIComponent(sshCommand)}`;
    } else {
        copyToClipboard(sshCommand);
        showNotification('Command copied! Paste it in your terminal.');
    }
    closeSSHModal();
}

function openVSCode(sshInfo: SSHConnectionInfo): void {
    const { username, host } = sshInfo;
    window.open(`vscode://vscode-remote/ssh-remote+${username}@${host}/home/${username}`, '_blank');
    closeSSHModal();
}
