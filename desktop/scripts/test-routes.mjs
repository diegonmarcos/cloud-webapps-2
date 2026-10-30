#!/usr/bin/env node
// test-routes.mjs (#1321): every path of the pinned routes.json is prerendered at sites/cloudy-webdesktop/dist/<path>/index.html.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(readFileSync(join(root, '.vendor/cloudy-ui/nav/routes.json'), 'utf8')).routes;
const miss = routes.filter((r) => !existsSync(join(root, 'sites/cloudy-webdesktop/dist', r.path, 'index.html'))).map((r) => r.path || '(home)');
if (miss.length) { console.error(`test-routes: ${miss.length} routes not prerendered: ${miss.slice(0, 20).join(' ')}`); process.exit(1); }
console.log(`test-routes: ok, ${routes.length} desktop routes prerendered`);
