<script setup lang="ts">
import { ref } from 'vue'
import type { Service } from '../lib/types'
import { icons } from '../lib/services'
import SvgIcon from './SvgIcon.vue'

const props = defineProps<{
  service: Service
}>()

const emit = defineEmits<{
  click: []
  copy: [text: string, label: string]
  openUrl: [url: string]
}>()

const cardRef = ref<HTMLDivElement>()

function handleMouseMove(e: MouseEvent) {
  if (!cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = (y - centerY) / 10
  const rotateY = (centerX - x) / 10
  cardRef.value.style.setProperty('--rotateX', `${rotateX}deg`)
  cardRef.value.style.setProperty('--rotateY', `${rotateY}deg`)
}

function handleMouseLeave() {
  if (!cardRef.value) return
  cardRef.value.style.setProperty('--rotateX', '0deg')
  cardRef.value.style.setProperty('--rotateY', '0deg')
}

const isVPS = props.service.id.startsWith('vps-')
const isVM = props.service.id.startsWith('vm-')

const statusClass = {
  online: 'status-online',
  pending: 'status-pending',
  offline: 'status-offline',
}[props.service.status]

const statusLabel = {
  online: 'Online',
  pending: props.service.id.includes('vps') ? 'Always Free' : 'Pending',
  offline: 'Offline',
}[props.service.status]
</script>

<template>
  <div
    ref="cardRef"
    class="card"
    @click="emit('click')"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <!-- Icon -->
    <div class="card-icon">
      <SvgIcon :path="service.icon" />
    </div>

    <!-- Title & Description -->
    <h3 class="card-title">{{ service.name }}</h3>
    <p class="card-description">{{ service.description }}</p>

    <!-- CLI Commands for VPS -->
    <div v-if="isVPS && service.cliConnect" class="command-box">
      <code>{{ service.cliConnect }}</code>
      <button
        @click.stop="emit('copy', service.cliConnect!, 'CLI command')"
        class="icon-btn"
        title="Copy command"
      >
        <SvgIcon :path="icons.copy" />
      </button>
      <button
        v-if="service.cliInstall"
        @click.stop="emit('copy', service.cliInstall!, 'CLI install')"
        class="icon-btn"
        title="Copy install command"
      >
        <SvgIcon :path="icons.download" />
      </button>
    </div>

    <!-- SSH Command for VMs -->
    <div v-if="isVM && service.sshCommand" class="command-box">
      <code>{{ service.sshCommand }}</code>
      <button
        @click.stop="emit('copy', service.sshCommand!, 'SSH command')"
        class="icon-btn"
        title="Copy SSH command"
      >
        <SvgIcon :path="icons.copy" />
      </button>
    </div>

    <!-- VM Quick Actions -->
    <div v-if="isVM && (service.proxyUrl || service.firewallUrl)" class="quick-actions">
      <button
        v-if="service.proxyUrl"
        @click.stop="emit('openUrl', service.proxyUrl!)"
        class="action-btn"
      >
        <SvgIcon :path="icons.proxy" />
        Proxy
      </button>
      <button
        v-if="service.firewallUrl"
        @click.stop="emit('openUrl', service.firewallUrl!)"
        class="action-btn"
      >
        <SvgIcon :path="icons.firewall" />
        Firewall
      </button>
    </div>

    <!-- Status Badge -->
    <div :class="['status-badge', statusClass]">
      {{ statusLabel }}
    </div>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  padding: var(--card-padding);
  cursor: pointer;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
  transform-style: preserve-3d;
  transform: perspective(1000px) rotateX(var(--rotateX, 0deg)) rotateY(var(--rotateY, 0deg));
  animation: fadeIn 0.5s ease-out;
}

.card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-highlight);
  box-shadow: 0 0 20px var(--glow);
}

.card-icon {
  margin-bottom: 0.75rem;
  color: var(--accent-primary);
}

.card-icon svg {
  width: 2rem;
  height: 2rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.card-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.command-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.command-box code {
  flex: 1;
  font-size: 0.75rem;
  color: var(--accent-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-btn {
  padding: 0.25rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--transition-speed);
}

.icon-btn:hover {
  color: var(--accent-primary);
}

.icon-btn svg {
  width: 1rem;
  height: 1rem;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.action-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.action-btn svg {
  width: 0.75rem;
  height: 0.75rem;
}

.status-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 9999px;
}

.status-online {
  background: rgba(0, 255, 136, 0.2);
  color: var(--accent-green);
}

.status-pending {
  background: rgba(255, 204, 0, 0.2);
  color: var(--accent-yellow);
}

.status-offline {
  background: rgba(255, 68, 68, 0.2);
  color: var(--accent-red);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
