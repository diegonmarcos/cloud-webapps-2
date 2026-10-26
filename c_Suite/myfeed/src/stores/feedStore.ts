import { defineStore } from 'pinia'
import type { FeedItem, FeedFilterType, SortBy, SortOrder } from '@/types/feed'

interface FeedState {
  // Filters
  selectedType: FeedFilterType
  searchQuery: string
  sortBy: SortBy
  sortOrder: SortOrder

  // Engagement (stored locally)
  likes: Record<string, boolean>
  bookmarks: Record<string, boolean>
  comments: Record<string, string>

  // UI State
  theme: 'dark' | 'light'
  expandedItems: Set<string>
}

export const useFeedStore = defineStore('feed', {
  state: (): FeedState => ({
    selectedType: 'all',
    searchQuery: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',

    likes: {},
    bookmarks: {},
    comments: {},

    theme: 'dark',
    expandedItems: new Set(),
  }),

  getters: {
    isLiked: (state) => (id: string) => state.likes[id] || false,
    isBookmarked: (state) => (id: string) => state.bookmarks[id] || false,
    getComment: (state) => (id: string) => state.comments[id],
    isExpanded: (state) => (id: string) => state.expandedItems.has(id),

    likeCount: (state) => Object.values(state.likes).filter(Boolean).length,
    bookmarkCount: (state) => Object.values(state.bookmarks).filter(Boolean).length,
  },

  actions: {
    // Filter actions
    setFilterType(type: FeedFilterType) {
      this.selectedType = type
    },

    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    setSorting(sortBy: SortBy, order: SortOrder) {
      this.sortBy = sortBy
      this.sortOrder = order
    },

    // Engagement actions
    toggleLike(id: string) {
      this.likes[id] = !this.likes[id]
    },

    toggleBookmark(id: string) {
      this.bookmarks[id] = !this.bookmarks[id]
    },

    setComment(id: string, comment: string) {
      if (comment) {
        this.comments[id] = comment
      } else {
        delete this.comments[id]
      }
    },

    // UI actions
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', this.theme)
    },

    toggleExpanded(id: string) {
      if (this.expandedItems.has(id)) {
        this.expandedItems.delete(id)
      } else {
        this.expandedItems.add(id)
      }
    },

    // Bulk actions
    clearLikes() {
      this.likes = {}
    },

    clearBookmarks() {
      this.bookmarks = {}
    },

    // Filter feed items
    filterItems(items: FeedItem[]): FeedItem[] {
      let filtered = items

      // Filter by type
      if (this.selectedType !== 'all') {
        filtered = filtered.filter(item => item.type === this.selectedType)
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(item => {
          const title = 'title' in item ? item.title.toLowerCase() : ''
          const content = 'content' in item ? item.content.toLowerCase() : ''
          return title.includes(query) || content.includes(query)
        })
      }

      // Sort items
      filtered = [...filtered].sort((a, b) => {
        let aValue: any
        let bValue: any

        if (this.sortBy === 'createdAt') {
          aValue = new Date(a._createdAt).getTime()
          bValue = new Date(b._createdAt).getTime()
        } else if (this.sortBy === 'publishDate') {
          aValue = 'publishDate' in a ? new Date(a.publishDate).getTime() : 0
          bValue = 'publishDate' in b ? new Date(b.publishDate).getTime() : 0
        } else if (this.sortBy === 'likes') {
          aValue = a.likes
          bValue = b.likes
        }

        if (this.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      return filtered
    },
  },

  persist: {
    key: 'myfeed-store',
    storage: localStorage,
    paths: ['likes', 'bookmarks', 'comments', 'theme', 'selectedType'],
  },
})
