console.log('YouTube Declutter: Content script loaded');

function applyCustomFont(fontFamily, fontWeight = 400) {
  console.log('Applying font:', fontFamily, 'weight:', fontWeight);
  
  let fontStyleId = 'youtube-custom-font';
  let fontLinkId = 'youtube-google-font-link';
  
  // Remove existing styles
  const existingStyle = document.getElementById(fontStyleId);
  const existingLink = document.getElementById(fontLinkId);
  
  if (existingStyle) existingStyle.remove();
  if (existingLink) existingLink.remove();
  
  if (fontFamily === 'default') {
    console.log('Using default font');
    return;
  }
  
  // Load Google Font with all weights
  const fontName = fontFamily.replace(/ /g, '+');
  const link = document.createElement('link');
  link.id = fontLinkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
  console.log('Google Font link added:', link.href);
  
  // Apply font with weight to all elements
  const style = document.createElement('style');
  style.id = fontStyleId;
  style.textContent = `
    * {
      font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-weight: ${fontWeight} !important;
    }
    
    /* Preserve icon fonts */
    .yt-icon,
    [class*="icon"],
    ytd-button-renderer yt-icon,
    yt-icon-button,
    .ytd-topbar-menu-button-renderer {
      font-family: "YouTube Icons", "Material Icons" !important;
    }
    
    /* Preserve code fonts */
    code, pre, kbd, samp {
      font-family: 'Courier New', monospace !important;
    }
    
    /* Respect headings weight variations */
    h1 { font-weight: ${Math.min(fontWeight + 200, 900)} !important; }
    h2 { font-weight: ${Math.min(fontWeight + 100, 900)} !important; }
    h3 { font-weight: ${Math.min(fontWeight + 100, 900)} !important; }
    
    /* Keep buttons slightly bolder */
    button, .button {
      font-weight: ${Math.min(fontWeight + 100, 900)} !important;
    }
  `;
  document.head.appendChild(style);
  console.log('Font style applied to main document');
  
  // Apply to iframes (playlist, live chat, etc.)
  applyFontToIframes(fontFamily, fontWeight);
}

// Function to apply font to all iframes
function applyFontToIframes(fontFamily, fontWeight = 400) {
  console.log('Checking iframes...');
  
  const iframes = document.querySelectorAll('iframe');
  console.log('Found', iframes.length, 'iframes');
  
  iframes.forEach((iframe, index) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      if (iframeDoc) {
        console.log('Applying font to iframe', index);
        
        // Remove existing styles
        const existingStyle = iframeDoc.getElementById('youtube-custom-font');
        const existingLink = iframeDoc.getElementById('youtube-google-font-link');
        
        if (existingStyle) existingStyle.remove();
        if (existingLink) existingLink.remove();
        
        if (fontFamily === 'default') return;
        
        // Add Google Font link to iframe
        const fontName = fontFamily.replace(/ /g, '+');
        const link = iframeDoc.createElement('link');
        link.id = 'youtube-google-font-link';
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700;800&display=swap`;
        iframeDoc.head.appendChild(link);
        
        // Add font style to iframe
        const style = iframeDoc.createElement('style');
        style.id = 'youtube-custom-font';
        style.textContent = `
          * {
            font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-weight: ${fontWeight} !important;
          }
          
          .yt-icon,
          [class*="icon"] {
            font-family: "YouTube Icons", "Material Icons" !important;
          }
        `;
        iframeDoc.head.appendChild(style);
        
        console.log('Font applied to iframe', index);
      }
    } catch (e) {
      console.log('Cannot access iframe', index, '(cross-origin):', e.message);
    }
  });
}

// Watch for new iframes
function watchForIframes(fontFamily, fontWeight) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'IFRAME') {
          console.log('New iframe detected, applying font...');
          setTimeout(() => {
            applyFontToIframes(fontFamily, fontWeight);
          }, 500);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
}

let iframeObserver = null;

function applyCustomColors(fontColor, bgColor) {
  console.log('Applying colors - Font:', fontColor, 'Background:', bgColor);
  
  let colorStyleId = 'youtube-custom-colors';
  
  // Remove existing color styles
  const existingColorStyle = document.getElementById(colorStyleId);
  if (existingColorStyle) existingColorStyle.remove();
  
  // Apply custom colors with SPECIFIC selectors (not *)
  const style = document.createElement('style');
  style.id = colorStyleId;
  style.textContent = `
    /* No custom colors applied - YouTube uses default theme */
  `;
  document.head.appendChild(style);
  console.log('Custom colors applied');
}


// Load saved font on page load
chrome.storage.sync.get(['selectedFont', 'fontWeight'], function(result) {
  console.log('Loaded from storage:', result);
  const font = result.selectedFont || 'default';
  const weight = result.fontWeight || 400;
  
  if (font !== 'default') {
    applyCustomFont(font, weight);
    
    if (iframeObserver) iframeObserver.disconnect();
    iframeObserver = watchForIframes(font, weight);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received:', request);
  
  if (request.action === 'changeFont') {
    const font = request.font || 'default';
    const weight = request.weight || 400;
    
    applyCustomFont(font, weight);
    
    if (iframeObserver) iframeObserver.disconnect();
    if (font !== 'default') {
      iframeObserver = watchForIframes(font, weight);
    }
    
    sendResponse({ status: 'Font changed successfully' });
  }
  
  return true;
});

// ============================================
// FOCUS MODE (Your existing code)
// ============================================

function injectStyles() {
  if (document.getElementById('focus-mode-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'focus-mode-styles';
  style.textContent = `
    ytd-comments#comments {
      max-height: 600px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    
    ytd-comments#comments {
      padding-right: 10px;
    }
    
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

    ytd-browse[page-subtype="home"] ytd-rich-grid-renderer {
      display: none !important;
    }

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
  
  const isHomePage = window.location.pathname === '/';
  
  if (isHomePage) {
    const richGrid = document.querySelector('ytd-rich-grid-renderer');
    if (richGrid) {
      richGrid.style.display = 'none';
    }
  } else {
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyFocusMode);
} else {
  applyFocusMode();
}

let observer = watchForChanges();

window.addEventListener("yt-navigate-start", () => {
  if (observer) observer.disconnect();
});

window.addEventListener("yt-navigate-finish", () => {
  applyFocusMode();
  setTimeout(applyFocusMode, 100);
  setTimeout(applyFocusMode, 500);
  setTimeout(applyFocusMode, 1000);
  
  // Re-apply font after navigation
  chrome.storage.sync.get(['selectedFont', 'fontWeight'], function(result) {
    const font = result.selectedFont || 'default';
    const weight = result.fontWeight || 400;
    
    if (font !== 'default') {
      applyCustomFont(font, weight);
      
      setTimeout(() => {
        applyFontToIframes(font, weight);
      }, 1000);
      
      setTimeout(() => {
        applyFontToIframes(font, weight);
      }, 2000);
      
      if (iframeObserver) iframeObserver.disconnect();
      iframeObserver = watchForIframes(font, weight);
    }
  });
 
  observer = watchForChanges();
});

window.addEventListener("yt-page-data-updated", () => {
  applyFocusMode();
  setTimeout(applyFocusMode, 300);
});

