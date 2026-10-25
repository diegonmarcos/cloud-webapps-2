<script setup lang="ts">
import { computed } from 'vue'
import type { GraphNode, GraphEdge, LayoutMode } from '@/types/json'

const props = defineProps<{ edge: GraphEdge; nodes: GraphNode[]; layout: LayoutMode }>()

const pathData = computed(() => {
  const source = props.nodes.find(n => n.id === props.edge.from)
  const target = props.nodes.find(n => n.id === props.edge.to)
  if (!source || !target) return { d: '', labelX: 0, labelY: 0 }

  let sX, sY, eX, eY, c1x, c1y, c2x, c2y
  if (props.layout === 'vertical') {
    sX = source.x + 320; sY = source.y + 28; eX = target.x; eY = target.y + 28
    c1x = sX + (eX - sX) / 2; c1y = sY; c2x = eX - (eX - sX) / 2; c2y = eY
  } else {
    sX = source.x + 160; sY = source.y + 60; eX = target.x + 160; eY = target.y
    c1x = sX; c1y = sY + (eY - sY) / 2; c2x = eX; c2y = eY - (eY - sY) / 2
  }
  return { d: `M ${sX} ${sY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${eX} ${eY}`, labelX: (sX + eX) / 2, labelY: (sY + eY) / 2 }
})
</script>

<template>
  <g>
    <path :d="pathData.d" fill="none" stroke="#334155" stroke-width="3" opacity="0.5"/>
    <rect :x="pathData.labelX - (edge.label.length * 4 + 12)" :y="pathData.labelY - 12" :width="edge.label.length * 8 + 24" height="24" rx="6" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <text :x="pathData.labelX" :y="pathData.labelY + 5" fill="#94a3b8" text-anchor="middle" font-size="12" font-family="monospace" font-weight="500">{{ edge.label }}</text>
  </g>
</template>
