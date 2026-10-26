/**
 * Matomo Tracking - Movies Page
 *
 * Tracks:
 * - Movie card interactions
 * - Tab navigation (Home, Movies 2025, Series 2025, Staff Picks)
 * - Search usage
 * - Trailer clicks
 *
 */

(function() {
  'use strict';

  if (typeof _paq === 'undefined') {
    console.warn('Matomo not loaded - tracking disabled');
    return;
  }

  // Click tracking
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a, button, .card');
    if (!target) return;

    // Movie Card clicks
    if (target.classList.contains('card')) {
      var itemTitle = target.querySelector('.card-title')?.textContent.trim() || 'Unknown';
      _paq.push(['trackEvent', 'Movies', 'Card Click', itemTitle]);
    }

    // Watch Trailer button
    else if (target.classList.contains('watch-btn')) {
      var movieTitle = target.closest('.card')?.querySelector('.card-title')?.textContent.trim() || 'Unknown';
      _paq.push(['trackEvent', 'Movies', 'Watch Trailer', movieTitle]);
    }

    // Tab navigation buttons
    else if (target.classList.contains('secondary')) {
      var tabName = target.textContent.trim() || 'Unknown';
      _paq.push(['trackEvent', 'Movies', 'Tab Click', tabName]);
    }

    // Search submit
    else if (target.classList.contains('primary') && target.textContent.includes('Search')) {
      _paq.push(['trackEvent', 'Movies', 'Search', 'Submit']);
    }

  });

  // Track scroll engagement
  var scrollDepth = 0;

  window.addEventListener('scroll', function() {
    var scrollPercentage = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);

    if (scrollPercentage > scrollDepth && scrollPercentage % 25 === 0) {
      scrollDepth = scrollPercentage;
      _paq.push(['trackEvent', 'Movies', 'Scroll Depth', scrollPercentage + '%']);
    }
  });

})();
