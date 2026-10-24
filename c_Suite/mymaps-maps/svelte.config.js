import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'dist',
			assets: 'dist',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/maps' : '',
			relative: true
		},
		prerender: {
			entries: ['/'],
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore external links to other projects
				if (path.startsWith('/mymaps')) {
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;
