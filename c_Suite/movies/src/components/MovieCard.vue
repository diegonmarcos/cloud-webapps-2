<script setup lang="ts">
import { ref } from 'vue'
import type { Movie } from '@/types/movie'

defineProps<{
  movie: Movie
}>()

const emit = defineEmits<{
  watch: [movie: Movie]
  webplayer: [movie: Movie]
}>()

const copied = ref(false)
const cardRef = ref<HTMLElement | null>(null)
const tiltX = ref(0)
const tiltY = ref(0)
const isHovering = ref(false)
const mouseX = ref(50)
const mouseY = ref(50)

// Physics parameters
const springStrength = 0.1
const damping = 0.8
let velocityX = 0
let velocityY = 0
let targetX = 0
let targetY = 0
let animationId: number | null = null

const getImageUrl = (posterUrl: string): string => {
  if (!posterUrl || posterUrl === 'N/A') {
    console.warn(`[MovieCard] No poster for movie, using placeholder`)
    return 'https://via.placeholder.com/300x450?text=No+Poster'
  }
  console.debug(`[MovieCard] Poster URL: ${posterUrl}`)
  return posterUrl
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  console.error(`[MovieCard] Image failed to load: ${target.src}`)
  target.src = 'https://via.placeholder.com/300x450?text=No+Poster'
}

const copyImdbId = async (imdbId: string) => {
  try {
    await navigator.clipboard.writeText(imdbId)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Physics animation loop
const animate = () => {
  const forceX = (targetX - tiltX.value) * springStrength
  const forceY = (targetY - tiltY.value) * springStrength

  velocityX += forceX
  velocityY += forceY

  velocityX *= damping
  velocityY *= damping

  tiltX.value += velocityX
  tiltY.value += velocityY

  if (isHovering.value || Math.abs(velocityX) > 0.01 || Math.abs(velocityY) > 0.01 ||
      Math.abs(tiltX.value) > 0.1 || Math.abs(tiltY.value) > 0.1) {
    animationId = requestAnimationFrame(animate)
  } else {
    tiltX.value = 0
    tiltY.value = 0
    animationId = null
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!cardRef.value) return

  const rect = cardRef.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height

  mouseX.value = x * 100
  mouseY.value = y * 100

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const deltaX = (e.clientX - centerX) / (rect.width / 2)
  const deltaY = (e.clientY - centerY) / (rect.height / 2)

  targetX = deltaY * -12
  targetY = deltaX * 12
}

const handleMouseEnter = () => {
  isHovering.value = true
  if (!animationId) {
    animationId = requestAnimationFrame(animate)
  }
}

const handleMouseLeave = () => {
  isHovering.value = false
  targetX = 0
  targetY = 0
  mouseX.value = 50
  mouseY.value = 50
  if (!animationId) {
    animationId = requestAnimationFrame(animate)
  }
}
</script>

<template>
  <article
    ref="cardRef"
    class="card"
    :style="{
      transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
    }"
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Dynamic spotlight -->
    <div
      class="spotlight"
      :style="{
        opacity: isHovering ? 1 : 0,
        background: `radial-gradient(circle at ${mouseX}% ${mouseY}%, rgba(255,255,255,0.15) 0%, transparent 50%)`
      }"
    ></div>

    <!-- Red glow on edges -->
    <div class="edge-glow" :class="{ active: isHovering }"></div>

    <div class="poster-container">
      <img
        :src="getImageUrl(movie.Poster)"
        @error="handleImageError"
        class="poster"
        :alt="movie.Title"
        loading="lazy"
      />
      <div class="poster-overlay"></div>
      <div class="film-strip left"></div>
      <div class="film-strip right"></div>
    </div>

    <div class="card-content">
      <h3 class="card-title">{{ movie.Title }}</h3>

      <div class="card-meta">
        <span class="type-badge" :class="movie.Type">
          {{ movie.Type === 'series' ? 'SERIES' : 'FILM' }}
        </span>
        <span class="year">{{ movie.Year }}</span>
        <span v-if="movie.imdbRating && movie.imdbRating !== 'N/A'" class="rating">
          {{ movie.imdbRating }}
        </span>
      </div>

      <div class="card-ids">
        <span class="id-badge imdb" @click="copyImdbId(movie.imdbID)" :title="movie.imdbID">
          IMDb: {{ movie.imdbID }}
        </span>
        <span v-if="movie.tmdbId" class="id-badge tmdb" @click="copyImdbId(String(movie.tmdbId))" :title="String(movie.tmdbId)">
          TMDB: {{ movie.tmdbId }}
        </span>
        <span v-else class="id-badge tmdb pending">TMDB: —</span>
      </div>

      <div class="card-actions">
        <button class="btn btn-red" @click="emit('watch', movie)">
          TRAILER
        </button>
        <button class="btn btn-gold" @click="emit('webplayer', movie)">
          WATCH
        </button>
        <button class="btn btn-ghost" @click="copyImdbId(movie.imdbID)">
          {{ copied ? '✓' : 'ID' }}
        </button>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.card {
  position: relative;
  background: linear-gradient(180deg, #141414 0%, #0a0a0a 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform-style: preserve-3d;
  will-change: transform;
  transition: box-shadow 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid rgba(255, 255, 255, 0.05);
    pointer-events: none;
    z-index: 20;
  }

  &:hover {
    box-shadow:
      0 30px 60px rgba(0, 0, 0, 0.9),
      0 0 0 1px rgba(139, 0, 0, 0.5);
  }
}

.spotlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 15;
  transition: opacity 0.3s ease;
  mix-blend-mode: overlay;
}

.edge-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.4s ease;

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg,
      transparent 0%,
      rgba(139, 0, 0, 0.5) 25%,
      transparent 50%,
      rgba(184, 134, 11, 0.3) 75%,
      transparent 100%
    );
    filter: blur(8px);
  }

  &.active {
    opacity: 1;
  }
}

.poster-container {
  position: relative;
  overflow: hidden;
}

.poster {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  background: #0a0a0a;
  filter: saturate(0.4) contrast(1.1);
  transition: filter 0.5s ease, transform 0.5s ease;

  .card:hover & {
    filter: saturate(0.6) contrast(1.15);
    transform: scale(1.03);
  }
}

.poster-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.2) 0%,
    transparent 30%,
    transparent 50%,
    rgba(10, 10, 10, 0.95) 100%
  );
  pointer-events: none;
}

.film-strip {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10px;
  background: repeating-linear-gradient(
    180deg,
    #1a1a1a 0px,
    #1a1a1a 6px,
    #0a0a0a 6px,
    #0a0a0a 10px
  );
  opacity: 0.4;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      180deg,
      transparent 0px,
      transparent 3px,
      rgba(255, 255, 255, 0.03) 3px,
      rgba(255, 255, 255, 0.03) 6px
    );
  }

  &.left { left: 0; }
  &.right { right: 0; }
}

.card-content {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 5;
  margin-top: -50px;
  background: linear-gradient(180deg, transparent 0%, #0a0a0a 30%);
}

.card-title {
  font-family: 'Bebas Neue', 'Oswald', sans-serif;
  font-size: 1.2rem;
  font-weight: 400;
  margin: 0;
  color: var(--noir-cream);
  letter-spacing: 1px;
  line-height: 1.2;
  text-transform: uppercase;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.type-badge {
  padding: 2px 6px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 1px;

  &.movie {
    color: var(--noir-crimson);
    border: 1px solid var(--noir-crimson);
  }

  &.series {
    color: var(--noir-gold);
    border: 1px solid var(--noir-gold);
  }
}

.year {
  color: var(--text-muted);
}

.rating {
  color: var(--noir-gold);
  font-weight: 700;
  font-size: 0.85rem;

  &::before {
    content: '★ ';
    font-size: 0.7rem;
  }
}

.card-ids {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.id-badge {
  font-family: 'Source Sans Pro', monospace;
  font-size: 0.6rem;
  padding: 2px 5px;
  border-radius: 3px;
  cursor: pointer;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  transition: background 0.2s;

  &.imdb {
    color: var(--noir-gold);
    background: rgba(184, 134, 11, 0.1);
    border: 1px solid rgba(184, 134, 11, 0.3);

    &:hover {
      background: rgba(184, 134, 11, 0.2);
    }
  }

  &.tmdb {
    color: #01d277;
    background: rgba(1, 210, 119, 0.1);
    border: 1px solid rgba(1, 210, 119, 0.3);

    &:hover {
      background: rgba(1, 210, 119, 0.2);
    }

    &.pending {
      color: var(--text-muted);
      border-color: rgba(255, 255, 255, 0.1);
      background: transparent;
      cursor: default;
    }
  }
}

.card-actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 6px;
  border: none;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover::before {
    opacity: 1;
  }

  &:active {
    transform: scale(0.97);
  }
}

.btn-red {
  background: var(--noir-red);
  color: var(--noir-cream);

  &:hover {
    background: var(--noir-crimson);
    box-shadow: 0 0 20px rgba(139, 0, 0, 0.6);
  }
}

.btn-gold {
  background: transparent;
  color: var(--noir-gold);
  border: 1px solid var(--noir-gold);

  &:hover {
    background: var(--noir-gold);
    color: #000;
    box-shadow: 0 0 20px rgba(184, 134, 11, 0.4);
  }
}

.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-muted);
  min-width: 40px;
  flex: 0;

  &:hover {
    border-color: var(--text-secondary);
    color: var(--text-primary);
  }
}

@media (max-width: 480px) {
  .card-content {
    padding: 12px;
  }

  .card-title {
    font-size: 1rem;
  }

  .btn {
    padding: 8px 4px;
    font-size: 0.7rem;
  }
}
</style>
