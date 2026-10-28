/**
 * Plain-node self-check for c3-api.ts. Not part of the build — run manually with:
 *   npx esbuild src/typescript/c3-api.selfcheck.ts --bundle --platform=node --outfile=/tmp/c3-selfcheck.js && node /tmp/c3-selfcheck.js
 * Asserts mock-mode resolves every registry key, and live-mode failure falls back to mock.
 */

import assert from 'assert';

// Minimal DOM/localStorage/fetch shims so this runs under plain node.
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
};
(globalThis as any).PORTAL_DATA = {};

import { REGISTRY, getMode, setMode, c3, lastErrors } from './c3-api';

async function main() {
    // Seed mock data for every registry key.
    for (const key of Object.keys(REGISTRY)) {
        (globalThis as any).PORTAL_DATA['c3-' + key] = { mock: true, key };
    }

    // (a) mock mode resolves defined data for every key
    setMode('mock');
    assert.strictEqual(getMode(), 'mock');
    for (const key of Object.keys(REGISTRY)) {
        const data = await c3(key);
        assert.ok(data !== undefined, `expected mock data for key "${key}"`);
    }

    // (b) simulated live-mode failure falls back to mock value
    setMode('live');
    (globalThis as any).fetch = async () => { throw new Error('simulated network failure'); };
    const key = Object.keys(REGISTRY)[0];
    const data = await c3(key);
    assert.deepStrictEqual(data, { mock: true, key });
    assert.ok(lastErrors[key], 'expected lastErrors to record the simulated failure');

    console.log('c3-api.selfcheck: all assertions passed');
}

main().catch((err) => {
    console.error('c3-api.selfcheck FAILED:', err);
    process.exit(1);
});
