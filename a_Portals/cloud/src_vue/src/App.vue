<script setup lang="ts">
import { ref } from 'vue'
import type { ViewType, Service, TreeService } from './lib/types'
import { useFleet } from './lib/useFleet'
import ThemeToggle from './components/ThemeToggle.vue'
import ViewToggle from './components/ViewToggle.vue'
import CardGrid from './components/CardGrid.vue'
import TreeView from './components/TreeView.vue'
import AppNotification from './components/AppNotification.vue'

const activeView = ref<ViewType>('cards')
const notification = ref<string | null>(null)
const { serviceSections, treeServices, load } = useFleet()
load()

function showNotification(message: string) {
  notification.value = message
}

function clearNotification() {
  notification.value = null
}

async function handleCopy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    showNotification(`${label} copied!`)
  } catch {
    showNotification('Failed to copy')
  }
}

function handleOpenUrl(url: string) {
  window.open(url, '_blank')
}

function handleServiceClick(service: Service) {
  if (service.url === '#pending') {
    showNotification('This service is under development.')
    return
  }

  if (service.url.startsWith('ssh://')) {
    if (service.sshCommand) {
      handleCopy(service.sshCommand, 'SSH command')
    }
    return
  }

  if (service.id.startsWith('vps-')) {
    window.open(service.url, '_blank')
    return
  }

  if (service.url.startsWith('http')) {
    window.open(service.url, '_blank')
  }
}

function handleTreeServiceClick(service: TreeService) {
  if (service.url === '#pending') {
    showNotification('This service is under development.')
    return
  }

  if (service.url && service.url.startsWith('ssh://')) {
    if (service.sshCommand) {
      handleCopy(service.sshCommand, 'SSH command')
    }
    return
  }

  if (service.url && (service.type === 'vps' || service.type === 'vm')) {
    window.open(service.url, '_blank')
    return
  }

  if (service.url && service.url.startsWith('http')) {
    window.open(service.url, '_blank')
  }
}
</script>

<template>
  <main class="min-h-screen py-8 px-4">
    <ThemeToggle />

    <!-- Header -->
    <header class="header">
      <h1 class="title">Cloud Services Dashboard</h1>
      <p class="subtitle">Manage your infrastructure</p>
      <ViewToggle v-model="activeView" />
    </header>

    <!-- Content -->
    <div class="content">
      <CardGrid
        v-if="activeView === 'cards'"
        :sections="serviceSections"
        @service-click="handleServiceClick"
        @copy="handleCopy"
        @open-url="handleOpenUrl"
      />

      <TreeView
        v-else-if="activeView === 'tree'"
        :treeServices="treeServices"
        @service-click="handleTreeServiceClick"
      />

      <div v-else-if="activeView === 'architecture'" class="iframe-container">
        <iframe src="/arch.html" title="Server Architecture" />
      </div>

      <div v-else-if="activeView === 'ai-architecture'" class="iframe-container">
        <iframe src="/ai-arch.html" title="AI Architecture" />
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <a
        href="https://diegonmarcos.github.io/linktree"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >
        <span class="accent-green">$</span>
        <span class="accent-primary">go</span>
        <span>linktree</span>
      </a>
    </footer>

    <!-- Notification -->
    <AppNotification
      v-if="notification"
      :message="notification"
      @close="clearNotification"
    />
  </main>
</template>

<style scoped>
.header {
  max-width: 72rem;
  margin: 0 auto 2rem;
  text-align: center;
  animation: fadeInDown 0.5s ease-out;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(to right, var(--accent-primary), var(--accent-purple));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
}

.content {
  max-width: 72rem;
  margin: 0 auto;
}

.placeholder {
  text-align: center;
  padding: 5rem 0;
  color: var(--text-secondary);
}

.iframe-container {
  width: 100%;
  height: 600px;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.iframe-container iframe {
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  border: none;
}

.footer {
  max-width: 72rem;
  margin: 4rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-speed);
}

.footer-link:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.accent-green {
  color: var(--accent-green);
}

.accent-primary {
  color: var(--accent-primary);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
