import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// The build version is the git tree hash of this site's src + the @cloudy/ui pin, so an unchanged source renders a
// byte-identical dist (dist is committed; CI rebuilds it and diffs).
function treeVersion() {
  try {
    const src = execFileSync('git', ['rev-parse', 'HEAD:desktop/sites/cloudy-webdesktop/src'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().slice(0, 10);
    return `${src}-${readFileSync('../../cloudy-ui.pin', 'utf8').trim().slice(0, 10)}`;
  } catch {
    return 'dev';
  }
}

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ pages: 'dist', assets: 'dist', fallback: '404.html', precompress: false, strict: true }),
    // /cloud-desktop is the plan default the owner took (#1320 Q5): the same path shape as /cloud-webapps under its own base.
    paths: { base: '/cloud-desktop', relative: false },
    version: { name: treeVersion() },
    prerender: {
      // every route of the generated routes.json, through the [...path] entry generator
      entries: ['*'],
      handleMissingId: 'fail',
      // links into the other sites (/cloud-webapps/..., the suite apps /movies/ ...) are published by their own builds
      handleHttpError: ({ path, message }) => { if (!path.startsWith('/cloud-desktop/')) return; throw new Error(message); },
    },
  },
};
