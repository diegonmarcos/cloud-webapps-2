<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ViewMode, LayoutMode } from '@/types/json'
import { useJsonFiles } from '@/composables/useJsonFiles'
import { setValueByPath } from '@/composables/useGraph'
import AppHeader from '@/components/AppHeader.vue'
import FileSidebar from '@/components/FileSidebar.vue'
import JsonEditor from '@/components/JsonEditor.vue'
import GraphView from '@/components/GraphView.vue'
import TreeView from '@/components/TreeView.vue'
import TableView from '@/components/TableView.vue'
import PathsView from '@/components/PathsView.vue'
import MindMapView from '@/components/MindMapView.vue'

const {
  files, openDocs, activeDocIndex, input, parsedData, error, notification, isSaving, useFallback,
  handleOpenFolder, handleFallbackFiles, handleOpenFile, handleCloseTab, loadFromUrl, handleRefresh, handleSaveFile,
  updateInput, handleFormat, handleMinify, handleCopy, handleCopyPath, showNotification
} = useJsonFiles()

const DEFAULT_API_URL = 'https://api.diegonmarcos.com/api/docs/openapi.json'

const viewMode = ref<ViewMode>('mindmap')
const layoutMode = ref<LayoutMode>('vertical')
const searchTerm = ref('')
const sidebarWidth = ref(256)
const sidebarCollapsed = ref(false)

onMounted(() => {
  loadFromUrl(DEFAULT_API_URL, 'Cloud API (OpenAPI)', true)
})

const jsonToMarkdown = (data: unknown, depth = 1): string => {
  if (data === null) return '_null_'
  if (typeof data !== 'object') return typeof data === 'string' ? data : `\`${data}\``

  // Array of objects → table
  if (Array.isArray(data)) {
    if (data.length === 0) return '_empty array_'
    if (data.every(r => r && typeof r === 'object' && !Array.isArray(r))) {
      const cols = [...new Set(data.flatMap(r => Object.keys(r as object)))]
      const hdr = `| ${cols.join(' | ')} |`
      const sep = `| ${cols.map(() => '---').join(' | ')} |`
      const rows = data.map(r => `| ${cols.map(c => {
        const v = (r as Record<string, unknown>)[c]
        if (v === null || v === undefined) return ''
        if (typeof v === 'object') return `\`${JSON.stringify(v)}\``
        return String(v)
      }).join(' | ')} |`)
      return [hdr, sep, ...rows].join('\n')
    }
    return data.map((item, i) => {
      const prefix = `${i + 1}. `
      if (item === null || typeof item !== 'object') return `${prefix}${jsonToMarkdown(item)}`
      return `${prefix}\n${jsonToMarkdown(item, depth + 1)}`
    }).join('\n')
  }

  // Object → headings + content
  const entries = Object.entries(data as Record<string, unknown>)
  return entries.map(([key, val]) => {
    const h = '#'.repeat(Math.min(depth, 6))
    if (val === null || typeof val !== 'object') return `${h} ${key}\n\n${jsonToMarkdown(val)}`
    if (Array.isArray(val) && val.length > 0 && val.every(r => r && typeof r === 'object' && !Array.isArray(r))) {
      return `${h} ${key}\n\n${jsonToMarkdown(val, depth + 1)}`
    }
    return `${h} ${key}\n\n${jsonToMarkdown(val, depth + 1)}`
  }).join('\n\n')
}

const downloadBlob = (content: string, ext: string, mime: string) => {
  const name = openDocs.value[activeDocIndex.value]?.filename?.replace(/\.json$/i, '') || 'export'
  const blob = new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${name}.${ext}`
  a.click()
  URL.revokeObjectURL(a.href)
}

const handleExportJson = () => {
  if (!parsedData.value) return
  downloadBlob(JSON.stringify(parsedData.value, null, 2), 'json', 'application/json')
  showNotification('Exported as JSON')
}

const handleExportMarkdown = () => {
  if (!parsedData.value) return
  downloadBlob(jsonToMarkdown(parsedData.value), 'md', 'text/markdown')
  showNotification('Exported as Markdown')
}

const jsonToCsv = (data: unknown): string => {
  const rows: [string, string, string][] = []
  const flatten = (val: unknown, path: string) => {
    if (val === null || typeof val !== 'object') {
      const t = val === null ? 'null' : typeof val
      rows.push([path || '(root)', t, val === null ? '' : String(val)])
      return
    }
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const p = Array.isArray(val) ? `${path}[${k}]` : path ? `${path}.${k}` : k
      flatten(v, p)
    }
  }
  flatten(data, '')
  const escape = (s: string) => s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  return ['Path,Type,Value', ...rows.map(([p, t, v]) => `${escape(p)},${escape(t)},${escape(v)}`)].join('\n')
}

const handleExportCsv = () => {
  if (!parsedData.value) return
  downloadBlob(jsonToCsv(parsedData.value), 'csv', 'text/csv')
  showNotification('Exported as CSV')
}

const handleEdit = (path: string, key: string, value: unknown) => {
  if (!parsedData.value) return
  try {
    const updatedData = setValueByPath(parsedData.value, path, key, value)
    updateInput(JSON.stringify(updatedData, null, 2))
    showNotification(`Updated ${key}`)
  } catch (e) {
    showNotification('Failed to update value', true)
  }
}
</script>

<template>
  <div class="app">
    <AppHeader
      :open-docs="openDocs"
      :active-doc-index="activeDocIndex"
      :is-saving="isSaving"
      @update:active-doc-index="activeDocIndex = $event"
      @close-tab="handleCloseTab"
      @export-json="handleExportJson"
      @export-md="handleExportMarkdown"
      @export-csv="handleExportCsv"
    />

    <div class="main-content">
      <div v-show="sidebarCollapsed" class="sidebar-collapsed">
        <button class="sidebar-toggle" @click="sidebarCollapsed = false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <FileSidebar
        v-show="!sidebarCollapsed"
        :files="files"
        :open-docs="openDocs"
        :width="sidebarWidth"
        :use-fallback="useFallback"
        @open-folder="handleOpenFolder"
        @open-file="handleOpenFile"
        @fallback-files="handleFallbackFiles"
        @update:width="sidebarWidth = $event"
        @collapse="sidebarCollapsed = true"
        @fetch-url="(url: string, label?: string, method?: string) => loadFromUrl(url, label || new URL(url).pathname.split('/').pop() || url, false, method)"
      />

      <main class="workspace">
        <div v-if="activeDocIndex === -1" class="empty-workspace">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <p class="empty-title">No file open</p>
          <p class="empty-subtitle">Select a file from the sidebar to start editing</p>
        </div>

        <template v-else>
          <JsonEditor
            v-show="viewMode === 'editor' || viewMode === 'split'"
            :class="['editor-pane', { 'full-width': viewMode === 'editor', 'half-width': viewMode === 'split' }]"
            :model-value="input"
            :error="error"
            @update:model-value="updateInput"
            @format="handleFormat"
            @minify="handleMinify"
            @copy="handleCopy"
          />

          <div :class="['visualizer-pane', { 'full-width': viewMode !== 'split' && viewMode !== 'editor', 'half-width': viewMode === 'split' }]">
            <div class="visualizer-toolbar">
              <div class="view-switcher">
                <button :class="{ active: viewMode === 'mindmap' }" @click="viewMode = 'mindmap'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg><span>Mind</span></button>
                <button :class="{ active: viewMode === 'graph' }" @click="viewMode = 'graph'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="8" y="14" width="7" height="7" rx="1"/><line x1="6" y1="10" x2="12" y2="14"/><line x1="18" y1="10" x2="12" y2="14"/></svg><span>Graph</span></button>
                <button :class="{ active: viewMode === 'visual' }" @click="viewMode = 'visual'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Tree</span></button>
                <button :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg><span>Table</span></button>
                <button :class="{ active: viewMode === 'paths' }" @click="viewMode = 'paths'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg><span>Paths</span></button>
                <button :class="{ active: viewMode === 'split' }" @click="viewMode = 'split'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg><span>Split</span></button>
              </div>
              <div class="toolbar-right">
                <input v-if="viewMode !== 'graph'" v-model="searchTerm" type="text" placeholder="Filter..." class="filter-input"/>
                <button v-if="activeDocIndex !== -1" class="export-btn" @click="handleRefresh" title="Refresh JSON">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                </button>
              </div>
            </div>

            <div class="visualizer-content">
              <div v-if="!parsedData" class="invalid-json">Invalid JSON</div>
              <GraphView
                v-else-if="viewMode === 'graph'"
                :data="parsedData"
                :layout-mode="layoutMode"
                @copy-path="handleCopyPath"
                @edit="handleEdit"
                @update:layout-mode="layoutMode = $event"
              />
              <TableView
                v-else-if="viewMode === 'table'"
                :data="parsedData"
                :search-term="searchTerm"
                @copy-path="handleCopyPath"
              />
              <PathsView
                v-else-if="viewMode === 'paths'"
                :data="parsedData"
                :search-term="searchTerm"
                @copy-path="handleCopyPath"
              />
              <MindMapView
                v-else-if="viewMode === 'mindmap'"
                :data="parsedData"
                :search-term="searchTerm"
                @copy-path="handleCopyPath"
              />
              <TreeView
                v-else
                :data="parsedData"
                :search-term="searchTerm"
                @copy-path="handleCopyPath"
                @edit="handleEdit"
              />
              <a href="https://linktree.diegonmarcos.com" target="_blank" rel="noopener noreferrer" class="linktree-ext" title="linktree.diegonmarcos.com">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22V12"/><path d="M12 12c-3-3-6-2-8-1"/><path d="M12 12c3-3 6-2 8-1"/><path d="M12 8c-2-3-5-4-7-3"/><path d="M12 8c2-3 5-4 7-3"/><path d="M12 5c-1.5-2-3-3-5-3"/><path d="M12 5c1.5-2 3-3 5-3"/><circle cx="12" cy="3" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
            </div>
          </div>
        </template>
      </main>
    </div>

    <div v-if="notification" :class="['notification', { error: notification.isError }]">
      <svg v-if="notification.isError" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12" />
      </svg>
      <span>{{ notification.msg }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app { display: flex; flex-direction: column; height: 100vh; height: 100dvh; overflow: hidden; }
.main-content { flex: 1; display: flex; overflow: hidden; }

.sidebar-collapsed {
  width: 32px; flex-shrink: 0;
  background: var(--color-bg-secondary); border-right: 1px solid var(--color-border);
  display: flex; align-items: flex-start; justify-content: center; padding-top: 10px;
}

.sidebar-toggle {
  width: 24px; height: 24px; border-radius: 4px;
  background: none; border: none;
  color: var(--color-text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  &:hover { color: white; background: var(--color-bg-tertiary); }
}
.workspace { flex: 1; display: flex; overflow: hidden; position: relative; }

.empty-workspace {
  width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--color-text-muted); background: var(--color-bg-primary);
  svg { margin-bottom: 16px; opacity: 0.2; }
  .empty-title { font-size: 18px; font-weight: 500; }
  .empty-subtitle { font-size: 14px; }
}

.editor-pane { display: flex; flex-direction: column; transition: width 0.3s; &.full-width { width: 100%; } &.half-width { width: 50%; } }
.visualizer-pane { display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.3); transition: width 0.3s; &.full-width { width: 100%; } &.half-width { width: 50%; } }

.visualizer-toolbar {
  background: rgba(15, 23, 42, 0.5); padding: 8px; border-bottom: 1px solid var(--color-border);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}

.view-switcher {
  display: flex; background: var(--color-bg-tertiary); border-radius: 6px; padding: 2px;
  button {
    padding: 5px 10px; font-size: 11px; font-weight: 500; border: none; border-radius: 5px; cursor: pointer;
    background: transparent; color: var(--color-text-muted);
    display: flex; align-items: center; gap: 4px;
    &.active { background: var(--color-accent); color: white; }
    &:not(.active):hover { color: var(--color-text-secondary); }
    svg { flex-shrink: 0; }
    span { @media (max-width: 640px) { display: none; } }
  }
}

.toolbar-right { display: flex; align-items: center; gap: 6px; }

.filter-input {
  background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: 4px;
  padding: 4px 8px; font-size: 12px; width: 96px; color: var(--color-text-secondary); outline: none;
  transition: width 0.2s;
  &:focus { width: 128px; }
}

.export-btn {
  padding: 4px 8px; font-size: 10px; font-weight: 700; border: 1px solid var(--color-border);
  border-radius: 4px; background: var(--color-bg-tertiary); color: var(--color-text-muted);
  cursor: pointer; white-space: nowrap;
  &:hover { color: white; border-color: var(--color-accent); }
}

.visualizer-content { flex: 1; overflow: hidden; background: var(--color-bg-primary); position: relative; }

.linktree-ext {
  position: absolute; bottom: 8px; right: 8px; z-index: 90;
  width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  background: rgba(16,185,129,0.12); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(52,211,153,0.25); box-shadow: 0 2px 8px rgba(16,185,129,0.15), inset 0 1px 0 rgba(52,211,153,0.15);
  color: rgba(52,211,153,0.5); text-decoration: none; transition: all 0.3s ease;
  &:hover { color: rgba(52,211,153,0.9); background: rgba(16,185,129,0.22); border-color: rgba(52,211,153,0.4); box-shadow: 0 4px 16px rgba(16,185,129,0.25), inset 0 1px 0 rgba(52,211,153,0.2); }
}
.invalid-json { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px; }

.notification {
  position: fixed; bottom: 24px; right: 24px; padding: 8px 16px; border-radius: 8px;
  backdrop-filter: blur(8px); border: 1px solid; display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 500; z-index: 100; animation: slide-up 0.2s ease-out;
  background: rgba(23, 37, 84, 0.8); border-color: rgba(30, 64, 175, 0.5); color: #bfdbfe;
  &.error { background: rgba(127, 29, 29, 0.8); border-color: rgba(185, 28, 28, 0.5); color: #fecaca; }
}
</style>
