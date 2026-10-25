<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{ data: unknown; searchTerm?: string }>()
const emit = defineEmits<{ copyPath: [path: string] }>()

interface MNode {
  id: string; label: string; value: string; path: string
  x: number; y: number; depth: number; color: string
  children: MNode[]; collapsed: boolean; isLeaf: boolean
}

const BRANCH_COLORS = [
  '#3b82f6','#ef4444','#22c55e','#f59e0b','#a855f7',
  '#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'
]
const RADIUS_STEP = 180
const FIT_PAD = 60

const container = ref<HTMLDivElement | null>(null)
const pan = ref({ x: 0, y: 0 })
const scale = ref(1)
const nodes = ref<MNode[]>([])
const allNodes = computed(() => { const r: MNode[] = []; const walk = (n: MNode) => { r.push(n); if (!n.collapsed) n.children.forEach(walk) }; nodes.value.forEach(walk); return r })
const visibleNodes = computed(() => {
  if (!props.searchTerm) return allNodes.value
  const t = props.searchTerm.toLowerCase()
  return allNodes.value.filter(n => n.label.toLowerCase().includes(t) || n.value.toLowerCase().includes(t) || n.path.toLowerCase().includes(t))
})
const visibleIds = computed(() => new Set(visibleNodes.value.map(n => n.id)))
const edges = computed(() => {
  const r: { x1: number; y1: number; x2: number; y2: number; color: string }[] = []
  const walk = (n: MNode) => {
    if (!n.collapsed) n.children.forEach(c => {
      if (visibleIds.value.has(n.id) || visibleIds.value.has(c.id)) {
        r.push({ x1: n.x, y1: n.y, x2: c.x, y2: c.y, color: c.color })
      }
      walk(c)
    })
  }
  nodes.value.forEach(walk)
  return r
})

const buildTree = (val: unknown, path: string, label: string, depth: number, color: string): MNode => {
  const id = path || 'root'
  if (val === null || typeof val !== 'object') {
    return { id, label, value: val === null ? 'null' : String(val), path, x: 0, y: 0, depth, color, children: [], collapsed: false, isLeaf: true }
  }
  const entries = Object.entries(val as Record<string, unknown>)
  const children = entries.map(([k, v], i) => {
    const cPath = Array.isArray(val) ? `${path}[${k}]` : path ? `${path}.${k}` : k
    const cColor = depth === 0 ? BRANCH_COLORS[i % BRANCH_COLORS.length] : color
    return buildTree(v, cPath, k, depth + 1, cColor)
  })
  const vStr = Array.isArray(val) ? `[${entries.length}]` : `{${entries.length}}`
  return { id, label, value: vStr, path, x: 0, y: 0, depth, color, children, collapsed: false, isLeaf: false }
}

const countLeaves = (n: MNode): number => {
  if (n.isLeaf || n.collapsed || n.children.length === 0) return 1
  return n.children.reduce((s, c) => s + countLeaves(c), 0)
}

const layoutRadial = (root: MNode) => {
  root.x = 0; root.y = 0
  const place = (node: MNode, aStart: number, aEnd: number, radius: number) => {
    if (node.collapsed || node.children.length === 0) return
    const total = node.children.reduce((s, c) => s + countLeaves(c), 0)
    let cur = aStart
    for (const child of node.children) {
      const span = ((aEnd - aStart) * countLeaves(child)) / total
      const mid = cur + span / 2
      child.x = node.x + Math.cos(mid) * radius
      child.y = node.y + Math.sin(mid) * radius
      place(child, cur, cur + span, RADIUS_STEP)
      cur += span
    }
  }
  place(root, 0, Math.PI * 2, RADIUS_STEP)
}

const rebuild = () => {
  if (!props.data) return
  const root = buildTree(props.data, '', Array.isArray(props.data) ? 'root[]' : 'root', 0, BRANCH_COLORS[0])
  layoutRadial(root)
  nodes.value = [root]
  nextTick(fitToView)
}

watch(() => props.data, rebuild, { immediate: true })

const toggleNode = (n: MNode) => {
  n.collapsed = !n.collapsed
  // re-layout from root
  if (nodes.value[0]) { layoutRadial(nodes.value[0]); nodes.value = [...nodes.value] }
}

// --- Pan / Zoom (same pattern as GraphView) ---
const isDragging = ref(false)
const dragStart = { x: 0, y: 0 }; const panStart = { x: 0, y: 0 }

const fitToView = () => {
  const el = container.value; if (!el || allNodes.value.length === 0) return
  const r = el.getBoundingClientRect(); if (r.width === 0) return
  let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity
  for (const n of allNodes.value) { mnX = Math.min(mnX, n.x - 60); mnY = Math.min(mnY, n.y - 20); mxX = Math.max(mxX, n.x + 60); mxY = Math.max(mxY, n.y + 20) }
  const gw = mxX - mnX, gh = mxY - mnY; if (gw === 0 || gh === 0) return
  const s = Math.min((r.width - FIT_PAD * 2) / gw, (r.height - FIT_PAD * 2) / gh, 1.5)
  scale.value = Math.max(0.05, s)
  pan.value = { x: r.width / 2 - ((mnX + mxX) / 2) * scale.value, y: r.height / 2 - ((mnY + mxY) / 2) * scale.value }
}

const onMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return; e.preventDefault()
  isDragging.value = true; dragStart.x = e.clientX; dragStart.y = e.clientY
  panStart.x = pan.value.x; panStart.y = pan.value.y
}
const onMouseMove = (e: MouseEvent) => { if (!isDragging.value) return; pan.value = { x: panStart.x + e.clientX - dragStart.x, y: panStart.y + e.clientY - dragStart.y } }
const onMouseUp = () => { isDragging.value = false }

const onWheel = (e: WheelEvent) => {
  e.preventDefault(); const r = container.value?.getBoundingClientRect(); if (!r) return
  const mx = e.clientX - r.left, my = e.clientY - r.top
  const d = -e.deltaY * (e.ctrlKey ? 0.01 : 0.002)
  const ns = Math.min(Math.max(0.05, scale.value * (1 + d)), 5)
  const wx = (mx - pan.value.x) / scale.value, wy = (my - pan.value.y) / scale.value
  pan.value = { x: mx - wx * ns, y: my - wy * ns }; scale.value = ns
}

let lastPinchDist = 0; let touchPanning = false
const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) { touchPanning = true; dragStart.x = e.touches[0].clientX; dragStart.y = e.touches[0].clientY; panStart.x = pan.value.x; panStart.y = pan.value.y }
  else if (e.touches.length === 2) { touchPanning = false; lastPinchDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY) }
}
const onTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  if (e.touches.length === 1 && touchPanning) { pan.value = { x: panStart.x + e.touches[0].clientX - dragStart.x, y: panStart.y + e.touches[0].clientY - dragStart.y } }
  else if (e.touches.length === 2) {
    const d = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY)
    const r = container.value?.getBoundingClientRect(); if (!r) return
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top
    const ns = Math.min(Math.max(0.05, scale.value * (d / lastPinchDist)), 5)
    const wx = (cx - pan.value.x) / scale.value, wy = (cy - pan.value.y) / scale.value
    pan.value = { x: cx - wx * ns, y: cy - wy * ns }; scale.value = ns; lastPinchDist = d
  }
}
const onTouchEnd = () => { touchPanning = false }

const zoomBy = (f: number) => {
  const r = container.value?.getBoundingClientRect(); if (!r) return
  const cx = r.width / 2, cy = r.height / 2
  const ns = Math.min(Math.max(0.05, scale.value * f), 5)
  const wx = (cx - pan.value.x) / scale.value, wy = (cy - pan.value.y) / scale.value
  pan.value = { x: cx - wx * ns, y: cy - wy * ns }; scale.value = ns
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp)
  const el = container.value
  if (el) { el.addEventListener('wheel', onWheel, { passive: false }); el.addEventListener('touchstart', onTouchStart, { passive: false }); el.addEventListener('touchmove', onTouchMove, { passive: false }); el.addEventListener('touchend', onTouchEnd) }
  nextTick(fitToView)
})
onUnmounted(() => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) })

const txStyle = computed(() => ({ transform: `translate(${pan.value.x}px,${pan.value.y}px) scale(${scale.value})`, transformOrigin: '0 0' }))

const curvePath = (e: { x1: number; y1: number; x2: number; y2: number }) => {
  const mx = (e.x1 + e.x2) / 2, my = (e.y1 + e.y2) / 2
  return `M${e.x1},${e.y1} Q${mx},${e.y1} ${mx},${my} Q${mx},${e.y2} ${e.x2},${e.y2}`
}

// --- Depth-based collapse control ---
const getMaxNonLeafDepth = (): number => {
  let max = 0
  const walk = (n: MNode) => { if (!n.isLeaf) max = Math.max(max, n.depth); n.children.forEach(walk) }
  nodes.value.forEach(walk)
  return max
}

const currentMaxDepth = ref(Infinity)

const applyDepthCollapse = () => {
  const walk = (n: MNode) => {
    if (!n.isLeaf) n.collapsed = n.depth >= currentMaxDepth.value
    n.children.forEach(walk)
  }
  nodes.value.forEach(walk)
  if (nodes.value[0]) { layoutRadial(nodes.value[0]); nodes.value = [...nodes.value] }
}

const collapseOneLevel = () => {
  const mp = getMaxNonLeafDepth()
  if (currentMaxDepth.value > mp) currentMaxDepth.value = mp
  else if (currentMaxDepth.value > 0) currentMaxDepth.value--
  applyDepthCollapse()
}

const expandOneLevel = () => {
  if (currentMaxDepth.value === Infinity) return
  currentMaxDepth.value++
  if (currentMaxDepth.value > getMaxNonLeafDepth()) currentMaxDepth.value = Infinity
  applyDepthCollapse()
}

const expandAll = () => {
  currentMaxDepth.value = Infinity
  const walk = (n: MNode) => { n.collapsed = false; n.children.forEach(walk) }
  nodes.value.forEach(walk)
  if (nodes.value[0]) { layoutRadial(nodes.value[0]); nodes.value = [...nodes.value] }
  nextTick(fitToView)
}

defineExpose({ collapseOneLevel, expandOneLevel, expandAll })
</script>

<template>
  <div ref="container" :class="['mm-container', { grabbing: isDragging }]" @mousedown="onMouseDown">
    <div class="mm-controls">
      <button class="ctrl-btn" @click.stop="zoomBy(1.4)">+</button>
      <button class="ctrl-btn" @click.stop="zoomBy(0.6)">-</button>
      <button class="ctrl-btn" @click.stop="fitToView()">Fit</button>
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
    <div class="mm-layer" :style="txStyle">
      <svg class="mm-edges">
        <path v-for="(e, i) in edges" :key="i" :d="curvePath(e)" fill="none" :stroke="e.color" stroke-width="2" opacity="0.6"/>
      </svg>
      <div
        v-for="n in visibleNodes" :key="n.id"
        :class="['mm-node', { leaf: n.isLeaf, collapsed: n.collapsed, root: n.depth === 0 }]"
        :style="{ left: n.x + 'px', top: n.y + 'px', borderColor: n.color, '--branch': n.color }"
        @click.stop="n.isLeaf ? emit('copyPath', n.path) : toggleNode(n)"
      >
        <span class="mm-label">{{ n.label }}</span>
        <span v-if="n.isLeaf" class="mm-val">{{ n.value.length > 40 ? n.value.slice(0, 37) + '...' : n.value }}</span>
        <span v-else class="mm-badge">{{ n.value }}</span>
        <span v-if="!n.isLeaf" class="mm-toggle">{{ n.collapsed ? '+' : '-' }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mm-container { width: 100%; height: 100%; position: relative; overflow: hidden; cursor: grab; background: var(--color-bg-primary); touch-action: none; &.grabbing { cursor: grabbing; } }
.mm-controls { position: absolute; top: 8px; right: 8px; z-index: 50; display: flex; flex-direction: column; gap: 3px; }
.ctrl-btn { background: var(--color-bg-tertiary); border: 1px solid var(--color-border); color: white; min-width: 28px; height: 28px; padding: 0 6px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; &:hover,&:active { background: var(--color-border); } }
.ctrl-sep { height: 1px; background: var(--color-border); margin: 2px 0; }
.mm-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; will-change: transform; }
.mm-edges { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.mm-node {
  position: absolute; transform: translate(-50%, -50%); cursor: pointer;
  padding: 6px 12px; border-radius: 20px; border: 2px solid; white-space: nowrap;
  background: var(--color-bg-secondary); display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-text-secondary); transition: box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent; user-select: none;
  &:hover { box-shadow: 0 0 12px var(--branch); z-index: 10; }
  &.root { font-size: 14px; font-weight: 700; padding: 10px 18px; border-radius: 24px; background: var(--color-bg-tertiary); color: white; }
  &.leaf { border-style: dashed; opacity: 0.85; }
  &.collapsed { opacity: 0.7; border-style: dotted; }
}
.mm-label { font-weight: 600; color: var(--branch); max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
.mm-val { color: var(--color-text-muted); font-size: 11px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
.mm-badge { font-size: 10px; color: var(--color-text-muted); background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 8px; }
.mm-toggle { font-size: 10px; font-weight: 700; color: var(--color-text-muted); margin-left: 2px; }
</style>
