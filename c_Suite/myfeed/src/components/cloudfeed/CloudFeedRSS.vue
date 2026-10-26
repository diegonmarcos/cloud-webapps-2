<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface NtfyMessage {
  id: string
  time: number
  expires: number
  event: string
  topic: string
  title?: string
  message?: string
  priority?: number
  tags?: string[]
}

interface Channel {
  id: string
  name: string
  color: string
  description: string
}

// JornalD Service Matrix - organized by service and category
interface ServiceEntry {
  service: string
  color: string
  healthWhat: { topic: string; desc: string } | null  // Errors, failures
  healthHow: { topic: string; desc: string } | null   // Metrics, performance
  securityWho: { topic: string; desc: string } | null // Auth, access
}

const serviceMatrix: ServiceEntry[] = [
  {
    service: 'NPM',
    color: '#f85149',
    healthWhat: { topic: 'system', desc: 'Proxy errors, SSL renewal' },
    healthHow: { topic: 'system', desc: 'Response times, connections' },
    securityWho: { topic: 'sauron', desc: 'Access logs, blocked requests' }
  },
  {
    service: 'Authelia',
    color: '#a371f7',
    healthWhat: { topic: 'system', desc: 'Config reload, failures' },
    healthHow: { topic: 'system', desc: 'Auth latency' },
    securityWho: { topic: 'auth', desc: 'Login attempts, 2FA events' }
  },
  {
    service: 'Docker',
    color: '#2496ed',
    healthWhat: { topic: 'system', desc: 'Container start/stop/crash' },
    healthHow: { topic: 'system', desc: 'Memory/CPU per container' },
    securityWho: null
  },
  {
    service: 'SSH',
    color: '#3fb950',
    healthWhat: { topic: 'system', desc: 'Connection events' },
    healthHow: null,
    securityWho: { topic: 'auth', desc: 'User logins, failed attempts' }
  },
  {
    service: 'Mailu',
    color: '#d29922',
    healthWhat: { topic: 'system', desc: 'Queue errors, delivery fails' },
    healthHow: { topic: 'system', desc: 'Queue size, delivery time' },
    securityWho: { topic: 'auth', desc: 'Auth attempts, relay denies' }
  }
]

// Apps channels
const appsChannels: Channel[] = [
  { id: 'github', name: 'GitHub', color: '#238636', description: 'Repository activity, commits, PRs' }
]

// JornalD channels (for fetching)
const jornaldChannels: Channel[] = [
  { id: 'system', name: 'System', color: '#d29922', description: 'Health What/How' },
  { id: 'auth', name: 'Auth', color: '#a371f7', description: 'Security Who' },
  { id: 'sauron', name: 'Sauron', color: '#f85149', description: 'Security scans' },
  { id: 'public', name: 'Public', color: '#58a6ff', description: 'General' }
]

const allChannels = computed(() => [...appsChannels, ...jornaldChannels])

const NTFY_BASE = 'https://rss.diegonmarcos.com'

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

const messages = ref<Map<string, NtfyMessage[]>>(new Map())
const loading = ref(true)
const error = ref<string | null>(null)
const lastUpdate = ref<Date | null>(null)
const expandedMsg = ref<string | null>(null)

async function fetchWithProxy(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (response.ok) return await response.text()
  } catch (e) {}

  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url))
      if (response.ok) return await response.text()
    } catch (e) {
      console.warn(`Proxy ${proxy} failed`)
    }
  }
  return null
}

async function fetchChannel(channel: Channel): Promise<NtfyMessage[]> {
  const url = `${NTFY_BASE}/${channel.id}/json?poll=1`
  try {
    const text = await fetchWithProxy(url)
    if (!text) return []
    const lines = text.trim().split('\n').filter(l => l)
    const msgs: NtfyMessage[] = []
    for (const line of lines) {
      try {
        const msg = JSON.parse(line) as NtfyMessage
        if (msg.event === 'message') msgs.push(msg)
      } catch (e) {}
    }
    return msgs.sort((a, b) => b.time - a.time).slice(0, 50)
  } catch (e) {
    console.warn(`Failed to fetch ${channel.id}:`, e)
    return []
  }
}

async function fetchAll() {
  loading.value = true
  error.value = null
  const newMessages = new Map<string, NtfyMessage[]>()

  const results = await Promise.allSettled(
    allChannels.value.map(async (ch) => {
      const msgs = await fetchChannel(ch)
      return { id: ch.id, msgs }
    })
  )

  let totalFetched = 0
  for (const result of results) {
    if (result.status === 'fulfilled') {
      newMessages.set(result.value.id, result.value.msgs)
      totalFetched += result.value.msgs.length
    }
  }

  messages.value = newMessages
  lastUpdate.value = new Date()
  loading.value = false

  if (totalFetched === 0) {
    error.value = 'No messages fetched. Check network or CORS.'
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
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

function getPriorityClass(priority?: number): string {
  if (!priority || priority <= 2) return 'priority-low'
  if (priority === 3) return 'priority-default'
  if (priority === 4) return 'priority-high'
  return 'priority-urgent'
}

function getJornaldCount(): number {
  let total = 0
  jornaldChannels.forEach(ch => {
    total += messages.value.get(ch.id)?.length || 0
  })
  return total
}

function getAppsCount(): number {
  let total = 0
  appsChannels.forEach(ch => {
    total += messages.value.get(ch.id)?.length || 0
  })
  return total
}

let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchAll()
  refreshInterval = setInterval(fetchAll, 60000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="cloudfeed-rss">
    <!-- Header -->
    <div class="feed-header">
      <div class="header-left">
        <h2>Cloud Feed (RSS)</h2>
        <span v-if="lastUpdate" class="last-update">{{ formatTime(lastUpdate.getTime() / 1000) }}</span>
      </div>
      <div class="header-right">
        <button @click="fetchAll" class="refresh-btn" :disabled="loading">
          <span :class="{ spinning: loading }">&#8635;</span>
          Refresh
        </button>
        <a href="https://rss.diegonmarcos.com" target="_blank" class="ntfy-link">ntfy</a>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Apps Section -->
    <div class="apps-section">
      <h3 class="section-title">Apps <span class="section-count">{{ getAppsCount() }}</span></h3>
      <div class="channels-grid apps-grid">
        <div v-for="channel in appsChannels" :key="channel.id" class="channel-card">
          <div class="channel-header" :style="{ borderColor: channel.color }">
            <div class="channel-info">
              <h3>{{ channel.name }}</h3>
              <span class="channel-desc">{{ channel.description }}</span>
            </div>
            <span class="channel-count" :style="{ background: channel.color }">
              {{ messages.get(channel.id)?.length || 0 }}
            </span>
          </div>

          <div class="messages-container">
            <div v-if="loading" class="loading-state">
              <div class="skeleton-msg" v-for="i in 3" :key="i"></div>
            </div>
            <div v-else-if="!messages.get(channel.id)?.length" class="empty-state">No messages</div>
            <div
              v-else
              v-for="msg in messages.get(channel.id)"
              :key="msg.id"
              class="message-item"
              :class="getPriorityClass(msg.priority)"
              @click="expandedMsg = expandedMsg === msg.id ? null : msg.id"
            >
              <div class="message-header">
                <span class="message-topic">{{ msg.topic }}</span>
                <span class="message-time">{{ formatTime(msg.time) }}</span>
              </div>
              <div class="message-title">{{ msg.title || 'Notification' }}</div>
              <div v-if="msg.message" class="message-body">{{ msg.message }}</div>
              <div v-if="expandedMsg === msg.id" class="message-details">
                <div v-if="msg.tags?.length" class="tags">
                  <span v-for="tag in msg.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
                <div class="meta">
                  <span>Priority: {{ msg.priority || 3 }}</span>
                  <span>{{ new Date(msg.time * 1000).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="channel-footer">
            <a :href="`${NTFY_BASE}/${channel.id}/json?poll=1`" target="_blank">JSON</a>
            <a :href="`${NTFY_BASE}/${channel.id}`" target="_blank">ntfy</a>
          </div>
        </div>
      </div>
    </div>

    <!-- JornalD Section -->
    <div class="jornald-section">
      <h3 class="section-title">JornalD <span class="section-count">{{ getJornaldCount() }}</span></h3>
      <!-- Service Matrix Table -->
      <div class="matrix-section">
        <h3>Service Monitoring Matrix</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Health (What)</th>
              <th>Health (How)</th>
              <th>Security (Who)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in serviceMatrix" :key="entry.service">
              <td>
                <span class="service-badge" :style="{ background: entry.color }">{{ entry.service }}</span>
              </td>
              <td>
                <span v-if="entry.healthWhat" class="cell-content">
                  <span class="cell-topic">{{ entry.healthWhat.topic }}</span>
                  <span class="cell-desc">{{ entry.healthWhat.desc }}</span>
                </span>
                <span v-else class="cell-empty">-</span>
              </td>
              <td>
                <span v-if="entry.healthHow" class="cell-content">
                  <span class="cell-topic">{{ entry.healthHow.topic }}</span>
                  <span class="cell-desc">{{ entry.healthHow.desc }}</span>
                </span>
                <span v-else class="cell-empty">-</span>
              </td>
              <td>
                <span v-if="entry.securityWho" class="cell-content">
                  <span class="cell-topic">{{ entry.securityWho.topic }}</span>
                  <span class="cell-desc">{{ entry.securityWho.desc }}</span>
                </span>
                <span v-else class="cell-empty">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- JornalD Channels Grid -->
      <div class="channels-grid jornald-grid">
        <div v-for="channel in jornaldChannels" :key="channel.id" class="channel-card">
          <div class="channel-header" :style="{ borderColor: channel.color }">
            <div class="channel-info">
              <h3>{{ channel.name }}</h3>
              <span class="channel-desc">{{ channel.description }}</span>
            </div>
            <span class="channel-count" :style="{ background: channel.color }">
              {{ messages.get(channel.id)?.length || 0 }}
            </span>
          </div>

          <div class="messages-container">
            <div v-if="loading" class="loading-state">
              <div class="skeleton-msg" v-for="i in 3" :key="i"></div>
            </div>
            <div v-else-if="!messages.get(channel.id)?.length" class="empty-state">No messages</div>
            <div
              v-else
              v-for="msg in messages.get(channel.id)"
              :key="msg.id"
              class="message-item"
              :class="getPriorityClass(msg.priority)"
              @click="expandedMsg = expandedMsg === msg.id ? null : msg.id"
            >
              <div class="message-header">
                <span class="message-topic">{{ msg.topic }}</span>
                <span class="message-time">{{ formatTime(msg.time) }}</span>
              </div>
              <div class="message-title">{{ msg.title || 'Notification' }}</div>
              <div v-if="msg.message" class="message-body">{{ msg.message }}</div>
              <div v-if="expandedMsg === msg.id" class="message-details">
                <div v-if="msg.tags?.length" class="tags">
                  <span v-for="tag in msg.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
                <div class="meta">
                  <span>Priority: {{ msg.priority || 3 }}</span>
                  <span>{{ new Date(msg.time * 1000).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="channel-footer">
            <a :href="`${NTFY_BASE}/${channel.id}/json?poll=1`" target="_blank">JSON</a>
            <a :href="`${NTFY_BASE}/${channel.id}`" target="_blank">ntfy</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Channels Reference Table -->
    <div class="channels-table-section">
      <h3>All ntfy Channels</h3>
      <table class="channels-table">
        <thead>
          <tr>
            <th>Channel</th>
            <th>Category</th>
            <th>JSON</th>
            <th>SSE</th>
            <th>WebSocket</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="channel in allChannels" :key="channel.id">
            <td>
              <span class="channel-badge" :style="{ background: channel.color }">{{ channel.name }}</span>
            </td>
            <td class="desc-cell">{{ channel.description }}</td>
            <td><a :href="`${NTFY_BASE}/${channel.id}/json?poll=1`" target="_blank">json</a></td>
            <td><a :href="`${NTFY_BASE}/${channel.id}/sse`" target="_blank">sse</a></td>
            <td><a :href="`${NTFY_BASE}/${channel.id}/ws`" target="_blank">ws</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.cloudfeed-rss {
  padding: 1rem;
}

.feed-header {
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

.header-left h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.last-update {
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
}

.refresh-btn:hover:not(:disabled) {
  background: var(--bg-hover, #30363d);
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ntfy-link {
  padding: 0.4rem 0.75rem;
  background: #238636;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.75rem;
}

/* Section Titles */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary, #e6edf3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-count {
  padding: 0.15rem 0.5rem;
  background: var(--bg-tertiary, #21262d);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary, #8b949e);
}

.apps-section {
  margin-bottom: 1.5rem;
}

.jornald-section {
  margin-bottom: 1.5rem;
}

.error-banner {
  padding: 0.5rem 0.75rem;
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.4);
  border-radius: 6px;
  color: #f85149;
  margin-bottom: 1rem;
  font-size: 0.75rem;
}

/* Matrix Section */
.matrix-section {
  margin-bottom: 1.5rem;
}

.matrix-section h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-secondary, #8b949e);
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  background: var(--bg-secondary, #161b22);
  border: 1px solid var(--border-default, #30363d);
  border-radius: 8px;
  overflow: hidden;
}

.matrix-table th,
.matrix-table td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-muted, #21262d);
}

.matrix-table th {
  background: var(--bg-tertiary, #21262d);
  font-weight: 600;
  color: var(--text-secondary, #8b949e);
  font-size: 0.7rem;
}

.matrix-table th:nth-child(2) { color: #d29922; }
.matrix-table th:nth-child(3) { color: #58a6ff; }
.matrix-table th:nth-child(4) { color: #f85149; }

.matrix-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.matrix-table tbody tr:last-child td {
  border-bottom: none;
}

.service-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.cell-topic {
  font-size: 0.65rem;
  color: var(--accent-blue, #58a6ff);
  font-family: monospace;
}

.cell-desc {
  font-size: 0.65rem;
  color: var(--text-tertiary, #6e7681);
}

.cell-empty {
  color: var(--text-tertiary, #6e7681);
  font-size: 0.7rem;
}

/* Channels Grid */
.channels-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.jornald-grid {
  grid-template-columns: repeat(4, 1fr);
}

.apps-grid {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 1200px) {
  .channels-grid { grid-template-columns: repeat(3, 1fr); }
  .apps-grid { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .channels-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .channels-grid { grid-template-columns: 1fr; }
}

.channel-card {
  background: var(--bg-secondary, #161b22);
  border: 1px solid var(--border-default, #30363d);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  height: 300px;
  overflow: hidden;
}

.channel-card-large {
  height: 400px;
}

.channel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 2px solid;
}

.channel-info {
  flex: 1;
}

.channel-info h3 {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
}

.channel-desc {
  font-size: 0.6rem;
  color: var(--text-tertiary, #6e7681);
}

.channel-count {
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #fff;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem;
  scrollbar-width: thin;
}

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

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary, #6e7681);
  font-size: 0.75rem;
}

.message-item {
  padding: 0.5rem 0.6rem;
  background: var(--bg-tertiary, #21262d);
  border-radius: 4px;
  margin-bottom: 0.4rem;
  border-left: 2px solid var(--border-default, #30363d);
  cursor: pointer;
}

.message-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.message-item.priority-urgent { border-left-color: #da3633; background: rgba(218, 54, 51, 0.08); }
.message-item.priority-high { border-left-color: #f85149; background: rgba(248, 81, 73, 0.08); }
.message-item.priority-default { border-left-color: #d29922; }
.message-item.priority-low { border-left-color: #58a6ff; }

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.15rem;
}

.message-topic, .message-time {
  font-size: 0.55rem;
  color: var(--text-tertiary, #6e7681);
}

.message-title {
  font-size: 0.7rem;
  font-weight: 500;
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

.message-details {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-muted, #21262d);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.3rem;
}

.tag {
  font-size: 0.5rem;
  padding: 0.1rem 0.4rem;
  background: var(--bg-tertiary, #21262d);
  border-radius: 4px;
  color: var(--text-secondary, #8b949e);
}

.meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.5rem;
  color: var(--text-tertiary, #6e7681);
}

.channel-footer {
  padding: 0.4rem 0.75rem;
  border-top: 1px solid var(--border-muted, #21262d);
  display: flex;
  gap: 0.75rem;
}

.channel-footer a {
  font-size: 0.65rem;
  color: var(--accent-blue, #58a6ff);
  text-decoration: none;
}

.channel-footer a:hover {
  text-decoration: underline;
}

/* Channels Reference Table */
.channels-table-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-muted, #21262d);
}

.channels-table-section h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-secondary, #8b949e);
}

.channels-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  background: var(--bg-secondary, #161b22);
  border: 1px solid var(--border-default, #30363d);
  border-radius: 8px;
  overflow: hidden;
}

.channels-table th,
.channels-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-muted, #21262d);
}

.channels-table th {
  background: var(--bg-tertiary, #21262d);
  font-weight: 600;
  color: var(--text-secondary, #8b949e);
  font-size: 0.65rem;
  text-transform: uppercase;
}

.channels-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.channels-table tbody tr:last-child td {
  border-bottom: none;
}

.channel-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  color: #fff;
}

.desc-cell {
  color: var(--text-tertiary, #6e7681);
  font-size: 0.7rem;
}

.channels-table a {
  color: var(--accent-blue, #58a6ff);
  text-decoration: none;
  font-size: 0.7rem;
}

.channels-table a:hover {
  text-decoration: underline;
}
</style>
