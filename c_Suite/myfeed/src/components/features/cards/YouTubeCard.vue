<script setup lang="ts">
import { Play, Clock } from 'lucide-vue-next'
import type { YouTubeVideo } from '@/types/feed'

interface Props {
  video: YouTubeVideo
}

const props = defineProps<Props>()
const emit = defineEmits<{
  like: []
  bookmark: []
}>()

const playing = ref(false)

const thumbnailUrl = computed(() => {
  return `https://img.youtube.com/vi/${props.video.videoId}/maxresdefault.jpg`
})

const embedUrl = computed(() => {
  const startTime = props.video.startTime ? `?start=${props.video.startTime}` : ''
  return `https://www.youtube.com/embed/${props.video.videoId}${startTime}`
})

function playVideo() {
  playing.value = true
}
</script>

<template>
  <GlassCard hover>
    <ContentHeader
      :author="video.channel.name"
      :source="'YouTube'"
      :publish-date="video.publishDate"
      badge="📺 Video"
    />

    <!-- Title -->
    <h2 class="text-xl font-bold text-white mb-3">
      {{ video.customTitle || video.title }}
    </h2>

    <!-- Video Player / Thumbnail -->
    <div class="relative aspect-video rounded-xl overflow-hidden mb-4 bg-obsidian-800">
      <!-- Thumbnail with Play Button -->
      <div
        v-if="!playing"
        class="relative w-full h-full group cursor-pointer"
        @click="playVideo"
      >
        <img
          :src="thumbnailUrl"
          :alt="video.title"
          class="w-full h-full object-cover"
        />

        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

        <!-- Play Button -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
            <Play class="w-10 h-10 text-white fill-white ml-1" />
          </div>
        </div>

        <!-- Duration -->
        <div
          v-if="video.duration"
          class="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white"
        >
          {{ video.duration }}
        </div>
      </div>

      <!-- YouTube iframe -->
      <iframe
        v-else
        :src="embedUrl"
        class="w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </div>

    <!-- Description -->
    <p
      v-if="video.description"
      class="text-white/70 text-sm mb-3 line-clamp-2"
    >
      {{ video.description }}
    </p>

    <!-- User Comment -->
    <UserComment
      v-if="video.userComment"
      :comment="video.userComment"
    />

    <!-- Actions -->
    <ActionBar
      :likes="video.likes"
      :is-liked="video.isLiked"
      :is-bookmarked="video.isBookmarked"
      @like="emit('like')"
      @bookmark="emit('bookmark')"
    />
  </GlassCard>
</template>
