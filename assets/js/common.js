/**
 * Common JavaScript Functions
 * This file contains common functions used across the EEG Curriculum
 */

// Global constants
const BASE_TITLE = "EEG Curriculum";

// DOM Ready functions
document.addEventListener("DOMContentLoaded", () => {
  // Set up initial page title
  const initialPage = window.location.hash.substring(1);
  if (initialPage) {
    const sectionName = getTabName(initialPage);
    document.title = `${sectionName} - ${BASE_TITLE}`;
  } else {
    document.title = BASE_TITLE;
  }
  
  // Set up header observer for dynamically loaded header
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    const headerObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && document.getElementById('header')) {
          setupHeader();
          headerObserver.disconnect();
          break;
        }
      }
    });
    
    headerObserver.observe(headerContainer, { childList: true });
  }
  
  // Add header shrink on scroll effect
  setupHeader();
  
  // Apply saved preferences
  setupDarkMode();
  setupFontSize();
  
  // Since footer is loaded dynamically, we need to wait for it to be loaded
  // Check if footer is already in the DOM
  if (document.getElementById('footer')) {
    setupFooterControls();
    setupCopyrightModal();
  } else {
    // If not, set up a MutationObserver to detect when it's loaded
    const footerContainerObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && document.getElementById('footer')) {
          setupFooterControls();
          setupCopyrightModal();
          footerContainerObserver.disconnect();
          break;
        }
      }
    });
    
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      footerContainerObserver.observe(footerContainer, { childList: true });
    }
  }

  // Setup section toggling and quick links if they exist on the page
  // BUT exclude pages that handle filtering differently (e.g., acns-criteria)
  if (!document.body.classList.contains('page-acns_criteria')) { 
      const sectionHeaders = document.querySelectorAll('.section .section-header');
      const quickLinks = document.querySelectorAll('.quick-links a');

      if (sectionHeaders.length > 0 || quickLinks.length > 0) {
        console.log('Setting up standard section toggling and quick links...');
        
        // Add click listener to headers (only if they don't have explicit onclick)
        sectionHeaders.forEach(header => {
          if (!header.hasAttribute('onclick')) { // Avoid overriding specific page logic
             header.addEventListener('click', () => toggleSection(header));
          }
          
          // Set initial state for content based on 'expanded' class
          const content = header.nextElementSibling;
          if (content && content.classList.contains('section-content')) {
            if (header.classList.contains('expanded')) {
              // If initially expanded, set max-height
              content.style.paddingTop = '1rem'; // Ensure padding is set
              content.style.paddingBottom = '1.5rem';
              content.style.maxHeight = content.scrollHeight + "px";
            } else {
              // Ensure collapsed sections have 0 max-height and padding
              content.style.maxHeight = '0px';
              content.style.paddingTop = '0';
              content.style.paddingBottom = '0';
            }
          }
        });

        // Add listeners to quick links for smooth scrolling (only if they use href like #section-id)
        quickLinks.forEach(anchor => {
            if (anchor.getAttribute('href')?.startsWith('#') && !anchor.hasAttribute('onclick') && !anchor.hasAttribute('data-category')) {
               anchor.addEventListener('click', scrollToSection);
            }
        });

        // Update active link on scroll and initial load (only if using smooth scroll)
        if (document.querySelector('.quick-links a[href^="#"]')) { // Check if any scroll links exist
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(updateQuickLinks, 100); // Throttle update checks
            });
            updateQuickLinks(); // Set initial active link
            
            // Recalculate on resize and load (after images etc.)
            window.addEventListener('resize', updateQuickLinks);
            window.addEventListener('load', () => {
                // Recalculate heights for initially expanded sections after load
                document.querySelectorAll('.section .section-header.expanded').forEach(header => {
                   const content = header.nextElementSibling;
                   if (content && content.classList.contains('section-content')) {
                       content.style.maxHeight = content.scrollHeight + "px";
                   }
                });
                updateQuickLinks(); // Final check after load
            });
        }
      }
  } else {
      console.log('Skipping standard section/quick link setup for page-acns_criteria.');
  }
});

// Set up footer controls
function setupFooterControls() {
  console.log('Setting up footer controls...');
  // Font size toggle button
  const fontSizeBtn = document.getElementById('font-size-btn');
  if (fontSizeBtn) {
    // Remove any existing listeners to avoid duplicates
    fontSizeBtn.removeEventListener('click', toggleFontSize);
    // Add the listener
    fontSizeBtn.addEventListener('click', toggleFontSize);
    console.log('Font size button found and listener attached');
    
    // Add visual feedback for the button based on current state
    if (document.body.classList.contains('large-font')) {
      fontSizeBtn.classList.add('active');
    } else {
      fontSizeBtn.classList.remove('active');
    }
  } else {
    console.error('Font size button not found in the DOM');
  }
  
  // Dark mode toggle button
  const darkModeBtn = document.getElementById('dark-mode-btn');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', toggleDarkMode);
    console.log('Dark mode button found and listener attached');
    
    // Update button text based on current mode
    if (document.body.classList.contains('dark')) {
      darkModeBtn.textContent = 'Light Mode';
    } else {
      darkModeBtn.textContent = 'Dark Mode';
    }
  } else {
    console.error('Dark mode button not found in the DOM');
  }
  
  // Setup disclaimer modal
  setupDisclaimerModal();
}

// Set up copyright modal
function setupCopyrightModal() {
  console.log('Setting up copyright modal...');
  const modal = document.getElementById('copyright-modal');
  const copyTrigger = document.getElementById('copyright-trigger');
  const closeBtn = document.getElementById('copyright-close-btn');
  
  if (modal) {
    console.log('Copyright modal found');
    
    // Ensure modal is initially hidden
    modal.style.display = 'none';
    modal.classList.remove('visible');
    
    // Set up click event on copyright text
    if (copyTrigger) {
      copyTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Copyright text clicked, opening modal');
        openCopyrightModal();
      });
      console.log('Copyright trigger found and listener attached');
    } else {
      console.log('Copyright trigger not found');
    }
    
    // Close modal when clicking outside of it
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        console.log('Clicked outside modal content, closing');
        closeCopyrightModal();
      }
    });
    
    // Close button functionality
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Close button clicked, closing modal');
        closeCopyrightModal();
      });
      console.log('Close button found and listener attached');
    } else {
      console.log('Close button not found');
    }
    
    // Also handle ESC key to close modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('visible')) {
        closeCopyrightModal();
      }
    });
  } else {
    console.log('Copyright modal not found');
  }
}

// Set up dark mode toggle
function setupDarkMode() {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'true') {
    document.body.classList.add('dark');
  }
}

// Toggle dark mode
function toggleDarkMode() {
  console.log('Toggle dark mode called');
  if (document.body.classList.contains('dark')) {
    document.body.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
    updateDarkModeButtonText('Dark Mode');
  } else {
    document.body.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
    updateDarkModeButtonText('Light Mode');
  }
}

// Update the dark mode button text
function updateDarkModeButtonText(text) {
  const darkModeButton = document.getElementById('dark-mode-btn');
  if (darkModeButton) {
    darkModeButton.textContent = text;
  }
}

// Set up font size toggle
function setupFontSize() {
  const largeFont = localStorage.getItem('largeFont');
  if (largeFont === 'true') {
    document.body.classList.add('large-font');
    
    // Set active class on the button if it exists
    const fontSizeBtn = document.getElementById('font-size-btn');
    if (fontSizeBtn) {
      fontSizeBtn.classList.add('active');
    }
  }
}

// Toggle font size
function toggleFontSize() {
  console.log('Toggle font size called');
  try {
    const fontSizeBtn = document.getElementById('font-size-btn');
    
    if (document.body.classList.contains('large-font')) {
      // Disable large font
      document.body.classList.remove('large-font');
      localStorage.setItem('largeFont', 'false');
      console.log('Large font disabled');
      
      // Update button state
      if (fontSizeBtn) {
        fontSizeBtn.classList.remove('active');
      }
    } else {
      // Enable large font
      document.body.classList.add('large-font');
      localStorage.setItem('largeFont', 'true');
      console.log('Large font enabled');
      
      // Update button state
      if (fontSizeBtn) {
        fontSizeBtn.classList.add('active');
      }
    }
  } catch (error) {
    console.error('Error toggling font size:', error);
  }
}

// Get tab name from URL
function getTabName(url) {
  const mapping = {
    'epilepsy_rotation.html': 'Epilepsy Rotation',
    'seizure_management.html': 'Seizure Management',
    'ilae_classification.html': 'ILAE Classification',
    'natus_instructions.html': 'Natus & Persyst',
    'acns_criteria.html': 'ACNS Criteria',
    'eeg_atlas.html': 'EEG Atlas',
    'eeg_videos.html': 'EEG Videos',
    'faq.html': 'Learning Resources'
  };
  
  return mapping[url] || 'Menu';
}

// Set dropdown label
function setDropdownLabel(label) {
  const toggle = document.getElementById('nav-button');
  if (toggle) {
    // If there's a span in the button, update only the text node
    const span = toggle.querySelector('span');
    if (span) {
      // Remove all text nodes
      const textNodes = Array.from(toggle.childNodes).filter(node => node.nodeType === 3);
      textNodes.forEach(node => node.remove());
      
      // Add new text node before span
      toggle.insertBefore(document.createTextNode(label + ' '), span);
    } else {
      toggle.innerHTML = label + ' <span>▾</span>';
    }
  }
}

// Toggle navigation menu
function toggleNavMenu(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  console.log('Toggle nav menu called');
  
  // Get navigation menu
  const navMenu = document.getElementById('nav-menu');
  const navPanel = document.getElementById('nav-panel');
  
  if (!navMenu || !navPanel) {
    console.error('Navigation menu elements not found');
    return;
  }
  
  // Toggle active class on the menu
  if (navMenu.classList.contains('active')) {
    console.log('Hiding navigation panel');
    navMenu.classList.remove('active');
  } else {
    console.log('Showing navigation panel');
    navMenu.classList.add('active');
  }
  
  // Function to close menu when clicking outside
  function closeNavMenu(e) {
    const navButton = document.getElementById('nav-button');
    
    if (navButton && !navButton.contains(e.target) && !navPanel.contains(e.target)) {
      console.log('Clicked outside navigation menu, closing');
      navMenu.classList.remove('active');
      document.removeEventListener('click', closeNavMenu);
    }
  }
  
  // Remove any existing listener first to avoid duplicates
  document.removeEventListener('click', closeNavMenu);
  
  // Add the event listener with a slight delay to avoid immediate trigger
  setTimeout(() => {
    document.addEventListener('click', closeNavMenu);
  }, 10);
  
  return false; // Prevent default behavior
}

// Copyright modal functions
function openCopyrightModal() {
  console.log('Opening copyright modal');
  const modal = document.getElementById('copyright-modal');
  if (modal) {
    // First set display to flex to make it visible in the DOM
    modal.style.display = 'flex';
    
    // Force a reflow before adding the visible class for the transition to work
    modal.offsetHeight;
    
    // Then add the visible class to trigger the transition
    modal.classList.add('visible');
    document.body.classList.add('modal-open');
  } else {
    console.log('Modal element not found');
  }
}

function closeCopyrightModal() {
  console.log('Closing copyright modal');
  const modal = document.getElementById('copyright-modal');
  if (modal) {
    // First remove the visible class to trigger the fade out transition
    modal.classList.remove('visible');
    document.body.classList.remove('modal-open');
    
    // Wait for the transition to complete before hiding the modal completely
    setTimeout(() => {
      if (!modal.classList.contains('visible')) {
        modal.style.display = 'none';
      }
    }, 300); // Match this to the transition duration in CSS
  } else {
    console.log('Modal element not found');
  }
}

// Expose functions to global scope for inline HTML click handlers
// These MUST be defined here, and not inside DOMContentLoaded,
// so they're available when the HTML is parsed
window.openCopyrightModal = openCopyrightModal;
window.closeCopyrightModal = closeCopyrightModal;
window.toggleNavMenu = toggleNavMenu;

// Log to confirm these are properly exposed
console.log('Global functions exposed:',
  window.openCopyrightModal ? 'openCopyrightModal ✓' : 'openCopyrightModal ✗',
  window.closeCopyrightModal ? 'closeCopyrightModal ✓' : 'closeCopyrightModal ✗', 
  window.toggleNavMenu ? 'toggleNavMenu ✓' : 'toggleNavMenu ✗'
);

// Set up header functionality
function setupHeader() {
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('shrink');
      } else {
        header.classList.remove('shrink');
      }
    });
    
    // Set up navigation menu - only if not already set up in the header HTML
    const navButton = header.querySelector('.nav-button');
    const navPanel = header.querySelector('#nav-panel');
    
    if (navButton && navPanel && !navButton.getAttribute('id')) {
      // Only attach listener if it doesn't have an ID (meaning it wasn't configured in the HTML)
      console.log('Setting up nav button in setupHeader');
      
      // Set up click handler for navigation button
      navButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleNavMenu(event);
      });
      
      console.log('Navigation menu setup complete');
    } else {
      console.log('Navigation menu already configured in HTML or elements not found');
    }
  }
}

// Set up disclaimer modal
function setupDisclaimerModal() {
  console.log('Setting up disclaimer modal...');
  const disclaimerTrigger = document.getElementById('disclaimer-trigger');
  const disclaimerModal = document.getElementById('disclaimer-modal');
  
  if (disclaimerTrigger && disclaimerModal) {
    console.log('Disclaimer elements found, attaching event listeners');
    
    // Open disclaimer modal when clicking the trigger
    disclaimerTrigger.addEventListener('click', function() {
      console.log('Disclaimer button clicked');
      disclaimerModal.classList.add('active');
    });
    
    // Close disclaimer modal when clicking the close button
    const disclaimerClose = document.getElementById('disclaimer-close');
    if (disclaimerClose) {
      disclaimerClose.addEventListener('click', function() {
        disclaimerModal.classList.remove('active');
      });
    }
    
    // Close disclaimer modal when clicking the acknowledge button
    const disclaimerAcknowledge = document.getElementById('disclaimer-acknowledge');
    if (disclaimerAcknowledge) {
      disclaimerAcknowledge.addEventListener('click', function() {
        disclaimerModal.classList.remove('active');
      });
    }
    
    // Close modal when clicking outside
    disclaimerModal.addEventListener('click', function(e) {
      if (e.target === disclaimerModal) {
        disclaimerModal.classList.remove('active');
      }
    });
  } else {
    console.log('Disclaimer elements not found:', {
      trigger: disclaimerTrigger, 
      modal: disclaimerModal
    });
  }
}

// --- Section and Quick Link Handling ---

/**
 * Toggles the visibility of a section's content and updates the header class.
 * Uses max-height for smooth transition.
 * @param {HTMLElement} headerElement - The header element that was clicked.
 */
function toggleSection(headerElement) {
  if (!headerElement) return;
  headerElement.classList.toggle('expanded');
  const content = headerElement.nextElementSibling;
  if (content && content.classList.contains('section-content')) {
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
      // Collapse: set max-height to 0 after getting current height for transition
      content.style.maxHeight = content.scrollHeight + "px"; // Ensure transition starts from current height
      requestAnimationFrame(() => {
        content.style.maxHeight = '0px';
        content.style.paddingTop = '0'; // Also transition padding
        content.style.paddingBottom = '0';
      });
    } else {
      // Expand: set max-height based on scrollHeight
      content.style.paddingTop = '1rem'; // Set padding before calculating scrollHeight
      content.style.paddingBottom = '1.5rem';
      content.style.maxHeight = content.scrollHeight + "px";
      // Optional: Remove max-height after transition completes
      content.addEventListener('transitionend', () => {
        if (headerElement.classList.contains('expanded')) {
           // content.style.maxHeight = 'none'; // Be careful with this, might cause jumpiness if content changes
        }
      }, { once: true });
    } 
  }
  // Avoid calling updateQuickLinks here if it scrolls, causes race condition
  // Call updateQuickLinks after scrolling finishes in scrollToSection
}

/**
 * Updates the active state of quick links based on the currently visible section.
 */
function updateQuickLinks() {
  const quickLinks = document.querySelectorAll('.quick-links a');
  const sections = document.querySelectorAll('.section');
  if (quickLinks.length === 0 || sections.length === 0) return; // Only run if elements exist

  let firstVisibleSectionId = null;
  const headerHeight = document.getElementById('header-container')?.offsetHeight || 60;
  const scrollOffset = window.pageYOffset + headerHeight + 15; // Offset considers header and some padding

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionBottom = sectionTop + section.offsetHeight;

    // Check if the top of the section is within the viewport (considering offset)
    // Or if the section spans across the offset point
    if (scrollOffset >= sectionTop && scrollOffset < sectionBottom) {
       firstVisibleSectionId = section.id;
    }
    // Fallback for the very first section if near the top
    else if (!firstVisibleSectionId && scrollOffset < sectionTop && section === sections[0]) {
        firstVisibleSectionId = section.id;
    }
    // Fallback for the last section if scrolled past everything
    else if (!firstVisibleSectionId && scrollOffset >= sectionBottom && section === sections[sections.length - 1]) {
         firstVisibleSectionId = section.id;
    }
  });

  // If no section found (e.g., all above/below view), default to first/last based on scroll
  if (!firstVisibleSectionId && sections.length > 0) {
      if (scrollOffset < sections[0].offsetTop) {
          firstVisibleSectionId = sections[0].id; // Scrolled above first section
      } else if (scrollOffset >= sections[sections.length - 1].offsetTop + sections[sections.length - 1].offsetHeight) {
          firstVisibleSectionId = sections[sections.length - 1].id; // Scrolled below last section
      }
  }
  
  quickLinks.forEach(link => {
    const targetId = link.getAttribute('href').substring(1);
    if (targetId === firstVisibleSectionId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Smoothly scrolls to the target section when a quick link is clicked.
 * @param {Event} event - The click event.
 */
function scrollToSection(event) {
    event.preventDefault();
    const targetId = event.currentTarget.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        const headerHeight = document.getElementById('header-container')?.offsetHeight || 60; 
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 15; 
  
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });

        const sectionHeader = targetElement.querySelector('.section-header');
        if (sectionHeader && !sectionHeader.classList.contains('expanded')) {
             // Expand the section *after* scrolling animation likely starts
             setTimeout(() => {
                 toggleSection(sectionHeader);
                 // Re-check active link *after* expansion finishes transition
                 const content = sectionHeader.nextElementSibling;
                 if (content) {
                    content.addEventListener('transitionend', () => {
                       updateQuickLinks();
                    }, { once: true });
                 } else {
                    updateQuickLinks(); // Update immediately if no content transition
                 }
             }, 350); // Delay should be less than scroll time but enough to start scroll
        } else {
            // If already expanded or no header, update links after scroll
            // Use scrollend event if available, otherwise fallback to timeout
            let scrollTimeout;
            const scrollEndHandler = () => {
                clearTimeout(scrollTimeout);
                window.removeEventListener('scrollend', scrollEndHandler);
                updateQuickLinks();
            };

            if ('onscrollend' in window) {
                window.addEventListener('scrollend', scrollEndHandler, { once: true });
            } else {
                // Fallback timeout if scrollend is not supported
                window.addEventListener('scroll', () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(scrollEndHandler, 150); // Adjust timeout as needed
                });
            }
        }
    }
}

// --- End Section Handling --- 