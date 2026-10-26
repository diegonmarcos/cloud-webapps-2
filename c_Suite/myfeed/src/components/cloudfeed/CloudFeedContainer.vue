<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Alert {
  id: string
  vm: string
  category: string
  severity: string
  title: string
  message: string
  timestamp: string
  source: string
  context?: {
    who?: { uid?: number; audit_session?: string; command?: string }
    what?: { priority?: number; errno?: string; unit?: string }
    how?: { cmdline?: string; invocation_id?: string }
  }
}

interface Channel {
  id: string
  name: string
  icon: string
  color: string
  description: string
  rss_url: string
}

// Default channels (used if API fails)
const defaultChannels: Channel[] = [
  { id: 'github', name: 'GitHub', icon: '', color: '#238636', description: 'Repository activity', rss_url: 'https://rss.diegonmarcos.com/github/json?poll=1' },
  { id: 'sauron', name: 'Sauron', icon: '', color: '#f85149', description: 'YARA security scans', rss_url: 'https://rss.diegonmarcos.com/sauron/json?poll=1' },
  { id: 'auth', name: 'Auth', icon: '', color: '#a371f7', description: 'SSH, sudo, login events', rss_url: 'https://rss.diegonmarcos.com/auth/json?poll=1' },
  { id: 'system', name: 'System', icon: '', color: '#58a6ff', description: 'Service errors & crashes', rss_url: 'https://rss.diegonmarcos.com/system/json?poll=1' },
  { id: 'ops', name: 'Operations', icon: '', color: '#d29922', description: 'Deployments & restarts', rss_url: 'https://rss.diegonmarcos.com/ops/json?poll=1' },
  { id: 'docker', name: 'Docker', icon: '', color: '#2496ed', description: 'Container events', rss_url: 'https://rss.diegonmarcos.com/docker/json?poll=1' },
  { id: 'cron', name: 'Cron', icon: '', color: '#6e7681', description: 'Scheduled job events', rss_url: 'https://rss.diegonmarcos.com/cron/json?poll=1' },
  { id: 'backup', name: 'Backup', icon: '', color: '#3fb950', description: 'Backup job status', rss_url: 'https://rss.diegonmarcos.com/backup/json?poll=1' },
  { id: 'security', name: 'Security', icon: '', color: '#da3633', description: 'Security alerts', rss_url: 'https://rss.diegonmarcos.com/security/json?poll=1' },
  { id: 'deploy', name: 'Deploy', icon: '', color: '#bf8700', description: 'Deployment notifications', rss_url: 'https://rss.diegonmarcos.com/deploy/json?poll=1' }
]

const channels = ref<Channel[]>(defaultChannels)
const alerts = ref<Alert[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const lastUpdate = ref<Date | null>(null)
const expandedAlert = ref<string | null>(null)
let refreshInterval: ReturnType<typeof setInterval> | null = null

const API_URL = 'https://api.diegonmarcos.com/api/alerts'

// Group alerts by category
const alertsByChannel = computed(() => {
  const grouped: Record<string, Alert[]> = {}
  channels.value.forEach(ch => {
    grouped[ch.id] = alerts.value
      .filter(a => a.category === ch.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50)
  })
  return grouped
})

// Stats
const stats = computed(() => ({
  total: alerts.value.length,
  byCategory: channels.value.map(ch => ({
    id: ch.id,
    count: alertsByChannel.value[ch.id]?.length || 0
  }))
}))

async function fetchChannels() {
  try {
    const response = await fetch(`${API_URL}/channels`)
    if (response.ok) {
      const data = await response.json()
      if (data.channels?.length) {
        channels.value = data.channels
      }
    }
  } catch (e) {
    console.warn('Failed to fetch channels, using defaults')
  }
}

async function fetchAlerts() {
  try {
    const response = await fetch(`${API_URL}/list?limit=500`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    // Normalize alert structure (API may return 'hash' as id)
    alerts.value = (data.alerts || []).map((a: any) => ({
      id: a.id || a.hash || crypto.randomUUID(),
      vm: a.vm || 'unknown',
      category: a.category || 'system',
      severity: a.severity || 'notice',
      title: a.title || 'Alert',
      message: a.message || '',
      timestamp: a.timestamp || new Date().toISOString(),
      source: a.source || 'api',
      context: a.context || {}
    }))
    lastUpdate.value = new Date()
    error.value = null
  } catch (e) {
    console.error('Failed to fetch alerts:', e)
    error.value = 'Failed to load alerts'
  } finally {
    loading.value = false
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return date.toLocaleDateString()
}

function getSeverityClass(severity: string): string {
  switch (severity) {
    case 'critical':
    case 'alert':
    case 'emergency':
      return 'severity-critical'
    case 'error':
      return 'severity-error'
    case 'warning':
      return 'severity-warning'
    default:
      return 'severity-info'
  }
}

function toggleExpand(alertId: string) {
  expandedAlert.value = expandedAlert.value === alertId ? null : alertId
}

function formatContext(ctx: Alert['context']): string {
  if (!ctx) return ''
  const parts: string[] = []

  if (ctx.who) {
    if (ctx.who.uid !== undefined) parts.push(`uid=${ctx.who.uid}`)
    if (ctx.who.command) parts.push(`cmd=${ctx.who.command}`)
  }
  if (ctx.what?.unit) parts.push(`unit=${ctx.what.unit}`)
  if (ctx.how?.cmdline) parts.push(`cmdline=${ctx.how.cmdline.slice(0, 50)}`)

  return parts.join(' | ')
}

onMounted(async () => {
  await fetchChannels()
  await fetchAlerts()
  refreshInterval = setInterval(fetchAlerts, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="cloudfeed-container">
    <!-- Header -->
    <div class="cloudfeed-header">
      <div class="header-left">
        <h2 class="title">Cloud Alerts</h2>
        <span v-if="lastUpdate" class="last-update">
          {{ formatTime(lastUpdate.toISOString()) }}
        </span>
        <span class="total-count">{{ stats.total }} alerts</span>
      </div>
      <div class="header-right">
        <button @click="fetchAlerts" class="refresh-btn" :disabled="loading">
          <span :class="{ spinning: loading }"></span>
          Refresh
        </button>
        <a href="https://rss.diegonmarcos.com" target="_blank" class="dashboard-link">
          ntfy
        </a>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Channel Grid -->
    <div class="channels-grid">
      <div
        v-for="channel in channels"
        :key="channel.id"
        class="channel-card"
      >
        <!-- Channel Header -->
        <div class="channel-header" :style="{ borderColor: channel.color }">
          <span class="channel-icon">{{ channel.icon }}</span>
          <div class="channel-info">
            <h3 class="channel-name">{{ channel.name }}</h3>
            <span class="channel-desc">{{ channel.description }}</span>
          </div>
          <span class="channel-count" :style="{ background: channel.color }">
            {{ alertsByChannel[channel.id]?.length || 0 }}
          </span>
        </div>

        <!-- Messages List (Scrollable) -->
        <div class="messages-container">
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="skeleton-msg" v-for="i in 3" :key="i"></div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!alertsByChannel[channel.id]?.length" class="empty-state">
            No alerts
          </div>

          <!-- Messages -->
          <div
            v-else
            v-for="alert in alertsByChannel[channel.id]"
            :key="alert.id"
            class="message-item"
            :class="[getSeverityClass(alert.severity), { expanded: expandedAlert === alert.id }]"
            @click="toggleExpand(alert.id)"
          >
            <div class="message-header">
              <span class="message-vm">{{ alert.vm }}</span>
              <span class="message-time">{{ formatTime(alert.timestamp) }}</span>
            </div>
            <div class="message-title">{{ alert.title }}</div>
            <div v-if="alert.message" class="message-body">{{ alert.message }}</div>

            <!-- Expanded Context -->
            <div v-if="expandedAlert === alert.id && alert.context" class="message-context">
              <div v-if="formatContext(alert.context)" class="context-line">
                {{ formatContext(alert.context) }}
              </div>
              <div class="context-meta">
                <span>{{ alert.severity }}</span>
                <span>{{ alert.source }}</span>
                <span>{{ new Date(alert.timestamp).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Channel Footer -->
        <div class="channel-footer">
          <a :href="channel.rss_url" target="_blank" class="rss-link">
            JSON
          </a>
          <a :href="`https://rss.diegonmarcos.com/${channel.id}`" target="_blank" class="ntfy-link">
            ntfy
          </a>
        </div>
      </div>
    </div>

    <!-- Links Footer -->
    <div class="cloudfeed-footer">
      <a href="https://diegonmarcos.github.io/cloud/feed_docs.html" class="footer-link">
        Docs
      </a>
      <span class="separator">|</span>
      <a href="https://api.diegonmarcos.com/api/alerts/stats" target="_blank" class="footer-link">
        Stats
      </a>
      <span class="separator">|</span>
      <a href="https://api.diegonmarcos.com/api/alerts/channels" target="_blank" class="footer-link">
        Channels API
      </a>
      <span class="separator">|</span>
      <a href="https://rss.diegonmarcos.com" target="_blank" class="footer-link">
        ntfy Dashboard
      </a>
    </div>
  </div>
</template>

<style scoped>
.cloudfeed-container {
  padding: 1rem;
  max-width: 100%;
  margin: 0 auto;
}

/* Header */
.cloudfeed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-muted, #21262d);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #e6edf3);
  margin: 0;
}

.last-update,
.total-count {
  font-size: 0.7rem;
  color: var(--text-tertiary, #6e7681);
}

.header-right {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background: var(--bg-tertiary, #21262d);
  border: 1px solid var(--border-default, #30363d);
  border-radius: 6px;
  color: var(--text-primary, #e6edf3);
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--bg-hover, #30363d);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dashboard-link {
  padding: 0.4rem 0.75rem;
  background: var(--accent-blue, #238636);
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: background 0.15s ease;
}

.dashboard-link:hover {
  background: var(--accent-blue-hover, #2ea043);
}

/* Error Banner */
.error-banner {
  padding: 0.5rem 0.75rem;
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.4);
  border-radius: 6px;
  color: #f85149;
  margin-bottom: 1rem;
  font-size: 0.75rem;
}

/* Channel Grid - responsive columns */
.channels-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
}

@media (max-width: 1400px) {
  .channels-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1100px) {
  .channels-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .channels-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .channels-grid {
    grid-template-columns: 1fr;
  }
}

/* Channel Card */
.channel-card {
  background: var(--bg-secondary, #161b22);
  border: 1px solid var(--border-default, #30363d);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  height: 320px;
  overflow: hidden;
}

.channel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 2px solid;
  flex-shrink: 0;
}

.channel-icon {
  font-size: 1.1rem;
}

.channel-info {
  flex: 1;
  min-width: 0;
}

.channel-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary, #e6edf3);
  margin: 0;
}

.channel-desc {
  font-size: 0.6rem;
  color: var(--text-tertiary, #6e7681);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-count {
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #fff;
  min-width: 1.5rem;
  text-align: center;
}

/* Messages Container - Scrollable */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem;
  scrollbar-width: thin;
  scrollbar-color: var(--border-default, #30363d) transparent;
}

.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--border-default, #30363d);
  border-radius: 2px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.skeleton-msg {
  height: 50px;
  background: var(--bg-tertiary, #21262d);
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary, #6e7681);
  font-size: 0.75rem;
}

/* Message Item */
.message-item {
  padding: 0.5rem 0.6rem;
  background: var(--bg-tertiary, #21262d);
  border-radius: 4px;
  margin-bottom: 0.4rem;
  border-left: 2px solid var(--border-default, #30363d);
  cursor: pointer;
  transition: background 0.15s ease;
}

.message-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.message-item.expanded {
  background: rgba(255, 255, 255, 0.08);
}

.message-item.severity-critical {
  border-left-color: #da3633;
  background: rgba(218, 54, 51, 0.08);
}

.message-item.severity-error {
  border-left-color: #f85149;
  background: rgba(248, 81, 73, 0.08);
}

.message-item.severity-warning {
  border-left-color: #d29922;
  background: rgba(210, 153, 34, 0.08);
}

.message-item.severity-info {
  border-left-color: #58a6ff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.15rem;
}

.message-vm {
  font-size: 0.55rem;
  color: var(--text-tertiary, #6e7681);
  font-family: monospace;
}

.message-time {
  font-size: 0.55rem;
  color: var(--text-tertiary, #6e7681);
}

.message-title {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-primary, #e6edf3);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-body {
  font-size: 0.6rem;
  color: var(--text-secondary, #8b949e);
  margin-top: 0.15rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Expanded Context */
.message-context {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-muted, #21262d);
}

.context-line {
  font-size: 0.55rem;
  font-family: monospace;
  color: var(--text-secondary, #8b949e);
  word-break: break-all;
  margin-bottom: 0.3rem;
}

.context-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.5rem;
  color: var(--text-tertiary, #6e7681);
}

/* Channel Footer */
.channel-footer {
  padding: 0.4rem 0.75rem;
  border-top: 1px solid var(--border-muted, #21262d);
  flex-shrink: 0;
  display: flex;
  gap: 0.75rem;
}

.rss-link,
.ntfy-link {
  font-size: 0.65rem;
  color: var(--accent-blue, #58a6ff);
  text-decoration: none;
}

.rss-link:hover,
.ntfy-link:hover {
  text-decoration: underline;
}

/* Footer */
.cloudfeed-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-muted, #21262d);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.footer-link {
  color: var(--accent-blue, #58a6ff);
  text-decoration: none;
  font-size: 0.75rem;
}

.footer-link:hover {
  text-decoration: underline;
}

.separator {
  color: var(--text-tertiary, #6e7681);
}
</style>
