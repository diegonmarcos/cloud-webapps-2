// src/lib/onehand/config.ts — local types for the "onehand" shell.json key
// (edge-handle swipe menus). Declared here, not in ../core/types.ts, because
// that file is shared by every engine and app-chrome module; onehand is the
// only consumer of this shape.
import type { PortalData } from '../core/types';

export type OnehandSectorKey = 'top' | 'top_middle' | 'center' | 'down_middle' | 'down';

// Only "back" has a real web equivalent (history.back()) — every other
// sector in the sample data is a label-only Android shortcut (WhatsApp
// Business, Obsidian, ...) with no web destination, so it stays untyped
// here rather than inventing a grammar this data never uses.
export type OnehandAction = 'back';

export interface OnehandSector {
  label: string;
  action?: OnehandAction;
}

export interface OnehandHandle {
  edge: 'left' | 'right';
  sectors: Partial<Record<OnehandSectorKey, OnehandSector>>;
}

export interface OnehandDefaults {
  length_dp: number;
  thickness_dp: number;
  swipe_threshold_dp: number;
}

export interface OnehandConfig {
  handles: OnehandHandle[];
  defaults: OnehandDefaults;
}

// shell.json's ShellData interface (../core/types.ts) doesn't declare an
// "onehand" field — it's a shared type this module isn't allowed to touch —
// so the cast happens once here, at the single point where the raw
// PortalData is read, instead of scattering `as unknown as ...` through
// edge-menu.ts.
export function getOnehandConfig(data: PortalData): OnehandConfig | null {
  const withOnehand = data as unknown as { onehand?: OnehandConfig };
  return withOnehand.onehand ?? null;
}
