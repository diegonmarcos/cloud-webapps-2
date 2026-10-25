/**
 * Matomo Tracking - MyMaps Page
 *
 * Tracks:
 * - Map interactions
 * - Location selections
 * - Zoom/pan controls
 * - Layer toggles
 * - Search usage
 */

(function() {
  'use strict';

  if (typeof _paq === 'undefined') {
    console.warn('Matomo not loaded - tracking disabled');
    return;
  }

  // Click tracking
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a, button, .map-marker, .location-item, .layer-toggle');
    if (!target) return;

    // Map marker clicks
    if (target.classList.contains('map-marker')) {
      var location = target.getAttribute('data-location') || target.textContent.trim();

      _paq.push(['trackEvent', 'MyMaps', 'Marker Click', location]);
    }

    // Location list items
    else if (target.classList.contains('location-item')) {
      var locationName = target.getAttribute('data-name') || target.textContent.trim();

      _paq.push(['trackEvent', 'MyMaps', 'Location Select', locationName]);
    }

    // Layer toggles
    else if (target.classList.contains('layer-toggle')) {
      var layer = target.getAttribute('data-layer') || target.textContent.trim();

      _paq.push(['trackEvent', 'MyMaps', 'Layer Toggle', layer]);
    }

    // Zoom controls
    else if (target.classList.contains('zoom-in') || target.id === 'zoom-in') {
      _paq.push(['trackEvent', 'MyMaps', 'Zoom', 'In']);
    }

    else if (target.classList.contains('zoom-out') || target.id === 'zoom-out') {
      _paq.push(['trackEvent', 'MyMaps', 'Zoom', 'Out']);
    }

    // Theme toggle
    else if (target.id === 'theme-toggle') {
      _paq.push(['trackEvent', 'MyMaps', 'Theme', 'Toggle']);
    }
  });

  // Track search usage
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form.classList.contains('search-form') || form.id === 'map-search') {
      var searchInput = form.querySelector('input[type="text"], input[type="search"]');
      if (searchInput && searchInput.value) {
        _paq.push(['trackEvent', 'MyMaps', 'Search', searchInput.value]);
      }
    }
  });

  // Track page load
  window.addEventListener('load', function() {
    var markers = document.querySelectorAll('.map-marker');
    var layers = document.querySelectorAll('.layer-toggle');

    if (markers.length > 0) {
      _paq.push(['trackEvent', 'MyMaps', 'Markers Loaded', markers.length.toString()]);
    }

    if (layers.length > 0) {
      _paq.push(['trackEvent', 'MyMaps', 'Layers Available', layers.length.toString()]);
    }
  });

})();
