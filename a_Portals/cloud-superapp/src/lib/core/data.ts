import type { PortalData, Section, ShellData, MockAppsData, LinktreeData } from './types';

interface SectionsFile {
  sections: Record<string, Section>;
}

// data_wrap keys each companion by its source filename (no extension) —
// shell.json -> "shell", sections-core.json -> "sections-core", etc. Merged
// here into one PortalData shape so the rest of the client code (drawer.ts,
// stars.ts) doesn't need to know the data is split across 4 files on disk,
// mirroring how generate-pages.mjs merges the same files at build time.
let cached: PortalData | null = null;

export function getData(): PortalData {
  if (cached) return cached;

  const bag = (globalThis as unknown as { PORTAL_DATA?: Record<string, unknown> }).PORTAL_DATA;
  const shell = bag?.['shell'] as ShellData | undefined;
  const core = bag?.['sections-core'] as SectionsFile | undefined;
  const contentFile = bag?.['sections-content'] as SectionsFile | undefined;
  if (!shell || !core || !contentFile) throw new Error('cloud-superapp portal data not loaded');

  // Cloud > App groups are GENERATED from the SuperApp (src/data/cloud-apps.json, gen-nav.mjs).
  const cloudApps = bag?.['cloud-apps'] as { groups?: unknown[] } | undefined;
  const cloudPages = core.sections.cloud?.pages;
  if (cloudApps?.groups && cloudPages) {
    core.sections.cloud.pages = cloudPages.map((p) => (typeof p !== 'string' && p.id === 'apps' ? { ...p, groups: cloudApps.groups } : p)) as typeof cloudPages;
  }

  cached = {
    ...shell,
    sections: {
      ...core.sections,
      ...contentFile.sections,
      home: { label: 'Home', icon: 'home', color: 'blue' },
    },
  };
  return cached;
}

export function getMockApps(): MockAppsData {
  const bag = (globalThis as unknown as { PORTAL_DATA?: Record<string, unknown> }).PORTAL_DATA;
  const mock = bag?.['mock-apps'] as MockAppsData | undefined;
  if (!mock) throw new Error('mock-apps portal data not loaded');
  return mock;
}

// Browser > Linktree page data — same PORTAL_DATA companion pattern
// as getMockApps() above, wired by front-data-json-js-wrapper.sh from
// src/data/linktree.json -> data-linktree.json.js -> PORTAL_DATA['linktree'].
export function getLinktree(): LinktreeData {
  const bag = (globalThis as unknown as { PORTAL_DATA?: Record<string, unknown> }).PORTAL_DATA;
  const linktree = bag?.['linktree'] as LinktreeData | undefined;
  if (!linktree) throw new Error('linktree portal data not loaded');
  return linktree;
}
