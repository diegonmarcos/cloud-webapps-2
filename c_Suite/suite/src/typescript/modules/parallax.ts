export function initParallax(): void {
  document.addEventListener('mousemove', (e: MouseEvent) => {
    const docs = document.querySelectorAll<HTMLElement>('.doc-icon');
    const glows = document.querySelectorAll<HTMLElement>('.glow-spot');
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;

    docs.forEach((doc, i) => {
      const factor = (i % 4 + 1) * 0.4;
      const rotateAmount = x * 0.1 * factor;
      doc.style.transform = `translate(${x * factor}px, ${y * factor}px) rotate(${rotateAmount}deg)`;
    });

    glows.forEach((glow, i) => {
      const factor = (i + 1) * 0.15;
      glow.style.transform = `translate(${x * factor}px, ${y * factor}px) scale(${1 + Math.abs(x * 0.002)})`;
    });
  });
}
