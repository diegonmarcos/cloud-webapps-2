<script setup lang="ts">
import { ref } from 'vue'
import TabBar from '../common/TabBar.vue'
import GitHubRow from './GitHubRow.vue'
import MusicRow from './MusicRow.vue'
import VideoRow from './VideoRow.vue'
import { useGitHubFeed } from '../../composables/useGitHubFeed'
import { useTidalFeed } from '../../composables/useTidalFeed'
import { useYouTubeFeed } from '../../composables/useYouTubeFeed'
import { Github, Music, Youtube, RefreshCw } from 'lucide-vue-next'

const activeTab = ref('all')

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'github', label: 'GitHub' },
  { id: 'music', label: 'Music' },
  { id: 'youtube', label: 'YouTube' },
]

// GitHub feed
const { events: githubEvents, loading: githubLoading, loadEvents: refreshGitHub } = useGitHubFeed()

// Tidal feed
const { tracks: tidalTracks, isLoading: tidalLoading, fetchTidalFeed: refreshTidal } = useTidalFeed()

// YouTube feed
const { videos: youtubeVideos, isLoading: youtubeLoading, fetchYouTubeFeed: refreshYouTube } = useYouTubeFeed()

function refresh() {
  switch (activeTab.value) {
    case 'all':
      refreshGitHub()
      refreshTidal()
      refreshYouTube()
      break
    case 'github':
      refreshGitHub()
      break
    case 'music':
      refreshTidal()
      break
    case 'youtube':
      refreshYouTube()
      break
  }
}
</script>

<template>
  <div class="myfeed">
    <div class="myfeed__header">
      <TabBar :tabs="tabs" :active-tab="activeTab" @update:active-tab="activeTab = $event" />
      <button class="btn btn--ghost btn--icon" @click="refresh" title="Refresh">
        <RefreshCw class="w-4 h-4" />
      </button>
    </div>

    <!-- All Tab - 3 columns side by side -->
    <div v-if="activeTab === 'all'" class="feed-grid">
      <!-- GitHub Column -->
      <div class="feed-column">
        <div class="section-header">
          <Github class="section-header__icon" />
          <span>GitHub</span>
        </div>
        <div v-if="githubLoading" class="p-4 text-text-tertiary text-sm">Loading...</div>
        <template v-else-if="githubEvents.length > 0">
          <GitHubRow
            v-for="event in githubEvents.slice(0, 10)"
            :key="event.id"
            :event="event"
          />
        </template>
        <div v-else class="empty-state empty-state--compact">
          <p class="empty-state__title">No activity</p>
        </div>
      </div>

      <!-- Music Column -->
      <div class="feed-column">
        <div class="section-header">
          <Music class="section-header__icon" />
          <span>Music</span>
        </div>
        <div v-if="tidalLoading" class="p-4 text-text-tertiary text-sm">Loading...</div>
        <template v-else-if="tidalTracks.length > 0">
          <MusicRow
            v-for="track in tidalTracks.slice(0, 10)"
            :key="track.id"
            :track="{
              id: track.id,
              title: track.title,
              artist: track.artist,
              album: track.album,
              duration: track.duration,
              url: track.tidalUrl,
              coverUrl: track.coverUrl
            }"
          />
        </template>
        <div v-else class="empty-state empty-state--compact">
          <p class="empty-state__title">No music</p>
        </div>
      </div>

      <!-- YouTube Column -->
      <div class="feed-column">
        <div class="section-header">
          <Youtube class="section-header__icon" />
          <span>YouTube</span>
        </div>
        <div v-if="youtubeLoading" class="p-4 text-text-tertiary text-sm">Loading...</div>
        <template v-else-if="youtubeVideos.length > 0">
          <VideoRow
            v-for="video in youtubeVideos.slice(0, 10)"
            :key="video.id"
            :video="{
              id: video.id,
              title: video.title,
              channel: video.channel?.name || 'Unknown',
              url: `https://www.youtube.com/watch?v=${video.videoId}`,
              publishedAt: video.publishDate,
              thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
            }"
          />
        </template>
        <div v-else class="empty-state empty-state--compact">
          <p class="empty-state__title">No videos</p>
        </div>
      </div>
    </div>

    <!-- GitHub Tab -->
    <div v-if="activeTab === 'github'" class="feed-list">
      <div v-if="githubLoading" class="p-4 text-text-tertiary text-sm">Loading GitHub activity...</div>
      <template v-else-if="githubEvents.length > 0">
        <div class="section-header">
          <Github class="section-header__icon" />
          <span>Recent Activity</span>
        </div>
        <GitHubRow
          v-for="event in githubEvents.slice(0, 30)"
          :key="event.id"
          :event="event"
        />
      </template>
      <div v-else class="empty-state">
        <Github class="empty-state__icon" />
        <p class="empty-state__title">No GitHub activity</p>
        <p class="empty-state__description">Recent activity will appear here</p>
      </div>
    </div>

    <!-- Music Tab -->
    <div v-if="activeTab === 'music'" class="feed-list">
      <div v-if="tidalLoading" class="p-4 text-text-tertiary text-sm">Loading music...</div>
      <template v-else-if="tidalTracks.length > 0">
        <div class="section-header">
          <Music class="section-header__icon" />
          <span>Tidal Library</span>
        </div>
        <MusicRow
          v-for="track in tidalTracks.slice(0, 30)"
          :key="track.id"
          :track="{
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            url: track.tidalUrl,
            coverUrl: track.coverUrl
          }"
        />
      </template>
      <div v-else class="empty-state">
        <Music class="empty-state__icon" />
        <p class="empty-state__title">No music data</p>
        <p class="empty-state__description">Connect your Tidal account</p>
      </div>
    </div>

    <!-- YouTube Tab -->
    <div v-if="activeTab === 'youtube'" class="feed-list">
      <div v-if="youtubeLoading" class="p-4 text-text-tertiary text-sm">Loading videos...</div>
      <template v-else-if="youtubeVideos.length > 0">
        <div class="section-header">
          <Youtube class="section-header__icon" />
          <span>Liked Videos</span>
        </div>
        <VideoRow
          v-for="video in youtubeVideos.slice(0, 30)"
          :key="video.id"
          :video="{
            id: video.id,
            title: video.title,
            channel: video.channel?.name || 'Unknown',
            url: `https://www.youtube.com/watch?v=${video.videoId}`,
            publishedAt: video.publishDate,
            thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
          }"
        />
      </template>
      <div v-else class="empty-state">
        <Youtube class="empty-state__icon" />
        <p class="empty-state__title">No videos</p>
        <p class="empty-state__description">Liked videos will appear here</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.myfeed__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface, #161b22);
}

.myfeed__header .tab-bar {
  flex: 1;
  border-bottom: none;
}

/* 3-column grid layout for "All" tab */
.feed-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border-primary, #30363d);
  min-height: 0;
}

.feed-column {
  background: var(--bg-primary, #0d1117);
  min-width: 0;
  overflow-y: auto;
  max-height: calc(100vh - 120px);
}

.feed-column .section-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-surface, #161b22);
}

.empty-state--compact {
  padding: 1rem;
}

.empty-state--compact .empty-state__title {
  font-size: 0.75rem;
}

/* Responsive: stack columns on smaller screens */
@media (max-width: 900px) {
  .feed-grid {
    grid-template-columns: 1fr;
  }

  .feed-column {
    max-height: none;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  .feed-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .feed-column:nth-child(3) {
    grid-column: span 2;
  }
}
</style>
