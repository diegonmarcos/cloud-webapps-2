// Merges raw nutrition sources + authored inputs into a single shippable food-library.json.
// Run via: npm run build:data (wired into build.json as the first step).
//
// Inputs (all under src/data/):
//   raw/usda-sr-legacy.zip      — USDA Standard Reference Legacy (~7,800 foods, no GI)
//   raw/gi-mygi.json            — open GI overlay (188 foods, MIT)
//   food-table-inputs.json      — authored layer: presets, tag rules, computed ratios, overrides
//
// Output:
//   food-library.json           — fully merged, all tags + ratios precomputed. Zero runtime math.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
// @ts-ignore — xlsx ships its own types under a different shape
import * as XLSX from "xlsx";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = resolve(HERE, "raw");
const INPUTS_PATH = resolve(HERE, "food-table-inputs.json");
const OUT_PATH    = resolve(HERE, "food-library.json");

// ─── Types ────────────────────────────────────────────────────────────────────
interface Inputs {
  category_aliases: Record<string, string[]>;
  tag_rules: Record<string, TagRule>;
  presets: Record<string, Preset & { _doc?: string }>;
  ui_rows: Record<string, UiRow & { _doc?: string }>;
  computed_ratios: Record<string, RatioDef & { _doc?: string }>;
  table_columns: Record<string, ColumnDef[]>;
  table_filters: Record<string, TableFilter>;
  name_aliases: Record<string, string>;
  gi_overrides: Record<string, number>;
  tag_overrides: Record<string, { add?: string[]; remove?: string[] }>;
  name_pattern_overrides?: { _doc?: string; rules: Array<{ match: string; add?: string[]; remove?: string[]; _why?: string }> };
  umami_data?: { _doc?: string; tag_threshold: number; rules: Array<{ match: string; glutamate_mg: number; imp_mg: number; gmp_mg: number }> };
  extra_foods: Record<string, FoodRecord>;
  whitelist: { ids: string[] };
}
interface TagRule {
  always?: boolean;
  exclude_groups?: string[];
  include_groups?: string[];
  max_per_100g?: Record<string, number>;
  min_per_100g?: Record<string, number>;
  name_excludes?: string;
  name_includes?: string;
  manual_only?: boolean;
}
interface Preset { label: string; protein: string; carb: string; restrictions: string[]; }
interface UiRow { label: string; selectMode: "single" | "multi"; options: string[]; }
interface RatioDef { formula: string; default_dir: "asc"|"desc"; decimals: number; }
interface ColumnDef { key: string; label: string; align: "left"|"right"; sortable: boolean; default_dir: "asc"|"desc"; primary?: boolean; tone?: "good"|"bad"; }
interface TableFilter { min?: Record<string, number>; require?: string[]; }
interface FoodRecord {
  id: string;
  name: string;
  source: string;
  category: string | null;
  kcal_per_100g: number | null;
  prot_g: number | null;
  carb_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  fat_g: number | null;
  fat_sat_g: number | null;
  fat_mono_g: number | null;
  fat_poly_g: number | null;
  sodium_mg: number | null;
  gi: number | null;
  glutamate_mg: number | null;
  imp_mg: number | null;
  gmp_mg: number | null;
  diet_tags: string[];
  // populated by computed_ratios
  [extra: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const log = (msg: string): void => { console.log(`  → ${msg}`); };

function slug(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

const USDA_NUTRIENT_KEYS: Record<string, string> = {
  "Energy":                              "kcal_per_100g",
  "Energy (Atwater General Factors)":    "kcal_per_100g_alt",
  "Protein":                             "prot_g",
  "Carbohydrate, by difference":         "carb_g",
  "Fiber, total dietary":                "fiber_g",
  "Sugars, Total":                       "sugar_g",
  "Total lipid (fat)":                   "fat_g",
  "Fatty acids, total saturated":        "fat_sat_g",
  "Fatty acids, total monounsaturated":  "fat_mono_g",
  "Fatty acids, total polyunsaturated":  "fat_poly_g",
  "Sodium, Na":                          "sodium_mg",
};

// ─── USDA SR Legacy reader ────────────────────────────────────────────────────
async function readUsdaSrLegacy(): Promise<FoodRecord[]> {
  const zipBuf = readFileSync(resolve(RAW, "usda-sr-legacy.zip"));
  const zip = await JSZip.loadAsync(zipBuf);
  // Find the JSON file inside the zip
  const jsonName = Object.keys(zip.files).find(n => n.endsWith(".json"));
  if (!jsonName) throw new Error("usda-sr-legacy.zip: no .json found");
  log(`unzipping ${jsonName}…`);
  const jsonStr = await zip.files[jsonName].async("string");
  const root = JSON.parse(jsonStr) as { SRLegacyFoods?: any[] };
  const foods = root.SRLegacyFoods ?? [];
  log(`SR Legacy raw entries: ${foods.length}`);

  const out: FoodRecord[] = [];
  for (const f of foods) {
    if (!f || typeof f !== "object") continue;
    const name = String(f.description ?? "").trim();
    if (!name) continue;
    const category = (f.foodCategory && f.foodCategory.description) ?? null;
    const rec: FoodRecord = {
      id: `usda_${f.fdcId}`,
      name,
      source: "USDA SR Legacy",
      category,
      kcal_per_100g: null, prot_g: null, carb_g: null, fiber_g: null,
      sugar_g: null, fat_g: null, fat_sat_g: null, fat_mono_g: null,
      fat_poly_g: null, sodium_mg: null, gi: null, glutamate_mg: null, imp_mg: null, gmp_mg: null, diet_tags: [],
    };
    // Extract nutrients (kcal stays in kcal, mg→mg, g→g — USDA already uses these units for our targets)
    let kcalAlt: number | null = null;
    for (const n of f.foodNutrients ?? []) {
      const nm = (n.nutrient && n.nutrient.name) ?? "";
      const key = USDA_NUTRIENT_KEYS[nm];
      if (!key) continue;
      const amt = typeof n.amount === "number" ? n.amount : null;
      if (amt === null) continue;
      if (key === "kcal_per_100g_alt") kcalAlt = amt;
      else (rec as any)[key] = amt;
    }
    // Fall back to Atwater General Factors energy if "Energy" missing
    if (rec.kcal_per_100g === null && kcalAlt !== null) rec.kcal_per_100g = kcalAlt;
    out.push(rec);
  }
  return out;
}

// ─── AFCD reader (Australian Food Composition DB Release 3) ───────────────────
// Per-100g sheet has 1,588 foods, 272 columns, headers in row index 2.
// Energy is in kJ — converted to kcal here.
const AFCD_NUTRIENT_PROFILES = "afcd-nutrient_profiles.xlsx";
const AFCD_COL = {
  food_key:   0,    // "Public Food Key" (e.g. F002258)
  classification: 1,
  food_name:  3,
  energy_kj:  4,    // "Energy with dietary fibre, equated (kJ)"
  protein_g:  7,
  fat_g:      9,
  fiber_g:    11,
  sugar_g:    19,
  carb_g:     39,   // "Available carbohydrate, with sugar alcohols (g)"
  sodium_mg:  72,
  fat_sat_g:  191,
  fat_mono_g: 204,
  fat_poly_g: 230,
} as const;

function readAfcd(): FoodRecord[] {
  const path = resolve(RAW, AFCD_NUTRIENT_PROFILES);
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets["All solids & liquids per 100 g"];
  const arr = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  // Data rows start at index 3 (after title, blank, header rows)
  const out: FoodRecord[] = [];
  for (let i = 3; i < arr.length; i++) {
    const r = arr[i];
    if (!r || r.length === 0) continue;
    const name = String(r[AFCD_COL.food_name] ?? "").trim();
    if (!name) continue;
    const fkey = String(r[AFCD_COL.food_key] ?? "").trim();
    const num = (idx: number): number | null => {
      const v = r[idx];
      if (typeof v !== "number" || !Number.isFinite(v)) return null;
      return v;
    };
    const kj = num(AFCD_COL.energy_kj);
    const rec: FoodRecord = {
      id: `afcd_${fkey || i}`,
      name,
      source: "AFCD R3",
      category: null,
      kcal_per_100g: kj !== null ? Math.round((kj / 4.184) * 10) / 10 : null,
      prot_g:     num(AFCD_COL.protein_g),
      carb_g:     num(AFCD_COL.carb_g),
      fiber_g:    num(AFCD_COL.fiber_g),
      sugar_g:    num(AFCD_COL.sugar_g),
      fat_g:      num(AFCD_COL.fat_g),
      fat_sat_g:  num(AFCD_COL.fat_sat_g),
      fat_mono_g: num(AFCD_COL.fat_mono_g),
      fat_poly_g: num(AFCD_COL.fat_poly_g),
      sodium_mg:  num(AFCD_COL.sodium_mg),
      gi: null,
      glutamate_mg: null,
      imp_mg: null,
      gmp_mg: null,
      diet_tags: [],
    };
    out.push(rec);
  }
  log(`AFCD records: ${out.length}`);
  return out;
}

// ─── GI overlay reader ────────────────────────────────────────────────────────
interface GiEntry { name: string; tokens: string[]; gi: number; }

function tokenize(s: string): string[] {
  return s.toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(t => t.length >= 3); // drop trivial tokens like "of", "a"
}

function readGiOverlay(): GiEntry[] {
  const arr = JSON.parse(readFileSync(resolve(RAW, "gi-mygi.json"), "utf8")) as
    Array<{ name: string; gi: string | number }>;
  const out: GiEntry[] = [];
  for (const e of arr) {
    const v = typeof e.gi === "number" ? e.gi : Number(e.gi);
    if (!Number.isFinite(v)) continue;
    out.push({ name: e.name, tokens: tokenize(e.name), gi: v });
  }
  log(`GI overlay entries: ${out.length}`);
  return out;
}

function findGi(foodName: string, overlay: GiEntry[]): number | null {
  // Tokenized substring match: all GI-entry tokens must appear in food name tokens.
  // Prefer the longest-token-count match (more specific wins).
  const foodTokens = new Set(tokenize(foodName));
  let best: { score: number; gi: number } | null = null;
  for (const e of overlay) {
    if (e.tokens.length === 0) continue;
    let allMatch = true;
    for (const t of e.tokens) if (!foodTokens.has(t)) { allMatch = false; break; }
    if (!allMatch) continue;
    const score = e.tokens.length;
    if (!best || score > best.score) best = { score, gi: e.gi };
  }
  return best ? best.gi : null;
}

// ─── Tag computation ──────────────────────────────────────────────────────────
function buildGroupIndex(aliases: Record<string, string[]>): Map<string, Set<string>> {
  // category-string -> set of group keys it belongs to
  const idx = new Map<string, Set<string>>();
  for (const [group, cats] of Object.entries(aliases)) {
    if (group.startsWith("_")) continue;
    for (const cat of cats) {
      if (!idx.has(cat)) idx.set(cat, new Set());
      idx.get(cat)!.add(group);
    }
  }
  return idx;
}

function applyTagRules(
  rec: FoodRecord,
  rules: Record<string, TagRule>,
  groupIdx: Map<string, Set<string>>
): string[] {
  const groups = rec.category ? Array.from(groupIdx.get(rec.category) ?? []) : [];
  const tags: string[] = [];

  for (const [tag, rule] of Object.entries(rules)) {
    if (tag.startsWith("_")) continue;
    if (rule.manual_only) continue;
    if (rule.always) { tags.push(tag); continue; }

    let pass = true;
    if (rule.exclude_groups) {
      for (const g of rule.exclude_groups) if (groups.includes(g)) { pass = false; break; }
    }
    if (pass && rule.include_groups) {
      let any = false;
      for (const g of rule.include_groups) if (groups.includes(g)) { any = true; break; }
      if (!any) pass = false;
    }
    if (pass && rule.max_per_100g) {
      for (const [field, max] of Object.entries(rule.max_per_100g)) {
        const v = (rec as any)[field];
        if (typeof v !== "number" || v >= max) { pass = false; break; }
      }
    }
    if (pass && rule.min_per_100g) {
      for (const [field, min] of Object.entries(rule.min_per_100g)) {
        const v = (rec as any)[field];
        if (typeof v !== "number" || v < min) { pass = false; break; }
      }
    }
    if (pass && rule.name_excludes) {
      if (new RegExp(rule.name_excludes, "i").test(rec.name)) pass = false;
    }
    if (pass && rule.name_includes) {
      if (!new RegExp(rule.name_includes, "i").test(rec.name)) pass = false;
    }
    if (pass) tags.push(tag);
  }
  return tags;
}

// ─── Ratio computation ────────────────────────────────────────────────────────
function compileFormula(formula: string): (rec: FoodRecord) => number | null {
  // Whitelist field tokens to avoid eval injection. Build a function (a,b,c,...) => expr.
  const fields = ["kcal_per_100g","prot_g","carb_g","fiber_g","sugar_g","fat_g","fat_sat_g","fat_mono_g","fat_poly_g","sodium_mg","gi","glutamate_mg","imp_mg","gmp_mg"];
  // Validate formula contains only allowed identifiers + operators + numbers
  const safe = formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (m) => {
    if (!fields.includes(m)) throw new Error(`Unknown identifier in formula: ${m}`);
    return `r["${m}"]`;
  });
  // eslint-disable-next-line no-new-func
  const fn = new Function("r", `try { var v = ${safe}; return Number.isFinite(v) ? v : null; } catch(e) { return null; }`) as (r: FoodRecord) => number | null;
  return fn;
}

function applyComputedRatios(rec: FoodRecord, ratios: Record<string, RatioDef & {_doc?:string}>): void {
  for (const [key, def] of Object.entries(ratios)) {
    if (key.startsWith("_")) continue;
    const fn = compileFormula(def.formula);
    const v = fn(rec);
    rec[key] = v === null ? null : Number(v.toFixed(def.decimals));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("[build-food-library] Reading authored inputs…");
  const inputs = JSON.parse(readFileSync(INPUTS_PATH, "utf8")) as Inputs;
  log(`presets: ${Object.keys(inputs.presets).filter(k=>!k.startsWith("_")).length}, tag rules: ${Object.keys(inputs.tag_rules).filter(k=>!k.startsWith("_")).length}, ratios: ${Object.keys(inputs.computed_ratios).filter(k=>!k.startsWith("_")).length}`);

  console.log("[build-food-library] Reading USDA SR Legacy…");
  const usda = await readUsdaSrLegacy();
  log(`USDA records: ${usda.length}`);

  console.log("[build-food-library] Reading AFCD R3…");
  const afcd = readAfcd();

  console.log("[build-food-library] Reading GI overlay…");
  const gi = readGiOverlay();

  console.log("[build-food-library] Merging GI + tags + ratios…");
  const groupIdx = buildGroupIndex(inputs.category_aliases);
  // Dedupe by normalized name across sources (USDA wins over AFCD for ties)
  const seen = new Set<string>();
  const allRaw: FoodRecord[] = [...usda, ...afcd];
  const merged0: FoodRecord[] = [];
  for (const r of allRaw) {
    const key = slug(r.name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged0.push(r);
  }
  log(`pre-tag merge total: ${merged0.length} (deduped by name)`);
  for (const rec of merged0) {
    // Display name override
    const alias = inputs.name_aliases[rec.name];
    if (alias) rec.name = alias;

    // Normalised key for overrides
    const key = slug(rec.name);

    // GI: manual override > tokenized overlay match
    if (inputs.gi_overrides[key] != null) rec.gi = inputs.gi_overrides[key];
    else rec.gi = findGi(rec.name, gi);

    // Umami data — first matching rule wins (rules are ordered most-specific first)
    if (inputs.umami_data) {
      for (const ur of inputs.umami_data.rules) {
        if (new RegExp(ur.match, "i").test(rec.name)) {
          rec.glutamate_mg = ur.glutamate_mg;
          rec.imp_mg = ur.imp_mg;
          rec.gmp_mg = ur.gmp_mg;
          break;
        }
      }
    }

    // Diet tags via rules
    rec.diet_tags = applyTagRules(rec, inputs.tag_rules, groupIdx);

    // Name-pattern overrides (regex)
    const patternRules = inputs.name_pattern_overrides?.rules ?? [];
    if (patternRules.length > 0) {
      const set = new Set(rec.diet_tags);
      for (const pr of patternRules) {
        if (!pr || !pr.match) continue;
        if (new RegExp(pr.match, "i").test(rec.name)) {
          for (const t of pr.add ?? []) set.add(t);
          for (const t of pr.remove ?? []) set.delete(t);
        }
      }
      rec.diet_tags = Array.from(set);
    }

    // Per-food tag overrides
    const ov = inputs.tag_overrides[key];
    if (ov) {
      const set = new Set(rec.diet_tags);
      for (const t of ov.add ?? []) set.add(t);
      for (const t of ov.remove ?? []) set.delete(t);
      rec.diet_tags = Array.from(set);
    }

    // Computed ratios (must run AFTER umami_data so umami_score sees the values)
    applyComputedRatios(rec, inputs.computed_ratios);

    // Umami tag based on threshold
    const threshold = inputs.umami_data?.tag_threshold ?? 100;
    const score = (rec as any).umami_score;
    if (typeof score === "number" && score >= threshold) {
      const set = new Set(rec.diet_tags); set.add("umami"); rec.diet_tags = Array.from(set);
    }
  }

  // Append extra_foods (already shaped)
  let merged: FoodRecord[] = [...merged0];
  for (const [k, extra] of Object.entries(inputs.extra_foods ?? {})) {
    if (k.startsWith("_")) continue;
    const e = { ...extra, id: extra.id ?? `extra_${k}`, source: extra.source ?? "Authored" };
    applyComputedRatios(e, inputs.computed_ratios);
    merged.push(e);
  }

  // Whitelist filter (optional)
  const wl = (inputs.whitelist?.ids ?? []).map(s => s.toLowerCase());
  if (wl.length > 0) {
    const wlSet = new Set(wl);
    merged = merged.filter(r => wlSet.has(slug(r.name)));
    log(`whitelist applied: ${merged.length} survivors`);
  }

  console.log("[build-food-library] Writing food-library.json…");
  const out = {
    _meta: {
      generated_at:  new Date().toISOString(),
      sources:       ["USDA SR Legacy 2018-04 (CC0)", "AFCD R3 (FSANZ, free w/ attribution)", "mygi/bitmoremedia GI overlay (MIT)", "food-table-inputs.json (authored)"],
      total_foods:   merged.length,
      with_gi:       merged.filter(r => r.gi != null).length,
      with_fiber:    merged.filter(r => r.fiber_g != null).length,
      with_fat_breakdown: merged.filter(r => r.fat_sat_g != null).length,
    },
    presets:         inputs.presets,
    ui_rows:         inputs.ui_rows,
    computed_ratios: inputs.computed_ratios,
    table_columns:   inputs.table_columns,
    table_filters:   inputs.table_filters,
    items:           merged,
  };
  writeFileSync(OUT_PATH, JSON.stringify(out));
  const sizeKb = (JSON.stringify(out).length / 1024).toFixed(1);
  log(`food-library.json written: ${merged.length} foods, ${sizeKb} KB`);
  log(`  with GI: ${out._meta.with_gi}, with fiber: ${out._meta.with_fiber}, with fat breakdown: ${out._meta.with_fat_breakdown}`);
}

main().catch(e => { console.error(e); process.exit(1); });
