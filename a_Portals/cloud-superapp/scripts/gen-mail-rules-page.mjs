#!/usr/bin/env node
// Regenerate sections.mail.pages["rules"] from the canonical mail rule set and
// park it directly after the Accounts page.
//
// ponytail: a dev-time generator, not a build step. The canonical JSON lives in
// another repo (cloud-u-containers), and wiring a cross-repo path into the
// portal build is exactly the coupling the 2026-08-27 carve-out broke 600
// symlinks over. Re-run this by hand when the rules change:
//   node scripts/gen-mail-rules-page.mjs
// Point it elsewhere with $MAIL_RULES or argv[2].

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const RULES =
  process.argv[2] ||
  process.env.MAIL_RULES ||
  join(
    homedir(),
    "git/cloud-u-containers/user-comm_tools-stalwart/src/mail-rules-general.json",
  );
const TARGET = new URL("../src/data/sections-content.json", import.meta.url).pathname;

const rules = JSON.parse(readFileSync(RULES, "utf8"));
// The live sieve is general + profile merged (see stalwart src/flake.nix),
// so a page built from general alone under-reports what actually runs.
const PROFILE = RULES.replace("mail-rules-general.json", "mail-rules-profile-diego.json");
let profileRules = [];
try {
  profileRules = JSON.parse(readFileSync(PROFILE, "utf8")).rules || [];
} catch {
  console.warn(`no profile alongside ${RULES} — general only`);
}
const allRules = [...rules.rules, ...profileRules];
const doc = JSON.parse(readFileSync(TARGET, "utf8"));

// ── what a rule matches, in one line ───────────────────────────────────
const MATCH_LABEL = {
  from_domain: "from",
  from_address: "from",
  to_domain: "to",
  to_address: "to",
  subject_contains: "subject",
  header_contains: "header",
  list_id: "list-id",
  any_of: "any of",
  all_of: "all of",
};

function summarise(when) {
  if (!when) return "always";
  // any_of/all_of are KEYS on the condition, not a `type` value.
  if (when.any_of) return when.any_of.map(summarise).join(" or ");
  if (when.all_of) return when.all_of.map(summarise).join(" and ");
  const label = MATCH_LABEL[when.type] || when.type;
  const vals = when.values || (when.value ? [when.value] : []);
  if (when.header) {
    return `${when.header}: ${vals.slice(0, 2).join(", ")}${vals.length > 2 ? ` +${vals.length - 2}` : ""}`;
  }
  if (!vals.length) return label;
  const head = vals.slice(0, 2).join(", ");
  return `${label}: ${head}${vals.length > 2 ? ` +${vals.length - 2}` : ""}`;
}

// A rule can name its destination as copy_to, move_to or file_into.
function destOf(r) {
  const a = r.actions || {};
  return a.copy_to || a.move_to || a.file_into || null;
}

// ── group rules by destination folder ──────────────────────────────────
const byFolder = new Map();
for (const r of allRules) {
  const dest = destOf(r);
  if (!dest) continue;
  if (!byFolder.has(dest)) byFolder.set(dest, []);
  byFolder.get(dest).push(r);
}

// Folder order = the numeric prefix the display name already carries. Keys with
// no declared folder sort last — they are a real defect, not a display quirk:
// the rule routes somewhere general.folders never declares, so the mailbox is
// never created and the copy silently lands nowhere on stalwart.
const folderNames = rules.folders;
const declared = Object.keys(folderNames).sort((a, b) =>
  folderNames[a].localeCompare(folderNames[b]),
);
const undeclared = [...byFolder.keys()].filter((k) => !folderNames[k]).sort();
const order = [...declared, ...undeclared];

const rows = [
  { group: "Apply" },
  // The sorter re-applies every rule to every message on each poll, so this is
  // "do it now" rather than a separate backfill path. action: targets are
  // Android-only -- the web build renders this as an inert row, which is
  // correct: there is nothing for a static page to call.
  ["Re-apply rules to all mail", "commit, push, deploy — then tap", { "target": "action:reapply_mail_rules" }],
  { group: "How routing works" },
  ["Order", "lowest priority number wins"],
  ["First match", "stops — later rules never see the message"],
  ["Rules", `${allRules.length} total, ${byFolder.size} tags`],
];
if (undeclared.length) {
  rows.push(["Undeclared tags", `${undeclared.length} route to no real folder`]);
}

for (const key of order) {
  const list = (byFolder.get(key) || []).sort(
    (a, b) => (a.priority ?? 999) - (b.priority ?? 999),
  );
  if (!list.length) continue;
  const title = folderNames[key] || `${key} — no such folder`;
  rows.push({
    group: `${title} · ${list.length} rule${list.length > 1 ? "s" : ""}`,
  });
  for (const r of list) {
    // strip the kind prefix ("route.lifestyle.") — the group already says where
    const name = r.id.split(".").slice(-1)[0].replace(/_/g, " ");
    rows.push([name, `p${r.priority ?? "—"} · ${summarise(r.when)}`]);
  }
}

// ── splice it in as parsed JSON ────────────────────────────────────────
// This used to be a TEXT splice, justified by the target being hand-formatted
// (re-serialising it would have exploded every one-line row into six). That is
// no longer true: sections-content.json is now uniformly machine-serialised at
// a 2-space indent, so parse -> stringify is both stable and far more robust
// than matching an 8-space indent by prefix.
const page = { id: "rules", label: "Rules", rows };

// Insert `rules` at a named position in a section's page list, replacing any
// existing rules page first so re-runs are idempotent.
function spliceInto(sectionKey, anchorId, after) {
  const pages = doc.sections[sectionKey]?.pages;
  if (!pages) throw new Error(`no ${sectionKey} section`);
  const existing = pages.findIndex((p) => typeof p === "object" && p.id === "rules");
  if (existing !== -1) pages.splice(existing, 1);
  const anchor = pages.findIndex((p) => typeof p === "object" && p.id === anchorId);
  if (anchor === -1) throw new Error(`${sectionKey} has no ${anchorId} page to anchor to`);
  pages.splice(after ? anchor + 1 : anchor, 0, page);
}

// The page is wanted in two places: Mail (where you read the mail) and Configs
// (/config/rules, where you change the rules). Same object, same generated
// content -- one source, so they cannot drift apart.
//
// Mail's page order is the APK's (folders, inbox, accounts, identities, rules,
// ...), so the anchor is Identities, not Accounts.
spliceInto("mail", "identities", true);
// Configs has no Accounts page (profile, wg, kde, ai, launcher, ...), so this
// goes ahead of Profile, the identity page and the closest thing Configs has.
spliceInto("config", "profile", false);

writeFileSync(TARGET, `${JSON.stringify(doc, null, 2)}\n`);
console.log(
  `rules page: ${rows.length} rows, ${byFolder.size} tags -> mail (after identities) + config (first)`,
);
