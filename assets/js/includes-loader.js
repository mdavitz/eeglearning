/**
 * Includes Loader
 * Handles loading of common includes (header, footer, disclaimer) across all pages
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Includes loader initializing on page:', window.location.pathname);
  
  // Load header
  loadInclude('header');
  
  // Load footer with extra debugging for index page
  loadInclude('footer', function() {
    // Initialize footer controls once loaded
    console.log('Footer loaded, setting up controls on page:', window.location.pathname);
    setupFooterControls();
  });
  
  // Load disclaimer
  loadInclude('disclaimer', function() {
    // Set up disclaimer modal once loaded
    console.log('Disclaimer loaded, setting up modal on page:', window.location.pathname);
    setupDisclaimerModal();
  });
  
  // Remove any existing duplicate code load listeners
  // (These could be present from old implementations)
  cleanupDuplicateCodeLoader();
});

/**
 * Loads an include file and injects it into the page
 * @param {string} includeName - Name of the include file (without .html extension)
 * @param {function} [callback] - Optional callback to execute after the include is loaded
 */
function loadInclude(includeName, callback) {
  // Allow for a custom includes path for nested pages
  const basePath = window.includesBasePath || 'includes';
  
  fetch(`${basePath}/${includeName}.html`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${includeName}.html: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(data => {
      // Handle different includes
      switch (includeName) {
        case 'header':
          if (document.getElementById('header-container')) {
            // Inject header HTML
            const container = document.getElementById('header-container');
            container.innerHTML = data;
            // Execute inline <script> tags from the header include
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
            tempDiv.querySelectorAll('script').forEach(oldScript => {
              const newScript = document.createElement('script');
              if (oldScript.src) {
                newScript.src = oldScript.src;
              } else {
                newScript.textContent = oldScript.textContent;
              }
              document.head.appendChild(newScript);
              document.head.removeChild(newScript);
            });
          }
          break;
          
        case 'footer':
          if (document.getElementById('footer-container')) {
            document.getElementById('footer-container').innerHTML = data;
            // Execute callback if provided
            if (typeof callback === 'function') {
              setTimeout(callback, 100); // Small delay to ensure DOM is updated
            }
          }
          break;
          
        case 'disclaimer':
          // Create a container if it doesn't exist
          let disclaimerContainer = document.getElementById('disclaimer-container');
          if (!disclaimerContainer) {
            disclaimerContainer = document.createElement('div');
            disclaimerContainer.id = 'disclaimer-container';
            document.body.appendChild(disclaimerContainer);
          }
          disclaimerContainer.innerHTML = data;
          // Execute callback if provided
          if (typeof callback === 'function') {
            setTimeout(callback, 100); // Small delay to ensure DOM is updated
          }
          break;
      }
      
      // Log success
      console.log(`Loaded ${includeName}.html`);
    })
    .catch(error => {
      console.error(`Error loading ${includeName}.html:`, error);
    });
}

/**
 * Cleans up any duplicate code load intervals that might exist on the page
 * This prevents conflicts with old code
 */
function cleanupDuplicateCodeLoader() {
  // Find any existing intervals that load footer functionality
  const existingIntervals = [];
  for (let i = 1; i < 1000; i++) {
    if (window['waitForFooter' + i]) {
      clearInterval(window['waitForFooter' + i]);
      existingIntervals.push(i);
    }
  }
  
  if (existingIntervals.length > 0) {
    console.log('Cleaned up duplicate loaders:', existingIntervals);
  }
}

/**
 * Sets up footer control functionality
 */
function setupFooterControls() {
  console.log('Setting up footer controls...');
  
  // Function to initialize a button with retries
  function initializeButton(buttonId, callback, maxRetries = 5) {
    let retries = 0;
    const retryInterval = 100; // 100ms between retries
    
    function tryInitialize() {
      const button = document.getElementById(buttonId);
      if (button) {
        // Only add event listener if not already initialized
        if (!button.getAttribute('data-initialized')) {
          callback(button);
          button.setAttribute('data-initialized', 'true');
          console.log(`Button ${buttonId} initialized successfully`);
          return true;
        }
      }
      
      if (retries < maxRetries) {
        retries++;
        console.log(`Retrying initialization of ${buttonId} (attempt ${retries}/${maxRetries})`);
        setTimeout(tryInitialize, retryInterval);
        return false;
      }
      
      console.warn(`Failed to initialize ${buttonId} after ${maxRetries} attempts`);
      return false;
    }
    
    return tryInitialize();
  }
  
  // Font size toggle button
  initializeButton('font-size-btn', function(button) {
    console.log('Initializing font size button with improved debugging');
    
    button.addEventListener('click', function() {
      console.log('Font size button clicked');
      
      // Toggle large font class
      document.body.classList.toggle('large-font');
      const isLargeFont = document.body.classList.contains('large-font');
      localStorage.setItem('largeFont', isLargeFont);
      
      // Update button appearance and log status
      if (isLargeFont) {
        button.classList.add('active');
        console.log('Large font enabled. Current classes on body:', document.body.className);
      } else {
        button.classList.remove('active');
        console.log('Large font disabled. Current classes on body:', document.body.className);
      }
      
      // Apply styles to debug elements with fixed font sizes
      console.log('Remember to check for elements with hardcoded font sizes that might not be affected');
    });
    
    // Set initial button state based on current font size
    if (document.body.classList.contains('large-font') || localStorage.getItem('largeFont') === 'true') {
      console.log('Setting button to active state - large font is enabled');
      button.classList.add('active');
      document.body.classList.add('large-font');
    } else {
      console.log('Setting button to normal state - large font is disabled');
      button.classList.remove('active');
    }
  });
  
  // Dark mode toggle button
  initializeButton('dark-mode-btn', function(button) {
    button.addEventListener('click', function() {
      document.body.classList.toggle('dark');
      localStorage.setItem('darkMode', document.body.classList.contains('dark'));
      
      // Update button text based on current state
      if (document.body.classList.contains('dark')) {
        button.textContent = 'Light Mode';
      } else {
        button.textContent = 'Dark Mode';
      }
      
      console.log('Dark mode toggled:', document.body.classList.contains('dark'));
    });
    
    // Initialize button text based on saved preference
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark');
      button.textContent = 'Light Mode';
    } else {
      button.textContent = 'Dark Mode';
    }
  });
  
  // Set up copyright modal
  setupCopyrightModal();
  
  // Apply saved preferences
  applyUserPreferences();
}

/**
 * Apply user preferences from localStorage
 */
function applyUserPreferences() {
  // Apply dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
  
  // Apply font size preference
  if (localStorage.getItem('largeFont') === 'true') {
    document.body.classList.add('large-font');
  }
}

/**
 * Sets up copyright modal functionality
 */
function setupCopyrightModal() {
  const copyrightTrigger = document.getElementById('copyright-trigger');
  const copyrightModal = document.getElementById('copyright-modal');
  const copyrightCloseBtn = document.getElementById('copyright-close-btn');
  
  if (copyrightTrigger && copyrightModal) {
    // Only add event listener if not already initialized
    if (!copyrightTrigger.getAttribute('data-initialized')) {
      // Open modal when clicking the copyright text
      copyrightTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        copyrightModal.style.display = 'flex';
        setTimeout(() => {
          copyrightModal.classList.add('visible');
        }, 10);
      });
      copyrightTrigger.setAttribute('data-initialized', 'true');
      console.log('Copyright trigger event listener attached');
    }
    
    // Close modal when clicking outside or on close button
    if (copyrightCloseBtn && !copyrightCloseBtn.getAttribute('data-initialized')) {
      copyrightCloseBtn.addEventListener('click', function() {
        copyrightModal.classList.remove('visible');
        setTimeout(() => {
          copyrightModal.style.display = 'none';
        }, 300);
      });
      copyrightCloseBtn.setAttribute('data-initialized', 'true');
    }
    
    // Only add window event listener once
    if (!copyrightModal.getAttribute('data-initialized')) {
      window.addEventListener('click', function(e) {
        if (e.target === copyrightModal) {
          copyrightModal.classList.remove('visible');
          setTimeout(() => {
            copyrightModal.style.display = 'none';
          }, 300);
        }
      });
      copyrightModal.setAttribute('data-initialized', 'true');
    }
    
    console.log('Copyright modal event listeners attached');
  } else {
    console.log('Copyright elements not found:', {
      trigger: copyrightTrigger,
      modal: copyrightModal
    });
  }
}

/**
 * Sets up disclaimer modal functionality
 */
function setupDisclaimerModal() {
  console.log('Setting up disclaimer modal...');
  const disclaimerTrigger = document.getElementById('disclaimer-trigger');
  const disclaimerModal = document.getElementById('disclaimer-modal');
  
  if (disclaimerTrigger && disclaimerModal) {
    console.log('Disclaimer elements found, attaching event listeners');
    
    // Open disclaimer modal when clicking the trigger (only if not already initialized)
    if (!disclaimerTrigger.getAttribute('data-initialized')) {
      disclaimerTrigger.addEventListener('click', function() {
        console.log('Disclaimer button clicked');
        disclaimerModal.classList.add('active');
      });
      disclaimerTrigger.setAttribute('data-initialized', 'true');
    }
    
    // Close disclaimer modal when clicking the close button
    const disclaimerClose = document.getElementById('disclaimer-close');
    if (disclaimerClose && !disclaimerClose.getAttribute('data-initialized')) {
      disclaimerClose.addEventListener('click', function() {
        disclaimerModal.classList.remove('active');
      });
      disclaimerClose.setAttribute('data-initialized', 'true');
    }
    
    // Close disclaimer modal when clicking the acknowledge button
    const disclaimerAcknowledge = document.getElementById('disclaimer-acknowledge');
    if (disclaimerAcknowledge && !disclaimerAcknowledge.getAttribute('data-initialized')) {
      disclaimerAcknowledge.addEventListener('click', function() {
        disclaimerModal.classList.remove('active');
      });
      disclaimerAcknowledge.setAttribute('data-initialized', 'true');
    }
    
    // Close modal when clicking outside (only add once)
    if (!disclaimerModal.getAttribute('data-initialized')) {
      disclaimerModal.addEventListener('click', function(e) {
        if (e.target === disclaimerModal) {
          disclaimerModal.classList.remove('active');
        }
      });
      disclaimerModal.setAttribute('data-initialized', 'true');
    }
    
    console.log('Disclaimer modal event listeners attached successfully');
  } else {
    console.log('Disclaimer elements not found:', {
      trigger: disclaimerTrigger, 
      modal: disclaimerModal
    });
  }
}

// Add a window.onload handler to ensure footer controls are initialized
// This serves as a fallback in case the earlier initialization didn't work
window.addEventListener('load', function() {
  console.log('Window loaded on page:', window.location.pathname);
  
  // If footer exists but buttons don't have event listeners, set them up again
  if (document.getElementById('footer')) {
    console.log('Footer exists, ensuring buttons are functional');
    setupFooterControls();
  }
});

// Add footer visibility control
function initializeFooterVisibility() {
  const footer = document.getElementById('footer');
  let lastScrollY = window.scrollY;
  let ticking = false;

  // Initially hide the footer
  if (footer) {
    footer.style.transition = 'transform 0.3s ease-in-out';
    footer.style.transform = 'translateY(100%)';
  }

  function updateFooterVisibility() {
    if (!footer) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrolledToBottom = (window.scrollY + windowHeight) >= (documentHeight - 50);

    // Show footer when near bottom, hide otherwise
    if (scrolledToBottom) {
      footer.style.transform = 'translateY(0)';
    } else {
      footer.style.transform = 'translateY(100%)';
    }

    ticking = false;
  }

  window.addEventListener('scroll', function() {
    lastScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(function() {
        updateFooterVisibility();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Also check on page load
  updateFooterVisibility();
}

// Initialize footer visibility after footer is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for the footer to be fully loaded
  setTimeout(initializeFooterVisibility, 500);
});

// Add CSS for footer transitions
const footerStyle = document.createElement('style');
footerStyle.textContent = `
  #footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--footer-bg, #ffffff);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease-in-out;
    pointer-events: none; /* Make footer transparent to clicks by default */
  }
  
  /* But enable clicks on the actual footer content */
  #footer * {
    pointer-events: auto;
  }
  
  body.dark #footer {
    background: var(--footer-bg, #1a1a1a);
  }
  
  /* Add padding to prevent content from being hidden behind fixed footer */
  body {
    padding-bottom: 60px;
  }
`;
document.head.appendChild(footerStyle); 