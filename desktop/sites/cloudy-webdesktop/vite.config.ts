import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // @cloudy/ui is the pinned workspace package in .vendor/, consumed as source.
  server: { fs: { allow: ['../..'] } },
});
