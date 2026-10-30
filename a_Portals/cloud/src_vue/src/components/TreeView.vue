<script setup lang="ts">
import { ref } from 'vue'
import SvgIcon from './SvgIcon.vue'
import type { TreeService } from '../lib/types'

const props = defineProps<{ treeServices: TreeService[] }>()

const expandedNodes = ref<Set<string>>(new Set())

const toggleExpand = (nodeId: string) => {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

const isExpanded = (nodeId: string) => expandedNodes.value.has(nodeId)

const emit = defineEmits<{
  (e: 'service-click', service: TreeService): void
}>()

const handleServiceClick = (service: TreeService) => {
  if (service.clickable) {
    emit('service-click', service)
  }
}

const expandAll = () => {
  expandedNodes.value = new Set(getAllNodeIds(props.treeServices))
}

const collapseAll = () => {
  expandedNodes.value = new Set()
}

// Helper to get all node IDs for expand/collapse all functionality
function getAllNodeIds(nodes: TreeService[]): string[] {
  let ids: string[] = []
  nodes.forEach(node => {
    ids.push(node.id)
    if (node.children) {
      ids = ids.concat(getAllNodeIds(node.children))
    }
    if (node.siblings) {
      node.siblings.forEach(siblingColumn => {
        ids = ids.concat(getAllNodeIds(siblingColumn))
      })
    }
  })
  return ids
}

</script>

<template>
  <div class="tree-view">
    <div class="tree-controls">
      <button class="tree-ctrl-btn" @click="expandAll">
        <SvgIcon path="M6 9l6 6 6-6" class="icon" />
        Expand All
      </button>
      <button class="tree-ctrl-btn" @click="collapseAll">
        <SvgIcon path="M18 15l-6-6-6 6" class="icon" />
        Collapse All
      </button>
    </div>
    <div class="tree-container">

      <template v-for="section in treeServices" :key="section.id">
        <div class="tree-section-divider">
          <span class="divider-label">{{ section.label }}</span>
        </div>

        <div class="tree-vps">
          <div :class="['tree-node', 'vps-node', { 'is-expanded': isExpanded(section.id) }]">
            <div class="node-header" @click="toggleExpand(section.id)">
              <span :class="['expand-icon', { 'expanded': isExpanded(section.id) }]">▶</span>
              <span class="node-icon">{{ section.icon }}</span>
              <span class="node-title">{{ section.title }}</span>
              <span v-if="section.config" class="node-config">{{ section.config }}</span>
              <span :class="['node-badge', section.status]" v-if="section.status">{{ section.status }}</span>
            </div>
          </div>
          <div v-if="isExpanded(section.id)" class="tree-children expanded">
            <div class="tree-siblings">
              <template v-for="siblingColumn in section.siblings" :key="siblingColumn[0].id">
                <div class="tree-sibling-column">
                  <template v-for="node in siblingColumn" :key="node.id">
                    <div :class="['tree-node', node.type + '-node', { 'is-expanded': isExpanded(node.id) }]">
                      <div class="node-header" @click="toggleExpand(node.id)">
                        <span :class="['expand-icon', { 'expanded': isExpanded(node.id) }]">▶</span>
                        <span class="node-icon">{{ node.icon }}</span>
                        <span class="node-title">{{ node.title }}</span>
                        <span v-if="node.config" class="node-config">{{ node.config }}</span>
                        <span v-if="node.subtitle" class="node-subtitle">{{ node.subtitle }}</span>
                        <span v-if="node.port" class="node-port">{{ node.port }}</span>
                        <span :class="['node-badge', node.status]" v-if="node.status">{{ node.status }}</span>
                      </div>
                    </div>
                    <div v-if="isExpanded(node.id)" class="tree-children expanded">
                      <template v-for="child in node.children" :key="child.id">
                        <div :class="['tree-node', child.type + '-node', {'clickable': child.clickable}]" @click="handleServiceClick(child)">
                          <div class="node-header">
                            <span v-if="child.children" :class="['expand-icon', { 'expanded': isExpanded(child.id) }]">▶</span>
                            <span class="node-icon">{{ child.icon }}</span>
                            <span class="node-title">{{ child.title }}</span>
                            <span v-if="child.port" class="node-port">{{ child.port }}</span>
                            <span :class="['node-badge', child.status]" v-if="child.status">{{ child.status }}</span>
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tree-view {
  max-width: 72rem;
  margin: 0 auto;
  padding-top: 2rem;
  animation: fadeInDown 0.5s ease-out;
}

.tree-controls {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tree-ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.tree-ctrl-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.tree-ctrl-btn .icon {
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.tree-section-divider {
  text-align: center;
  margin: 2.5rem 0 1.5rem;
  position: relative;
}

.tree-section-divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--border-color);
  z-index: 0;
}

.divider-label {
  background: var(--bg-primary);
  padding: 0 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tree-vps {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 1rem;
  background: var(--bg-card);
}

.tree-node {
  cursor: pointer;
  user-select: none;
  margin-left: 1rem;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.expand-icon {
  transition: transform var(--transition-speed) ease;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.node-icon {
  font-size: 1.2rem;
}

.node-title {
  font-weight: 600;
  color: var(--text-primary);
}

.node-config, .node-subtitle, .node-port {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.node-badge {
  padding: 0.2em 0.6em;
  border-radius: 0.5em;
  font-size: 0.7em;
  font-weight: bold;
  text-transform: uppercase;
  margin-left: auto;
}

.node-badge.online {
  background-color: var(--accent-green);
  color: black;
}

.node-badge.pending {
  background-color: var(--accent-yellow);
  color: black;
}

.node-badge.active {
  background-color: var(--accent-blue);
  color: black;
}

.tree-children {
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px dashed var(--border-color);
}

.tree-siblings {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.tree-sibling-column {
  flex: 1;
  min-width: 250px; /* Adjust as needed */
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.service-node.clickable {
  cursor: pointer;
}

.service-node.clickable:hover .node-title {
  color: var(--accent-primary);
}
</style>
