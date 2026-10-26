<script setup lang="ts">
// Movies config: the same sections as cloud-media-center's Configs → Movies,
// drawn from sources-core.mjs::MOVIE_CONFIG so the two never diverge.
// Sources (servers, keys, region, drive folder, on/off per declared source),
// Playback (buffer, offline download) and Torrents (built-in legal sources,
// your own Torznab/Jackett/RSS/{query} sources, folder, connections, limits,
// seeding, sequential mode). Stored in this browser only.
import { reactive, ref } from 'vue'
import * as Core from '@/lib/sources-core.mjs'
import sourcesJson from '@/data/sources.json'
import { loadMovieConfig, saveMovieConfig, USER_SOURCES_KEY } from '@/composables/useMovieConfig'

const emit = defineEmits<{ saved: [cfg: any]; close: [] }>()
const ULS = USER_SOURCES_KEY
const decl = Core.parseSources(sourcesJson)
const SECTIONS: any[] = Core.MOVIE_CONFIG
const BUFFERS: any[] = Core.streamBufferModes()

const cfg = reactive<any>(loadMovieConfig())
const tab = ref('sources')
const msg = ref('')
const builtIn = (torrent: boolean) => decl.sources.filter((s: any) => (s.kind === 'torrent') === torrent)

function val(key: string) { return Core.getPath(cfg, key) }
function set(f: any, e: Event) {
  const i = e.target as HTMLInputElement
  Core.setPath(cfg, f.key, f.type === 'bool' ? i.checked : f.type === 'number' ? Number(i.value) : i.value)
}
function toggle(id: string, on: boolean) { cfg.disabled = Core.setSourceEnabled(cfg, id, on).disabled }
function save() {
  Object.assign(cfg, Core.normalizeMovieConfig(JSON.parse(JSON.stringify(cfg)), navigator.language))
  msg.value = saveMovieConfig(cfg) ? 'Saved.' : 'Storage is blocked: kept for this visit only.'
  emit('saved', JSON.parse(JSON.stringify(cfg)))
}

// your own torrent sources (none shipped)
const users = ref<any[]>(Core.parseUserSources((() => { try { return localStorage.getItem(ULS) || '[]' } catch { return '[]' } })()))
const nu = reactive({ name: '', type: 'torznab', url: '', apikey: '' })
const umsg = ref('')
function storeUsers(r: { list: any[]; error?: string }) {
  if (r.error) { umsg.value = r.error; return false }
  users.value = r.list; umsg.value = ''
  try { localStorage.setItem(ULS, JSON.stringify(r.list)) } catch { /* storage blocked */ }
  return true
}
function addUser() { if (storeUsers(Core.addUserSource(users.value, { ...nu }))) Object.assign(nu, { name: '', url: '', apikey: '' }) }
function patchUser(id: string, patch: any) { storeUsers(Core.updateUserSource(users.value, id, patch)) }
function delUser(id: string) { storeUsers(Core.removeUserSource(users.value, id)) }
</script>

<template>
  <form class="mcfg" @submit.prevent="save">
    <div class="mcfg__head">
      <b>Movies config</b>
      <button type="button" class="icon-btn" title="Close" @click="emit('close')">✕</button>
    </div>
    <div class="mcfg__tabs">
      <button v-for="s in SECTIONS" :key="s.id" type="button" :class="{ on: tab === s.id }" @click="tab = s.id">{{ s.label }}</button>
    </div>
    <p class="muted">Stored only in this browser. Nothing is sent anywhere except the servers you enter.</p>
    <template v-for="s in SECTIONS" :key="s.id">
      <section v-if="tab === s.id" :data-section="s.id">
        <template v-if="s.id === 'sources'">
          <h4>Sources on / off</h4>
          <label v-for="b in builtIn(false)" :key="b.id" class="row"><input type="checkbox" :checked="Core.isSourceEnabled(cfg, b.id)" @change="toggle(b.id, ($event.target as HTMLInputElement).checked)">{{ b.name }}</label>
        </template>
        <template v-if="s.id === 'torrent'">
          <h4>Built-in legal sources</h4>
          <label v-for="b in builtIn(true)" :key="b.id" class="row"><input type="checkbox" :checked="Core.isSourceEnabled(cfg, b.id)" @change="toggle(b.id, ($event.target as HTMLInputElement).checked)">{{ b.name }}</label>
        </template>
        <template v-for="f in s.fields" :key="f.key">
          <label v-if="f.type === 'bool'" class="row"><input type="checkbox" :name="f.key" :checked="val(f.key)" @change="set(f, $event)">{{ f.label }}</label>
          <label v-else-if="f.type === 'select'">{{ f.label }}
            <select :name="f.key" :value="val(f.key)" @change="set(f, $event)"><option v-for="b in BUFFERS" :key="b.id" :value="b.id">{{ b.label }}</option></select>
          </label>
          <label v-else>{{ f.label }}
            <input :name="f.key" :value="val(f.key)" :placeholder="f.placeholder" :maxlength="f.type === 'region' ? 2 : undefined"
              :type="f.type === 'secret' ? 'password' : f.type === 'number' ? 'number' : 'text'" :min="f.min" :max="f.max" :step="f.step" autocomplete="off" @change="set(f, $event)">
          </label>
        </template>
        <template v-if="s.id === 'torrent'">
          <h4>Your torrent sources</h4>
          <p class="muted">Added by you, kept in this browser only. Nothing is preset. Only use sources you have the right to download from.</p>
          <div v-for="u in users" :key="u.id" class="usrc">
            <input type="checkbox" :checked="u.enabled" @change="patchUser(u.id, { enabled: ($event.target as HTMLInputElement).checked })">
            <input :value="u.name" @change="patchUser(u.id, { name: ($event.target as HTMLInputElement).value })">
            <input :value="u.url" @change="patchUser(u.id, { url: ($event.target as HTMLInputElement).value })">
            <small class="muted">{{ u.type }}</small>
            <button type="button" class="icon-btn" title="Delete" @click="delUser(u.id)">🗑</button>
          </div>
          <label>Name<input v-model="nu.name"></label>
          <label>Type<select v-model="nu.type"><option value="torznab">Torznab / Jackett</option><option value="rss">RSS feed</option><option value="template">Search URL with {query}</option></select></label>
          <label>URL<input v-model="nu.url" placeholder="https://…"></label>
          <label v-if="nu.type === 'torznab'">API key<input v-model="nu.apikey" type="password" autocomplete="off"></label>
          <button type="button" class="update-btn" @click="addUser">Add source</button>
          <div v-if="umsg" class="failed">{{ umsg }}</div>
        </template>
      </section>
    </template>
    <button type="submit" class="update-btn">Save &amp; re-check</button>
    <span class="muted">{{ msg }}</span>
  </form>
</template>

<style lang="scss" scoped>
.mcfg {
  position: absolute; top: 58px; right: 12px; width: min(440px, 92%); max-height: 82%; overflow-y: auto; background: #202020; border: 1px solid #444; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; z-index: 5; color: #eee;
  label { display: flex; flex-direction: column; gap: 3px; font-size: 0.85em; color: #aaa; }
  label.row { flex-direction: row; align-items: center; gap: 8px; }
  section { display: flex; flex-direction: column; gap: 8px; }
  h4 { margin: 6px 0 0; }
}
.mcfg__head { display: flex; justify-content: space-between; align-items: center; }
.mcfg__tabs { display: flex; gap: 6px; button { flex: 1; padding: 6px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #ccc; cursor: pointer; &.on { border-color: var(--accent-color, #e50914); color: #fff; } } }
input, select { padding: 7px; background: #333; border: 1px solid #444; border-radius: 6px; color: #fff; }
.usrc { display: flex; gap: 6px; align-items: center; input:not([type='checkbox']) { flex: 1; min-width: 0; } }
.icon-btn { background: transparent; border: none; color: #fff; font-size: 1.2em; cursor: pointer; }
.update-btn { padding: 7px 12px; background: var(--accent-color, #e50914); border: none; border-radius: 6px; color: #fff; cursor: pointer; font-weight: 600; }
.muted { color: #888; font-size: 0.85em; }
.failed { font-size: 0.8em; color: #c77; }
</style>
