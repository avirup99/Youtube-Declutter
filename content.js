function injectStyles() {
  if (document.getElementById('focus-mode-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'focus-mode-styles';
  style.textContent = `
    /* Make comments scrollable */
    ytd-comments#comments {
      max-height: 600px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    
    ytd-comments#comments {
      padding-right: 10px;
    }
    
    /* Custom scrollbar styling */
    ytd-comments#comments::-webkit-scrollbar {
      width: 8px;
    }
    
    ytd-comments#comments::-webkit-scrollbar-track {
      background: #0f0f0f;
      border-radius: 4px;
    }
    
    ytd-comments#comments::-webkit-scrollbar-thumb {
      background: #717171;
      border-radius: 4px;
    }
    
    ytd-comments#comments::-webkit-scrollbar-thumb:hover {
      background: #909090;
    }

    /* BLANK HOMEPAGE */
    ytd-browse[page-subtype="home"] ytd-rich-grid-renderer {
      display: none !important;
    }

    /* Hide recommended videos on watch page */
    #secondary #related {
      display: none !important;
    }
    
    ytd-watch-next-secondary-results-renderer {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function applyFocusMode() {
  injectStyles();
  
  // Check if on home page
  const isHomePage = window.location.pathname === '/';
  
  if (isHomePage) {
    // Hide homepage videos
    const richGrid = document.querySelector('ytd-rich-grid-renderer');
    if (richGrid) {
      richGrid.style.display = 'none';
    }
  } else {
    // On watch page - hide only recommendations
    const secondary = document.getElementById("secondary");
    
    if (secondary) {
      const related = secondary.querySelector("#related");
      if (related) {
        related.style.display = "none";
      }
      
      const watchNext = secondary.querySelector("ytd-watch-next-secondary-results-renderer");
      if (watchNext) {
        watchNext.style.display = "none";
      }
      
      // Keep playlist visible
      const playlist = secondary.querySelector("ytd-playlist-panel-renderer");
      if (playlist) {
        playlist.style.display = "";
      }
    }
  }
}

function watchForChanges() {
  let timeout;
  const throttledApply = () => {
    clearTimeout(timeout);
    timeout = setTimeout(applyFocusMode, 100);
  };

  const observer = new MutationObserver(throttledApply);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'hidden']
  });

  return observer;
}

// Apply immediately on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyFocusMode);
} else {
  applyFocusMode();
}

// Set up continuous monitoring
let observer = watchForChanges();

// Handle YouTube's SPA navigation
window.addEventListener("yt-navigate-start", () => {
  if (observer) observer.disconnect();
});

window.addEventListener("yt-navigate-finish", () => {
  applyFocusMode();
  setTimeout(applyFocusMode, 100);
  setTimeout(applyFocusMode, 500);
  setTimeout(applyFocusMode, 1000);
  
  observer = watchForChanges();
});

window.addEventListener("yt-page-data-updated", () => {
  applyFocusMode();
  setTimeout(applyFocusMode, 300);
});