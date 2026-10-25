<script lang="ts">
  import { onMount } from 'svelte';
  import {
    selectedResult,
    selectedPlace,
    isLoadingPlace,
    clearSelectedPlace
  } from '$lib/stores/searchStore';
  import { openDirections } from '$lib/stores/routeStore';
  import { capabilities } from '$lib/stores/configStore';
  import { getPlaceDetails } from '$lib/services/api';
  import type { PlaceDetails } from '$lib/services/api/types';
  import ProviderBadge from '$lib/components/UI/ProviderBadge.svelte';

  // Load place details when a result is selected
  $effect(() => {
    if ($selectedResult && !$selectedPlace) {
      loadPlaceDetails($selectedResult.id, $selectedResult.source);
    }
  });

  async function loadPlaceDetails(id: string, source: string) {
    isLoadingPlace.set(true);

    try {
      const details = await getPlaceDetails(id, source);
      selectedPlace.set(details);
    } catch (error) {
      console.error('Failed to load place details:', error);
    } finally {
      isLoadingPlace.set(false);
    }
  }

  function handleClose() {
    clearSelectedPlace();
  }

  function handleDirections() {
    if ($selectedPlace) {
      openDirections({
        name: $selectedPlace.name,
        coordinates: $selectedPlace.coordinates
      });
      handleClose();
    }
  }

  function handleShare() {
    if ($selectedPlace && navigator.share) {
      navigator.share({
        title: $selectedPlace.name,
        text: $selectedPlace.address,
        url: window.location.href
      });
    } else if ($selectedPlace) {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  function formatCategory(category?: string): string {
    if (!category) return '';
    return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatPhone(phone?: string): string {
    if (!phone) return '';
    return phone.replace(/\s+/g, ' ').trim();
  }

  // Get current place data
  let place = $derived($selectedPlace || ($selectedResult ? {
    id: $selectedResult.id,
    name: $selectedResult.name,
    address: $selectedResult.address,
    coordinates: $selectedResult.coordinates,
    source: $selectedResult.source,
    category: $selectedResult.category
  } : null));

  let showPanel = $derived(place !== null);
</script>

{#if showPanel && place}
  <div class="place-panel panel">
    <div class="panel-header">
      <div class="place-panel-header-content">
        <h2 class="panel-title">{place.name}</h2>
        {#if place.category}
          <span class="place-category">{formatCategory(place.category)}</span>
        {/if}
      </div>
      <button class="panel-close" onclick={handleClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    {#if $isLoadingPlace}
      <div class="place-loading">
        <div class="search-loading-spinner"></div>
        <span>Loading details...</span>
      </div>
    {:else}
      <div class="place-content">
        <!-- Address -->
        <div class="place-info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="place-info-icon">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span class="place-info-text">{place.address}</span>
        </div>

        <!-- Phone -->
        {#if place.phone}
          <a href="tel:{place.phone}" class="place-info-row place-info-row--link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="place-info-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span class="place-info-text">{formatPhone(place.phone)}</span>
          </a>
        {/if}

        <!-- Website -->
        {#if place.website}
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            class="place-info-row place-info-row--link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="place-info-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span class="place-info-text place-info-text--truncate">
              {place.website.replace(/^https?:\/\/(www\.)?/, '')}
            </span>
          </a>
        {/if}

        <!-- Rating -->
        {#if place.rating}
          <div class="place-info-row">
            <svg viewBox="0 0 24 24" fill="currentColor" class="place-info-icon place-info-icon--star">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span class="place-info-text">
              {place.rating.toFixed(1)}
              {#if place.reviewCount}
                <span class="place-review-count">({place.reviewCount} reviews)</span>
              {/if}
            </span>
          </div>
        {/if}

        <!-- Business Hours -->
        {#if place.hours}
          <div class="place-hours">
            <div class="place-hours-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="place-info-icon">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span class="place-hours-status" class:place-hours-status--open={place.hours.isOpen}>
                {place.hours.isOpen ? 'Open now' : 'Closed'}
              </span>
            </div>
            {#if place.hours.schedule?.length > 0}
              <div class="place-hours-schedule">
                {#each place.hours.schedule as day}
                  <div class="place-hours-day">
                    <span>{day.day}</span>
                    <span>{day.hours}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Attributes -->
        {#if place.attributes && Object.keys(place.attributes).length > 0}
          <div class="place-attributes">
            {#each Object.entries(place.attributes) as [key, value]}
              <span class="place-attribute">
                {key.replace(/[_:]/g, ' ')}: {value}
              </span>
            {/each}
          </div>
        {/if}

        <!-- Photos (when available) -->
        {#if place.photos && place.photos.length > 0 && $capabilities.places.photos}
          <div class="place-photos">
            {#each place.photos.slice(0, 4) as photo}
              <div class="place-photo">
                <img src={photo.url} alt={place.name} loading="lazy" />
              </div>
            {/each}
          </div>
        {:else if !$capabilities.places.photos}
          <div class="place-premium-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Add Foursquare or Google API key for photos</span>
          </div>
        {/if}

        <!-- Reviews (when available) -->
        {#if place.reviews && place.reviews.length > 0 && $capabilities.places.reviews}
          <div class="place-reviews">
            <h3 class="place-section-title">Reviews</h3>
            {#each place.reviews.slice(0, 3) as review}
              <div class="place-review">
                <div class="place-review-header">
                  <span class="place-review-author">{review.author}</span>
                  <div class="place-review-rating">
                    {#each Array(5) as _, i}
                      <svg
                        viewBox="0 0 24 24"
                        fill={i < review.rating ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        stroke-width="2"
                        class="place-review-star"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    {/each}
                  </div>
                </div>
                <p class="place-review-text">{review.text}</p>
                <span class="place-review-date">{review.date}</span>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Source Badge -->
        <div class="place-source">
          <span>Data from</span>
          <ProviderBadge source={place.source} />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="place-actions">
        <button class="glass-button glass-button--primary" onclick={handleDirections}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Directions
        </button>
        <button class="glass-button" onclick={handleShare}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>
      </div>
    {/if}
  </div>
{/if}
