import { ref, computed } from 'vue'

export interface GitHubEvent {
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

const GITHUB_USERNAME = 'diegonmarcos'
const CACHE_KEY = 'github-events-cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CacheData {
  events: GitHubEvent[]
  timestamp: number
}

function getCache(): CacheData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const data = JSON.parse(cached) as CacheData
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data
      }
    }
  } catch (e) {
    console.warn('Failed to read GitHub cache')
  }
  return null
}

function setCache(events: GitHubEvent[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      events,
      timestamp: Date.now(),
    }))
  } catch (e) {
    console.warn('Failed to write GitHub cache')
  }
}

async function fetchCommitMessage(repoName: string, sha: string): Promise<string> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoName}/commits/${sha}`)
    if (response.ok) {
      const data = await response.json()
      return data.commit?.message?.split('\n')[0] || ''
    }
  } catch (e) {
    console.warn(`Failed to fetch commit ${sha}:`, e)
  }
  return ''
}

async function fetchGitHubEvents(): Promise<GitHubEvent[]> {
  // Check cache first
  const cached = getCache()
  if (cached) {
    return cached.events
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=30`
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    const events: GitHubEvent[] = []

    // Fetch commit messages for PushEvents (limit to avoid rate limiting)
    for (const event of data) {
      let commitMessage = ''

      // For PushEvents, fetch the actual commit message
      if (event.type === 'PushEvent' && event.payload?.head && event.repo?.name) {
        commitMessage = await fetchCommitMessage(event.repo.name, event.payload.head)
      }

      const parsed = parseGitHubEvent(event, commitMessage)
      if (parsed) {
        events.push(parsed)
      }
    }

    // Cache the results
    setCache(events)

    return events
  } catch (e) {
    console.error('Failed to fetch GitHub events:', e)
    // Return cached data even if expired
    const cached = getCache()
    return cached?.events || []
  }
}

function parseGitHubEvent(event: any, fetchedCommitMessage?: string): GitHubEvent | null {
  const base = {
    id: event.id,
    type: event.type,
    repo: event.repo?.name || 'unknown',
    repoUrl: `https://github.com/${event.repo?.name || ''}`,
    createdAt: event.created_at,
  }

  switch (event.type) {
    case 'PushEvent': {
      const branch = event.payload?.ref?.replace('refs/heads/', '') || 'main'
      // Use fetched commit message, or payload commits if available, or generate fallback
      const commits = event.payload?.commits || []
      const message = fetchedCommitMessage ||
                     commits[0]?.message?.split('\n')[0] ||
                     `Push to ${branch}`
      return {
        ...base,
        commits: event.payload?.size || commits.length || 1,
        message,
        branch,
      }
    }

    case 'WatchEvent':
      return {
        ...base,
        action: event.payload?.action || 'starred',
      }

    case 'ForkEvent':
      return base

    case 'PullRequestEvent':
      return {
        ...base,
        action: event.payload?.action || 'opened',
        message: event.payload?.pull_request?.title || '',
      }

    case 'IssuesEvent':
      return {
        ...base,
        action: event.payload?.action || 'opened',
        message: event.payload?.issue?.title || '',
      }

    case 'CreateEvent':
      return {
        ...base,
        branch: event.payload?.ref || event.payload?.ref_type || '',
      }

    case 'DeleteEvent':
      return {
        ...base,
        branch: event.payload?.ref || '',
      }

    case 'IssueCommentEvent':
      return {
        ...base,
        action: 'commented',
        message: event.payload?.comment?.body?.slice(0, 100) || '',
      }

    case 'PullRequestReviewEvent':
      return {
        ...base,
        action: event.payload?.action || 'reviewed',
        message: event.payload?.pull_request?.title || '',
      }

    default:
      return null
  }
}

export function useGitHubFeed() {
  const events = ref<GitHubEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Group events by type
  const commitEvents = computed(() =>
    events.value.filter((e) => e.type === 'PushEvent')
  )

  const starEvents = computed(() =>
    events.value.filter((e) => e.type === 'WatchEvent')
  )

  const prEvents = computed(() =>
    events.value.filter((e) => e.type === 'PullRequestEvent')
  )

  const issueEvents = computed(() =>
    events.value.filter((e) => e.type === 'IssuesEvent')
  )

  const otherEvents = computed(() =>
    events.value.filter(
      (e) =>
        !['PushEvent', 'WatchEvent', 'PullRequestEvent', 'IssuesEvent'].includes(
          e.type
        )
    )
  )

  // Example/fallback data
  function useFallbackData() {
    events.value = [
      {
        id: 'gh-example-001',
        type: 'PushEvent',
        repo: 'diegonmarcos/myproject',
        repoUrl: 'https://github.com/diegonmarcos/myproject',
        message: 'Fix authentication bug in login flow',
        branch: 'main',
        commits: 1,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'gh-example-002',
        type: 'PushEvent',
        repo: 'diegonmarcos/website',
        repoUrl: 'https://github.com/diegonmarcos/website',
        message: 'Add dark mode support',
        branch: 'feature/dark-mode',
        commits: 3,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'gh-example-003',
        type: 'WatchEvent',
        repo: 'vuejs/vue',
        repoUrl: 'https://github.com/vuejs/vue',
        action: 'starred',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'gh-example-004',
        type: 'PullRequestEvent',
        repo: 'diegonmarcos/api',
        repoUrl: 'https://github.com/diegonmarcos/api',
        message: 'Implement rate limiting for API endpoints',
        action: 'opened',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    ]
  }

  async function loadEvents() {
    loading.value = true
    error.value = null

    try {
      const fetchedEvents = await fetchGitHubEvents()
      if (fetchedEvents.length > 0) {
        events.value = fetchedEvents
      } else {
        useFallbackData()
      }
    } catch (e) {
      error.value = 'Failed to load GitHub activity'
      console.error(e)
      useFallbackData()
    } finally {
      loading.value = false
    }
  }

  // Load on init
  loadEvents()

  return {
    events,
    commitEvents,
    starEvents,
    prEvents,
    issueEvents,
    otherEvents,
    loading,
    error,
    loadEvents,
  }
}
