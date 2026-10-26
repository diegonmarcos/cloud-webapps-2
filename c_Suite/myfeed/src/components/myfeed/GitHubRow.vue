<script setup lang="ts">
import { GitCommit, Star, GitFork, GitPullRequest, CircleDot, Tag, ExternalLink } from 'lucide-vue-next'
import { computed } from 'vue'

interface GitHubEvent {
  id: string
  type: string
  repo: string
  repoUrl: string
  message?: string
  branch?: string
  commits?: number
  action?: string
  createdAt: string
}

interface Props {
  event: GitHubEvent
}

const props = defineProps<Props>()

const iconComponent = computed(() => {
  switch (props.event.type) {
    case 'PushEvent': return GitCommit
    case 'WatchEvent': return Star
    case 'ForkEvent': return GitFork
    case 'PullRequestEvent': return GitPullRequest
    case 'IssuesEvent': return CircleDot
    case 'CreateEvent': return Tag
    default: return GitCommit
  }
})

const iconClass = computed(() => {
  switch (props.event.type) {
    case 'PushEvent': return 'icon--commit'
    case 'WatchEvent': return 'icon--star'
    case 'ForkEvent': return 'icon--fork'
    case 'PullRequestEvent': return 'icon--pr'
    case 'IssuesEvent': return 'icon--issue'
    default: return 'icon--github'
  }
})

const eventLabel = computed(() => {
  switch (props.event.type) {
    case 'PushEvent': return `pushed ${props.event.commits || 1} commit${(props.event.commits || 1) > 1 ? 's' : ''}`
    case 'WatchEvent': return 'starred'
    case 'ForkEvent': return 'forked'
    case 'PullRequestEvent': return `${props.event.action || 'opened'} PR`
    case 'IssuesEvent': return `${props.event.action || 'opened'} issue`
    case 'CreateEvent': return `created ${props.event.branch || 'branch'}`
    default: return props.event.type.replace('Event', '')
  }
})

const timeAgo = computed(() => {
  const date = new Date(props.event.createdAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
})
</script>

<template>
  <div class="row">
    <component :is="iconComponent" class="row__icon icon" :class="iconClass" />
    <div class="row__content">
      <div class="row__title">
        {{ event.message || event.repo }}
      </div>
      <div class="row__meta">
        <a :href="event.repoUrl" target="_blank" rel="noopener" class="row__repo">{{ event.repo }}</a>
        <span>{{ eventLabel }}</span>
        <span class="row__time">{{ timeAgo }}</span>
      </div>
    </div>
    <a :href="event.repoUrl" target="_blank" rel="noopener" class="btn btn--ghost btn--icon">
      <ExternalLink class="w-3.5 h-3.5" />
    </a>
  </div>
</template>

<style scoped>
.row__repo {
  color: var(--text-link, #58a6ff);
  text-decoration: none;
}

.row__repo:hover {
  text-decoration: underline;
}
</style>
