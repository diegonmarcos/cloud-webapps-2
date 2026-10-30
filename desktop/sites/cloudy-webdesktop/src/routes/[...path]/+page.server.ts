import { error } from '@sveltejs/kit';
import type { EntryGenerator } from './$types';
import { ROUTES, deskView } from '$lib/server/desk';

export const entries: EntryGenerator = () => ROUTES.map((r) => ({ path: r.path.replace(/\/$/, '') }));
export const load = ({ params }) => {
  const view = deskView(params.path ? `${params.path}/` : '');
  if (!view) error(404, `No page ${params.path}`);
  return { view };
};
