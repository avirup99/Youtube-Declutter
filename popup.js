let allFonts = [];
let currentFont = 'default';
let currentWeight = 400;
let originalFont = 'default';
let originalWeight = 400;

// Popular fonts to show as quick chips
const popularFonts = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Inter', 'Nunito', 'Playfair Display', 'Merriweather'
];

// Weight labels
const weightLabels = {
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi-Bold',
  700: 'Bold',
  800: 'Extra-Bold'
};

// Google Fonts API Key
const GOOGLE_FONTS_API_KEY = 'AIzaSyD4u7FuQJwYQgjwH11FocQUPyUcyi6YfnM';

// ==================== GOOGLE FONTS ====================
async function loadGoogleFonts() {
  if (!GOOGLE_FONTS_API_KEY) {
    console.log('No API key provided, using fallback fonts');
    loadFallbackFonts();
    return;
  }
  
  try {
    console.log('Loading fonts from Google Fonts API...');
    const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    allFonts = data.items.map(font => ({
      family: font.family,
      category: font.category,
      variants: font.variants
    }));
    
    console.log(`Loaded ${allFonts.length} fonts from API`);
    populateFontList(allFonts);
    updateFontCount(allFonts.length, 'API');
    
  } catch (error) {
    console.error('Error loading Google Fonts API:', error);
    console.log('Falling back to hardcoded font list');
    loadFallbackFonts();
  }
}

function loadFallbackFonts() {
  const fallbackFonts = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Inter',
    'Nunito', 'Ubuntu', 'Mukta', 'Rubik', 'Work Sans', 'Noto Sans', 'Oswald', 
    'Source Sans Pro', 'Fira Sans', 'Quicksand', 'Karla', 'Bebas Neue', 'Oxygen', 
    'Playfair Display', 'Merriweather', 'Libre Baskerville', 'PT Serif'
  ];
  
  allFonts = fallbackFonts.map(font => ({
    family: font,
    category: 'sans-serif',
    variants: ['regular']
  }));
  
  console.log(`Loaded ${allFonts.length} fallback fonts`);
  populateFontList(allFonts);
  updateFontCount(allFonts.length, 'Fallback');
}

function populateFontList(fonts) {
  const select = document.getElementById('font-select');
  select.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = 'default';
  defaultOption.textContent = 'YouTube Default';
  select.appendChild(defaultOption);
  
  fonts.forEach(font => {
    const option = document.createElement('option');
    option.value = font.family;
    option.textContent = `${font.family} (${font.category})`;
    select.appendChild(option);
  });
}

function updateFontCount(count, source) {
  const sourceLabel = source === 'API' ? '🌐 from Google Fonts API' : '📦 built-in fonts';
  document.getElementById('font-count').textContent = `${count} ${sourceLabel}`;
}

function updateCurrentFontDisplay(fontFamily, weight) {
  const fontNameEl = document.getElementById('current-font-name');
  const fontDetailsEl = document.getElementById('current-font-details');
  
  if (fontFamily === 'default') {
    fontNameEl.textContent = 'YouTube Default';
    fontNameEl.style.fontFamily = 'Roboto, Arial, sans-serif';
    fontDetailsEl.textContent = 'Weight: Regular (400)';
  } else {
    fontNameEl.textContent = fontFamily;
    fontNameEl.style.fontFamily = `'${fontFamily}', sans-serif`;
    fontNameEl.style.fontWeight = weight;
    fontDetailsEl.textContent = `Weight: ${weightLabels[weight]} (${weight})`;
  }
  
  console.log('Updated current font display:', fontFamily, weight);
}

// Search functionality
document.getElementById('font-search').addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  
  if (searchTerm === '') {
    populateFontList(allFonts);
    updateFontCount(allFonts.length, GOOGLE_FONTS_API_KEY ? 'API' : 'Fallback');
  } else {
    const filtered = allFonts.filter(font => 
      font.family.toLowerCase().includes(searchTerm) ||
      font.category.toLowerCase().includes(searchTerm)
    );
    populateFontList(filtered);
    document.getElementById('font-count').textContent = `${filtered.length} fonts found`;
  }
});

function populatePopularChips() {
  const container = document.getElementById('popular-chips');
  container.innerHTML = '';
  
  popularFonts.forEach(fontName => {
    const chip = document.createElement('span');
    chip.className = 'font-chip';
    chip.textContent = fontName;
    chip.addEventListener('click', () => {
      document.getElementById('font-select').value = fontName;
      updatePreview(fontName, currentWeight);
      loadGoogleFont(fontName, currentWeight);
    });
    container.appendChild(chip);
  });
}

// focus mode toggle

// Load focus mode state
chrome.storage.sync.get(['focusModeEnabled'], function(result) {
  const focusModeEnabled = result.focusModeEnabled !== undefined ? result.focusModeEnabled : true;
  updateFocusModeButton(focusModeEnabled);
});

// Toggle button click handler
document.getElementById('toggle-focus-btn').addEventListener('click', function() {
  chrome.storage.sync.get(['focusModeEnabled'], function(result) {
    const currentState = result.focusModeEnabled !== undefined ? result.focusModeEnabled : true;
    const newState = !currentState;
    
    chrome.storage.sync.set({ focusModeEnabled: newState }, function() {
      updateFocusModeButton(newState);
      
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'toggleFocusMode', enabled: newState },
            function(response) {
              if (chrome.runtime.lastError) {
                showStatus('Please refresh the page to apply changes', false);
              } else {
                showStatus(newState ? 'Focus Mode ON' : 'Focus Mode OFF', false);
              }
            }
          );
        }
      });
    });
  });
});

function updateFocusModeButton(enabled) {
  const btn = document.getElementById('toggle-focus-btn');
  if (enabled) {
    btn.textContent = '🎯 Focus Mode: ON';
    btn.style.background = '#ea4335';
  } else {
    btn.textContent = '📺 Focus Mode: OFF';
    btn.style.background = '#34a853';
  }
}

// Weight button handling
document.querySelectorAll('.weight-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    
    document.querySelectorAll('.weight-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    currentWeight = parseInt(this.dataset.weight);
    
    const selectedFont = document.getElementById('font-select').value;
    updatePreview(selectedFont, currentWeight);
    
    if (selectedFont !== 'default') {
      loadGoogleFont(selectedFont, currentWeight);
    }
  });
});

// Load saved font preference
chrome.storage.sync.get(['selectedFont', 'fontWeight'], function(result) {
  console.log('Popup: Loaded from storage:', result);
  
  currentFont = result.selectedFont || 'default';
  currentWeight = result.fontWeight || 400;
  originalFont = currentFont;
  originalWeight = currentWeight;
  
  console.log('Setting current font:', currentFont, 'weight:', currentWeight);
  
  document.getElementById('font-select').value = currentFont;
  
  document.querySelectorAll('.weight-btn').forEach(btn => {
    btn.classList.remove('active');
    if (parseInt(btn.dataset.weight) === currentWeight) {
      btn.classList.add('active');
    }
  });
  
  updateCurrentFontDisplay(currentFont, currentWeight);
  updatePreview(currentFont, currentWeight);
  
  if (currentFont !== 'default') {
    loadGoogleFont(currentFont, currentWeight);
  }
});

// Listen for font selection changes
document.getElementById('font-select').addEventListener('change', function(e) {
  const selectedFont = e.target.value;
  updatePreview(selectedFont, currentWeight);
  if (selectedFont !== 'default') {
    loadGoogleFont(selectedFont, currentWeight);
  }
});

// Apply button
document.getElementById('apply-btn').addEventListener('click', function() {
  const selectedFont = document.getElementById('font-select').value;
  
  if (!selectedFont || selectedFont === '') {
    showStatus('Please select a font', true);
    return;
  }
  
  if (selectedFont === originalFont && currentWeight === originalWeight) {
    showStatus('No changes have been made', false);
    return;
  }

  currentFont = selectedFont;
  
  chrome.storage.sync.set({ 
    selectedFont: selectedFont,
    fontWeight: currentWeight 
  }, function() {
    updateCurrentFontDisplay(selectedFont, currentWeight);
    originalFont = selectedFont;
    originalWeight = currentWeight;
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id, 
          {
            action: 'changeFont',
            font: selectedFont,
            weight: currentWeight
          },
          function(response) {
            if (chrome.runtime.lastError) {
              showStatus('Error! Please refresh the page.', true);
            } else {
              showStatus('Font applied!', false);
            }
          }
        );
      }
    });
  });
});

// Reset button
document.getElementById('reset-btn').addEventListener('click', function() {
  if (originalFont === 'default' && originalWeight === 400) {
    showStatus('No changes have been made', false);
    return;
  }
  
  document.getElementById('font-select').value = 'default';
  currentFont = 'default';
  currentWeight = 400;
  
  document.querySelectorAll('.weight-btn').forEach(btn => {
    btn.classList.remove('active');
    if (parseInt(btn.dataset.weight) === 400) {
      btn.classList.add('active');
    }
  });
  
  updateCurrentFontDisplay('default', 400);
  updatePreview('default', 400);
  
  chrome.storage.sync.set({ 
    selectedFont: 'default',
    fontWeight: 400 
  }, function() {
    originalFont = 'default';
    originalWeight = 400;
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: 'changeFont',
            font: 'default',
            weight: 400
          },
          function(response) {
            if (chrome.runtime.lastError) {
              showStatus('Error! Please refresh the page.', true);
            } else {
              showStatus('Reset to default!', false);
            }
          }
        );
      }
    });
  });
});

function updatePreview(font, weight) {
  const preview = document.getElementById('preview');
  if (font === 'default') {
    preview.style.fontFamily = 'Roboto, Arial, sans-serif';
    preview.style.fontWeight = '400';
  } else {
    preview.style.fontFamily = `'${font}', sans-serif`;
    preview.style.fontWeight = weight.toString();
  }
}

function loadGoogleFont(fontFamily, weight) {
  if (fontFamily === 'default') return;
  
  const fontName = fontFamily.replace(/ /g, '+');
  const linkId = 'google-font-preview';
  
  const existingLink = document.getElementById(linkId);
  if (existingLink) {
    existingLink.remove();
  }
  
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function showStatus(message, isError) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.background = isError ? '#f8d7da' : '#d4edda';
  status.style.color = isError ? '#721c24' : '#155724';
  status.style.display = 'block';
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}

// initialize everything
console.log('Initializing popup...');

loadGoogleFonts();
populatePopularChips();
console.log('Popup initialized!');
