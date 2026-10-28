// Shared target-grammar resolver — mirrors resolveTarget() in
// scripts/generate-pages.mjs exactly. Both the build-time page generator
// and this client-side helper must agree on how a real app "target"
// string (section:/page:/https:.../extapp:/...) maps to a web href, or
// links and the drawer/star menus would disagree with the generated pages.

export interface ResolvedTarget {
  href: string | null;
  external: boolean;
}

export function resolveTarget(target: string | null | undefined): ResolvedTarget {
  if (!target) return { href: null, external: false };
  if (target.startsWith('https://') || target.startsWith('http://')) {
    return { href: target, external: true };
  }
  if (target.startsWith('section:')) {
    return { href: routeHref([target.slice('section:'.length)]), external: false };
  }
  if (target.startsWith('page:')) {
    return { href: routeHref(target.slice('page:'.length).split('/')), external: false };
  }
  // extapp: / intent: / app: / tab: / action: / mode: / stub: — Android-only, no web destination.
  return { href: null, external: false };
}

export function routeHref(segments: string[]): string {
  return '/' + ['cloud-superapp', ...segments.filter(Boolean)].join('/') + '/';
}
