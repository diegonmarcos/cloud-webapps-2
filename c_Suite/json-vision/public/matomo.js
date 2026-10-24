/**
 * Matomo Tracking - JSON Vision Page
 *
 * Tracks:
 * - File operations (open, save)
 * - View mode changes (graph, tree, split)
 * - Graph interactions
 * - Editor actions
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
    var target = e.target.closest('a, button, .graph-node, .file-item, .tab');
    if (!target) return;

    // Graph node clicks
    if (target.classList.contains('graph-node')) {
      var nodePath = target.querySelector('.node-label span')?.textContent.trim() || 'Unknown';
      _paq.push(['trackEvent', 'JSONVision', 'Node Click', nodePath]);
    }

    // File operations
    else if (target.classList.contains('file-item')) {
      var fileName = target.querySelector('.file-name')?.textContent.trim() || 'Unknown';
      _paq.push(['trackEvent', 'JSONVision', 'File Open', fileName]);
    }

    // View mode switches
    else if (target.closest('.view-switcher')) {
      var viewMode = target.textContent.trim() || 'Unknown';
      _paq.push(['trackEvent', 'JSONVision', 'View Mode', viewMode]);
    }

    // Layout toggle
    else if (target.classList.contains('layout-btn')) {
      var layout = target.textContent.includes('Vertical') ? 'Horizontal' : 'Vertical';
      _paq.push(['trackEvent', 'JSONVision', 'Layout Change', layout]);
    }

    // Save button
    else if (target.classList.contains('save-btn')) {
      _paq.push(['trackEvent', 'JSONVision', 'Save', 'Manual Save']);
    }

    // Open folder button
    else if (target.classList.contains('open-folder-btn')) {
      _paq.push(['trackEvent', 'JSONVision', 'Folder', 'Open']);
    }

    // Editor toolbar actions
    else if (target.closest('.toolbar-actions')) {
      var action = target.getAttribute('title') || 'Unknown';
      _paq.push(['trackEvent', 'JSONVision', 'Editor Action', action]);
    }

    // Tab interactions
    else if (target.classList.contains('tab')) {
      _paq.push(['trackEvent', 'JSONVision', 'Tab', 'Switch']);
    }

  });

  // Track files loaded
  window.addEventListener('load', function() {
    setTimeout(function() {
      var fileItems = document.querySelectorAll('.file-item');
      if (fileItems.length > 0) {
        _paq.push(['trackEvent', 'JSONVision', 'Files Available', fileItems.length.toString()]);
      }
    }, 2000);
  });

})();
