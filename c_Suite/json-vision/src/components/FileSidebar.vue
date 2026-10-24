<script setup lang="ts">
import { ref } from 'vue'
import type { OpenDoc } from '@/types/json'

defineProps<{
  files: string[]
  openDocs: OpenDoc[]
  width: number
  useFallback: boolean
}>()

const emit = defineEmits<{
  openFolder: []
  openFile: [filename: string]
  fallbackFiles: [files: FileList | null]
  fetchUrl: [url: string, label?: string, method?: string]
  'update:width': [value: number]
  collapse: []
}>()

type SidebarTab = 'files' | 'api'
const activeTab = ref<SidebarTab>('api')

// --- Files tab ---
const fileInputRef = ref<HTMLInputElement | null>(null)
const triggerFileInput = () => { fileInputRef.value?.click() }
const handleFileChange = (e: Event) => {
  const t = e.target as HTMLInputElement
  emit('fallbackFiles', t.files)
  t.value = ''
}

// --- API tab ---
interface ApiEndpoint {
  method: string
  path: string
  tag: string
  operationId: string
  description: string
  url: string
}

const specUrl = ref('https://api.diegonmarcos.com/api/docs/openapi.json')
const singleUrl = ref('')
const endpoints = ref<ApiEndpoint[]>([])
const apiBaseUrl = ref('')
const isLoadingSpec = ref(false)
const isFetchingSingle = ref(false)
const expandedTags = ref<Set<string>>(new Set())

const loadSpec = async () => {
  const url = specUrl.value.trim()
  if (!url) return
  isLoadingSpec.value = true
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const spec = await res.json()

    // Derive base URL: strip path from spec URL, or use servers[0]
    if (spec.servers?.[0]?.url) {
      apiBaseUrl.value = spec.servers[0].url.replace(/\/$/, '')
    } else {
      const u = new URL(url)
      apiBaseUrl.value = u.origin
    }

    // Parse paths
    const eps: ApiEndpoint[] = []
    for (const [path, methods] of Object.entries(spec.paths || {})) {
      for (const [method, detail] of Object.entries(methods as Record<string, any>)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          const tag = detail.tags?.[0] || 'default'
          eps.push({
            method: method.toUpperCase(),
            path,
            tag,
            operationId: detail.operationId || '',
            description: detail.responses?.['200']?.description || detail.summary || '',
            url: apiBaseUrl.value + path,
          })
          if (!expandedTags.value.has(tag)) expandedTags.value.add(tag)
        }
      }
    }
    // Sort: by tag then path
    eps.sort((a, b) => a.tag.localeCompare(b.tag) || a.path.localeCompare(b.path))
    endpoints.value = eps

    // Also open the full spec itself as a document
    emit('fetchUrl', url, spec.info?.title || 'OpenAPI Spec')
  } catch (e: any) {
    console.error('[JSON Vision] Failed to load spec:', e)
    endpoints.value = []
  } finally {
    isLoadingSpec.value = false
  }
}

const fetchEndpoint = (ep: ApiEndpoint) => {
  emit('fetchUrl', ep.url, `${ep.method} ${ep.path}`, ep.method)
}

const fetchSingleUrl = () => {
  const url = singleUrl.value.trim()
  if (!url) return
  isFetchingSingle.value = true
  try {
    const label = new URL(url).pathname.split('/').pop() || url
    emit('fetchUrl', url, label)
  } catch { emit('fetchUrl', url) }
  setTimeout(() => { isFetchingSingle.value = false }, 2000)
}

const tagGroups = () => {
  const map = new Map<string, ApiEndpoint[]>()
  for (const ep of endpoints.value) {
    if (!map.has(ep.tag)) map.set(ep.tag, [])
    map.get(ep.tag)!.push(ep)
  }
  return map
}

const toggleTag = (tag: string) => {
  if (expandedTags.value.has(tag)) expandedTags.value.delete(tag)
  else expandedTags.value.add(tag)
}

const methodColor = (m: string) => {
  if (m === 'GET') return '#22c55e'
  if (m === 'POST') return '#3b82f6'
  if (m === 'PUT') return '#f59e0b'
  if (m === 'DELETE') return '#ef4444'
  return '#94a3b8'
}

// --- Resize ---
let isResizing = false; let startX = 0; let startWidth = 0
const startResize = (e: MouseEvent) => {
  isResizing = true; startX = e.clientX; startWidth = 256
  document.addEventListener('mousemove', doResize); document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
}
const doResize = (e: MouseEvent) => { if (!isResizing) return; emit('update:width', Math.max(150, Math.min(startWidth + (e.clientX - startX), 600))) }
const stopResize = () => { isResizing = false; document.removeEventListener('mousemove', doResize); document.removeEventListener('mouseup', stopResize); document.body.style.cursor = 'default' }
</script>

<template>
  <aside class="sidebar" :style="{ width: `${width}px` }">
    <input ref="fileInputRef" type="file" accept=".json" multiple style="display:none" @change="handleFileChange"/>

    <div class="sidebar-header">
      <div class="sidebar-title-row">
        <div class="tab-switcher">
          <button :class="['stab', { active: activeTab === 'files' }]" @click="activeTab = 'files'">Files</button>
          <button :class="['stab', { active: activeTab === 'api' }]" @click="activeTab = 'api'">API</button>
        </div>
        <button class="collapse-btn" title="Collapse sidebar" @click="emit('collapse')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <!-- Files header -->
      <template v-if="activeTab === 'files'">
        <div class="open-buttons">
          <button class="open-btn" title="Select JSON Files" @click="triggerFileInput()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
            </svg>
            <span>File</span>
          </button>
          <button :class="['open-btn', { disabled: useFallback }]" :title="useFallback ? 'Folder API blocked' : 'Open Folder'" @click="emit('openFolder')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Folder</span>
          </button>
        </div>
      </template>

      <!-- API header -->
      <template v-if="activeTab === 'api'">
        <div class="api-section">
          <label class="section-label">OpenAPI Spec</label>
          <div class="fetch-row">
            <input v-model="specUrl" class="fetch-input" type="url" placeholder="https://api.example.com/openapi.json" @keydown.enter="loadSpec"/>
            <button class="fetch-btn" :disabled="!specUrl.trim() || isLoadingSpec" title="Load spec & discover endpoints" @click="loadSpec">
              <svg v-if="!isLoadingSpec" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
        </div>
        <div class="api-section">
          <label class="section-label">Single Endpoint</label>
          <div class="fetch-row">
            <input v-model="singleUrl" class="fetch-input" type="url" placeholder="https://api.example.com/data" @keydown.enter="fetchSingleUrl"/>
            <button class="fetch-btn" :disabled="!singleUrl.trim() || isFetchingSingle" title="Fetch endpoint" @click="fetchSingleUrl">
              <svg v-if="!isFetchingSingle" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Files list -->
    <div v-if="activeTab === 'files'" class="file-list">
      <div v-if="files.length === 0" class="empty-state">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <div class="empty-text">Open a file or folder</div>
      </div>
      <div v-for="file in files" :key="file" :class="['file-item', { open: openDocs.some(d => d.filename === file) }]" @click="emit('openFile', file)">
        <svg class="file-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
        </svg>
        <span class="file-name">{{ file }}</span>
      </div>
    </div>

    <!-- API endpoints list -->
    <div v-if="activeTab === 'api'" class="file-list">
      <div v-if="endpoints.length === 0" class="empty-state">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        <div class="empty-text">Load an OpenAPI spec to discover endpoints</div>
      </div>
      <template v-for="[tag, eps] in tagGroups()" :key="tag">
        <div class="tag-header" @click="toggleTag(tag)">
          <span class="tag-chevron">{{ expandedTags.has(tag) ? '▼' : '▶' }}</span>
          <span class="tag-name">{{ tag }}</span>
          <span class="tag-count">{{ eps.length }}</span>
        </div>
        <template v-if="expandedTags.has(tag)">
          <div
            v-for="ep in eps" :key="ep.operationId || ep.path + ep.method"
            class="ep-item"
            :title="ep.description"
            @click="fetchEndpoint(ep)"
          >
            <span class="ep-method" :style="{ color: methodColor(ep.method) }">{{ ep.method }}</span>
            <span class="ep-path">{{ ep.path }}</span>
          </div>
        </template>
      </template>
    </div>

    <div class="resize-handle" @mousedown="startResize"></div>
  </aside>
</template>

<style lang="scss" scoped>
.sidebar { background: var(--color-bg-secondary); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; flex-shrink: 0; position: relative; }
.sidebar-header { padding: 8px 12px; border-bottom: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 6px; }
.sidebar-title-row { display: flex; align-items: center; justify-content: space-between; }
.collapse-btn { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 2px; border-radius: 4px; display: flex; align-items: center; justify-content: center; &:hover { color: white; background: var(--color-bg-tertiary); } }

.tab-switcher {
  display: flex; background: var(--color-bg-tertiary); border-radius: 4px; padding: 2px;
}
.stab {
  padding: 4px 10px; font-size: 10px; font-weight: 600; border: none; border-radius: 3px; cursor: pointer;
  background: transparent; color: var(--color-text-muted); transition: all 0.15s;
  &.active { background: var(--color-accent); color: white; }
  &:not(.active):hover { color: var(--color-text-secondary); }
}

.open-buttons { display: flex; gap: 4px; }
.open-btn {
  display: flex; align-items: center; gap: 3px; padding: 4px 6px; border: none; border-radius: 4px;
  background: none; color: var(--color-accent); font-size: 10px; cursor: pointer;
  &:hover { background: var(--color-bg-tertiary); }
  &.disabled { opacity: 0.35; cursor: not-allowed; text-decoration: line-through; }
}

.api-section { display: flex; flex-direction: column; gap: 3px; }
.section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
.fetch-row { display: flex; gap: 4px; }
.fetch-input {
  flex: 1; min-width: 0; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: 4px;
  padding: 4px 6px; font-size: 10px; color: var(--color-text-secondary); outline: none;
  &:focus { border-color: var(--color-accent); }
  &::placeholder { color: var(--color-text-muted); opacity: 0.6; }
}
.fetch-btn {
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 1px solid var(--color-border); border-radius: 4px;
  background: var(--color-bg-tertiary); color: var(--color-accent); cursor: pointer;
  &:hover:not(:disabled) { background: var(--color-accent); color: white; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  .spin { animation: spin 1s linear infinite; }
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.file-list { flex: 1; overflow-y: auto; padding: 8px; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; color: var(--color-text-muted); gap: 8px; text-align: center; svg { opacity: 0.5; } }
.empty-text { font-size: 12px; }

.file-item {
  display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 14px; color: var(--color-text-muted);
  &:hover { background: var(--color-bg-tertiary); color: var(--color-text-primary); .file-icon { color: var(--color-accent); } }
  &.open { color: var(--color-accent-light); }
}
.file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.tag-header {
  display: flex; align-items: center; gap: 6px; padding: 6px 8px; cursor: pointer; user-select: none;
  border-radius: 4px;
  &:hover { background: var(--color-bg-tertiary); }
}
.tag-chevron { font-size: 8px; color: var(--color-text-muted); width: 12px; }
.tag-name { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); flex: 1; }
.tag-count { font-size: 9px; color: var(--color-text-muted); background: var(--color-bg-tertiary); padding: 1px 5px; border-radius: 8px; }

.ep-item {
  display: flex; align-items: center; gap: 6px; padding: 5px 8px 5px 20px; cursor: pointer;
  border-radius: 4px; font-size: 11px;
  &:hover { background: var(--color-bg-tertiary); }
}
.ep-method { font-size: 9px; font-weight: 800; width: 32px; flex-shrink: 0; font-family: var(--font-mono); }
.ep-path { color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-mono); }

.resize-handle { position: absolute; top: 0; right: 0; width: 4px; height: 100%; cursor: col-resize; z-index: 50; &:hover { background: rgba(59, 130, 246, 0.5); } }
</style>
