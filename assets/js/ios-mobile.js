/**
 * iOS-Style Mobile Interface JavaScript
 * Adds iOS-like behaviors and elements for mobile users
 */

document.addEventListener('DOMContentLoaded', function() {
  // Only run on mobile devices
  if (window.innerWidth <= 767) {
    initMobileInterface();
    
    // Store that mobile interface is initialized in sessionStorage
    sessionStorage.setItem('mobileInterfaceInitialized', 'true');
  }
});

// Also check on window load to ensure the mobile design persists after navigation
window.addEventListener('load', function() {
  // Only run on mobile devices
  if (window.innerWidth <= 767) {
    // Check if we need to re-initialize (coming from a different page)
    if (!document.querySelector('.mobile-nav')) {
      initMobileInterface();
    }
    
    // Make sure mobile design is visible
    enforceMobileStyle();
  }
});

// Handle back/forward navigation with popstate event
window.addEventListener('popstate', function() {
  if (window.innerWidth <= 767) {
    // Re-apply mobile interface if needed
    setTimeout(function() {
      if (!document.querySelector('.mobile-nav')) {
        initMobileInterface();
      }
      enforceMobileStyle();
    }, 100);
  }
});

// Additional function to enforce mobile styling
function enforceMobileStyle() {
  // Only apply mobile styles if window width is mobile
  if (window.innerWidth > 767) return;

  // Hide regular header and footer
  const header = document.querySelector('header, #header-container');
  const footer = document.querySelector('footer, #footer-container');
  const disclaimer = document.querySelector('#disclaimer-container');
  const copyright = document.querySelector('#copyright-container');
  
  if (header) header.style.display = 'none';
  if (footer) footer.style.display = 'none';
  if (disclaimer) disclaimer.style.display = 'none';
  if (copyright) copyright.style.display = 'none';
  
  // Update page title - need to do this here as well for navigation
  updatePageTitle();
  
  // Re-apply curriculum bar hiding
  const curriculumBars = document.querySelectorAll('header .curriculum-bar, #curriculum-bar, .top-menu-bar, header .curriculum-nav, #top-nav, header .navigation-bar, .curriculum-reference');
  curriculumBars.forEach(bar => {
    if (bar) bar.style.display = 'none';
  });
  
  // Make sure mobile nav is visible and positioned correctly
  const mobileNav = document.querySelector('.mobile-nav');
  if (mobileNav) {
    mobileNav.style.display = 'flex';
    mobileNav.style.bottom = '0';
    mobileNav.style.position = 'fixed';
  }
}

// New function to handle page title updates
function updatePageTitle() {
  // Log the original title for debugging
  console.log("Original title:", document.title);
  
  // Get current page path for better title detection
  const currentPath = window.location.pathname;
  const pageName = currentPath.split('/').pop() || 'index.html';
  
  console.log("Current page:", pageName);
  
  // Set default title based on page name if other methods fail
  let pageTitle = 'Home';
  
  // Map of page filenames to their titles - only show the name, no "title" text
  const pageTitles = {
    'index.html': 'Home',
    'epilepsy_rotation.html': 'Rotation',
    'seizure_management.html': 'Seizures',
    'ilae_classification.html': 'ILAE',
    'natus_instructions.html': 'EEG Software',
    'acns_criteria.html': 'ACNS',
    'question_bank.html': 'Quiz',
    'eeg_waveforms.html': 'Waveforms',
    'eeg_videos.html': 'Videos',
    'eeg_atlas.html': 'Atlas',
    'faq.html': 'Resources',
    'discussion.html': 'Forum',
    'eeg_lead_practice.html': 'Lead Practice'
  };
  
  // First try to get title from our mapping
  if (pageTitles[pageName]) {
    pageTitle = pageTitles[pageName];
  } else {
    // If not in our mapping, try to extract from document.title
    pageTitle = document.title
      .replace(' - EEG Learning', '')
      .replace(' - EEG Explorer', '')
      .replace('EEG Explorer', '')
      .replace('EEG Learning', 'Home')
      .replace('ILAE Classification of the Epilepsies', 'ILAE')
      .replace('Epilepsy Rotation', 'Rotation')
      .replace('Seizure Management', 'Seizures')
      .replace('Question Bank', 'Quiz')
      .replace('EEG Waveforms', 'Waveforms')
      .replace('EEG Videos', 'Videos')
      .replace('EEG Atlas', 'Atlas')
      .replace('Natus', 'EEG Software')
      .replace('ACNS Criteria', 'ACNS')
      .trim();
  }
  
  console.log("Final page title:", pageTitle);
  
  // Add page title at the top if it doesn't exist
  if (!document.querySelector('.ios-page-title')) {
    const pageTitleElement = document.createElement('div');
    pageTitleElement.className = 'ios-page-title';
    pageTitleElement.textContent = pageTitle;
    document.body.insertBefore(pageTitleElement, document.body.firstChild);
    
    // Apply dark styling to the new page title
    setTimeout(() => {
      applyPageTitleStyle(pageTitleElement);
    }, 10);
  } else {
    // Update the existing page title
    document.querySelector('.ios-page-title').textContent = pageTitle;
  }
}

// Helper function to apply dark styling to page title
function applyPageTitleStyle(pageTitleElement) {
  const titleElement = pageTitleElement || document.querySelector('.ios-page-title');
  if (titleElement) {
    titleElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 900 !important;
      background-color: rgba(60, 60, 67, 0.95) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      border-bottom: 1px solid rgba(80, 80, 90, 0.3) !important;
      padding: 0 16px !important;
      height: 44px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: calc(var(--base-font-size) + 2px) !important;
      font-weight: 600 !important;
      color: white !important;
      letter-spacing: -0.2px !important;
      transition: all var(--ios-transition) !important;
      padding-top: var(--ios-safe-area-top) !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
      text-align: center !important;
      min-height: calc(44px + var(--ios-safe-area-top)) !important;
    `;
    
    // Apply different style for dark mode
    if (document.body.classList.contains('dark')) {
      titleElement.style.cssText += `
        background-color: rgba(28, 28, 30, 0.95) !important;
        border-bottom-color: #38383a !important;
      `;
    }
  }
}

/**
 * Initializes the mobile interface
 */
function initMobileInterface() {
  // Hide header and footer on mobile
  const header = document.querySelector('header, #header-container');
  const footer = document.querySelector('footer, #footer-container');
  const disclaimer = document.querySelector('#disclaimer-container');
  const copyright = document.querySelector('#copyright-container');
  
  if (header) header.style.display = 'none';
  if (footer) footer.style.display = 'none';
  if (disclaimer) disclaimer.style.display = 'none';
  if (copyright) copyright.style.display = 'none';
  
  // Update page title
  updatePageTitle();
  
  // Apply custom styling to the page title to match the bottom bar
  const pageTitle = document.querySelector('.ios-page-title');
  if (pageTitle) {
    applyPageTitleStyle(pageTitle);
  }
  
  // Handle any EEG Curriculum elements by hiding them
  const curriculumBars = document.querySelectorAll('header .curriculum-bar, #curriculum-bar, .top-menu-bar, header .curriculum-nav, #top-nav, header .navigation-bar, .curriculum-reference');
  curriculumBars.forEach(bar => {
    if (bar) bar.style.display = 'none';
  });
  
  // Specifically target elements with "EEG Curriculum" text and hide them
  document.querySelectorAll('header *, .page-header *, div[class*="header"] *, .top-section *').forEach(element => {
    if (element.textContent === 'EEG Curriculum') {
      // Go up to find a reasonable container to hide
      let parent = element;
      // Try to get a parent container, but not body or main elements
      for (let i = 0; i < 3; i++) {
        if (parent.parentElement && 
            parent.parentElement.tagName !== 'BODY' && 
            parent.parentElement.tagName !== 'MAIN') {
          parent = parent.parentElement;
        } else {
          break;
        }
      }
      parent.style.display = 'none';
    }
  });
  
  // Initialize dark mode from localStorage
  initDarkMode();
  
  // Initialize font size from localStorage
  initFontSize();
  
  // Only create tab bar if it doesn't already exist
  if (!document.querySelector('.mobile-nav')) {
    createTabBar();
  }
  
  setupSearchBar();
  handleSafeAreas();
  setupEventListeners();
  
  // Remove any existing sheets - this prevents auto-showing on page load
  const existingSheets = document.querySelectorAll('.ios-sheet');
  existingSheets.forEach(sheet => sheet.remove());
  
  // Keep monitoring for curriculum bars that might be added later
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        // More specific selectors to avoid affecting mobile navigation
        const newCurriculumBars = document.querySelectorAll('header .curriculum-bar, #curriculum-bar, .top-menu-bar, header .curriculum-nav, #top-nav, header .navigation-bar, .curriculum-reference');
        newCurriculumBars.forEach(bar => {
          if (bar && bar.style.display !== 'none') {
            bar.style.display = 'none';
          }
        });
        
        // Check for newly added elements with "EEG Curriculum" text in headers or top sections
        document.querySelectorAll('header *, .page-header *, div[class*="header"] *, .top-section *').forEach(element => {
          if (element.textContent === 'EEG Curriculum') {
            // Go up to find a reasonable container to hide
            let parent = element;
            // Try to get a parent container, but not body or main elements
            for (let i = 0; i < 3; i++) {
              if (parent.parentElement && 
                  parent.parentElement.tagName !== 'BODY' && 
                  parent.parentElement.tagName !== 'MAIN') {
                parent = parent.parentElement;
              } else {
                break;
              }
            }
            parent.style.display = 'none';
          }
        });
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Initializes dark mode from localStorage
 */
function initDarkMode() {
  const darkMode = localStorage.getItem('darkMode');
  if (darkMode === 'true') {
    document.body.classList.add('dark');
  } else if (darkMode === 'false') {
    document.body.classList.remove('dark');
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // If no preference set but system is dark mode, enable dark mode
    document.body.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }
}

/**
 * Initializes font size from localStorage
 */
function initFontSize() {
  const bigFont = localStorage.getItem('bigFont');
  let fontSizeValue = '16px'; // Default normal size
  
  if (bigFont === 'true') {
    fontSizeValue = '18px';
    document.body.classList.add('large-font');
  } else {
    document.body.classList.remove('large-font');
  }
  
  document.documentElement.style.setProperty('--base-font-size', fontSizeValue);
  document.documentElement.style.setProperty('--small-font-size', 
    bigFont === 'true' ? '16px' : '14px'); // Adjust small font size based on base size
  document.documentElement.style.setProperty('--large-font-size', 
    bigFont === 'true' ? '20px' : '18px'); // Adjust large font size based on base size
    
  // Dispatch a storage event for other scripts to detect the change
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'bigFont',
      newValue: bigFont,
      oldValue: bigFont === 'true' ? 'false' : 'true',
      storageArea: localStorage
    }));
  } catch (e) {
    console.error('Error dispatching storage event:', e);
  }
}

/**
 * Creates the iOS-style tab bar at the bottom of the screen
 */
function createTabBar() {
  // Remove existing tab bar if present
  const existingTabBar = document.querySelector('.mobile-nav');
  if (existingTabBar) {
    existingTabBar.remove();
  }

  const tabBar = document.createElement('nav');
  tabBar.className = 'mobile-nav';
  
  // Force the styling directly in JavaScript using darker colors
  // Use !important flag to override any existing styles
  tabBar.style.cssText = `
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 60px !important;
    padding-bottom: var(--ios-safe-area-bottom) !important;
    background-color: rgba(60, 60, 67, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    border-top: 1px solid rgba(80, 80, 90, 0.3) !important;
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    z-index: 1000 !important;
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1) !important;
    color: white !important;
  `;
  
  // Apply dark mode styling if needed - even darker in dark mode
  if (document.body.classList.contains('dark')) {
    tabBar.style.cssText += `
      background-color: rgba(28, 28, 30, 0.95) !important;
      border-top-color: #38383a !important;
    `;
  }
  
  // Define tab items - removed epilepsy and seizure tabs, keeping only essential navigation
  const tabs = [
    { icon: 'fa-solid fa-house', label: 'Home', url: 'index.html' },
    { icon: 'fa-solid fa-bars', label: 'Menu', url: '#search' },
    { icon: 'fa-solid fa-cog', label: 'Settings', url: '#settings' }
  ];
  
  // Create tabs
  tabs.forEach(tab => {
    const tabLink = document.createElement('a');
    tabLink.href = tab.url;
    tabLink.setAttribute('aria-label', tab.label); // Add aria-label for accessibility
    tabLink.style.cssText = 'color: white !important; flex: 1 !important; display: flex !important; align-items: center !important; justify-content: center !important; height: 100% !important;';
    
    // Set as active if it's the current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (tab.url === currentPage) {
      tabLink.className = 'active';
      tabLink.style.color = '#0A84FF !important'; // iOS blue for active tab
    }
    
    // Add tab icon
    const icon = document.createElement('i');
    icon.className = tab.icon;
    icon.setAttribute('aria-hidden', 'true');
    icon.style.cssText = 'font-size: 24px !important;';
    tabLink.appendChild(icon);
    
    // Don't add text label anymore to save space
    
    tabBar.appendChild(tabLink);
  });
  
  // Add the tab bar to the document
  document.body.appendChild(tabBar);
  
  // Add event listeners for special tabs
  const searchTab = document.querySelector('.mobile-nav a[href="#search"]');
  if (searchTab) {
    searchTab.addEventListener('click', function(e) {
      e.preventDefault();
      showSearchSheet();
    });
  }
  
  const settingsTab = document.querySelector('.mobile-nav a[href="#settings"]');
  if (settingsTab) {
    settingsTab.addEventListener('click', function(e) {
      e.preventDefault();
      showSettingsSheet();
    });
  }
  
  // Listen for dark mode changes to update tab bar
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target === document.body && mutation.attributeName === 'class') {
        // Update bottom navigation bar
        if (document.body.classList.contains('dark')) {
          tabBar.style.cssText += `
            background-color: rgba(28, 28, 30, 0.95) !important;
            border-top-color: #38383a !important;
          `;
        } else {
          tabBar.style.cssText += `
            background-color: rgba(60, 60, 67, 0.95) !important;
            border-top-color: rgba(80, 80, 90, 0.3) !important;
          `;
        }
        
        // Update tab colors
        const tabs = document.querySelectorAll('.mobile-nav a');
        tabs.forEach(tab => {
          if (tab.classList.contains('active')) {
            tab.style.cssText += 'color: #0A84FF !important;'; // iOS blue for active tab
          } else {
            tab.style.cssText += 'color: white !important;';
          }
        });

        // Update top page title bar to match
        const pageTitle = document.querySelector('.ios-page-title');
        if (pageTitle) {
          if (document.body.classList.contains('dark')) {
            pageTitle.style.cssText += `
              background-color: rgba(28, 28, 30, 0.95) !important;
              border-bottom-color: #38383a !important;
              color: white !important;
            `;
          } else {
            pageTitle.style.cssText += `
              background-color: rgba(60, 60, 67, 0.95) !important;
              border-bottom-color: rgba(80, 80, 90, 0.3) !important;
              color: white !important;
            `;
          }
        }
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
}

/**
 * Shows the search/menu bottom sheet
 */
function showSearchSheet() {
  // Remove existing sheet if any
  const existingSheet = document.querySelector('.ios-sheet');
  if (existingSheet) {
    existingSheet.remove();
  }
  
  // Create search sheet
  const sheet = document.createElement('div');
  sheet.className = 'ios-sheet ios-fullscreen-sheet';
  
  // Add drag handle
  const handle = document.createElement('div');
  handle.className = 'ios-sheet-handle';
  sheet.appendChild(handle);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'ios-sheet-close';
  closeButton.innerHTML = '<i class="fa-solid fa-times"></i>';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '15px';
  closeButton.style.right = '15px';
  closeButton.style.background = 'rgba(142, 142, 147, 0.2)';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '50%';
  closeButton.style.width = '32px';
  closeButton.style.height = '32px';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  closeButton.style.fontSize = '16px';
  closeButton.style.color = 'var(--ios-gray)';
  sheet.appendChild(closeButton);
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Menu';
  title.style.fontSize = '20px';
  title.style.fontWeight = '600';
  title.style.marginBottom = '16px';
  title.style.textAlign = 'center';
  title.style.marginTop = '15px';
  sheet.appendChild(title);
  
  // Add search input
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-container';
  searchContainer.style.padding = '0 16px';
  searchContainer.style.marginBottom = '16px';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'search-box';
  searchInput.placeholder = 'Search EEG Learning...';
  searchInput.id = 'ios-search-input';
  searchContainer.appendChild(searchInput);
  
  sheet.appendChild(searchContainer);
  
  // Add quick links header
  const quickLinksHeader = document.createElement('div');
  quickLinksHeader.style.padding = '0 16px 8px';
  quickLinksHeader.style.fontSize = '14px';
  quickLinksHeader.style.fontWeight = '600';
  quickLinksHeader.style.color = 'var(--ios-gray)';
  quickLinksHeader.textContent = 'Quick Navigation';
  sheet.appendChild(quickLinksHeader);
  
  // Add search results container
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'ios-search-results';
  resultsContainer.style.overflow = 'auto';
  resultsContainer.style.height = 'calc(100% - 170px)';
  resultsContainer.style.padding = '0 16px';
  sheet.appendChild(resultsContainer);
  
  // Add overlay (transparent for fullscreen)
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
  overlay.style.zIndex = '1000';
  
  // Add to document
  document.body.appendChild(overlay);
  document.body.appendChild(sheet);
  
  // Animate in
  setTimeout(() => {
    sheet.classList.add('active');
    searchInput.focus();
    
    // Show all navigation options immediately
    showNavigationOptions(resultsContainer);
  }, 10);
  
  // Handle dismissal with close button
  closeButton.addEventListener('click', dismissSheet);
  
  // Add search functionality
  searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    
    if (query.length < 2) {
      // Show all navigation options when search is cleared
      showNavigationOptions(resultsContainer);
      return;
    }
    
    // Perform search
    if (typeof UniversalSearch !== 'undefined' && typeof UniversalSearch.searchContent === 'function') {
      const results = UniversalSearch.searchContent(query);
      displaySearchResults(results, resultsContainer);
    } else {
      // Fallback search if UniversalSearch is not available
      fallbackSearch(query, resultsContainer);
    }
  });
  
  function dismissSheet() {
    sheet.classList.remove('active');
    
    setTimeout(() => {
      sheet.remove();
      overlay.remove();
    }, 300);
  }
  
  function showNavigationOptions(container) {
    // Get all navigation options
    const navigationOptions = [
      { title: 'Home', url: 'index.html', description: 'Main page with all resources' },
      { title: 'Epilepsy Rotation', url: 'epilepsy_rotation.html', description: 'Rotation guidelines and resources' },
      { title: 'Seizure Management', url: 'seizure_management.html', description: 'Treatment protocols and guidelines' },
      { title: 'ILAE Classification', url: 'ilae_classification.html', description: 'Epilepsy syndrome classifications' },
      { title: 'Natus & Persyst', url: 'natus_instructions.html', description: 'EEG software instructions' },
      { title: 'ACNS Terminology', url: 'acns_criteria.html', description: 'EEG pattern classifications' },
      { title: 'Question Bank', url: 'question_bank.html', description: 'Test your EEG knowledge' },
      { title: 'EEG Simulator', url: 'eeg_waveforms.html', description: 'Interactive EEG waveform simulator' },
      { title: 'EEG Videos', url: 'eeg_videos.html', description: 'Educational EEG recordings' },
      { title: 'EEG Atlas', url: 'eeg_atlas.html', description: 'Visual reference of EEG patterns' },
      { title: 'Learning Resources', url: 'faq.html', description: 'Educational materials and FAQs' },
      { title: 'Discussion Forum', url: 'discussion.html', description: 'Community discussions' }
    ];
    
    displaySearchResults(navigationOptions, container);
  }
  
  function displaySearchResults(results, container) {
    if (!results || results.length === 0) {
      container.innerHTML = '<div class="ios-no-results">No results found</div>';
      return;
    }
    
    container.innerHTML = '';
    
    results.forEach(result => {
      const resultItem = document.createElement('a');
      resultItem.className = 'ios-search-result';
      resultItem.href = result.url || '#';
      
      const resultTitle = document.createElement('div');
      resultTitle.className = 'ios-result-title';
      resultTitle.textContent = result.title || 'Untitled';
      resultItem.appendChild(resultTitle);
      
      if (result.description) {
        const resultDesc = document.createElement('div');
        resultDesc.className = 'ios-result-description';
        resultDesc.textContent = result.description;
        resultItem.appendChild(resultDesc);
      }
      
      resultItem.addEventListener('click', function() {
        dismissSheet();
      });
      
      container.appendChild(resultItem);
    });
  }
  
  function fallbackSearch(query, container) {
    // Simple hardcoded fallback search for main sections
    const fallbackResults = [
      { title: 'Epilepsy Rotation', url: 'epilepsy_rotation.html', description: 'Rotation guidelines and resources' },
      { title: 'Seizure Management', url: 'seizure_management.html', description: 'Treatment protocols and guidelines' },
      { title: 'ILAE Classification', url: 'ilae_classification.html', description: 'Epilepsy syndrome classifications' },
      { title: 'Natus & Persyst', url: 'natus_instructions.html', description: 'EEG software instructions' },
      { title: 'ACNS Terminology', url: 'acns_criteria.html', description: 'EEG pattern classifications' },
      { title: 'Question Bank', url: 'question_bank.html', description: 'Test your EEG knowledge' },
      { title: 'EEG Simulator', url: 'eeg_waveforms.html', description: 'Interactive EEG waveform simulator' },
      { title: 'EEG Videos', url: 'eeg_videos.html', description: 'Educational EEG recordings' },
      { title: 'Learning Resources', url: 'faq.html', description: 'Educational materials and FAQs' },
      { title: 'EEG Atlas', url: 'eeg_atlas.html', description: 'Visual reference of EEG patterns' }
    ];
    
    const filteredResults = fallbackResults.filter(result => 
      result.title.toLowerCase().includes(query) || 
      (result.description && result.description.toLowerCase().includes(query))
    );
    
    displaySearchResults(filteredResults, container);
  }
}

/**
 * Sets up the iOS-style search bar
 */
function setupSearchBar() {
  const searchContainers = document.querySelectorAll('.search-container');
  
  searchContainers.forEach(container => {
    const searchInputs = container.querySelectorAll('input[type="search"], input[type="text"].search');
    
    searchInputs.forEach(input => {
      input.classList.add('search-box');
      
      // Add clear button functionality
      input.addEventListener('input', function() {
        const clearBtn = this.parentNode.querySelector('.search-clear-btn');
        
        if (this.value && !clearBtn) {
          const btn = document.createElement('button');
          btn.className = 'search-clear-btn';
          btn.innerHTML = '<i class="fa-solid fa-times-circle"></i>';
          btn.style.position = 'absolute';
          btn.style.right = '16px';
          btn.style.top = '50%';
          btn.style.transform = 'translateY(-50%)';
          btn.style.background = 'none';
          btn.style.border = 'none';
          btn.style.color = 'var(--ios-gray)';
          btn.style.fontSize = '16px';
          btn.style.padding = '0';
          
          btn.addEventListener('click', () => {
            input.value = '';
            input.focus();
            btn.remove();
            
            // Trigger input event to update search results
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
          });
          
          this.parentNode.style.position = 'relative';
          this.parentNode.appendChild(btn);
        } else if (!this.value && clearBtn) {
          clearBtn.remove();
        }
      });
    });
  });
}

/**
 * Handles safe areas for newer iPhones
 */
function handleSafeAreas() {
  // Add CSS variables for safe areas
  document.documentElement.style.setProperty('--ios-safe-area-top', 'env(safe-area-inset-top, 0px)');
  document.documentElement.style.setProperty('--ios-safe-area-bottom', 'env(safe-area-inset-bottom, 20px)');
  document.documentElement.style.setProperty('--ios-safe-area-left', 'env(safe-area-inset-left, 0px)');
  document.documentElement.style.setProperty('--ios-safe-area-right', 'env(safe-area-inset-right, 0px)');
  
  // Add viewport meta tag if it doesn't exist
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(meta);
  } else {
    // Update existing viewport meta tag
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta.content.includes('viewport-fit=cover')) {
      meta.content += ', viewport-fit=cover';
    }
  }
}

/**
 * Sets up event listeners for the mobile interface
 */
function setupEventListeners() {
  // Add touch ripple effect to buttons
  const buttons = document.querySelectorAll('button, .btn, [role="button"]');
  
  buttons.forEach(btn => {
    btn.addEventListener('touchstart', function() {
      this.classList.add('ios-active');
    });
    
    btn.addEventListener('touchend', function() {
      this.classList.remove('ios-active');
    });
    
    btn.addEventListener('touchcancel', function() {
      this.classList.remove('ios-active');
    });
  });
}

/**
 * Shows the settings bottom sheet
 */
function showSettingsSheet() {
  // Remove existing sheet if any
  const existingSheet = document.querySelector('.ios-sheet');
  if (existingSheet) {
    existingSheet.remove();
  }
  
  // Create settings sheet
  const sheet = document.createElement('div');
  sheet.className = 'ios-sheet ios-fullscreen-sheet';
  
  // Add drag handle
  const handle = document.createElement('div');
  handle.className = 'ios-sheet-handle';
  sheet.appendChild(handle);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'ios-sheet-close';
  closeButton.innerHTML = '<i class="fa-solid fa-times"></i>';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '15px';
  closeButton.style.right = '15px';
  closeButton.style.background = 'rgba(142, 142, 147, 0.2)';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '50%';
  closeButton.style.width = '32px';
  closeButton.style.height = '32px';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  closeButton.style.fontSize = '16px';
  closeButton.style.color = 'var(--ios-gray)';
  sheet.appendChild(closeButton);
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Settings';
  title.style.fontSize = '20px';
  title.style.fontWeight = '600';
  title.style.marginBottom = '16px';
  title.style.textAlign = 'center';
  title.style.marginTop = '15px';
  sheet.appendChild(title);
  
  // Add settings sections
  const settingsContainer = document.createElement('div');
  settingsContainer.className = 'ios-settings-container';
  settingsContainer.style.height = 'calc(100% - 70px)';
  settingsContainer.style.overflowY = 'auto';
  settingsContainer.style.padding = '0 16px';
  sheet.appendChild(settingsContainer);
  
  // Add dark mode toggle
  const darkModeToggle = document.createElement('div');
  darkModeToggle.style.display = 'flex';
  darkModeToggle.style.justifyContent = 'space-between';
  darkModeToggle.style.alignItems = 'center';
  darkModeToggle.style.padding = '12px 0';
  
  const darkModeLabel = document.createElement('span');
  darkModeLabel.textContent = 'Dark Mode';
  darkModeLabel.style.fontSize = '17px';
  darkModeToggle.appendChild(darkModeLabel);
  
  const darkModeSwitch = document.createElement('div');
  darkModeSwitch.className = 'ios-switch';
  darkModeSwitch.style.position = 'relative';
  darkModeSwitch.style.width = '51px';
  darkModeSwitch.style.height = '31px';
  darkModeSwitch.style.backgroundColor = document.body.classList.contains('dark') ? '#34c759' : '#e5e5ea';
  darkModeSwitch.style.borderRadius = '31px';
  darkModeSwitch.style.transition = 'background-color 0.2s';
  
  const switchKnob = document.createElement('div');
  switchKnob.style.position = 'absolute';
  switchKnob.style.top = '2px';
  switchKnob.style.left = document.body.classList.contains('dark') ? '22px' : '2px';
  switchKnob.style.width = '27px';
  switchKnob.style.height = '27px';
  switchKnob.style.backgroundColor = '#fff';
  switchKnob.style.borderRadius = '50%';
  switchKnob.style.transition = 'left 0.2s';
  switchKnob.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
  darkModeSwitch.appendChild(switchKnob);
  
  darkModeSwitch.addEventListener('click', function() {
    if (document.body.classList.contains('dark')) {
      document.body.classList.remove('dark');
      this.style.backgroundColor = '#e5e5ea';
      switchKnob.style.left = '2px';
    } else {
      document.body.classList.add('dark');
      this.style.backgroundColor = '#34c759';
      switchKnob.style.left = '22px';
    }
    
    // Update localStorage
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  });
  
  darkModeToggle.appendChild(darkModeSwitch);
  settingsContainer.appendChild(darkModeToggle);
  
  // Add divider
  const divider = document.createElement('div');
  divider.className = 'ios-divider';
  divider.style.margin = '8px 0';
  settingsContainer.appendChild(divider);
  
  // Add big font toggle
  const bigFontToggle = document.createElement('div');
  bigFontToggle.style.display = 'flex';
  bigFontToggle.style.justifyContent = 'space-between';
  bigFontToggle.style.alignItems = 'center';
  bigFontToggle.style.padding = '12px 0';
  
  const bigFontLabel = document.createElement('span');
  bigFontLabel.textContent = 'Big Font';
  bigFontLabel.style.fontSize = '17px';
  bigFontToggle.appendChild(bigFontLabel);
  
  // Check if big font is enabled
  const isBigFont = localStorage.getItem('bigFont') === 'true';
  
  const bigFontSwitch = document.createElement('div');
  bigFontSwitch.className = 'ios-switch';
  bigFontSwitch.style.position = 'relative';
  bigFontSwitch.style.width = '51px';
  bigFontSwitch.style.height = '31px';
  bigFontSwitch.style.backgroundColor = isBigFont ? '#34c759' : '#e5e5ea';
  bigFontSwitch.style.borderRadius = '31px';
  bigFontSwitch.style.transition = 'background-color 0.2s';
  
  const bigFontKnob = document.createElement('div');
  bigFontKnob.style.position = 'absolute';
  bigFontKnob.style.top = '2px';
  bigFontKnob.style.left = isBigFont ? '22px' : '2px';
  bigFontKnob.style.width = '27px';
  bigFontKnob.style.height = '27px';
  bigFontKnob.style.backgroundColor = '#fff';
  bigFontKnob.style.borderRadius = '50%';
  bigFontKnob.style.transition = 'left 0.2s';
  bigFontKnob.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
  bigFontSwitch.appendChild(bigFontKnob);
  
  bigFontSwitch.addEventListener('click', function() {
    const isBigFontNow = localStorage.getItem('bigFont') === 'true';
    if (isBigFontNow) {
      localStorage.setItem('bigFont', 'false');
      this.style.backgroundColor = '#e5e5ea';
      bigFontKnob.style.left = '2px';
    } else {
      localStorage.setItem('bigFont', 'true');
      this.style.backgroundColor = '#34c759';
      bigFontKnob.style.left = '22px';
    }
    
    // Apply font size changes immediately
    initFontSize();
  });
  
  bigFontToggle.appendChild(bigFontSwitch);
  settingsContainer.appendChild(bigFontToggle);
  
  // Add divider
  const divider2 = document.createElement('div');
  divider2.className = 'ios-divider';
  divider2.style.margin = '16px 0';
  settingsContainer.appendChild(divider2);
  
  // Add Secret Games link
  const gamesLink = document.createElement('a');
  gamesLink.href = 'flappy_brain/menu.html';
  gamesLink.className = 'ios-setting-link';
  gamesLink.style.display = 'flex';
  gamesLink.style.alignItems = 'center';
  gamesLink.style.padding = '12px 0';
  gamesLink.style.textDecoration = 'none';
  gamesLink.style.color = 'var(--ios-blue)';
  
  const gamesIcon = document.createElement('i');
  gamesIcon.className = 'fa-solid fa-gamepad';
  gamesIcon.style.marginRight = '12px';
  gamesIcon.style.fontSize = '18px';
  gamesIcon.style.width = '24px';
  gamesIcon.style.textAlign = 'center';
  gamesLink.appendChild(gamesIcon);
  
  const gamesLabel = document.createElement('span');
  gamesLabel.textContent = 'Secret Games';
  gamesLabel.style.fontSize = '16px';
  gamesLabel.style.flex = '1';
  gamesLink.appendChild(gamesLabel);
  
  const gamesChevron = document.createElement('i');
  gamesChevron.className = 'fa-solid fa-chevron-right';
  gamesChevron.style.fontSize = '12px';
  gamesChevron.style.color = 'var(--ios-gray)';
  gamesLink.appendChild(gamesChevron);
  
  settingsContainer.appendChild(gamesLink);
  
  // Add divider
  const divider3 = document.createElement('div');
  divider3.className = 'ios-divider';
  divider3.style.margin = '16px 0';
  settingsContainer.appendChild(divider3);
  
  // Add disclaimer link
  const disclaimerLink = document.createElement('a');
  disclaimerLink.href = '#'; // Changed from #disclaimer
  disclaimerLink.className = 'ios-setting-link';
  disclaimerLink.style.display = 'flex';
  disclaimerLink.style.alignItems = 'center';
  disclaimerLink.style.padding = '12px 0';
  disclaimerLink.style.textDecoration = 'none';
  disclaimerLink.style.color = 'var(--ios-blue)';
  
  const disclaimerIcon = document.createElement('i');
  disclaimerIcon.className = 'fa-solid fa-exclamation-triangle';
  disclaimerIcon.style.marginRight = '12px';
  disclaimerIcon.style.fontSize = '18px';
  disclaimerIcon.style.width = '24px';
  disclaimerIcon.style.textAlign = 'center';
  disclaimerLink.appendChild(disclaimerIcon);
  
  const disclaimerLabel = document.createElement('span');
  disclaimerLabel.textContent = 'Disclaimer';
  disclaimerLabel.style.fontSize = '16px';
  disclaimerLabel.style.flex = '1';
  disclaimerLink.appendChild(disclaimerLabel);
  
  const disclaimerChevron = document.createElement('i');
  disclaimerChevron.className = 'fa-solid fa-chevron-right';
  disclaimerChevron.style.fontSize = '12px';
  disclaimerChevron.style.color = 'var(--ios-gray)';
  disclaimerLink.appendChild(disclaimerChevron);
  
  disclaimerLink.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Close settings first
    dismissSheet();
    
    // Create and show a mobile-optimized disclaimer popup
    setTimeout(() => {
      showDisclaimerPopup();
    }, 400);
  });
  
  settingsContainer.appendChild(disclaimerLink);
  
  // Add copyright text
  const copyrightText = document.createElement('div');
  copyrightText.className = 'ios-copyright';
  copyrightText.style.fontSize = '12px';
  copyrightText.style.color = 'var(--ios-gray)';
  copyrightText.style.textAlign = 'center';
  copyrightText.style.margin = '20px 0 10px';
  copyrightText.innerHTML = '© ' + new Date().getFullYear() + ' EEG Learning. All rights reserved.';
  settingsContainer.appendChild(copyrightText);
  
  // Add version info
  const versionInfo = document.createElement('div');
  versionInfo.className = 'ios-version-info';
  versionInfo.style.fontSize = '11px';
  versionInfo.style.color = 'var(--ios-gray)';
  versionInfo.style.textAlign = 'center';
  versionInfo.style.marginBottom = '20px';
  versionInfo.textContent = 'Version 1.1.0';
  settingsContainer.appendChild(versionInfo);
  
  // Add overlay (transparent for fullscreen)
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
  overlay.style.zIndex = '1000';
  
  // Add to document
  document.body.appendChild(overlay);
  document.body.appendChild(sheet);
  
  // Animate in
  setTimeout(() => {
    sheet.classList.add('active');
  }, 10);
  
  // Handle dismissal with close button
  closeButton.addEventListener('click', dismissSheet);
  
  function dismissSheet() {
    sheet.classList.remove('active');
    
    setTimeout(() => {
      sheet.remove();
      overlay.remove();
    }, 300);
  }
}

/**
 * Shows a mobile-optimized disclaimer popup
 */
function showDisclaimerPopup() {
  // Create popup container
  const popup = document.createElement('div');
  popup.className = 'ios-sheet ios-fullscreen-sheet';
  popup.style.zIndex = '2000';
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Disclaimer';
  title.style.fontSize = '20px';
  title.style.fontWeight = '600';
  title.style.marginBottom = '20px';
  title.style.textAlign = 'center';
  title.style.marginTop = '20px';
  title.style.color = 'var(--ios-text)';
  popup.appendChild(title);
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'ios-sheet-close';
  closeButton.innerHTML = '<i class="fa-solid fa-times"></i>';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '15px';
  closeButton.style.right = '15px';
  closeButton.style.background = 'rgba(142, 142, 147, 0.2)';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '50%';
  closeButton.style.width = '32px';
  closeButton.style.height = '32px';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  closeButton.style.fontSize = '16px';
  closeButton.style.color = 'var(--ios-gray)';
  popup.appendChild(closeButton);
  
  // Content
  const content = document.createElement('div');
  content.style.padding = '0 20px';
  content.style.color = 'var(--ios-text)';
  content.style.fontSize = '16px';
  content.style.lineHeight = '1.5';
  content.style.overflowY = 'auto';
  content.style.height = 'calc(100% - 140px)';
  
  content.innerHTML = `
    <p>Any information or materials provided on or accessed through this web site are intended solely for informational purposes and are NOT intended for individuals or patients seeking medical advice or treatment. The information and materials presented are not intended nor implied to be a substitute for professional medical advice, diagnosis or treatment.</p>
    
    <p>Every individual should always seek the advice of a physician or other qualified health care provider prior to starting or continuing any treatment. Medical professionals should not use or rely upon any of the information or content provided on or accessed through this web site to make any medical decisions.</p>
  `;
  
  popup.appendChild(content);
  
  // Acknowledge button
  const acknowledgeButton = document.createElement('button');
  acknowledgeButton.textContent = 'I Acknowledge';
  acknowledgeButton.style.display = 'block';
  acknowledgeButton.style.width = 'calc(100% - 40px)';
  acknowledgeButton.style.margin = '20px auto';
  acknowledgeButton.style.padding = '14px 20px';
  acknowledgeButton.style.backgroundColor = 'var(--ios-blue)';
  acknowledgeButton.style.color = 'white';
  acknowledgeButton.style.border = 'none';
  acknowledgeButton.style.borderRadius = '12px';
  acknowledgeButton.style.fontSize = '16px';
  acknowledgeButton.style.fontWeight = '500';
  acknowledgeButton.style.cursor = 'pointer';
  
  popup.appendChild(acknowledgeButton);
  
  // Add overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '1999';
  
  // Add to document
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  
  // Animate in
  setTimeout(() => {
    popup.classList.add('active');
  }, 10);
  
  // Close handlers
  const closePopup = () => {
    popup.classList.remove('active');
    setTimeout(() => {
      popup.remove();
      overlay.remove();
    }, 300);
  };
  
  closeButton.addEventListener('click', closePopup);
  acknowledgeButton.addEventListener('click', closePopup);
}

/**
 * Toggles dark mode
 */
function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle('dark');
  
  // Update localStorage
  localStorage.setItem('darkMode', body.classList.contains('dark'));
} 