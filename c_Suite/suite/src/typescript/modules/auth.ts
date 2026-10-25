import { updateActionButtons } from './actionButtons';

export function initAuth(): void {
  const authBtns = document.querySelectorAll<HTMLElement>('.auth-btn');

  authBtns.forEach(btn => {
    btn.addEventListener('click', function (this: HTMLElement) {
      authBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      updateActionButtons();
    });
  });
}
