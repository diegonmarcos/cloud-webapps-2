<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Github, RefreshCw, ExternalLink, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-vue-next'

// GitHub Event interface (from Events API)
interface GitHubEvent {
  id: string
  type: string
  repo: {
    name: string
    url: string
  }
  payload: {
    commits?: Array<{
      sha: string
      message: string
    }> | null
    ref?: string
    ref_type?: string
    action?: string
    head?: string       // SHA of the most recent commit
    before?: string     // SHA of the commit before the push
    size?: number       // Number of commits in push
    pull_request?: {
      title: string
      number: number
    }
    issue?: {
      title: string
      number: number
    }
  }
  created_at: string
}

// Processed feed item
interface FeedItem {
  id: string
  title: string
  link: string
  published: string
  repo: string
  type: string
  details?: string
  commits?: number
}

// State
const feedItems = ref<FeedItem[]>([])
const isLoading = ref(false)
const isExpanded = ref(true)
const lastUpdated = ref<Date | null>(null)
const error = ref<string | null>(null)

// GitHub username
const GITHUB_USERNAME = 'diegonmarcos'

// Cache for commit messages to avoid duplicate API calls
const commitCache = new Map<string, string>()

// Fetch commit message by SHA
async function fetchCommitMessage(repoFullName: string, sha: string): Promise<string> {
  const cacheKey = `${repoFullName}:${sha}`
  if (commitCache.has(cacheKey)) {
    return commitCache.get(cacheKey)!
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/commits/${sha}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      const message = data.commit?.message?.split('\n')[0] || ''
      commitCache.set(cacheKey, message)
      return message
    }
  } catch (e) {
    console.warn(`Failed to fetch commit ${sha}:`, e)
  }

  return ''
}

// Fetch GitHub Events API (returns up to 300 events, 100 per page)
async function fetchGitHubEvents(): Promise<FeedItem[]> {
  const items: FeedItem[] = []
  const pushEventsToFetch: Array<{ index: number; repoFullName: string; sha: string }> = []

  // Fetch multiple pages to get more events
  for (let page = 1; page <= 3; page++) {
    try {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100&page=${page}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          // Rate limited
          console.warn('GitHub API rate limited')
          break
        }
        continue
      }

      const events: GitHubEvent[] = await response.json()

      if (events.length === 0) break

      for (const event of events) {
        const item = processEvent(event)
        if (item) {
          // Track PushEvents that need commit message fetching
          if (event.type === 'PushEvent' && event.payload.head && item.details === 'Loading...') {
            pushEventsToFetch.push({
              index: items.length,
              repoFullName: event.repo.name,
              sha: event.payload.head
            })
          }
          items.push(item)
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch page ${page}:`, e)
      break
    }
  }

  // Fetch commit messages for PushEvents (limit to first 20 to avoid rate limiting)
  const fetchPromises = pushEventsToFetch.slice(0, 20).map(async ({ index, repoFullName, sha }) => {
    const message = await fetchCommitMessage(repoFullName, sha)
    if (message && items[index]) {
      items[index].details = message
    }
  })

  await Promise.all(fetchPromises)

  return items
}

// Process GitHub event into feed item
function processEvent(event: GitHubEvent): FeedItem | null {
  const repoName = event.repo.name.replace(`${GITHUB_USERNAME}/`, '')
  const repoUrl = `https://github.com/${event.repo.name}`

  switch (event.type) {
    case 'PushEvent': {
      const commits = event.payload.commits || []
      const commitCount = event.payload.size || commits.length || 1
      const branch = event.payload.ref?.replace('refs/heads/', '') || 'main'

      // Get commit message from payload if available
      let commitPreview = ''
      if (Array.isArray(commits) && commits.length > 0) {
        // Get the most recent commit's first line
        const recentCommit = commits[commits.length - 1]
        const message = recentCommit?.message || ''
        commitPreview = message.split('\n')[0]?.trim() || ''
      }

      // If no commits in payload, mark for fetching via Commits API
      if (!commitPreview && event.payload.head) {
        commitPreview = 'Loading...'
      } else if (!commitPreview) {
        commitPreview = `Updated ${branch}`
      }

      return {
        id: event.id,
        title: `${repoName}`,
        link: `${repoUrl}/commits/${branch}`,
        published: event.created_at,
        repo: repoName,
        type: 'push',
        details: commitPreview,
        commits: commitCount
      }
    }

    case 'CreateEvent': {
      const refType = event.payload.ref_type
      if (refType === 'repository') {
        return {
          id: event.id,
          title: `Created repository ${repoName}`,
          link: repoUrl,
          published: event.created_at,
          repo: repoName,
          type: 'repo'
        }
      } else if (refType === 'branch') {
        return {
          id: event.id,
          title: `Created branch ${event.payload.ref} in ${repoName}`,
          link: `${repoUrl}/tree/${event.payload.ref}`,
          published: event.created_at,
          repo: repoName,
          type: 'branch'
        }
      }
      return null
    }

    case 'WatchEvent':
      return {
        id: event.id,
        title: `Starred ${event.repo.name}`,
        link: repoUrl,
        published: event.created_at,
        repo: event.repo.name,
        type: 'star'
      }

    case 'ForkEvent':
      return {
        id: event.id,
        title: `Forked ${event.repo.name}`,
        link: repoUrl,
        published: event.created_at,
        repo: event.repo.name,
        type: 'fork'
      }

    case 'PullRequestEvent': {
      const pr = event.payload.pull_request
      const action = event.payload.action
      return {
        id: event.id,
        title: `${action === 'opened' ? 'Opened' : action === 'closed' ? 'Closed' : 'Updated'} PR #${pr?.number} in ${repoName}`,
        link: `${repoUrl}/pull/${pr?.number}`,
        published: event.created_at,
        repo: repoName,
        type: 'pr',
        details: pr?.title
      }
    }

    case 'IssuesEvent': {
      const issue = event.payload.issue
      const action = event.payload.action
      return {
        id: event.id,
        title: `${action === 'opened' ? 'Opened' : action === 'closed' ? 'Closed' : 'Updated'} issue #${issue?.number} in ${repoName}`,
        link: `${repoUrl}/issues/${issue?.number}`,
        published: event.created_at,
        repo: repoName,
        type: 'issue',
        details: issue?.title
      }
    }

    case 'IssueCommentEvent':
      return {
        id: event.id,
        title: `Commented on issue in ${repoName}`,
        link: `${repoUrl}/issues`,
        published: event.created_at,
        repo: repoName,
        type: 'comment'
      }

    case 'DeleteEvent':
      return {
        id: event.id,
        title: `Deleted ${event.payload.ref_type} ${event.payload.ref} in ${repoName}`,
        link: repoUrl,
        published: event.created_at,
        repo: repoName,
        type: 'delete'
      }

    case 'ReleaseEvent':
      return {
        id: event.id,
        title: `Released in ${repoName}`,
        link: `${repoUrl}/releases`,
        published: event.created_at,
        repo: repoName,
        type: 'release'
      }

    default:
      return null
  }
}

// Fetch all GitHub activity
async function fetchGitHubFeed() {
  isLoading.value = true
  error.value = null

  try {
    const items = await fetchGitHubEvents()

    if (items.length > 0) {
      feedItems.value = items
      lastUpdated.value = new Date()
    } else {
      error.value = 'No events found or API rate limited'
      useFallbackData()
    }
  } catch (e) {
    console.error('Failed to fetch GitHub events:', e)
    error.value = 'Could not fetch live feed'
    useFallbackData()
  }

  isLoading.value = false
}

// Fallback data if fetch fails
function useFallbackData() {
  feedItems.value = [
    {
      id: 'fallback-1',
      title: 'Pushed to front-Github_io',
      link: 'https://github.com/diegonmarcos/front-Github_io',
      published: new Date().toISOString(),
      repo: 'front-Github_io',
      type: 'push',
      details: 'Updated MyFeed with Apple Glassy Pixel Art theme'
    }
  ]
  lastUpdated.value = new Date()
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString()
}

// Get activity icon based on type
function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    push: '⬆️',
    repo: '✨',
    branch: '🌿',
    star: '⭐',
    fork: '🍴',
    pr: '🔀',
    issue: '🐛',
    comment: '💬',
    delete: '🗑️',
    release: '🚀'
  }
  return icons[type] || '📌'
}

// Refresh feeds
async function refreshFeeds() {
  await fetchGitHubFeed()
}

// Toggle expand/collapse
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// Group items by date
function getDateGroup(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This Week'
  if (diffDays < 30) return 'This Month'
  return 'Older'
}

// Initial load
onMounted(() => {
  fetchGitHubFeed()
})
</script>

<template>
  <div class="rss-sidebar glass-pixel">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="header-title">
        <div class="pixel-icon-container">
          <Github class="w-5 h-5" />
        </div>
        <div>
          <h2 class="font-pixel text-base">GitHub Activity</h2>
          <p class="text-xs text-white/50 font-pixel-body">@{{ GITHUB_USERNAME }}</p>
        </div>
      </div>

      <div class="header-actions">
        <button
          class="pixel-btn-icon"
          :class="{ 'animate-spin': isLoading }"
          @click="refreshFeeds"
          :disabled="isLoading"
          title="Refresh feeds"
        >
          <RefreshCw class="w-4 h-4" />
        </button>
        <button
          class="pixel-btn-icon"
          @click="toggleExpand"
          :title="isExpanded ? 'Collapse' : 'Expand'"
        >
          <ChevronUp v-if="isExpanded" class="w-4 h-4" />
          <ChevronDown v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Feed Items -->
    <div v-if="isExpanded" class="sidebar-content">
      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <AlertCircle class="w-4 h-4" />
        <span>{{ error }}</span>
      </div>

      <!-- Stats Bar -->
      <div v-if="lastUpdated && feedItems.length > 0" class="stats-bar">
        <div class="stat-item">
          <Clock class="w-3 h-3" />
          <span>{{ formatRelativeTime(lastUpdated.toISOString()) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-count">{{ feedItems.length }}</span>
          <span>events</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && feedItems.length === 0" class="loading-state">
        <div class="loading-spinner"></div>
        <span class="font-pixel-body">Fetching activity...</span>
      </div>

      <!-- Feed List -->
      <div v-else class="feed-list">
        <a
          v-for="item in feedItems"
          :key="item.id"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="feed-item glass-pixel-item"
        >
          <!-- Repo Name Side Badge -->
          <div class="repo-badge-side">
            <div class="repo-icon">
              {{ getActivityIcon(item.type) }}
            </div>
            <span class="repo-name">{{ item.repo }}</span>
          </div>

          <div class="item-content">
            <!-- Activity Type Header -->
            <div class="activity-header">
              <span class="activity-type">{{ item.type }}</span>
              <span class="item-time">{{ formatRelativeTime(item.published) }}</span>
              <span v-if="item.commits && item.commits > 1" class="commits-badge">
                {{ item.commits }} commits
              </span>
            </div>

            <!-- Commit Message (prominent) -->
            <div v-if="item.details" class="commit-message">
              <span class="commit-icon">📝</span>
              <span class="commit-text">{{ item.details }}</span>
            </div>

            <!-- Fallback title if no details -->
            <p v-else class="item-title">{{ item.title }}</p>
          </div>

          <ExternalLink class="item-link-icon w-3 h-3" />
        </a>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && feedItems.length === 0" class="empty-state">
        <span class="text-2xl">📭</span>
        <span class="font-pixel-body text-sm text-white/60">No activity found</span>
      </div>

      <!-- View All Link -->
      <a
        :href="`https://github.com/${GITHUB_USERNAME}?tab=overview`"
        target="_blank"
        rel="noopener noreferrer"
        class="view-all-link"
      >
        <span class="font-pixel-body">View profile on GitHub</span>
        <ExternalLink class="w-3 h-3" />
      </a>
    </div>

    <!-- Collapsed State -->
    <div v-else class="collapsed-indicator">
      <span class="font-pixel-body text-sm text-white/60">
        {{ feedItems.length }} events
      </span>
    </div>
  </div>
</template>

<style scoped>
.rss-sidebar {
  border-radius: 16px;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 2px solid rgba(139, 92, 246, 0.3);
  background: rgba(26, 11, 46, 0.5);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pixel-icon-container {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1));
  border: 2px solid rgba(139, 92, 246, 0.5);
  border-radius: 8px;
  color: #a78bfa;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.pixel-btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.2);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pixel-btn-icon:hover {
  background: rgba(139, 92, 246, 0.3);
  color: white;
  border-color: rgba(139, 92, 246, 0.5);
}

.pixel-btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sidebar-content {
  padding: 0.75rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.7rem;
  color: rgba(255, 165, 0, 0.9);
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 6px;
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(139, 92, 246, 0.1);
  border-radius: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.stat-count {
  color: rgba(167, 139, 250, 0.9);
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.6);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-top-color: rgba(139, 92, 246, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feed-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  position: relative;
}

.feed-item:hover {
  transform: translateX(4px);
}

.feed-item:hover .item-link-icon {
  opacity: 1;
}

/* Repo Name Side Badge - Prominent */
.repo-badge-side {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(0, 212, 255, 0.2));
  border: 2px solid rgba(139, 92, 246, 0.5);
  border-radius: 8px;
  width: fit-content;
}

.repo-icon {
  font-size: 1rem;
}

.repo-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: rgba(0, 212, 255, 1);
  font-weight: 600;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  letter-spacing: 0.5px;
}

.item-content {
  flex: 1;
  min-width: 0;
  padding-left: 0.25rem;
}

/* Activity Header */
.activity-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
  flex-wrap: wrap;
}

.activity-type {
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  background: rgba(139, 92, 246, 0.25);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 4px;
  color: rgba(167, 139, 250, 1);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.item-time {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.4);
}

.commits-badge {
  font-size: 0.55rem;
  padding: 0.1rem 0.35rem;
  background: rgba(0, 212, 255, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.4);
  border-radius: 3px;
  color: rgba(0, 212, 255, 1);
  font-weight: 600;
}

/* Commit Message - Prominent */
.commit-message {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  padding: 0.5rem 0.625rem;
  background: rgba(26, 11, 46, 0.6);
  border-left: 3px solid rgba(0, 212, 255, 0.6);
  border-radius: 0 6px 6px 0;
}

.commit-icon {
  font-size: 0.8rem;
  flex-shrink: 0;
}

.commit-text {
  font-size: 0.85rem;
  font-family: 'VT323', monospace;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.4;
  word-break: break-word;
}

.item-title {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.3;
}

.item-link-icon {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.view-all-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  margin-top: 0.75rem;
  background: rgba(139, 92, 246, 0.15);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: rgba(167, 139, 250, 0.9);
  text-decoration: none;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.view-all-link:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.5);
  color: white;
}

.collapsed-indicator {
  padding: 0.75rem 1rem;
  text-align: center;
}

/* Animations */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
