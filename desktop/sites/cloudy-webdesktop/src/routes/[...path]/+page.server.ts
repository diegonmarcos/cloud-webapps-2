import { error } from '@sveltejs/kit';
import type { EntryGenerator } from './$types';
import { ROUTES, deskView } from '$lib/server/desk';

export const entries: EntryGenerator = () => ROUTES.map((r) => ({ path: r.path.replace(/\/$/, '') }));
export const load = ({ params }) => {
  const path = params.path ? `${params.path.replace(/\/$/, '')}/` : '';
  const view = deskView(path);
  if (!view) {
    // printed in the prerender log: the build fails on any 404, this says which lookup missed
    console.error(`[desk] no view for "${path}" (params.path=${JSON.stringify(params.path)}, ${ROUTES.length} routes)`);
    error(404, `No page ${path}`);
  }
  return { view };
};
