// src/app/launcher/stack-cards.ts — collapsible stack-cards.
//
// Every .stack-card__header ships from scripts/generate-pages.mjs with
// aria-expanded="true" already set; the CSS hides the sibling
// .stack-card__content whenever that attribute flips to "false". This
// module owns nothing but that toggle: one delegated click listener, no
// per-page wiring, no data dependency.

export function initStackCards(): void {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const header = event.target.closest<HTMLElement>('.stack-card__header');
    if (!header) return;

    const expanded = header.getAttribute('aria-expanded') === 'true';
    header.setAttribute('aria-expanded', String(!expanded));
  });
}
