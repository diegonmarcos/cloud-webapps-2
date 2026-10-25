<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ data: unknown; searchTerm: string }>()
const emit = defineEmits<{ copyPath: [path: string] }>()

interface FlatEntry {
  path: string
  value: unknown
  type: string
  depth: number
}

const flatEntries = computed(() => {
  const entries: FlatEntry[] = []
  const walk = (obj: unknown, path: string, depth: number) => {
    if (obj === null || typeof obj !== 'object') {
      entries.push({ path: path || '(root)', value: obj, type: typeof obj === 'object' ? 'null' : typeof obj, depth })
      return
    }
    const keys = Object.keys(obj as object)
    const isArr = Array.isArray(obj)
    // Add container entry
    entries.push({ path: path || '(root)', value: isArr ? `Array(${keys.length})` : `Object{${keys.length}}`, type: isArr ? 'array' : 'object', depth })
    for (const key of keys) {
      const val = (obj as Record<string, unknown>)[key]
      const childPath = path
        ? (isArr ? `${path}[${key}]` : `${path}.${key}`)
        : (isArr ? `[${key}]` : key)
      walk(val, childPath, depth + 1)
    }
  }
  walk(props.data, '', 0)
  return entries
})

const filtered = computed(() => {
  if (!props.searchTerm) return flatEntries.value
  const term = props.searchTerm.toLowerCase()
  return flatEntries.value.filter(e =>
    e.path.toLowerCase().includes(term) || String(e.value).toLowerCase().includes(term)
  )
})

const stats = computed(() => {
  let objects = 0, arrays = 0, strings = 0, numbers = 0, booleans = 0, nulls = 0
  for (const e of flatEntries.value) {
    switch (e.type) {
      case 'object': objects++; break
      case 'array': arrays++; break
      case 'string': strings++; break
      case 'number': numbers++; break
      case 'boolean': booleans++; break
      case 'null': nulls++; break
    }
  }
  const maxDepth = flatEntries.value.reduce((m, e) => Math.max(m, e.depth), 0)
  return { total: flatEntries.value.length, objects, arrays, strings, numbers, booleans, nulls, maxDepth }
})

const formatValue = (entry: FlatEntry): string => {
  if (entry.type === 'object' || entry.type === 'array') return String(entry.value)
  if (entry.value === null) return 'null'
  if (typeof entry.value === 'string') return `"${entry.value}"`
  return String(entry.value)
}

const getTypeClass = (type: string): string => {
  switch (type) {
    case 'string': return 'type-string'
    case 'number': return 'type-number'
    case 'boolean': return 'type-boolean'
    case 'null': return 'type-null'
    case 'object': return 'type-object'
    case 'array': return 'type-array'
    default: return ''
  }
}
</script>

<template>
  <div class="paths-view">
    <div class="paths-stats">
      <span class="stat">{{ stats.total }} entries</span>
      <span class="stat">depth: {{ stats.maxDepth }}</span>
      <span class="stat type-object">{{ stats.objects }} obj</span>
      <span class="stat type-array">{{ stats.arrays }} arr</span>
      <span class="stat type-string">{{ stats.strings }} str</span>
      <span class="stat type-number">{{ stats.numbers }} num</span>
      <span class="stat type-boolean">{{ stats.booleans }} bool</span>
      <span class="stat type-null">{{ stats.nulls }} null</span>
    </div>
    <div class="paths-list">
      <div
        v-for="(entry, idx) in filtered"
        :key="idx"
        class="path-row"
        :style="{ paddingLeft: `${entry.depth * 12 + 8}px` }"
        @click="emit('copyPath', entry.path)"
      >
        <span :class="['path-type', getTypeClass(entry.type)]">{{ entry.type.slice(0, 3) }}</span>
        <span class="path-name">{{ entry.path }}</span>
        <span :class="['path-value', getTypeClass(entry.type)]">{{ formatValue(entry) }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.paths-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

.paths-stats {
  padding: 4px 8px; border-bottom: 1px solid var(--color-border);
  display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0;
  .stat { font-size: 11px; padding: 1px 5px; border-radius: 4px; background: var(--color-bg-tertiary); color: var(--color-text-muted); }
}

.paths-list { flex: 1; overflow: auto; font-family: var(--font-mono); font-size: 13px; }

.path-row {
  display: flex; align-items: center; gap: 6px;
  padding: 2px 6px; border-bottom: 1px solid rgba(51, 65, 85, 0.2);
  cursor: pointer; min-height: 24px;
  &:hover { background: rgba(59, 130, 246, 0.05); }
}

.path-type {
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  width: 28px; text-align: center; flex-shrink: 0;
  padding: 1px 4px; border-radius: 3px;
  background: var(--color-bg-tertiary);
}

.path-name { color: var(--color-text-secondary); flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50%; }
.path-value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; }

.type-string { color: #34d399; }
.type-number { color: #60a5fa; }
.type-boolean { color: #a78bfa; }
.type-null { color: var(--color-text-muted); }
.type-object { color: #fbbf24; }
.type-array { color: #f472b6; }

@media (max-width: 640px) {
  .paths-list { font-size: 11px; }
  .paths-stats .stat { font-size: 9px; }
  .path-type { font-size: 8px; }
}
</style>
