const init = (): void => {
  const cards = document.querySelectorAll<HTMLElement>('.app-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';

    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 400 + i * 120);
  });

  cards.forEach(card => {
    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) perspective(800px) rotateX(${y * -4}deg) rotateY(${x * 4}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
