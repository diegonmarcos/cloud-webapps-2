/**
 * Matomo Tracking - MyHealth FeedYourself Page
 *
 * Tracks:
 * - Content interactions
 * - Navigation clicks
 * - Feature usage
 *
 * NOTE: Customize based on actual MyHealth FeedYourself page implementation
 */

(function() {
  'use strict';

  if (typeof _paq === 'undefined') {
    console.warn('Matomo not loaded - tracking disabled');
    return;
  }

  // Click tracking
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a, button');
    if (!target) return;

    // Main action buttons
    if (target.classList.contains('feed-action') || target.closest('.action-buttons')) {
      var action = target.textContent.trim() || target.getAttribute('data-action') || 'Unknown';

      _paq.push(['trackEvent', 'MyHealth FeedYourself', 'Action', action]);
    }

    // Content links
    else if (target.closest('.content-area')) {
      var linkText = target.textContent.trim();

      _paq.push(['trackEvent', 'MyHealth FeedYourself', 'Content Link', linkText]);
    }
  });

  // Track page engagement
  _paq.push(['trackEvent', 'MyHealth FeedYourself', 'Page', 'Loaded']);

})();
