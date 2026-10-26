/**
 * Matomo Tracking - Music Page
 *
 * Tracks:
 * - Music interactions
 * - Section navigation
 * - Content engagement
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
    var target = e.target.closest('a, button, .media-card');
    if (!target) return;

    // Media Card clicks
    if (target.classList.contains('media-card')) {
      var itemTitle = target.querySelector('.media-title')?.textContent.trim() || 'Unknown';
      _paq.push(['trackEvent', 'Music', 'Card Click', itemTitle]);
    }
    
    // Winamp controls
    else if (target.closest('.window-controls') || target.closest('.winamp-nav')) {
        var controlName = target.getAttribute('aria-label') || target.textContent.trim() || 'Nav';
        _paq.push(['trackEvent', 'Music', 'Navigation', controlName]);
    }

  });

  // Track scroll engagement
  var scrollDepth = 0;

  window.addEventListener('scroll', function() {
    var scrollPercentage = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);

    if (scrollPercentage > scrollDepth && scrollPercentage % 25 === 0) {
      scrollDepth = scrollPercentage;
      _paq.push(['trackEvent', 'Music', 'Scroll Depth', scrollPercentage + '%']);
    }
  });

})();
