<script lang="ts">
  import { onMount } from 'svelte';
  import {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    recentSearches,
    clearSearch
  } from '$lib/stores/searchStore';
  import { userLocation } from '$lib/stores/mapStore';
  import { search } from '$lib/services/api';
  import { debounce } from '$lib/utils/debounce';
  import SearchResults from './SearchResults.svelte';
  import QuickSearchBar from './QuickSearchBar.svelte';

  let inputElement: HTMLInputElement;
  let isFocused = $state(false);

  // Debounced search
  const debouncedSearch = debounce(async (query: string) => {
    if (query.length < 2) {
      searchResults.set([]);
      return;
    }

    isSearching.set(true);
    searchError.set(null);

    try {
      const results = await search(query, {
        limit: 10,
        proximity: $userLocation || undefined
      });
      searchResults.set(results);
    } catch (error) {
      console.error('Search failed:', error);
      searchError.set('Search failed. Please try again.');
      searchResults.set([]);
    } finally {
      isSearching.set(false);
    }
  }, 300);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    searchQuery.set(target.value);
    debouncedSearch(target.value);
  }

  function handleClear() {
    clearSearch();
    inputElement?.focus();
  }

  function handleFocus() {
    isFocused = true;
  }

  function handleBlur(e: FocusEvent) {
    // Delay blur to allow click on results
    setTimeout(() => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!relatedTarget?.closest('.search-container')) {
        isFocused = false;
      }
    }, 150);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClear();
      inputElement?.blur();
    }
  }

  function handleRecentClick(query: string) {
    searchQuery.set(query);
    debouncedSearch(query);
    inputElement?.focus();
  }

  // Show results or recent searches
  let showDropdown = $derived(
    isFocused && ($searchQuery.length > 0 || $recentSearches.length > 0)
  );
  let hasResults = $derived($searchResults.length > 0);
</script>

<div class="search-container">
  <div
    class="search-bar"
    class:search-bar--focused={isFocused}
    class:search-bar--has-results={showDropdown && (hasResults || $isSearching)}
  >
    <span class="search-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </span>

    <input
      type="text"
      class="search-input"
      placeholder="Search places..."
      value={$searchQuery}
      oninput={handleInput}
      onfocus={handleFocus}
      onblur={handleBlur}
      onkeydown={handleKeydown}
      bind:this={inputElement}
      autocomplete="off"
      spellcheck="false"
    />

    <button
      class="search-clear"
      class:search-clear--visible={$searchQuery.length > 0}
      onclick={handleClear}
      aria-label="Clear search"
      tabindex={$searchQuery.length > 0 ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>

  {#if showDropdown}
    {#if $isSearching}
      <div class="search-results">
        <div class="search-loading">
          <div class="search-loading-spinner"></div>
          <span>Searching...</span>
        </div>
      </div>
    {:else if hasResults}
      <SearchResults />
    {:else if $searchQuery.length > 1 && !$isSearching}
      <div class="search-results">
        <div class="search-no-results">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15s1.5-2 4-2 4 2 4 2" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
            <circle cx="15" cy="9" r="1" fill="currentColor" />
          </svg>
          <p>No results found</p>
          <span>Try a different search term</span>
        </div>
      </div>
    {:else if $recentSearches.length > 0}
      <div class="search-results">
        <div class="recent-searches">
          <div class="recent-searches-header">
            <span>Recent</span>
            <button onclick={() => recentSearches.clear()}>Clear</button>
          </div>
          {#each $recentSearches as query}
            <button
              class="recent-search-item"
              onclick={() => handleRecentClick(query)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{query}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/if}

  <QuickSearchBar />
</div>
