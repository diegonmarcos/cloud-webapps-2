// GENERATED FROM nav-overlay.json by front-data-json-js-wrapper.sh — DO NOT EDIT BY HAND.
// Re-generate with: bash Lnktree/linktree/src/data/build.sh
(function () {
  var g = (typeof globalThis !== "undefined") ? globalThis : (typeof window !== "undefined" ? window : this);
  g.PORTAL_DATA = g.PORTAL_DATA || {};
  g.PORTAL_DATA["nav-overlay"] = {
  "_doc": "HAND-WRITTEN companion of nav.json (which scripts/gen-nav.mjs GENERATES from the Android build.json files). Everything the Android declarations cannot say lives here: which fleet apps the site mirrors, how Android drawable ids map onto the web icon set, which web page body (already written in sections-content.json) a generated page reuses, the density, and the Cloud > WebApps tab until the SuperApp declares it itself.",
  "fleet_apps": [
    { "id": "c3", "dir": "ac_cloud-c3", "name": "Cloud C3" },
    { "id": "calc", "dir": "ac_cloud-calc", "name": "Cloud Calc" },
    { "id": "tasks", "dir": "ac_cloud-tasks", "name": "Cloud Tasks" },
    { "id": "notes", "dir": "ac_cloud-notes", "name": "Cloud Notes" },
    { "id": "dialer", "dir": "ac_cloud-dialer", "name": "Cloud Dialer" },
    { "id": "store", "dir": "ac_cloud-store", "name": "Cloud Store" },
    { "id": "nav", "dir": "ac_cloud-nav", "name": "Cloud Nav" }
  ],
  "density": "dense",
  "top_bar": { "_doc": "The fleet's shared AppTopBar (libs:bottomnav): hamburger at the left, the app title, then two circular buttons AI and Settings. Declared once for the fleet; per-app flags (drawer/ai/settings) come from each build.json ui.top_bar and are generated into nav.json.", "ai_label": "AI", "settings_label": "Settings" },
  "icon_map": {
    "ic_p_inbox": "mail", "ic_pm_boards": "briefcase", "ic_suite": "suite", "ic_p_dialer": "phone", "ic_mail": "mail",
    "ic_rss": "rss", "ic_home": "home", "ic_calendar": "calendar", "ic_vault": "lock", "ic_chat": "chat", "ic_wg": "mesh",
    "ic_solutions": "tools", "ic_settings": "settings", "ic_mode_apps": "suite", "ic_file_stack": "logs", "ic_world": "browser",
    "ic_wallet": "wallet", "ic_heart": "heart", "ic_lock": "lock", "ic_refresh": "refresh", "ic_robot": "robot",
    "ic_superapp_d": "home", "ic_p_watchdog": "cube", "ic_p_sol_cloud": "suite", "ic_p_sol_personal": "user", "ic_p_sol_tools": "tools",
    "ic_p_folder": "pin", "ic_p_c3_stack": "cube", "ic_p_c3_workflows": "workflow", "ic_search": "browser",
    "home": "home", "tasks": "logs", "calendar": "calendar", "settings": "settings", "calculate": "tools", "table_chart": "database",
    "auto_awesome": "sparkles", "speed": "chart", "psychology": "brain", "person": "user", "star": "sparkles", "history": "logs",
    "sms": "chat", "pages": "logs", "canvas": "pin", "graph": "mesh", "search": "browser", "cloud": "suite", "phone": "phone",
    "feed": "rss", "access": "lock", "routes": "pin", "navigation": "browser", "places": "pin", "timeline": "logs", "configs": "settings"
  },
  "page_content_alias": {
    "_doc": "Generated Configs page id -> id of the page body already written in sections-content.json (config). A generated page with no alias and no declared tiles/stack renders its tab strip and an honest empty state.",
    "config": { "profile": "profile", "perms": "permissions", "onehand": "onehand", "controls": "launcher", "notify": "launcher", "c3": "update-all", "kde": "kde", "about": "about", "store": "update-all" }
  },
  "extra_pages": {
    "_doc": "Pages the web replica must carry that the SuperApp build.json does not declare YET. gen-nav output wins: once ui.sections[cloud].pages declares an id listed here, the overlay entry is ignored. WebApps = the SuperApp's new Cloud > Apps tab that hosts THIS site (?embed=1).",
    "cloud": [{ "id": "webapps", "label": "WebApps", "after": "apps", "icon": "browser" }]
  },
  "page_order_hint": {
    "_doc": "Cloud top tabs as the owner states them: App | WebApps | Linktree | Configs.",
    "cloud": ["apps", "webapps", "lnktree", "configs"]
  },
  "page_label_override": { "cloud": { "apps": "App" } }
}
;
})();
