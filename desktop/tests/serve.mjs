#!/usr/bin/env node
// CI-only static server laying the dists out as GitHub Pages publishes them (#1321):
//   /cloud-desktop/...  -> sites/cloudy-webdesktop/dist
//   /cloud-webapps/...  -> .vendor/cloudy-h-webapps-mob/sites/cloudy-webapps/dist (the pinned mobile site the desktop embeds)
//   /<suite app>/...    -> ../c_Suite/<app>/dist (movies, music, myfeed, tldraw, myhealth-feedyourself, mymaps-*)
// Unknown paths get 404. Never run locally (owner rule: CI builds only).
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4174);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.txt': 'text/plain' };
const SUITE = ['movies', 'music', 'myfeed', 'tldraw', 'myhealth-feedyourself', 'mymaps-maps', 'mymaps-navigation'];
const MOUNTS = [
  ['/cloud-desktop/', join(root, 'sites/cloudy-webdesktop/dist')],
  ['/cloud-webapps/', join(root, '.vendor/cloudy-h-webapps-mob/sites/cloudy-webapps/dist')],
  ...SUITE.map((s) => [`/${s}/`, join(root, '..', 'c_Suite', s, 'dist')]),
];
function resolveFile(dir, rest) {
  const p = normalize(join(dir, decodeURIComponent(rest)));
  if (!p.startsWith(dir)) return null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  return null;
}
createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = url.pathname;
  for (const [prefix, dir] of MOUNTS) {
    if (path === prefix.slice(0, -1)) { res.writeHead(301, { location: prefix + url.search }); return res.end(); }
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    const f = resolveFile(dir, rest);
    if (f) {
      if (f.endsWith('index.html') && !path.endsWith('/') && !rest.endsWith('index.html')) { res.writeHead(301, { location: path + '/' + url.search }); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
      return res.end(readFileSync(f));
    }
    break;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('404');
}).listen(port, '127.0.0.1', () => console.log(`serving dists on :${port}`));
