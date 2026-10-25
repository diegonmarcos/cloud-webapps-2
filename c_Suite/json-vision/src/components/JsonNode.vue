<script setup lang="ts">
import { ref, computed, inject, watch, type Ref } from 'vue'

const props = defineProps<{
  itemKey?: string | number
  value: unknown
  isLast?: boolean
  path?: string
  searchTerm?: string
  depth?: number
}>()

const emit = defineEmits<{
  copyPath: [path: string]
  edit: [path: string, key: string, value: unknown]
}>()

const collapseSignal = inject<Ref<{ maxDepth: number; version: number }>>('collapseSignal', ref({ maxDepth: Infinity, version: 0 }))
const isExpanded = ref((props.depth ?? 0) < collapseSignal.value.maxDepth)
watch(() => collapseSignal.value.version, () => {
  isExpanded.value = (props.depth ?? 0) < collapseSignal.value.maxDepth
})
const isObject = computed(() => props.value !== null && typeof props.value === 'object' && !Array.isArray(props.value))
const isArray = computed(() => Array.isArray(props.value))
const isPrimitive = computed(() => !isObject.value && !isArray.value)

const matchesSearch = computed(() => {
  if (!props.searchTerm) return true
  const term = props.searchTerm.toLowerCase()
  const check = (key: string | number | undefined, val: unknown): boolean => {
    if (key !== undefined && String(key).toLowerCase().includes(term)) return true
    if (val === null || typeof val !== 'object') return String(val).toLowerCase().includes(term)
    return Object.entries(val as Record<string, unknown>).some(([k, v]) => check(k, v))
  }
  return check(props.itemKey, props.value)
})

const currentPath = computed(() => {
  if (!props.path) return String(props.itemKey ?? '')
  return Number.isInteger(props.itemKey)
    ? `${props.path}[${props.itemKey}]`
    : `${props.path}.${props.itemKey}`
})

const keys = computed(() => (isObject.value || isArray.value) ? Object.keys(props.value as object) : [])
const brackets = computed(() => isArray.value ? ['[', ']'] : ['{', '}'])

const getValueClass = (v: unknown) => {
  if (typeof v === 'number') return 'val-number'
  if (typeof v === 'boolean') return 'val-boolean'
  if (v === null) return 'val-null'
  return 'val-string'
}

const formatValue = (v: unknown) => {
  if (v === null) return 'null'
  if (typeof v === 'string') return `"${v}"`
  return String(v)
}
</script>

<template>
  <template v-if="matchesSearch">
  <div v-if="isPrimitive" class="tree-row" @click="emit('copyPath', currentPath)">
    <span v-if="itemKey !== undefined" class="tree-key">{{ itemKey }}:</span>
    <span :class="['tree-value', getValueClass(value)]">{{ formatValue(value) }}</span>
    <span v-if="!isLast" class="comma">,</span>
  </div>
  <div v-else class="tree-node">
    <div class="tree-row" @click="isExpanded = !isExpanded">
      <button class="toggle-btn">{{ isExpanded ? '▼' : '▶' }}</button>
      <span v-if="itemKey !== undefined" class="tree-key">{{ itemKey }}:</span>
      <span class="bracket">{{ brackets[0] }}</span>
      <span v-if="!isExpanded" class="collapsed-hint">{{ isArray ? keys.length + ' items' : keys.length + ' keys' }}</span>
      <template v-if="!isExpanded">
        <span class="bracket">{{ brackets[1] }}</span>
        <span v-if="!isLast" class="comma">,</span>
      </template>
    </div>
    <div v-if="isExpanded" class="tree-children">
      <JsonNode
        v-for="(k, idx) in keys"
        :key="k"
        :item-key="isArray ? parseInt(k) : k"
        :value="(value as any)[k]"
        :is-last="idx === keys.length - 1"
        :path="currentPath"
        :depth="(depth ?? 0) + 1"
        :search-term="searchTerm"
        @copy-path="emit('copyPath', $event)"
        @edit="(a: string, b: string, c: unknown) => emit('edit', a, b, c)"
      />
    </div>
    <div v-if="isExpanded" class="tree-row">
      <span class="bracket">{{ brackets[1] }}</span>
      <span v-if="!isLast" class="comma">,</span>
    </div>
  </div>
  </template>
</template>
