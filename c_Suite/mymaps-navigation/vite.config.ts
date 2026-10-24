import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
	plugins: [sveltekit(), cesium()],
	server: {
		port: 8018,
		open: false,
	},
	css: {
		preprocessorOptions: {
			scss: {
				// Use modern Sass API
			}
		}
	}
});
