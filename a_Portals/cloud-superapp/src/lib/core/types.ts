export interface Tile {
  id: string;
  label: string;
  icon: string;
  target?: string | null;
}

export interface ItemRef {
  title: string;
  subtitle?: string;
  meta?: string;
}

export interface ConstellationApp {
  id: string;
  label: string;
  pkg: string;
  image: string;
  status: 'installed' | 'update' | 'missing' | 'blocked' | 'error';
  version?: string;
  versionCode?: string;
  sha?: string;
  remoteDigest?: string;
  message?: string;
}

export interface ConstellationData {
  autoUpdate: boolean;
  installPermGranted: boolean;
  apps: ConstellationApp[];
}

export type PageEntry = string | {
  id: string;
  label: string;
  icon?: string;
  target?: string;
  // Hidden pages are filtered out of every child list (section grid, tab
  // strip, drawer, radial menus) but stay declared, generated and routable —
  // mirrors Sections.kt's pages/allPages split.
  hidden?: boolean;
  // Aggregator + content page bodies, all optional and freely combined.
  tiles?: Tile[];
  groups?: TileGroup[];
  stack?: StackCard[];
  rows?: [string, string][];
  items?: ItemRef[];
  // Bodies that come from somewhere other than this page's own data:
  // 'linktree' (linktree.json), 'mirror' (+ mirror: sectionId), 'phone-apps'.
  render?: 'linktree' | 'mirror' | 'phone-apps';
  mirror?: string;
  constellation?: ConstellationData;
};

export interface TileGroup {
  title: string;
  tiles: Tile[];
}

export interface AppRef {
  name: string;
  icon: string;
  category?: string;
  pinned?: boolean;
  real?: boolean;
  // Simulated Android metadata — deterministic mock values, no live device API.
  package?: string;
  // Short token for the on-device installer package: play =
  // com.android.vending, samsung = com.sec.android.app.samsungapps, sideload
  // = com.google.android.packageinstaller, direct = no owning store.
  installSource?: 'play' | 'samsung' | 'fdroid' | 'sideload' | 'uptodown' | 'direct';
  firstInstallDaysAgo?: number;
  lastUsedHoursAgo?: number;
  opens7d?: number;
  batteryPct7d?: number;
  usageMin7d?: number;
  // Topical folder membership — references PhoneFolder.id.
  folderId?: string;
}

export interface AppFolder {
  label: string;
  apps: AppRef[];
}

export interface PhoneFolder {
  id: string;
  label: string;
  order: number;
}

export interface AppGroup {
  title: string;
  apps: AppRef[];
  folders?: AppFolder[];
}

export interface StackCard {
  kind: string;
  title: string;
  subtitle?: string;
  target?: string;
  rows?: [string, string][];
}

export interface Section {
  label: string;
  icon: string;
  color: string;
  tiles?: Tile[];
  pages?: PageEntry[];
}

export interface PortalUser {
  name: string;
  email: string;
  initials: string;
  mode: string;
}

export interface PortalApp {
  name: string;
  build: string;
  user: PortalUser;
}

export interface RadialNode {
  id: string;
  label: string;
  icon?: string;
  target?: string;
  children?: RadialNode[];
}

export interface StarsConfig {
  sirius: { nodes: RadialNode[] };
  canopus: { fixedSection: string };
  centauri: { recentApps: string[] };
}

export interface LongPressItem {
  id: string;
  label: string;
  icon: string;
  target: string | null;
}

export interface NotificationItem {
  title: string;
  subtitle?: string;
}

export interface NotificationGroup {
  title: string;
  items: NotificationItem[];
}

export interface NotificationCenterConfig {
  emptyTitle: string;
  emptyBody: string;
  groups?: NotificationGroup[];
}

export interface FooterApk {
  label: string;
  sub: string;
  url: string;
}

export interface FooterConstellationApp {
  id: string;
  label: string;
  url: string;
}

export interface FooterConfig {
  apk: FooterApk;
  constellation: FooterConstellationApp[];
}

export interface UpdateOverlayConfig {
  title: string;
  states: Record<string, string>;
}

export interface StatusBarConfig {
  left: { label: string; active: boolean }[];
  right: { label: string; value: string }[];
}

// shell.json's own shape (before sections are merged in by data.ts).
export interface ShellData {
  app: PortalApp;
  bottomNav: string[];
  cube: { glow: string; line: string; dot: string };
  stars: StarsConfig;
  longPress: Record<string, LongPressItem[]>;
  notificationCenter: NotificationCenterConfig;
  updateOverlay: UpdateOverlayConfig;
  statusBar: StatusBarConfig;
  footer: FooterConfig;
}

export interface MockAppsData {
  apps: AppRef[];
  phoneFolders: PhoneFolder[];
}

// Browser > Linktree page data — see src/data/linktree.json.
export interface LinktreeTile {
  label: string;
  icon: string;
  href?: string;
}

export interface LinktreeGroup {
  id: string;
  label: string;
  tiles: LinktreeTile[];
}

export interface LinktreeData {
  groups: LinktreeGroup[];
}

export interface PortalData extends ShellData {
  sections: Record<string, Section>;
}
