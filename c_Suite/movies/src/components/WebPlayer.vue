<script setup lang="ts">
// Legal multi-source player. The source list is src/data/sources.json (shared
// with cloud-media-center on Android); the logic is src/lib/sources-core.mjs.
// Every source is probed in the background and the picker shows only the ones
// that actually have this title. Credentials live in this browser only.
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as Core from '@/lib/sources-core.mjs'
import sourcesJson from '@/data/sources.json'
import MovieConfig from './MovieConfig.vue'
import { loadMovieConfig, saveMovieConfig, USER_SOURCES_KEY } from '@/composables/useMovieConfig'

const props = defineProps<{
  imdbId: string
  tmdbId?: number
  movieType: 'movie' | 'series' | 'episode'
  title: string
  year?: string
}>()
const emit = defineEmits<{ close: [] }>()

const decl = Core.parseSources(sourcesJson)
const BUFFER_MODES: any[] = Core.streamBufferModes()

// ── settings: Movies config (MovieConfig.vue, shared schema), this browser only ──
const settings = reactive<any>(loadMovieConfig())
const showSettings = ref(false)
function persist() { saveMovieConfig(settings) }
function onConfigSaved(cfg: any) {
  Object.assign(settings, cfg)
  userSources.value = Core.parseUserSources((() => { try { return localStorage.getItem(ULS) || '[]' } catch { return '[]' } })())
  showSettings.value = false
  probe()
}
const enabledDecl = computed(() => Core.enabledSources(decl, settings))

// ── probing ────────────────────────────────────────────────────────────────
type Result = { source: any; ok: boolean; error?: string; [k: string]: any }
const results = ref<Result[]>([])
const probing = ref(false)
const deviceFiles = ref<File[]>([])
const ids = reactive({ imdb: props.imdbId, tmdb: props.tmdbId as number | undefined, title: props.title, year: props.year || '' })
const available = computed(() => results.value.filter((r) => r.ok))
const failed = computed(() => results.value.filter((r) => r.error))
const pending = computed(() => enabledDecl.value.sources.length - results.value.length)

async function get(url: string, headers?: Record<string, string>) {
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

let probeRun = 0
async function probe() {
  const run = ++probeRun
  results.value = []
  probing.value = true
  if (settings.tmdb_key && Core.isImdbId(ids.imdb)) {
    try {
      const f = await Core.imdbToTmdb(get, ids.imdb, props.movieType, settings.tmdb_key)
      if (f) {
        ids.tmdb = f.tmdbId
        if (f.title && (!ids.title || ids.title === 'Random Movie')) { ids.title = f.title; ids.year = f.year }
      }
    } catch { /* trailer / where-to-watch then show as unavailable */ }
  }
  const title = { imdbId: ids.imdb, tmdbId: ids.tmdb, type: props.movieType, title: ids.title, year: ids.year }
  const cfg = { ...settings, deviceFiles: deviceFiles.value }
  await Core.probeAll(enabledDecl.value, title, cfg, get, (r: Result) => { if (run === probeRun) results.value = [...results.value, r] })
  if (run === probeRun) {
    probing.value = false
    if (!active.value && available.value.length) choose(available.value.find((r) => r.play || r.file || r.embed) || available.value[0])
  }
}

// ── playing ────────────────────────────────────────────────────────────────
const active = ref<Result | null>(null)
const error = ref('')
const video = ref<HTMLVideoElement | null>(null)
const buffered = ref(0)
const played = ref(0)
const waitingFor = ref('')
const downloadPct = ref(-1)
const torrentStatus = ref('')
let objectUrl = ''
let torrentClient: any = null
const policy = computed(() => Core.bufferPolicy(Core.effectiveBuffer(settings)))

function cleanup() {
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = '' }
  if (torrentClient) { try { torrentClient.destroy() } catch { /* already gone */ } torrentClient = null }
  error.value = ''; waitingFor.value = ''; downloadPct.value = -1; buffered.value = 0; played.value = 0; torrentStatus.value = ''
}
async function choose(r: Result) {
  cleanup()
  active.value = r
  await nextTick()
  if (r.play) return playUrl(r.play)
  if (r.file) {
    const f = deviceFiles.value.find((x) => x.name === r.file)
    if (f) { objectUrl = URL.createObjectURL(f); return playUrl(objectUrl, true) }
  }
  if (r.torrent) return playTorrent(r.torrent)
}

async function playUrl(url: string, local = false) {
  const v = video.value
  if (!v) return
  if (policy.value.offline && !local) {
    try { url = await downloadFully(url) } catch (e: any) {
      error.value = 'Download failed: ' + (e.message || e) + '. The server may not allow downloads from this site (CORS).'
      return
    }
  }
  v.preload = 'auto'
  v.src = url
  v.load()
  holdUntilBuffered(true)
}
async function downloadFully(url: string) {
  const r = await fetch(url)
  if (!r.ok || !r.body) throw new Error('HTTP ' + r.status)
  const total = Number(r.headers.get('content-length')) || 0
  const reader = r.body.getReader()
  const parts: BlobPart[] = []
  let got = 0
  downloadPct.value = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value); got += value.length
    downloadPct.value = total ? Math.round((got / total) * 100) : -2
  }
  downloadPct.value = 100
  objectUrl = URL.createObjectURL(new Blob(parts, { type: r.headers.get('content-type') || 'video/mp4' }))
  return objectUrl
}
// Preload before play: hold playback until the policy's lead is buffered.
function holdUntilBuffered(autoplay: boolean) {
  const v = video.value
  if (!v) return
  if (policy.value.offline) { if (autoplay) v.play().catch(() => {}); return }
  const need = policy.value.startAhead
  waitingFor.value = 'Buffering ' + (isFinite(need) ? need + ' s' : 'everything') + ' ahead…'
  const check = () => {
    if (video.value !== v) return
    const ahead = Core.bufferedAhead(v.buffered, v.currentTime)
    if (Core.readyToPlay(policy.value, ahead, v.currentTime, v.duration)) {
      waitingFor.value = ''
      if (autoplay) v.play().catch(() => { /* autoplay blocked: the user presses play */ })
      return
    }
    setTimeout(check, 400)
  }
  check()
}
function onProgress() {
  const v = video.value
  if (!v || !v.duration || !isFinite(v.duration)) return
  buffered.value = v.buffered.length ? v.buffered.end(v.buffered.length - 1) / v.duration : 0
  played.value = v.currentTime / v.duration
}
function onWaiting() {
  const v = video.value
  if (v && !policy.value.offline && !v.paused) { v.pause(); holdUntilBuffered(true) }
}
function onVideoError() {
  const e = video.value?.error
  const why: Record<number, string> = {
    1: 'Playback was aborted.',
    2: 'A network error stopped the download.',
    3: 'The file could not be decoded (this browser may not support its codec; MP4/H.264 is safest).',
    4: 'The source is unreachable, not a video, or refused (check the URL/token; the server may block this site).'
  }
  error.value = (e && why[e.code]) || 'The video could not be played.'
  waitingFor.value = ''
}

// ── torrents: Internet Archive's own, or what the user pastes ──────────────
const torrentInput = ref('')
function loadWebTorrent(): Promise<any> {
  const w = window as any
  if (w.WebTorrent) return Promise.resolve(w.WebTorrent)
  return new Promise((ok, bad) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/webtorrent@1.9.7/webtorrent.min.js'
    s.onload = () => ok(w.WebTorrent)
    s.onerror = () => bad(new Error('could not load WebTorrent'))
    document.head.appendChild(s)
  })
}
async function playTorrent(uri: string) {
  const parsed = Core.parseTorrentInput(uri, decl.denylist)
  if (parsed.error) { error.value = parsed.error; return }
  try {
    const WT = await loadWebTorrent()
    torrentClient = new WT(Core.torrentClientOptions(settings))
    torrentStatus.value = 'Connecting to peers…'
    torrentClient.on('error', (e: any) => { error.value = 'Torrent error: ' + (e.message || e) })
    torrentClient.add(parsed.uri, Core.torrentAddOptions(settings), (t: any) => {
      const f = Core.pickTorrentVideo(t.files)
      if (!f) { error.value = 'This torrent has no browser-playable video (MP4/WebM).'; t.destroy(); return }
      t.files.forEach((x: any) => { if (x !== f) x.deselect() })
      f.select()
      if (policy.value.offline) {
        t.on('done', () => f.getBlobURL((err: any, u: string) => {
          if (err) error.value = 'Torrent failed: ' + err.message
          else { objectUrl = u; playUrl(u, true) }
        }))
      } else {
        // renderTo streams the file in order (sequential pieces) into the <video>.
        f.renderTo(video.value, { autoplay: false }, (err: any) => {
          if (err) error.value = 'Torrent playback failed: ' + err.message
          else holdUntilBuffered(true)
        })
      }
      const tick = () => {
        if (!torrentClient) return
        torrentStatus.value = Math.round(t.progress * 100) + '% · ' + t.numPeers + ' peers · ' + Math.round(t.downloadSpeed / 1024) + ' KB/s'
        downloadPct.value = Math.round(t.progress * 100)
        if (t.progress < 1) { setTimeout(tick, 1000); return }
        // Done: seed until the configured ratio / time, then stop.
        const t0 = Date.now()
        const seed = () => {
          if (!torrentClient) return
          if (Core.seedingDone(settings, t.ratio || 0, (Date.now() - t0) / 1000)) { try { t.pause && t.pause(); t.wires && t.wires.forEach((w: any) => w.destroy()) } catch { /* gone */ } return }
          setTimeout(seed, 5000)
        }
        seed()
      }
      tick()
    })
  } catch (e: any) { error.value = 'Torrent playback failed: ' + (e.message || e) }
}
function playPasted() {
  const p = Core.parseTorrentInput(torrentInput.value, decl.denylist)
  if (p.error) { error.value = p.error; return }
  choose({ source: { id: 'pasted', name: 'Your torrent', kind: 'torrent' }, ok: true, torrent: p.uri })
}

// ── user-defined torrent sources (this browser only; none shipped) ─────────
const ULS = USER_SOURCES_KEY
const userSources = ref<any[]>(Core.parseUserSources((() => { try { return localStorage.getItem(ULS) || '[]' } catch { return '[]' } })()))
const userQuery = ref('')
const userResults = ref<any[]>([])
const userErrors = ref<any[]>([])
const userSearching = ref(false)
async function searchUser() {
  userSearching.value = true
  const getText = async (u: string) => { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text() }
  try {
    const out = await Core.searchUserSources(userSources.value, userQuery.value || ids.title, getText)
    userResults.value = out.results; userErrors.value = out.errors
  } finally { userSearching.value = false }
}
function playUserResult(r: any) {
  if (r.open) { window.open(r.open, '_blank', 'noopener'); return }
  const uri = r.magnet || r.torrent
  if (!uri) { error.value = 'That result has no magnet or .torrent link.'; return }
  choose({ source: { id: 'user', name: r.title, kind: 'torrent' }, ok: true, torrent: uri, badge: r.badge })
}

function onPickFiles(e: Event) {
  deviceFiles.value = Array.from((e.target as HTMLInputElement).files || [])
  probe()
}

const sourceIcon: Record<string, string> = { library: '🗄', local: '📁', providers: '📺', trailer: '🎞', catalogue: '🏛', torrent: '🧲' }
watch(() => settings.buffer, persist)
onMounted(probe)
onBeforeUnmount(cleanup)
</script>

<template>
  <div class="webplayer-wrapper">
    <div class="player-window">
      <div class="window-header">
        <h2>{{ ids.title }}<span v-if="ids.year" class="year"> · {{ ids.year }}</span></h2>
        <div class="header-buttons">
          <button class="icon-btn" title="Movies config" @click="showSettings = !showSettings">⚙</button>
          <button class="icon-btn" title="Close" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="body">
        <aside class="picker">
          <div class="picker-head">
            Sources
            <span v-if="probing" class="muted">checking {{ pending }}…</span>
          </div>
          <button
            v-for="r in available"
            :key="r.source.id"
            class="src"
            :class="{ on: active && active.source.id === r.source.id }"
            @click="choose(r)"
          >
            <span>{{ sourceIcon[r.source.kind] }}</span>
            <span class="src-name">{{ r.source.name }}<small v-if="r.badge" class="badge">{{ r.badge }}</small></span>
          </button>
          <p v-if="!probing && !available.length" class="empty">
            No legal source has this title.<br>
            <span class="muted">Add your Jellyfin/Plex/Emby server, a drive folder or a TMDB key in ⚙, pick files from this device, or paste a torrent you have the right to share.</span>
          </p>
          <details v-if="failed.length" class="failed">
            <summary>{{ failed.length }} source(s) failed</summary>
            <div v-for="r in failed" :key="r.source.id">{{ r.source.name }}: {{ r.error }}</div>
          </details>
          <label class="file-pick">📁 Files on this device<input type="file" accept="video/*" multiple @change="onPickFiles"></label>
          <form class="paste" @submit.prevent="playPasted">
            <input v-model="torrentInput" placeholder="magnet:… or https://….torrent">
            <button type="submit">▶</button>
          </form>
          <form v-if="userSources.length" class="usearch" @submit.prevent="searchUser">
            <div class="picker-head">Your sources <span class="muted">{{ userSources.filter((u) => u.enabled).length }} on</span></div>
            <div class="paste"><input v-model="userQuery" :placeholder="'Search: ' + ids.title"><button type="submit">⌕</button></div>
            <span v-if="userSearching" class="muted">searching…</span>
            <button v-for="(r, i) in userResults" :key="i" type="button" class="src" @click="playUserResult(r)">
              <span>🧲</span><span class="src-name">{{ r.title }}<small class="badge">{{ r.badge }}<template v-if="r.seeders != null"> · {{ r.seeders }} seeders</template></small></span>
            </button>
            <div v-for="e in userErrors" :key="e.name" class="failed">{{ e.name }}: {{ e.error }}</div>
          </form>
          <label class="buffer">Buffer
            <select v-model="settings.buffer">
              <option v-for="b in BUFFER_MODES" :key="b.id" :value="b.id">{{ b.label }}</option>
            </select>
          </label>
        </aside>

        <section class="stage">
          <div v-if="!active" class="placeholder">
            {{ probing ? 'Looking for this title in your sources…' : (available.length ? 'Pick a source.' : 'Nothing to play.') }}
          </div>

          <iframe
            v-else-if="active.embed"
            :key="active.embed"
            :src="active.embed"
            allowfullscreen
            allow="autoplay; fullscreen; picture-in-picture"
            class="frame"
          ></iframe>

          <div v-else-if="active.groups" class="providers">
            <div v-for="g in active.groups" :key="g.category" class="prov-group">
              <h3>{{ g.label }}</h3>
              <div class="prov-row">
                <a v-for="s in g.services" :key="s.id" :href="s.link" target="_blank" rel="noopener" class="prov" :title="s.name">
                  <img v-if="s.logo" :src="s.logo" :alt="s.name"><span>{{ s.name }}</span>
                </a>
              </div>
            </div>
            <p class="muted">Availability from TMDB / JustWatch for region {{ settings.region }}.</p>
          </div>

          <template v-else>
            <video ref="video" class="frame" controls playsinline @progress="onProgress" @timeupdate="onProgress" @waiting="onWaiting" @error="onVideoError"></video>
            <div class="bufbar" :title="Math.round(buffered * 100) + '% buffered'">
              <div class="buf" :style="{ width: buffered * 100 + '%' }"></div>
              <div class="pos" :style="{ width: played * 100 + '%' }"></div>
            </div>
            <div class="status">
              <span v-if="waitingFor">{{ waitingFor }}</span>
              <span v-if="downloadPct >= 0 && downloadPct < 100">Downloading {{ downloadPct }}%</span>
              <span v-if="downloadPct === -2">Downloading…</span>
              <span v-if="torrentStatus">{{ torrentStatus }}</span>
              <a v-if="active.page" :href="active.page" target="_blank" rel="noopener">Archive page ↗</a>
            </div>
          </template>
          <div v-if="error" class="error" role="alert">⚠ {{ error }}</div>
        </section>
      </div>

      <MovieConfig v-if="showSettings" @saved="onConfigSaved" @close="showSettings = false" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.webplayer-wrapper { position: fixed; inset: 0; z-index: 1000; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; }
.player-window { background: #1a1a1a; border-radius: 12px; width: 95%; max-width: 1280px; height: 88vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8); color: #eee; position: relative; overflow: hidden; }
.window-header {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-bottom: 1px solid #333;
  h2 { margin: 0; font-size: 1.15em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .year { color: #888; font-weight: 400; }
}
.header-buttons { display: flex; gap: 8px; }
.icon-btn { background: transparent; border: none; color: #fff; font-size: 1.3em; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; &:hover { background: rgba(255, 255, 255, 0.1); } }
.body { flex: 1; display: flex; min-height: 0; }
.picker { width: 260px; border-right: 1px solid #333; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; background: #151515; }
.picker-head { font-weight: 600; display: flex; justify-content: space-between; color: #aaa; font-size: 0.9em; }
.src {
  display: flex; gap: 10px; align-items: center; text-align: left; padding: 9px 10px; border-radius: 8px; border: 1px solid #333; background: #222; color: #eee; cursor: pointer;
  &.on { border-color: var(--accent-color, #e50914); background: #2a1a1a; }
  &:hover { background: #2a2a2a; }
}
.src-name { display: flex; flex-direction: column; }
.badge { color: #c9a227; font-size: 0.75em; }
.empty { color: #ddd; font-size: 0.9em; line-height: 1.4; }
.muted { color: #888; font-size: 0.85em; }
.failed { font-size: 0.8em; color: #c77; }
.file-pick { cursor: pointer; font-size: 0.85em; color: #bbb; input { display: block; margin-top: 4px; max-width: 100%; } }
.paste { display: flex; gap: 4px; input { flex: 1; min-width: 0; } }
.buffer { font-size: 0.85em; color: #bbb; display: flex; flex-direction: column; gap: 4px; }
input, select { padding: 7px; background: #333; border: 1px solid #444; border-radius: 6px; color: #fff; }
.paste button, .update-btn { padding: 7px 12px; background: var(--accent-color, #e50914); border: none; border-radius: 6px; color: #fff; cursor: pointer; font-weight: 600; }
.stage { flex: 1; display: flex; flex-direction: column; min-width: 0; background: #000; position: relative; }
.frame { flex: 1; width: 100%; min-height: 0; border: 0; background: #000; }
.placeholder { margin: auto; color: #888; padding: 20px; text-align: center; }
.bufbar {
  height: 6px; background: #222; position: relative;
  .buf, .pos { position: absolute; left: 0; top: 0; bottom: 0; }
  .buf { background: #555; }
  .pos { background: var(--accent-color, #e50914); }
}
.status { display: flex; flex-wrap: wrap; gap: 14px; padding: 6px 10px; font-size: 0.85em; color: #aaa; background: #111; a { color: #c9a227; } }
.error { position: absolute; left: 12px; right: 12px; bottom: 44px; background: #3a1010; border: 1px solid #a33; color: #fdd; padding: 10px 14px; border-radius: 8px; }
.providers { padding: 18px; overflow-y: auto; background: #1a1a1a; flex: 1; h3 { margin: 10px 0 8px; font-size: 1em; color: #ccc; } }
.prov-row { display: flex; flex-wrap: wrap; gap: 10px; }
.prov {
  display: flex; flex-direction: column; align-items: center; width: 84px; color: #ddd; text-decoration: none; font-size: 0.75em; text-align: center; gap: 4px;
  img { width: 56px; height: 56px; border-radius: 12px; }
  &:hover { color: #fff; }
}
.usearch { display: flex; flex-direction: column; gap: 4px; }
.usrc { display: flex; gap: 6px; align-items: center; input:not([type='checkbox']) { flex: 1; } }
.settings h4 { margin: 8px 0 0; }
.settings {
  position: absolute; top: 58px; right: 12px; width: min(420px, 92%); max-height: 80%; overflow-y: auto; background: #202020; border: 1px solid #444; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; z-index: 5;
  label { display: flex; flex-direction: column; gap: 3px; font-size: 0.85em; color: #aaa; text-transform: capitalize; }
}
@media (max-width: 768px) {
  .player-window { height: 96vh; width: 100%; border-radius: 0; }
  .body { flex-direction: column-reverse; }
  .picker { width: auto; max-height: 40%; border-right: 0; border-top: 1px solid #333; }
}
</style>
