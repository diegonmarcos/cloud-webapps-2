<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { GraphNode, GraphEdge, LayoutMode } from '@/types/json'
import { processGraph } from '@/composables/useGraph'
import GraphNodeCard from './GraphNodeCard.vue'
import GraphEdgeLine from './GraphEdgeLine.vue'

const props = defineProps<{
  data: unknown
  layoutMode: LayoutMode
}>()

const emit = defineEmits<{
  copyPath: [path: string]
  edit: [path: string, key: string, value: unknown]
  'update:layoutMode': [value: LayoutMode]
}>()

const NODE_WIDTH = 320
const NODE_HEIGHT_EST = 120
const FIT_PADDING = 40

const graphNodes = ref<GraphNode[]>([])
const graphEdges = ref<GraphEdge[]>([])
const collapsedNodes = ref(new Set<string>())
const pan = ref({ x: 0, y: 0 })
const scale = ref(1)
const isDraggingCanvas = ref(false)
const draggedNodeId = ref<string | null>(null)
const graphContainer = ref<HTMLDivElement | null>(null)

// Build children map from edges, then find all descendants of collapsed nodes
const hiddenNodeIds = computed(() => {
  const childrenOf = new Map<string, string[]>()
  for (const e of graphEdges.value) {
    if (!childrenOf.has(e.from)) childrenOf.set(e.from, [])
    childrenOf.get(e.from)!.push(e.to)
  }
  const hidden = new Set<string>()
  const hide = (id: string) => {
    for (const child of childrenOf.get(id) || []) {
      hidden.add(child)
      hide(child)
    }
  }
  for (const id of collapsedNodes.value) hide(id)
  return hidden
})

const visibleNodes = computed(() => graphNodes.value.filter(n => !hiddenNodeIds.value.has(n.id)))
const visibleEdges = computed(() => graphEdges.value.filter(e => !hiddenNodeIds.value.has(e.from) && !hiddenNodeIds.value.has(e.to)))

const childCount = (nodeId: string) => graphEdges.value.filter(e => e.from === nodeId).length

const toggleCollapse = (nodeId: string) => {
  const s = new Set(collapsedNodes.value)
  if (s.has(nodeId)) s.delete(nodeId)
  else s.add(nodeId)
  collapsedNodes.value = s
}

const dragStart = { x: 0, y: 0 }
const itemStart = { x: 0, y: 0 }

// Auto-fit: compute bounding box and set scale/pan to fit all nodes in viewport
const fitToView = () => {
  const container = graphContainer.value
  if (!container || graphNodes.value.length === 0) return

  const rect = container.getBoundingClientRect()
  const cw = rect.width
  const ch = rect.height
  if (cw === 0 || ch === 0) return

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of graphNodes.value) {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + NODE_WIDTH)
    maxY = Math.max(maxY, node.y + NODE_HEIGHT_EST)
  }

  const graphW = maxX - minX
  const graphH = maxY - minY
  if (graphW === 0 || graphH === 0) return

  const scaleX = (cw - FIT_PADDING * 2) / graphW
  const scaleY = (ch - FIT_PADDING * 2) / graphH
  const newScale = Math.min(scaleX, scaleY, 1.5) // don't over-zoom

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  scale.value = Math.max(0.05, newScale)
  pan.value = {
    x: cw / 2 - centerX * scale.value,
    y: ch / 2 - centerY * scale.value
  }
}

watch([() => props.data, () => props.layoutMode], () => {
  if (props.data && !draggedNodeId.value) {
    const { nodes, edges } = processGraph(props.data, props.layoutMode)
    graphNodes.value = nodes
    graphEdges.value = edges
    nextTick(fitToView)
  }
}, { immediate: true })

// Mouse drag — canvas pan or node drag
const handleMouseDown = (e: MouseEvent, nodeId: string | null = null) => {
  if (e.button !== 0) return
  e.preventDefault()
  dragStart.x = e.clientX
  dragStart.y = e.clientY

  if (nodeId) {
    draggedNodeId.value = nodeId
    const node = graphNodes.value.find(n => n.id === nodeId)
    if (node) {
      itemStart.x = node.x
      itemStart.y = node.y
    }
  } else {
    isDraggingCanvas.value = true
    itemStart.x = pan.value.x
    itemStart.y = pan.value.y
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (isDraggingCanvas.value) {
    pan.value = { x: itemStart.x + (e.clientX - dragStart.x), y: itemStart.y + (e.clientY - dragStart.y) }
  } else if (draggedNodeId.value) {
    const dx = (e.clientX - dragStart.x) / scale.value
    const dy = (e.clientY - dragStart.y) / scale.value
    graphNodes.value = graphNodes.value.map(n =>
      n.id === draggedNodeId.value ? { ...n, x: itemStart.x + dx, y: itemStart.y + dy } : n
    )
  }
}

const handleMouseUp = () => {
  isDraggingCanvas.value = false
  draggedNodeId.value = null
}

// Wheel zoom — no Ctrl required, zooms toward cursor
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const rect = graphContainer.value?.getBoundingClientRect()
  if (!rect) return

  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  // Pinch gesture (ctrlKey set by trackpad pinch) or regular scroll = zoom
  const delta = -e.deltaY * (e.ctrlKey ? 0.01 : 0.002)
  const newScale = Math.min(Math.max(0.05, scale.value * (1 + delta)), 5)

  // Zoom toward cursor position
  const worldX = (mouseX - pan.value.x) / scale.value
  const worldY = (mouseY - pan.value.y) / scale.value
  pan.value = { x: mouseX - worldX * newScale, y: mouseY - worldY * newScale }
  scale.value = newScale
}

// Touch support — pinch to zoom, single finger to pan
let lastTouches: Touch[] = []
let lastPinchDist = 0
let touchPanning = false

const getTouchDist = (t1: Touch, t2: Touch) =>
  Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)

const getTouchCenter = (t1: Touch, t2: Touch) => ({
  x: (t1.clientX + t2.clientX) / 2,
  y: (t1.clientY + t2.clientY) / 2,
})

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    touchPanning = true
    dragStart.x = e.touches[0].clientX
    dragStart.y = e.touches[0].clientY
    itemStart.x = pan.value.x
    itemStart.y = pan.value.y
  } else if (e.touches.length === 2) {
    touchPanning = false
    lastTouches = [e.touches[0], e.touches[1]]
    lastPinchDist = getTouchDist(e.touches[0], e.touches[1])
  }
}

const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  if (e.touches.length === 1 && touchPanning) {
    pan.value = {
      x: itemStart.x + (e.touches[0].clientX - dragStart.x),
      y: itemStart.y + (e.touches[0].clientY - dragStart.y),
    }
  } else if (e.touches.length === 2) {
    const dist = getTouchDist(e.touches[0], e.touches[1])
    const center = getTouchCenter(e.touches[0], e.touches[1])
    const rect = graphContainer.value?.getBoundingClientRect()
    if (!rect) return

    const ratio = dist / lastPinchDist
    const newScale = Math.min(Math.max(0.05, scale.value * ratio), 5)

    const cx = center.x - rect.left
    const cy = center.y - rect.top
    const worldX = (cx - pan.value.x) / scale.value
    const worldY = (cy - pan.value.y) / scale.value
    pan.value = { x: cx - worldX * newScale, y: cy - worldY * newScale }
    scale.value = newScale

    lastPinchDist = dist
    lastTouches = [e.touches[0], e.touches[1]]
  }
}

const handleTouchEnd = () => {
  touchPanning = false
  lastPinchDist = 0
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  const el = graphContainer.value
  if (el) {
    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
  }
  nextTick(fitToView)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})

// Zoom toward viewport center (for +/- buttons)
const zoomBy = (factor: number) => {
  const rect = graphContainer.value?.getBoundingClientRect()
  if (!rect) { scale.value = Math.min(Math.max(0.05, scale.value * factor), 5); return }
  const cx = rect.width / 2
  const cy = rect.height / 2
  const newScale = Math.min(Math.max(0.05, scale.value * factor), 5)
  const worldX = (cx - pan.value.x) / scale.value
  const worldY = (cy - pan.value.y) / scale.value
  pan.value = { x: cx - worldX * newScale, y: cy - worldY * newScale }
  scale.value = newScale
}

const transformStyle = computed(() => ({
  transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${scale.value})`,
  transformOrigin: '0 0'
}))

// --- Depth-based collapse control ---
const currentMaxDepth = ref(Infinity)

const getMaxNodeDepth = () => {
  let max = 0
  for (const n of graphNodes.value) max = Math.max(max, n.depth)
  return max
}

const applyDepthCollapse = () => {
  const s = new Set<string>()
  for (const n of graphNodes.value) {
    if (n.depth >= currentMaxDepth.value) s.add(n.id)
  }
  collapsedNodes.value = s
}

const collapseOneLevel = () => {
  const mp = getMaxNodeDepth()
  if (currentMaxDepth.value > mp) currentMaxDepth.value = mp
  else if (currentMaxDepth.value > 0) currentMaxDepth.value--
  applyDepthCollapse()
}

const expandOneLevel = () => {
  if (currentMaxDepth.value === Infinity) return
  currentMaxDepth.value++
  if (currentMaxDepth.value > getMaxNodeDepth()) currentMaxDepth.value = Infinity
  applyDepthCollapse()
}

const expandAll = () => {
  currentMaxDepth.value = Infinity
  collapsedNodes.value = new Set()
}

defineExpose({ collapseOneLevel, expandOneLevel, expandAll })
</script>

<template>
  <div ref="graphContainer" :class="['graph-container', { grabbing: isDraggingCanvas }]" @mousedown="handleMouseDown($event, null)">
    <div class="graph-controls">
      <button class="ctrl-btn" @click.stop="zoomBy(1.4)">+</button>
      <button class="ctrl-btn" @click.stop="zoomBy(0.6)">-</button>
      <button class="ctrl-btn" @click.stop="fitToView()">Fit</button>
      <button class="ctrl-btn" @click.stop="emit('update:layoutMode', layoutMode === 'vertical' ? 'horizontal' : 'vertical')">
        {{ layoutMode === 'vertical' ? 'H' : 'V' }}
      </button>
      <div class="ctrl-sep"></div>
      <button class="ctrl-btn" @click.stop="collapseOneLevel" title="Collapse one level">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 14l-5-5-5 5"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
      </button>
      <button class="ctrl-btn" @click.stop="expandOneLevel" title="Expand one level">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10l5 5 5-5"/><line x1="4" y1="4" x2="20" y2="4"/></svg>
      </button>
      <button class="ctrl-btn" @click.stop="expandAll" title="Expand all">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 8l5 5 5-5"/><path d="M7 14l5 5 5-5"/></svg>
      </button>
    </div>
    <div class="transform-layer" :style="transformStyle">
      <svg class="edges-svg">
        <GraphEdgeLine v-for="(edge, idx) in visibleEdges" :key="idx" :edge="edge" :nodes="graphNodes" :layout="layoutMode"/>
      </svg>
      <GraphNodeCard
        v-for="node in visibleNodes" :key="node.id" :node="node"
        :collapsed="collapsedNodes.has(node.id)"
        :child-count="childCount(node.id)"
        @copy-path="emit('copyPath', $event)"
        @mousedown="handleMouseDown($event, node.id)"
        @edit="emit('edit', $event.path, $event.key, $event.value)"
        @toggle-collapse="toggleCollapse(node.id)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.graph-container { width: 100%; height: 100%; position: relative; overflow: hidden; cursor: grab; background: var(--color-bg-primary); touch-action: none; &.grabbing { cursor: grabbing; } }
.graph-controls { position: absolute; top: 8px; right: 8px; z-index: 50; display: flex; flex-direction: column; gap: 3px; }
.ctrl-btn { background: var(--color-bg-tertiary); border: 1px solid var(--color-border); color: white; min-width: 28px; height: 28px; padding: 0 6px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; &:hover, &:active { background: var(--color-border); } }
.ctrl-sep { height: 1px; background: var(--color-border); margin: 2px 0; }
.transform-layer { width: 100%; height: 100%; position: absolute; top: 0; left: 0; will-change: transform; }
.edges-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
</style>
