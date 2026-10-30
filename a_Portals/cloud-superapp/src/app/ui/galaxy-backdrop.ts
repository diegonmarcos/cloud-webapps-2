// src/app/ui/galaxy-backdrop.ts — animated galaxy backdrop, standing in for
// the APK's GalaxyBackdropView: ~220 twinkling stars (per-star sine alpha)
// plus 3 diagonal comets with fading tails, all on an 18s loop. Renders
// into a canvas injected as the first child of .galaxy-backdrop (see
// _stars.scss's .galaxy-backdrop__canvas — sits above the two nebula-blob
// background-image layers, below everything else).

const STAR_COUNT = 220;
const COMET_COUNT = 3;
const CYCLE_MS = 18000;
const TAIL_SEGMENTS = 12;

interface Star {
  x: number; // 0..1, fraction of canvas width
  y: number; // 0..1, fraction of canvas height
  radius: number;
  phase: number; // radians offset into the twinkle sine wave
  speed: number; // twinkle cycles per 18s loop
}

interface Comet {
  phase: number; // 0..1 offset into the 18s loop where this comet starts
  y0: number; // start y, 0..1
  length: number; // travel length as a fraction of the diagonal
}

function makeStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      radius: 0.6 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      speed: 1 + Math.random() * 2,
    });
  }
  return stars;
}

function makeComets(): Comet[] {
  const comets: Comet[] = [];
  for (let i = 0; i < COMET_COUNT; i++) {
    comets.push({
      phase: i / COMET_COUNT,
      y0: Math.random(),
      length: 0.35 + Math.random() * 0.25,
    });
  }
  return comets;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stars: Star[],
  comets: Comet[],
  t: number, // 0..1 fraction through the 18s cycle
): void {
  ctx.clearRect(0, 0, width, height);

  for (const star of stars) {
    const alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((t * Math.PI * 2 * star.speed) + star.phase));
    ctx.beginPath();
    ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    ctx.fill();
  }

  for (const comet of comets) {
    const local = (t - comet.phase + 1) % 1; // 0..1, this comet's own progress
    const headX = local * (width + height) - height; // travel off both edges
    const headY = comet.y0 * height + local * height * 0.6;

    for (let seg = 0; seg < TAIL_SEGMENTS; seg++) {
      const segT = seg / TAIL_SEGMENTS;
      const segX = headX - segT * comet.length * width;
      const segY = headY - segT * comet.length * height * 0.6;
      if (segX < -20 || segX > width + 20 || segY < -20 || segY > height + 20) continue;
      const alpha = (1 - segT) * 0.8;
      ctx.beginPath();
      ctx.arc(segX, segY, 1.6 * (1 - segT * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(233, 216, 253, ${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }
}

export function initGalaxyBackdrop(): void {
  const host = document.querySelector<HTMLElement>('.galaxy-backdrop');
  if (!host) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'galaxy-backdrop__canvas';
  host.insertBefore(canvas, host.firstChild);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const stars = makeStars();
  const comets = makeComets();

  let width = 0;
  let height = 0;

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = host!.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  if (reduceMotion) {
    drawFrame(ctx, width, height, stars, comets, 0);
    return;
  }

  let rafId = 0;

  function frame(now: number): void {
    const t = (now % CYCLE_MS) / CYCLE_MS;
    drawFrame(ctx!, width, height, stars, comets, t);
    rafId = window.requestAnimationFrame(frame);
  }

  function start(): void {
    if (rafId) return;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop(): void {
    if (!rafId) return;
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  start();
}
