<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ data: unknown; searchTerm: string }>()
const emit = defineEmits<{ copyPath: [path: string] }>()

const sortCol = ref<string | null>(null)
const sortAsc = ref(true)
const expandedPath = ref<string | null>(null)

// Find the best array to display as table
// Priority: root array > first large array in object
const tableData = computed(() => {
  const d = props.data
  if (Array.isArray(d)) return { path: '', rows: d }
  if (d && typeof d === 'object') {
    // Find first array property with objects inside
    for (const [key, val] of Object.entries(d as Record<string, unknown>)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
        return { path: key, rows: val }
      }
    }
    // Fallback: wrap object entries as rows
    return { path: '', rows: Object.entries(d as Record<string, unknown>).map(([k, v]) => ({ _key: k, _value: v })) }
  }
  return { path: '', rows: [] }
})

const columns = computed(() => {
  const rows = tableData.value.rows
  if (rows.length === 0) return []
  const colSet = new Set<string>()
  for (const row of rows.slice(0, 50)) {
    if (row && typeof row === 'object') {
      Object.keys(row as object).forEach(k => colSet.add(k))
    }
  }
  return [...colSet]
})

const filteredRows = computed(() => {
  let rows = tableData.value.rows as Record<string, unknown>[]
  if (props.searchTerm) {
    const term = props.searchTerm.toLowerCase()
    rows = rows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(term))
    )
  }
  if (sortCol.value) {
    const col = sortCol.value
    const asc = sortAsc.value
    rows = [...rows].sort((a, b) => {
      const va = a[col], vb = b[col]
      if (va === vb) return 0
      if (va === null || va === undefined) return 1
      if (vb === null || vb === undefined) return -1
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
      return asc ? cmp : -cmp
    })
  }
  return rows
})

const toggleSort = (col: string) => {
  if (sortCol.value === col) {
    sortAsc.value = !sortAsc.value
  } else {
    sortCol.value = col
    sortAsc.value = true
  }
}

const formatCell = (value: unknown): string => {
  if (value === null) return 'null'
  if (value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const isComplex = (value: unknown): boolean =>
  value !== null && typeof value === 'object'

const getCellClass = (value: unknown): string => {
  if (typeof value === 'number') return 'cell-number'
  if (typeof value === 'boolean') return 'cell-boolean'
  if (value === null) return 'cell-null'
  if (typeof value === 'object') return 'cell-object'
  return 'cell-string'
}

const toggleExpand = (rowIdx: number, col: string) => {
  const key = `${rowIdx}:${col}`
  expandedPath.value = expandedPath.value === key ? null : key
}

const copyPath = (rowIdx: number, col: string) => {
  const base = tableData.value.path ? `${tableData.value.path}[${rowIdx}]` : `[${rowIdx}]`
  emit('copyPath', `${base}.${col}`)
}
</script>

<template>
  <div class="table-view">
    <div v-if="tableData.path" class="table-info">
      Showing: <code>{{ tableData.path }}</code> ({{ tableData.rows.length }} rows)
    </div>
    <div v-if="columns.length === 0" class="table-empty">No tabular data found</div>
    <div v-else class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="row-num">#</th>
            <th v-for="col in columns" :key="col" @click="toggleSort(col)" class="sortable">
              {{ col }}
              <span v-if="sortCol === col" class="sort-icon">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in filteredRows" :key="idx">
            <td class="row-num">{{ idx }}</td>
            <td
              v-for="col in columns"
              :key="col"
              :class="getCellClass((row as any)[col])"
              @click="isComplex((row as any)[col]) ? toggleExpand(idx, col) : copyPath(idx, col)"
            >
              <template v-if="isComplex((row as any)[col]) && expandedPath === `${idx}:${col}`">
                <pre class="cell-expanded">{{ JSON.stringify((row as any)[col], null, 2) }}</pre>
              </template>
              <template v-else>
                {{ formatCell((row as any)[col]) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.table-info { padding: 4px 8px; font-size: 12px; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); flex-shrink: 0; code { color: var(--color-accent-light); } }
.table-empty { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px; }
.table-scroll { flex: 1; overflow: auto; }

table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 13px; }
thead { position: sticky; top: 0; z-index: 10; }
th {
  background: var(--color-bg-tertiary); color: var(--color-text-secondary);
  padding: 4px 8px; text-align: left; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
  border-bottom: 2px solid var(--color-border);
  &.sortable { cursor: pointer; user-select: none; &:hover { color: white; } }
  &.row-num { width: 40px; color: var(--color-text-muted); }
}
.sort-icon { font-size: 9px; margin-left: 4px; }

td {
  padding: 3px 8px; border-bottom: 1px solid rgba(51, 65, 85, 0.3);
  max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  cursor: pointer;
  &:hover { background: rgba(59, 130, 246, 0.05); }
  &.row-num { color: var(--color-text-muted); font-size: 11px; cursor: default; }
}

tr:hover td { background: rgba(59, 130, 246, 0.03); }

.cell-string { color: #34d399; }
.cell-number { color: #60a5fa; }
.cell-boolean { color: #a78bfa; }
.cell-null { color: var(--color-text-muted); font-style: italic; }
.cell-object { color: #fbbf24; cursor: pointer; }
.cell-expanded { white-space: pre-wrap; word-break: break-all; max-width: none; color: var(--color-text-primary); font-size: 12px; max-height: 200px; overflow: auto; }

@media (max-width: 640px) {
  table { font-size: 11px; }
  th { font-size: 9px; padding: 6px 8px; }
  td { padding: 4px 8px; &.row-num { font-size: 9px; } }
  .table-info { font-size: 10px; }
  .cell-expanded { font-size: 10px; }
}
</style>
