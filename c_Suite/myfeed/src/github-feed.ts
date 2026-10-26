// GitHub Feed Module
// ====================================

interface GitHubEvent {
  id: string;
  type: string;
  repo: string;
  repoUrl: string;
  message?: string;
  branch?: string;
  commits?: number;
  action?: string;
  createdAt: string;
}

const GITHUB_USERNAME = 'diegonmarcos';
const CACHE_KEY = 'github-events-cache';
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheData {
  events: GitHubEvent[];
  timestamp: number;
}

function getCache(): CacheData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached) as CacheData;
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Failed to read GitHub cache');
  }
  return null;
}

function setCache(events: GitHubEvent[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      events,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to write GitHub cache');
  }
}

async function fetchCommitMessage(repoName: string, sha: string): Promise<string> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoName}/commits/${sha}`);
    if (response.ok) {
      const data = await response.json();
      return data.commit?.message?.split('\n')[0] || '';
    }
  } catch (e) {
    console.warn(`Failed to fetch commit ${sha}:`, e);
  }
  return '';
}

function parseGitHubEvent(event: any, fetchedCommitMessage?: string): GitHubEvent | null {
  const base = {
    id: event.id,
    type: event.type,
    repo: event.repo?.name || 'unknown',
    repoUrl: `https://github.com/${event.repo?.name || ''}`,
    createdAt: event.created_at,
  };

  switch (event.type) {
    case 'PushEvent': {
      const branch = event.payload?.ref?.replace('refs/heads/', '') || 'main';
      const commits = event.payload?.commits || [];
      const message = fetchedCommitMessage ||
                     commits[0]?.message?.split('\n')[0] ||
                     `Push to ${branch}`;
      return {
        ...base,
        commits: event.payload?.size || commits.length || 1,
        message,
        branch,
      };
    }
    case 'WatchEvent':
      return { ...base, action: event.payload?.action || 'starred' };
    case 'ForkEvent':
      return base;
    case 'PullRequestEvent':
      return {
        ...base,
        action: event.payload?.action || 'opened',
        message: event.payload?.pull_request?.title || '',
      };
    case 'IssuesEvent':
      return {
        ...base,
        action: event.payload?.action || 'opened',
        message: event.payload?.issue?.title || '',
      };
    case 'CreateEvent':
      return { ...base, branch: event.payload?.ref || event.payload?.ref_type || '' };
    case 'DeleteEvent':
      return { ...base, branch: event.payload?.ref || '' };
    case 'IssueCommentEvent':
      return {
        ...base,
        action: 'commented',
        message: event.payload?.comment?.body?.slice(0, 100) || '',
      };
    default:
      return null;
  }
}

async function fetchGitHubEvents(): Promise<GitHubEvent[]> {
  const cached = getCache();
  if (cached) return cached.events;

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=30`
    );
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

    const data = await response.json();
    const events: GitHubEvent[] = [];

    for (const event of data) {
      let commitMessage = '';
      if (event.type === 'PushEvent' && event.payload?.head && event.repo?.name) {
        commitMessage = await fetchCommitMessage(event.repo.name, event.payload.head);
      }
      const parsed = parseGitHubEvent(event, commitMessage);
      if (parsed) events.push(parsed);
    }

    setCache(events);
    return events;
  } catch (e) {
    console.error('Failed to fetch GitHub events:', e);
    const cached = getCache();
    return cached?.events || [];
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

function getEventIcon(type: string): string {
  switch (type) {
    case 'PushEvent': return '&#8593;';
    case 'WatchEvent': return '&#9733;';
    case 'ForkEvent': return '&#128260;';
    case 'PullRequestEvent': return '&#8634;';
    case 'IssuesEvent': return '&#9888;';
    case 'CreateEvent': return '&#43;';
    case 'DeleteEvent': return '&#10060;';
    default: return '&#128187;';
  }
}

function renderGitHubEvent(event: GitHubEvent): string {
  return `
    <div class="github-row">
      <div class="event-icon">${getEventIcon(event.type)}</div>
      <div class="event-content">
        <div class="event-header">
          <span class="event-repo"><a href="${event.repoUrl}" target="_blank">${event.repo.split('/')[1] || event.repo}</a></span>
          <span class="event-time">${formatTime(event.createdAt)}</span>
        </div>
        <div class="event-message">${event.message || event.action || event.type}</div>
        ${event.branch ? `<div class="event-meta">${event.branch}${event.commits ? ` (${event.commits} commit${event.commits > 1 ? 's' : ''})` : ''}</div>` : ''}
      </div>
    </div>
  `;
}

function renderLoading(): string {
  return `
    <div class="loading-state">
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
    </div>
  `;
}

function renderEmpty(): string {
  return `
    <div class="empty-state">
      <span class="icon">&#128187;</span>
      <p>No GitHub activity</p>
    </div>
  `;
}

export async function initGitHubFeed(): Promise<void> {
  const containers = [
    'github-feed-mini',
    'github-feed'
  ];

  // Show loading
  containers.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = renderLoading();
  });

  // Fetch events
  const events = await fetchGitHubEvents();

  // Render to containers
  containers.forEach((id, index) => {
    const el = document.getElementById(id);
    if (!el) return;

    const limit = index === 0 ? 10 : 30;
    const displayEvents = events.slice(0, limit);

    if (displayEvents.length === 0) {
      el.innerHTML = renderEmpty();
    } else {
      el.innerHTML = displayEvents.map(renderGitHubEvent).join('');
    }
  });

  // Refresh button
  const refreshBtn = document.getElementById('myfeed-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      localStorage.removeItem(CACHE_KEY);
      await initGitHubFeed();
    });
  }
}
