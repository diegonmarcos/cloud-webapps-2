<script setup lang="ts">
import { ref } from 'vue'
import type { GraphNode } from '@/types/json'

const props = defineProps<{ node: GraphNode; collapsed?: boolean; childCount?: number }>()
const emit = defineEmits<{ copyPath: [path: string]; edit: [data: { path: string; key: string; value: unknown }]; toggleCollapse: [] }>()

const editingKey = ref<string | null>(null)
const editValue = ref('')

const startEdit = (key: string, value: unknown) => {
  editingKey.value = key
  editValue.value = String(value === null ? 'null' : value)
}

const commitEdit = (key: string) => {
  let finalVal: unknown = editValue.value
  if (editValue.value === 'true') finalVal = true
  else if (editValue.value === 'false') finalVal = false
  else if (editValue.value === 'null') finalVal = null
  else if (!isNaN(Number(editValue.value)) && editValue.value.trim() !== '') finalVal = Number(editValue.value)
  emit('edit', { path: props.node.path, key, value: finalVal })
  editingKey.value = null
}

const getValueClass = (value: unknown) => {
  if (typeof value === 'number') return 'value-number'
  if (typeof value === 'boolean') return 'value-boolean'
  if (value === null) return 'value-null'
  return 'value-string'
}
</script>

<template>
  <div class="graph-node" :class="node.type" :style="{ left: `${node.x}px`, top: `${node.y}px` }" @click.stop="emit('copyPath', node.path)">
    <div class="node-header">
      <div class="node-label">
        <button v-if="childCount" class="collapse-toggle" @click.stop="emit('toggleCollapse')" @mousedown.stop>
          {{ collapsed ? '▶' : '▼' }}
        </button>
        <svg v-if="node.type === 'array'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="14"/><path d="M5 19a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/></svg>
        <span>{{ node.label }}</span>
        <span v-if="collapsed" class="collapsed-badge">{{ childCount }} hidden</span>
      </div>
      <div class="node-hint">Copy Path</div>
    </div>
    <div class="node-body">
      <div v-if="Object.keys(node.data).length === 0" class="empty-hint">Contains objects...</div>
      <div v-for="(value, key) in node.data" :key="key" class="data-row">
        <span class="data-key">{{ key }}:</span>
        <input v-if="editingKey === key" v-model="editValue" class="edit-input" @blur="commitEdit(String(key))" @keydown.enter="commitEdit(String(key))" @mousedown.stop autofocus/>
        <span v-else :class="['data-value', getValueClass(value)]" @click.stop="startEdit(String(key), value)">{{ value === null ? 'null' : value }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.graph-node { position: absolute; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 8px; width: 320px; overflow: hidden; cursor: grab; z-index: 10; &:hover { border-color: rgba(59, 130, 246, 0.5); } &.array .node-header { background: rgba(126, 34, 206, 0.3); color: #c4b5fd; } &.object .node-header { background: rgba(30, 64, 175, 0.3); color: #93c5fd; } }
.node-header { padding: 12px 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center; }
.node-label { display: flex; align-items: center; gap: 6px; overflow: hidden; span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; } }
.collapse-toggle { background: none; border: none; color: inherit; cursor: pointer; font-size: 10px; padding: 2px 4px; border-radius: 3px; opacity: 0.7; &:hover { opacity: 1; background: rgba(255,255,255,0.1); } }
.collapsed-badge { font-size: 9px; font-weight: 400; opacity: 0.6; background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 8px; flex-shrink: 0; }
.node-hint { opacity: 0; font-size: 10px; background: var(--color-bg-primary); padding: 2px 4px; border-radius: 4px; color: var(--color-text-muted); transition: opacity 0.2s; .graph-node:hover & { opacity: 1; } }
.node-body { padding: 12px; }
.empty-hint { color: var(--color-text-muted); font-size: 14px; font-style: italic; padding: 4px; }
.data-row { display: flex; align-items: center; font-family: var(--font-mono); font-size: 14px; padding: 6px 4px; border-bottom: 1px solid rgba(51, 65, 85, 0.5); &:last-child { border-bottom: none; } }
.data-key { color: var(--color-text-muted); margin-right: 8px; flex-shrink: 0; }
.data-value { flex: 1; min-width: 0; word-break: break-all; cursor: text; padding: 2px 4px; margin: -2px -4px; border-radius: 4px; &:hover { background: rgba(59, 130, 246, 0.1); } }
.value-string { color: #34d399; }
.value-number { color: #60a5fa; }
.value-boolean { color: #a78bfa; }
.value-null { color: var(--color-text-muted); }
.edit-input { background: transparent; border: none; outline: none; color: inherit; font-family: inherit; font-size: inherit; flex: 1; min-width: 20px; padding: 2px 4px; margin: -2px -4px; border-radius: 4px; box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5); }
</style>
