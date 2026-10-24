<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import JsonNode from './JsonNode.vue'

const props = defineProps<{ data: unknown; searchTerm: string }>()
const emit = defineEmits<{ copyPath: [path: string]; edit: [path: string, key: string, value: unknown] }>()

const flatMode = ref(false)
const collapsedPaths = ref(new Set<string>())

// --- Depth-based collapse control ---
const collapseSignal = ref({ maxDepth: Infinity, version: 0 })
provide('collapseSignal', collapseSignal)

const getMaxObjectDepth = (val: unknown, depth = 0): number => {
  if (val === null || typeof val !== 'object') return -Infinity
  let max = depth
  for (const v of Object.values(val as Record<string, unknown>)) {
    const d = getMaxObjectDepth(v, depth + 1)
    if (d > max) max = d
  }
  return max
}

const maxPossibleDepth = computed(() => Math.max(0, getMaxObjectDepth(props.data)))
const currentMaxDepth = ref(Infinity)

watch(() => props.data, () => { currentMaxDepth.value = Infinity })

const updateFlatCollapse = () => {
  if (!flatMode.value) return
  const paths = new Set<string>()
  const walk = (val: unknown, path: string, depth: number) => {
    if (val === null || typeof val !== 'object') return
    if (depth >= currentMaxDepth.value) { if (path !== '') paths.add(path); return }
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const p = Array.isArray(val) ? `${path}[${k}]` : path ? `${path}.${k}` : k
      walk(v, p, depth + 1)
    }
  }
  walk(props.data, '', 0)
  collapsedPaths.value = paths
}

const collapseOneLevel = () => {
  const mp = maxPossibleDepth.value
  if (currentMaxDepth.value > mp) currentMaxDepth.value = mp
  else if (currentMaxDepth.value > 0) currentMaxDepth.value--
  collapseSignal.value = { maxDepth: currentMaxDepth.value, version: collapseSignal.value.version + 1 }
  updateFlatCollapse()
}

const expandOneLevel = () => {
  if (currentMaxDepth.value === Infinity) return
  currentMaxDepth.value++
  if (currentMaxDepth.value > maxPossibleDepth.value) currentMaxDepth.value = Infinity
  collapseSignal.value = { maxDepth: currentMaxDepth.value, version: collapseSignal.value.version + 1 }
  updateFlatCollapse()
}

const expandAll = () => {
  currentMaxDepth.value = Infinity
  collapseSignal.value = { maxDepth: Infinity, version: collapseSignal.value.version + 1 }
  collapsedPaths.value = new Set()
}

// --- Flat mode ---
const toggleFlatCollapse = (path: string) => {
  const s = new Set(collapsedPaths.value)
  if (s.has(path)) s.delete(path)
  else s.add(path)
  collapsedPaths.value = s
}

interface FlatRow { path: string; key: string; value: string; type: string; depth: number; isHeader: boolean }

const flatRows = computed(() => {
  const rows: FlatRow[] = []
  const walk = (val: unknown, path: string, key: string, depth: number) => {
    if (val === null || typeof val !== 'object') {
      const type = val === null ? 'null' : typeof val
      rows.push({ path, key, value: val === null ? 'null' : String(val), type, depth, isHeader: false })
      return
    }
    const hint = Array.isArray(val) ? `[${Object.keys(val).length}]` : `{${Object.keys(val).length}}`
    rows.push({ path, key: key || 'root', value: hint, type: 'object', depth, isHeader: true })
    if (!collapsedPaths.value.has(path)) {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const p = Array.isArray(val) ? `${path}[${k}]` : path ? `${path}.${k}` : k
        walk(v, p, k, depth + 1)
      }
    }
  }
  walk(props.data, '', '', 0)
  return rows
})

const filteredRows = computed(() => {
  if (!props.searchTerm) return flatRows.value
  const t = props.searchTerm.toLowerCase()
  return flatRows.value.filter(r => r.path.toLowerCase().includes(t) || r.value.toLowerCase().includes(t) || r.isHeader)
})

const typeClass = (t: string) => {
  if (t === 'number') return 'ft-number'
  if (t === 'boolean') return 'ft-boolean'
  if (t === 'null') return 'ft-null'
  return 'ft-string'
}
</script>

<template>
  <div class="tree-wrapper">
    <div class="tree-controls">
      <button class="ctrl-btn" @click="collapseOneLevel" title="Collapse one level">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 14l-5-5-5 5"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
      </button>
      <button class="ctrl-btn" @click="expandOneLevel" title="Expand one level">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10l5 5 5-5"/><line x1="4" y1="4" x2="20" y2="4"/></svg>
      </button>
      <button class="ctrl-btn" @click="expandAll" title="Expand all">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 8l5 5 5-5"/><path d="M7 14l5 5 5-5"/></svg>
      </button>
      <button class="ctrl-btn" :title="flatMode ? 'Tree view' : 'Flat paths view'" @click="flatMode = !flatMode">
        <svg v-if="!flatMode" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>

    <!-- Default tree -->
    <div v-if="!flatMode" class="tree-view">
      <JsonNode
        :value="data"
        :is-last="true"
        path=""
        :depth="0"
        :search-term="searchTerm"
        @copy-path="emit('copyPath', $event)"
        @edit="(a: string, b: string, c: unknown) => emit('edit', a, b, c)"
      />
    </div>

    <!-- Flat paths -->
    <div v-else class="flat-view">
      <div
        v-for="(row, i) in filteredRows" :key="i"
        :class="['flat-row', { header: row.isHeader, collapsed: row.isHeader && collapsedPaths.has(row.path) }]"
        :style="{ paddingLeft: (row.depth * 12 + 4) + 'px' }"
        @click="row.isHeader ? toggleFlatCollapse(row.path) : emit('copyPath', row.path)"
      >
        <span v-if="row.isHeader" class="flat-chevron">{{ collapsedPaths.has(row.path) ? '▶' : '▼' }}</span>
        <span v-if="row.isHeader" class="flat-key header-key">{{ row.key }}</span>
        <span v-if="row.isHeader" class="flat-hint">{{ row.value }}</span>
        <template v-else>
          <span class="flat-key">{{ row.key }}</span>
          <span class="flat-dots"></span>
          <span :class="['flat-val', typeClass(row.type)]">{{ row.value.length > 60 ? row.value.slice(0, 57) + '...' : row.value }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tree-wrapper { height: 100%; width: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; }

.tree-controls { position: absolute; top: 6px; right: 6px; z-index: 10; display: flex; flex-direction: column; gap: 3px; }
.ctrl-btn {
  background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 5px;
  color: var(--color-text-muted); cursor: pointer;
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  -webkit-tap-highlight-color: transparent;
  &:hover { color: white; background: var(--color-border); }
}

.tree-view { padding: 8px; overflow: auto; flex: 1; font-family: var(--font-mono); font-size: 14px; -webkit-overflow-scrolling: touch; }

.flat-view { padding: 2px 0; overflow: auto; flex: 1; font-family: var(--font-mono); font-size: 12px; -webkit-overflow-scrolling: touch; }
.flat-row {
  display: flex; align-items: baseline; gap: 4px; padding: 2px 4px; border-radius: 4px; cursor: pointer; white-space: nowrap;
  &:hover { background: var(--color-bg-tertiary); }
  &.header { padding-top: 4px; padding-bottom: 1px; }
}
.flat-key { color: var(--color-text-secondary); white-space: nowrap; flex-shrink: 0; }
.flat-chevron { font-size: 8px; color: var(--color-text-muted); width: 10px; flex-shrink: 0; }
.header-key { color: #facc15; font-weight: 700; }
.flat-hint { color: var(--color-text-muted); font-size: 10px; margin-left: 4px; }
.flat-row.collapsed { opacity: 0.7; }
.flat-dots { flex: 1; border-bottom: 1px dotted rgba(51,65,85,0.5); min-width: 12px; margin-bottom: 3px; }
.flat-val { white-space: nowrap; text-align: right; flex-shrink: 0; max-width: 50%; overflow: hidden; text-overflow: ellipsis; }
.ft-string { color: #34d399; }
.ft-number { color: #60a5fa; }
.ft-boolean { color: #a78bfa; }
.ft-null { color: var(--color-text-muted); font-style: italic; }

:deep(.tree-row) { display: flex; align-items: center; padding: 2px; border-radius: 4px; cursor: pointer; white-space: nowrap; &:hover { background: var(--color-bg-tertiary); } }
:deep(.tree-children) { padding-left: 12px; margin-left: 8px; border-left: 1px solid rgba(51, 65, 85, 0.5); }
:deep(.toggle-btn) { background: none; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 10px; margin-right: 4px; padding: 2px; }
:deep(.tree-key) { color: var(--color-text-secondary); margin-right: 6px; white-space: nowrap; }
:deep(.tree-value) { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
:deep(.val-string) { color: #34d399; }
:deep(.val-number) { color: #60a5fa; }
:deep(.val-boolean) { color: #a78bfa; }
:deep(.val-null) { color: var(--color-text-muted); }
:deep(.bracket) { color: #facc15; font-weight: 700; }
:deep(.comma) { color: var(--color-text-muted); }
:deep(.collapsed-hint) { color: var(--color-text-muted); font-size: 12px; font-style: italic; margin: 0 6px; }

@media (max-width: 640px) {
  .tree-view { font-size: 11px; padding: 4px; }
  .flat-view { font-size: 10px; }
  .flat-hint { font-size: 8px; }
  .flat-chevron { font-size: 7px; }
  .flat-row { gap: 3px; }
  :deep(.toggle-btn) { font-size: 8px; }
  :deep(.collapsed-hint) { font-size: 10px; }
  :deep(.tree-children) { padding-left: 8px; margin-left: 4px; }
}
</style>
