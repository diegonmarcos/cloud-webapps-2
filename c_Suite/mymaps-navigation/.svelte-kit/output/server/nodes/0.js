import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.LQcJiNCm.js","_app/immutable/chunks/DUDsNDC3.js","_app/immutable/chunks/CzLXyedc.js","_app/immutable/chunks/CmnUXv2k.js","_app/immutable/chunks/B_AufDzU.js"];
export const stylesheets = ["_app/immutable/assets/0.C6vRT-s4.css"];
export const fonts = [];
