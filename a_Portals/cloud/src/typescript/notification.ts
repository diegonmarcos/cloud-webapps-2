export function showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('closing');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}
