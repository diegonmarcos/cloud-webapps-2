<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SectionScroll from './components/SectionScroll.vue'
import {
  rollingStoneTopSongs,
  rollingStoneTopAlbums,
  rollingStoneTopShows,
  jazzSection,
  rockSection,
  punkSection,
  alternativeRockSection,
  classicSection,
  mantrasSection,
  brasilidadesSection,
} from './data/staticLists'
import { IMusicItem } from './types'
import { searchArtistByName } from './services/theAudioDb'

// --- State ---
const currentView = ref<'list' | 'card'>('card')
const activeSkin = ref<'classic' | 'modern'>('classic')
const isPlaying = ref(false)
const currentTime = ref('00:00')
const volume = ref(80)
const balance = ref(0)
const currentTrack = ref({ name: 'Welcome to Music', artist: 'Your Library' })
const isMenuOpen = ref(false)

// Visualizer bars
const vizBars = ref(Array(20).fill(0).map(() => Math.random() * 100))
let vizInterval: number | null = null

// --- Skin Logic ---
const setSkin = (skin: 'classic' | 'modern') => {
  activeSkin.value = skin
  isMenuOpen.value = false
}

// --- Playback Simulation ---
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    vizInterval = setInterval(() => {
      vizBars.value = vizBars.value.map(() => Math.random() * 100)
    }, 80)
  } else {
    if (vizInterval) clearInterval(vizInterval)
    vizBars.value = vizBars.value.map(() => 0)
  }
}

// --- Data ---
const sections = ref([
  { title: 'Rolling Stone: Top 100 Songs', items: rollingStoneTopSongs as IMusicItem[], icon: '🎵' },
  { title: 'Rolling Stone: Top Albums', items: rollingStoneTopAlbums as IMusicItem[], icon: '💿' },
  { title: 'Rolling Stone: Top Shows', items: rollingStoneTopShows as IMusicItem[], icon: '🎤' },
  { title: 'Jazz Classics', items: jazzSection as IMusicItem[], icon: '🎷' },
  { title: 'Rock Anthems', items: rockSection as IMusicItem[], icon: '🎸' },
  { title: 'Punk Revolution', items: punkSection as IMusicItem[], icon: '🤘' },
  { title: 'Alternative Rock', items: alternativeRockSection as IMusicItem[], icon: '🎶' },
  { title: 'Classical Masterpieces', items: classicSection as IMusicItem[], icon: '🎻' },
  { title: 'Buddhist Mantras', items: mantrasSection as IMusicItem[], icon: '🕉️' },
  { title: 'Brasilidades', items: brasilidadesSection as IMusicItem[], icon: '🇧🇷' },
])

const totalTracks = computed(() =>
  sections.value.reduce((acc, s) => acc + s.items.length, 0)
)

onMounted(async () => {
  // Fetch images for some sections
  for (const section of sections.value) {
    if (['Jazz Classics', 'Rock Anthems', 'Punk Revolution', 'Alternative Rock'].includes(section.title)) {
      const updatedItems: IMusicItem[] = []
      for (const item of section.items) {
        if (!item.image || item.image.includes('placeholder')) {
          try {
            const artists = await searchArtistByName(item.name)
            if (artists.length > 0) {
              updatedItems.push({ ...item, image: artists[0].image || item.image, id: artists[0].id || item.id })
            } else {
              updatedItems.push(item)
            }
          } catch (e) {
            updatedItems.push(item)
          }
        } else {
          updatedItems.push(item)
        }
      }
      section.items = updatedItems
    }
  }
})
</script>

<template>
  <div class="app-wrapper" :class="[`skin-${activeSkin}`]">
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MAIN PLAYER WINDOW -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="wa-window main-player">
      <!-- Title Bar -->
      <div class="wa-titlebar">
        <div class="wa-titlebar-left">
          <span class="wa-icon">⚡</span>
          <span class="wa-title">WINAMP</span>
        </div>
        <div class="wa-titlebar-right">
          <button class="wa-btn-mini" @click="isMenuOpen = !isMenuOpen">☰</button>
          <button class="wa-btn-mini">_</button>
          <button class="wa-btn-mini">×</button>
        </div>
        <!-- Skin Menu Dropdown -->
        <div v-if="isMenuOpen" class="skin-dropdown">
          <div class="skin-option" :class="{ active: activeSkin === 'classic' }" @click="setSkin('classic')">
            ▸ Classic (Winamp 2.x)
          </div>
          <div class="skin-option" :class="{ active: activeSkin === 'modern' }" @click="setSkin('modern')">
            ▸ Modern (Dark)
          </div>
        </div>
      </div>

      <!-- Display Section -->
      <div class="wa-display">
        <!-- Left: Time & Bitrate -->
        <div class="display-left">
          <div class="time-display">
            <span class="time-large">{{ currentTime }}</span>
          </div>
          <div class="bitrate-display">
            <span class="bitrate-value">192</span><span class="bitrate-label">kbps</span>
            <span class="bitrate-value">44</span><span class="bitrate-label">kHz</span>
          </div>
        </div>

        <!-- Center: Visualizer -->
        <div class="display-center">
          <div class="visualizer">
            <div
              v-for="(bar, i) in vizBars"
              :key="i"
              class="viz-bar"
              :style="{ height: bar + '%' }"
            ></div>
          </div>
        </div>

        <!-- Right: Track Info -->
        <div class="display-right">
          <div class="track-ticker">
            <div class="ticker-text" :class="{ scrolling: isPlaying }">
              {{ currentTrack.name }} - {{ currentTrack.artist }}
            </div>
          </div>
          <div class="stereo-mono">
            <span class="indicator active">STEREO</span>
            <span class="indicator">MONO</span>
          </div>
        </div>
      </div>

      <!-- Controls Section -->
      <div class="wa-controls">
        <!-- Playback Buttons -->
        <div class="playback-buttons">
          <button class="wa-btn-playback" title="Previous">⏮</button>
          <button class="wa-btn-playback play-btn" :class="{ active: isPlaying }" @click="togglePlay" title="Play">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="wa-btn-playback" title="Stop" @click="isPlaying = false">⏹</button>
          <button class="wa-btn-playback" title="Next">⏭</button>
          <button class="wa-btn-playback" title="Open">📂</button>
        </div>

        <!-- Sliders -->
        <div class="slider-group">
          <div class="slider-row">
            <span class="slider-label">VOL</span>
            <input type="range" v-model="volume" min="0" max="100" class="wa-slider" />
            <span class="slider-value">{{ volume }}</span>
          </div>
          <div class="slider-row">
            <span class="slider-label">BAL</span>
            <input type="range" v-model="balance" min="-100" max="100" class="wa-slider balance" />
            <span class="slider-value">{{ balance > 0 ? 'R' : balance < 0 ? 'L' : 'C' }}</span>
          </div>
        </div>
      </div>

      <!-- Seek Bar -->
      <div class="wa-seekbar">
        <div class="seek-track">
          <div class="seek-progress" style="width: 35%"></div>
          <div class="seek-thumb" style="left: 35%"></div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- EQUALIZER WINDOW (Mini) -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="wa-window equalizer">
      <div class="wa-titlebar compact">
        <span class="wa-title">EQUALIZER</span>
        <button class="wa-btn-mini">×</button>
      </div>
      <div class="eq-content">
        <div class="eq-presets">
          <select class="eq-select">
            <option>Rock</option>
            <option>Pop</option>
            <option>Jazz</option>
            <option>Classical</option>
            <option>Flat</option>
          </select>
          <label class="eq-toggle">
            <input type="checkbox" checked />
            <span>ON</span>
          </label>
        </div>
        <div class="eq-bands">
          <div v-for="n in 10" :key="n" class="eq-band">
            <div class="eq-slider-track">
              <div class="eq-slider-fill" :style="{ height: (30 + Math.random() * 50) + '%' }"></div>
            </div>
            <span class="eq-freq">{{ ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'][n-1] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- PLAYLIST / LIBRARY WINDOW -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="wa-window playlist-library">
      <div class="wa-titlebar">
        <span class="wa-title">{{ currentView === 'list' ? 'PLAYLIST EDITOR' : 'MEDIA LIBRARY' }}</span>
        <div class="wa-titlebar-right">
          <button class="wa-btn-mini">_</button>
          <button class="wa-btn-mini">×</button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="pl-toolbar">
        <div class="view-switcher">
          <button
            class="toolbar-btn"
            :class="{ active: currentView === 'list' }"
            @click="currentView = 'list'"
            title="List View"
          >
            ☰ List
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: currentView === 'card' }"
            @click="currentView = 'card'"
            title="Card View"
          >
            ▦ Cards
          </button>
        </div>
        <div class="toolbar-info">
          <span class="track-count">{{ totalTracks }} tracks</span>
          <span class="separator">|</span>
          <span class="total-time">{{ sections.length }} categories</span>
        </div>
        <div class="toolbar-actions">
          <button class="toolbar-btn">+ Add</button>
          <button class="toolbar-btn">⟳ Shuffle</button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="pl-content" :class="currentView">
        <SectionScroll
          v-for="section in sections"
          :key="section.title"
          :title="section.title"
          :items="section.items"
          :mode="currentView"
          :icon="section.icon"
        />
      </div>

      <!-- Status Bar -->
      <div class="pl-statusbar">
        <span class="status-left">{{ currentView === 'list' ? '☰ Playlist Mode' : '▦ Library Mode' }}</span>
        <span class="status-center">Music v2.0 | Winamp Style</span>
        <span class="status-right">{{ activeSkin === 'classic' ? 'Classic Skin' : 'Modern Skin' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* WINDOW BASE STYLES */
/* ═══════════════════════════════════════════════════════════════════════════ */
.wa-window {
  background: var(--wa-bg);
  border: var(--wa-border);
  box-shadow: var(--wa-shadow);
}

.wa-titlebar {
  height: 20px;
  background: var(--wa-titlebar-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 3px;
  cursor: grab;
  position: relative;

  .wa-titlebar-left {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .wa-icon {
    font-size: 10px;
  }

  .wa-title {
    font-size: 11px;
    font-weight: bold;
    color: var(--wa-titlebar-text);
    text-shadow: var(--wa-text-shadow);
    letter-spacing: 1px;
  }

  .wa-titlebar-right {
    display: flex;
    gap: 2px;
  }

  &.compact {
    height: 16px;
    .wa-title { font-size: 9px; }
  }
}

.wa-btn-mini {
  width: 14px;
  height: 14px;
  background: var(--wa-btn-bg);
  border: var(--wa-btn-border);
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    border: var(--wa-btn-border-active);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* MAIN PLAYER */
/* ═══════════════════════════════════════════════════════════════════════════ */
.main-player {
  width: 100%;
  max-width: 500px;
}

.wa-display {
  display: flex;
  background: #000;
  margin: 3px;
  padding: 4px;
  gap: 4px;
  border: var(--wa-inset-border);
}

.display-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 80px;
}

.time-display {
  background: #000;
  padding: 4px;
  text-align: center;

  .time-large {
    font-family: var(--wa-font-lcd);
    font-size: 24px;
    color: var(--wa-lcd-color);
    text-shadow: 0 0 8px var(--wa-lcd-glow);
  }
}

.bitrate-display {
  display: flex;
  gap: 4px;
  justify-content: center;
  font-size: 9px;

  .bitrate-value {
    color: var(--wa-lcd-color);
  }
  .bitrate-label {
    color: var(--wa-text-dim);
  }
}

.display-center {
  flex: 1;
  min-width: 100px;
}

.visualizer {
  display: flex;
  align-items: flex-end;
  height: 100%;
  gap: 2px;
  padding: 4px;
}

.viz-bar {
  flex: 1;
  background: var(--wa-viz-gradient);
  min-height: 2px;
  transition: height 0.08s ease-out;
}

.display-right {
  width: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.track-ticker {
  background: #000;
  overflow: hidden;
  padding: 4px;
  height: 32px;

  .ticker-text {
    font-size: 10px;
    color: var(--wa-lcd-color);
    white-space: nowrap;

    &.scrolling {
      animation: ticker 8s linear infinite;
    }
  }
}

@keyframes ticker {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.stereo-mono {
  display: flex;
  gap: 8px;
  justify-content: center;
  font-size: 9px;

  .indicator {
    color: var(--wa-text-dim);
    &.active {
      color: var(--wa-lcd-color);
    }
  }
}

.wa-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
}

.playback-buttons {
  display: flex;
  gap: 3px;
}

.wa-btn-playback {
  width: 28px;
  height: 22px;
  background: var(--wa-btn-bg);
  border: var(--wa-btn-border);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active, &.active {
    border: var(--wa-btn-border-active);
    background: var(--wa-btn-bg-active);
  }

  &.play-btn {
    width: 34px;
    font-size: 14px;
  }
}

.slider-group {
  flex: 1;
  max-width: 200px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;

  .slider-label {
    font-size: 8px;
    color: var(--wa-text-dim);
    width: 24px;
  }

  .slider-value {
    font-size: 9px;
    color: var(--wa-lcd-color);
    width: 20px;
    text-align: right;
  }
}

.wa-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  background: var(--wa-slider-track);
  border: var(--wa-inset-border);

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 10px;
    background: var(--wa-btn-bg);
    border: var(--wa-btn-border);
    cursor: pointer;
  }
}

.wa-seekbar {
  padding: 4px 8px 8px;

  .seek-track {
    height: 8px;
    background: var(--wa-slider-track);
    border: var(--wa-inset-border);
    position: relative;
  }

  .seek-progress {
    height: 100%;
    background: var(--wa-progress-fill);
  }

  .seek-thumb {
    position: absolute;
    top: -2px;
    width: 14px;
    height: 12px;
    background: var(--wa-btn-bg);
    border: var(--wa-btn-border);
    transform: translateX(-50%);
    cursor: pointer;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* EQUALIZER */
/* ═══════════════════════════════════════════════════════════════════════════ */
.equalizer {
  width: 100%;
  max-width: 500px;
}

.eq-content {
  padding: 4px;
}

.eq-presets {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.eq-select {
  background: #000;
  color: var(--wa-lcd-color);
  border: var(--wa-inset-border);
  font-size: 10px;
  padding: 2px 4px;
}

.eq-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: var(--wa-lcd-color);
  cursor: pointer;

  input { width: 12px; height: 12px; }
}

.eq-bands {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  height: 60px;
}

.eq-band {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.eq-slider-track {
  flex: 1;
  width: 8px;
  background: #000;
  border: var(--wa-inset-border);
  position: relative;
  display: flex;
  align-items: flex-end;
}

.eq-slider-fill {
  width: 100%;
  background: var(--wa-viz-gradient);
}

.eq-freq {
  font-size: 7px;
  color: var(--wa-text-dim);
  margin-top: 2px;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* PLAYLIST / LIBRARY */
/* ═══════════════════════════════════════════════════════════════════════════ */
.playlist-library {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 400px;
  max-height: calc(100vh - 280px);
}

.pl-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--wa-toolbar-bg);
  border-bottom: var(--wa-toolbar-border);
  flex-wrap: wrap;
  gap: 8px;
}

.view-switcher {
  display: flex;
  gap: 4px;
}

.toolbar-btn {
  padding: 4px 8px;
  font-size: 10px;
  background: var(--wa-btn-bg);
  border: var(--wa-btn-border);
  cursor: pointer;
  color: var(--wa-text);

  &:active, &.active {
    border: var(--wa-btn-border-active);
    background: var(--wa-btn-bg-active);
    color: var(--wa-text-active);
  }
}

.toolbar-info {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: var(--wa-text-dim);

  .separator { color: var(--wa-text-dim); }
}

.toolbar-actions {
  display: flex;
  gap: 4px;
}

.pl-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--wa-content-bg);
  padding: 8px;

  &::-webkit-scrollbar {
    width: 14px;
  }
  &::-webkit-scrollbar-track {
    background: var(--wa-scrollbar-track);
  }
  &::-webkit-scrollbar-thumb {
    background: var(--wa-scrollbar-thumb);
    border: var(--wa-btn-border);
  }
}

.pl-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  font-size: 9px;
  background: var(--wa-statusbar-bg);
  color: var(--wa-text-dim);
  border-top: var(--wa-toolbar-border);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SKIN DROPDOWN */
/* ═══════════════════════════════════════════════════════════════════════════ */
.skin-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--wa-menu-bg);
  border: var(--wa-btn-border);
  z-index: 1000;
  min-width: 160px;
}

.skin-option {
  padding: 6px 10px;
  font-size: 10px;
  color: var(--wa-text);
  cursor: pointer;

  &:hover {
    background: var(--wa-highlight-bg);
    color: var(--wa-highlight-text);
  }

  &.active {
    background: var(--wa-highlight-bg);
    color: var(--wa-highlight-text);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* RESPONSIVE */
/* ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 600px) {
  .app-wrapper {
    padding: 10px;
  }

  .wa-display {
    flex-direction: column;
  }

  .display-left, .display-right {
    width: 100%;
  }

  .wa-controls {
    flex-direction: column;
    gap: 8px;
  }

  .slider-group {
    width: 100%;
    max-width: none;
  }

  .pl-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-info {
    justify-content: center;
  }
}
</style>
