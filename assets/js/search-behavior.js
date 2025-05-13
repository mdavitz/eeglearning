/**
 * Enhanced search dropdown behavior
 * This script works alongside the header code to enhance search functionality
 * without creating duplicate event handlers
 */
(function() {
  // Create a backdrop overlay element for capturing outside clicks
  let backdrop = null;
  
  /**
   * Helper function to ensure we don't try to initialize before the
   * main search functionality in header.html
   */
  function enhanceSearchBehavior() {
    // Get references to search elements
    const searchTrigger = document.getElementById('search-trigger');
    const searchMenuPanel = document.getElementById('search-menu-panel');
    
    // If elements don't exist or UniversalSearch is not initialized yet, try again later
    if (!searchTrigger || !searchMenuPanel) {
      console.log('Search elements not ready, waiting for initialization...');
      setTimeout(enhanceSearchBehavior, 300);
      return;
    }

    // Check if UniversalSearch is initialized
    if (typeof UniversalSearch === 'undefined' || !UniversalSearch.initialized) {
      console.log('UniversalSearch not initialized yet, waiting...');
      setTimeout(enhanceSearchBehavior, 300);
      return;
    }
    
    console.log('Enhanced search behavior initializing');

    // Track if we've already enhanced this component to avoid duplicate handlers
    if (searchTrigger.dataset.enhancedBehavior === 'true') {
      console.log('Search behavior already enhanced, skipping');
      return;
    }
    
    // Mark as enhanced to prevent duplicate initialization
    searchTrigger.dataset.enhancedBehavior = 'true';
    
    // Create the backdrop overlay if it doesn't exist
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'search-backdrop';
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.width = '100%';
      backdrop.style.height = '100%';
      backdrop.style.backgroundColor = 'transparent';
      backdrop.style.zIndex = '999'; // Lower than the dropdown but higher than other elements
      backdrop.style.display = 'none';
      document.body.appendChild(backdrop);
      
      // When backdrop is clicked, close the dropdown
      backdrop.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeDropdown();
        console.log('Search dropdown closed by backdrop click');
      });
    }
    
    // Function to close the search dropdown
    function closeDropdown() {
      searchMenuPanel.classList.remove('active');
      searchMenuPanel.style.display = 'none';
      backdrop.style.display = 'none';
    }
    
    // Function to open the search dropdown
    function openDropdown() {
      searchMenuPanel.classList.add('active');
      searchMenuPanel.style.display = 'block';
      searchMenuPanel.style.zIndex = '1000';
      backdrop.style.display = 'block';
      
      // Focus search input
      const searchInput = document.getElementById('universal-search-input');
      if (searchInput) {
        setTimeout(() => {
          searchInput.focus();
        }, 100);
      }
    }
    
    // Replace the click handler on search trigger
    searchTrigger.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (searchMenuPanel.classList.contains('active')) {
        closeDropdown();
      } else {
        openDropdown();
      }
      
      console.log('Search dropdown toggled');
    };
    
    // =============== ENHANCE MENU LINKS BEHAVIOR ===============
    // We do this as an enhancement since it's not explicitly handled in header.html
    const menuLinks = searchMenuPanel.querySelectorAll('.menu-section a');
    menuLinks.forEach(link => {
      // Only add if we haven't already added our handler
      if (!link.dataset.searchLinkEnhanced) {
        link.addEventListener('click', function() {
          closeDropdown();
          console.log('Search dropdown closed after menu link click');
        });
        link.dataset.searchLinkEnhanced = 'true';
      }
    });
    
    // Force close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && searchMenuPanel.classList.contains('active')) {
        closeDropdown();
        console.log('Search dropdown closed by Escape key');
      }
    });
    
    // Make sure the dropdown is hidden on page load
    closeDropdown();
    
    console.log('Enhanced search behavior loaded successfully with backdrop approach');
  }

  // Initialize our enhancements when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Wait slightly longer to ensure header.html completes its initialization first
      setTimeout(enhanceSearchBehavior, 500);
    });
  } else {
    // DOM already loaded, enhance right away but with a slight delay
    // to ensure header.html initialization completes first
    setTimeout(enhanceSearchBehavior, 500);
  }
})(); 