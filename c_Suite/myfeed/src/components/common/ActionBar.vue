<script setup lang="ts">
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

interface Props {
  likes?: number
  comments?: number
  isLiked?: boolean
  isBookmarked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  likes: 0,
  comments: 0,
  isLiked: false,
  isBookmarked: false,
})

const emit = defineEmits<{
  like: []
  comment: []
  share: []
  bookmark: []
}>()

function handleLike() {
  emit('like')
  toast.success(props.isLiked ? 'Removed from likes' : 'Added to likes!')
}

function handleBookmark() {
  emit('bookmark')
  toast.success(props.isBookmarked ? 'Removed from bookmarks' : 'Bookmarked!')
}

function handleShare() {
  emit('share')
  toast.success('Link copied to clipboard!')
}
</script>

<template>
  <div class="flex items-center gap-6 pt-4 border-t border-white/10">
    <!-- Like -->
    <button
      class="flex items-center gap-2 text-white/60 hover:text-violet-accent transition-colors group"
      @click="handleLike"
    >
      <Heart
        :class="[
          'w-5 h-5 transition-all',
          isLiked ? 'fill-violet-accent text-violet-accent' : 'group-hover:scale-110',
        ]"
      />
      <span
        v-if="likes > 0"
        class="text-sm font-medium"
      >
        {{ likes }}
      </span>
    </button>

    <!-- Comments -->
    <button
      class="flex items-center gap-2 text-white/60 hover:text-violet-accent transition-colors group"
      @click="emit('comment')"
    >
      <MessageCircle class="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span
        v-if="comments > 0"
        class="text-sm font-medium"
      >
        {{ comments }}
      </span>
    </button>

    <!-- Share -->
    <button
      class="flex items-center gap-2 text-white/60 hover:text-violet-accent transition-colors group"
      @click="handleShare"
    >
      <Share2 class="w-5 h-5 group-hover:scale-110 transition-transform" />
    </button>

    <!-- Bookmark -->
    <button
      class="flex items-center gap-2 text-white/60 hover:text-violet-accent transition-colors group ml-auto"
      @click="handleBookmark"
    >
      <Bookmark
        :class="[
          'w-5 h-5 transition-all',
          isBookmarked ? 'fill-violet-accent text-violet-accent' : 'group-hover:scale-110',
        ]"
      />
    </button>
  </div>
</template>
