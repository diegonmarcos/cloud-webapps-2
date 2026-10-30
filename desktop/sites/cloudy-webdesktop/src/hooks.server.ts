import type { Handle } from '@sveltejs/kit';
import { bootScript, THEME_IDS, tokens } from '@cloudy/ui';

// The inline <head> boot script (embed flag, theme, window class) runs before first paint; generated from the theme ids.
const boot = bootScript(THEME_IDS, tokens.theme.default);
export const handle: Handle = ({ event, resolve }) => resolve(event, { transformPageChunk: ({ html }) => html.replace('%cloudy.boot%', boot) });
