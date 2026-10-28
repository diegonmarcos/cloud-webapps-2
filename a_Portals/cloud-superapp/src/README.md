# src/ module boundary

This tree mirrors the real Android APK's module boundary so the web port and
the app share one mental model.

- `lib/` — engines. Mirrors the APK's `libs/` module: one file per widget,
  framework-agnostic logic (data resolution, rendering, interaction). Importing
  from `app/` here is FORBIDDEN — `lib/` must never know about app chrome.
  - `lib/core/` — shared low-level types, data loading, and the target-grammar
    router (`nav.ts`) used by both engines and app chrome.
  - `lib/onehand/` — the one-hand "Sirius" radial/stars engine.
- `app/` — chrome. Mirrors the APK's app packages: `launcher/` (drawer,
  fan menu, stack cards, bottom nav, tiles), `cloud/` (calendar widgets),
  `overlays/` (notification center / update overlay), plus `main.ts` (the
  esbuild entry) and `service-worker.ts`. `app/` may import from `lib/`, never
  the other way around.
- `data/` — mirrors `build.json`'s `ui.*` data manifests (shell, sections,
  mock apps) consumed by both the page generator and the client engines.
- `scss/` — mirrors the same `lib/` vs `app/` split as the TypeScript tree,
  rooted at `scss/_variables.scss`, `scss/_mixins.scss`, `scss/_base.scss`,
  and `scss/main.scss` (load order defined there).

## Nav data: generated vs hand-written

`data/nav.json` is **generated** — never edit it. `scripts/gen-nav.mjs` reads the
Android `build.json` `ui` declarations (SuperApp `aa_cloud-superapp` + the fleet
apps listed in `nav-overlay.json`: C3, Calc, Tasks, Notes, Dialer, Store, Nav) and
writes: the bottom-nav order, every section + page (label, hidden, facet, tabs,
group/subgroup), the Configs tree (Setup{Connect, Apps, Launcher, Network} · Fleet ·
Observability, Controls{Presets, Panels{UI, Tools}}), the Cloud ▸ Configs tile group,
declared tiles/stack titles, and each fleet app's bottom island, page tabs and
AppTopBar flags. `generate-pages.mjs` overlays it on the hand-written page bodies in
`sections-*.json`, so a SuperApp nav change reaches the site with:

    node scripts/gen-nav.mjs                  # from cloud-u-android main (gh api), or --android <checkout>
    node scripts/gen-nav.mjs --check          # CI-style drift check
    bash build.sh build && node test/embed.spec.mjs

`data/nav-overlay.json` is **hand-written**: which fleet apps to mirror, the
Android-icon → web-icon map, which existing page body a generated page reuses, the
`dense` density, and the Cloud ▸ WebApps tab until the SuperApp declares it.

## Embed mode

`?embed=1`, a user agent containing `CloudSuperApp-Embed/`, or an earlier embedded
page in the same tab (sessionStorage) puts `class="embed"` on `<html>` from an inline
`<head>` script (no flash). `scss/app/_embed.scss` then hides the status strip, top
toolbar, stars, bottom nav and fleet AppTopBar and zeroes their reserved space.
`main.ts` also keeps `?embed=1` on internal links. Test: `node test/embed.spec.mjs`
(Chromium; `BASE_URL=https://diegonmarcos.github.io/cloud-superapp` for the live site).
