/**
 * iOS Mobile Initialization Script
 * This script ensures the mobile interface stays consistent across page navigations
 */

(function() {
  // Initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function() {
    // Only run on mobile devices
    if (window.innerWidth <= 767) {
      console.log('iOS Mobile: Initializing mobile interface');
      interceptLinks();
      interceptForms();
      
      // Store the fact that we're in mobile view in sessionStorage
      sessionStorage.setItem('mobileViewEnabled', 'true');
    } else {
      // Ensure desktop search works
      initDesktopSearch();
    }
  });
  
  // Also check on window load
  window.addEventListener('load', function() {
    if (window.innerWidth <= 767) {
      // Make sure mobile styles are enforced even if coming from back/forward navigation
      console.log('iOS Mobile: Window loaded, applying mobile styles');
      
      // Set a flag so ios-mobile.js can know this page was loaded with mobile view
      sessionStorage.setItem('mobileViewEnabled', 'true');
      
      // If this page doesn't already have the mobile nav, something went wrong
      // Wait for ios-mobile.js to potentially run
      setTimeout(function() {
        if (!document.querySelector('.mobile-nav') && typeof initMobileInterface === 'function') {
          console.log('iOS Mobile: Reapplying mobile interface');
          initMobileInterface();
        } else if (document.querySelector('.mobile-nav') && typeof updatePageTitle === 'function') {
          // If we have the mobile nav but the title might be wrong, just update the title
          console.log('iOS Mobile: Updating page title after navigation');
          updatePageTitle();
        }
      }, 300);
    } else {
      // Ensure desktop search works even after page loads
      initDesktopSearch();
    }
  });
  
  // Handle desktop search functionality separately
  function initDesktopSearch() {
    console.log('Initializing desktop search functionality');
    
    // Wait for DOM to be fully ready
    setTimeout(function() {
      const searchTrigger = document.getElementById('search-trigger');
      const searchMenuPanel = document.getElementById('search-menu-panel');
      const searchInput = document.getElementById('universal-search-input');
      
      if (searchTrigger && searchMenuPanel) {
        // Add event listeners only if not already added
        if (!searchTrigger.getAttribute('data-listener-added')) {
          searchTrigger.addEventListener('click', function(event) {
            console.log('Desktop search trigger clicked');
            event.preventDefault();
            event.stopPropagation();
            searchMenuPanel.classList.toggle('active');
            
            // Focus search when opened
            if (searchMenuPanel.classList.contains('active') && searchInput) {
              setTimeout(() => {
                searchInput.focus();
                // Trigger search event
                if (typeof UniversalSearch !== 'undefined' && typeof UniversalSearch.handleSearchInput === 'function') {
                  UniversalSearch.handleSearchInput({target: searchInput});
                }
              }, 100);
            }
          });
          searchTrigger.setAttribute('data-listener-added', 'true');
        }
        
        // Close search when clicking outside
        document.addEventListener('click', function(e) {
          if (searchMenuPanel.classList.contains('active') && 
              !searchMenuPanel.contains(e.target) && 
              !searchTrigger.contains(e.target)) {
            searchMenuPanel.classList.remove('active');
          }
        });
      }
    }, 500);
  }
  
  // Add a MutationObserver to handle SPA-like navigation
  if (window.innerWidth <= 767) {
    const titleObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.target === document.querySelector('title')) {
          console.log('iOS Mobile: Title changed, updating mobile title');
          // Wait a moment for potential other DOM changes to complete
          setTimeout(function() {
            if (typeof updatePageTitle === 'function') {
              updatePageTitle();
            }
          }, 100);
        }
      });
    });
    
    // Start observing the document title for changes
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
    }
  }
  
  /**
   * Intercept all link clicks to maintain mobile interface across page loads
   */
  function interceptLinks() {
    document.addEventListener('click', function(e) {
      // Find if the click was on a link or within a link
      let el = e.target;
      let isLink = false;
      
      // Traverse up to 5 levels to find if we clicked inside a link
      for (let i = 0; i < 5; i++) {
        if (!el) break;
        if (el.tagName === 'A') {
          isLink = true;
          break;
        }
        el = el.parentElement;
      }
      
      // Only handle normal links with href attributes pointing to our own site
      if (isLink && el.href && el.href.indexOf(window.location.origin) === 0) {
        // Skip links that are meant to be handled by JavaScript (like menu tabs)
        if (el.href.includes('#') && !el.href.endsWith('.html')) {
          return;
        }
        
        // Skip if modifier keys are pressed (new tab/window)
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          return;
        }
        
        // Skip links with special targets
        if (el.target === '_blank' || el.target === '_new') {
          return;
        }
        
        // Set flag in sessionStorage to indicate we're coming from mobile view
        sessionStorage.setItem('mobileViewEnabled', 'true');
        
        // Store the destination page to help with title handling
        const destPage = el.href.split('/').pop();
        if (destPage) {
          sessionStorage.setItem('lastNavigatedPage', destPage);
        }
        
        // Continue with normal navigation
      }
    });
  }
  
  /**
   * Intercept form submissions to maintain mobile interface
   */
  function interceptForms() {
    document.addEventListener('submit', function(e) {
      const form = e.target;
      
      // Only intercept forms that submit to our own site
      if (form.action && form.action.indexOf(window.location.origin) === 0) {
        // Set flag in sessionStorage to indicate we're coming from mobile view
        sessionStorage.setItem('mobileViewEnabled', 'true');
        
        // Continue with normal form submission
      }
    });
  }
})();
