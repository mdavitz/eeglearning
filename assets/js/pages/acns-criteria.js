/**
 * Filters the sections displayed on the ACNS Terminology page based on the selected quick link.
 * Mimics the filterCategory function from seizure_management.html.
 * @param {string} category - The category to display ('all', 'reference-charts', 'training-module').
 */
function filterAcnsCategory(category) {
  console.log(`Filtering ACNS sections for: ${category}`);
  const quickLinks = document.querySelectorAll('.quick-links a');
  const sections = document.querySelectorAll('.section'); // Target the main section divs
  const mainContent = document.querySelector('main.page-acns_criteria'); // More specific selector for main content area

  // Update active state for quick links
  quickLinks.forEach(link => {
    link.classList.remove('active');
    const linkCategory = link.getAttribute('data-category');
    if (linkCategory === category) {
      link.classList.add('active');
    }
  });

  // Show/hide sections based on selected category
  sections.forEach(section => {
    const sectionId = section.id;
    const sectionCategory = sectionId.replace('-section', '');
    const content = section.querySelector('.section-content');

    if (category === 'all' || category === sectionCategory) {
      // Show matching section or all sections
      section.style.display = 'block';
      if(content) {
          content.style.display = 'block'; // Explicitly show content
          content.style.maxHeight = 'none'; // Remove max-height constraint
          content.style.paddingTop = '1rem'; // Ensure padding is set
          content.style.paddingBottom = '1.5rem';
      } 
    } else {
      // Hide other sections
      section.style.display = 'none';
      // Optionally hide content as well, though parent is hidden
      // if(content) content.style.display = 'none'; 
    }
  });

  // Scroll to the top of the main content area smoothly
  if (mainContent) {
     const mainContentTop = mainContent.getBoundingClientRect().top + window.pageYOffset;
     const header = document.getElementById('header-container');
     const headerHeight = header ? header.offsetHeight : 60; // Dynamic header height
     const offsetPosition = mainContentTop - headerHeight - 15; // Adjust for header

     // Only scroll if the content is not already near the top
     // Check if the current scroll position is significantly different
     if (Math.abs(window.pageYOffset - offsetPosition) > 5) { 
         window.scrollTo({
             top: offsetPosition > 0 ? offsetPosition : 0, 
             behavior: "smooth"
         });
     }
  }
}

// Initial setup on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  // Ensure this script only runs on the ACNS criteria page
  if (!document.body.classList.contains('page-acns_criteria')) {
      return;
  }
  
  console.log('Initializing ACNS terminology page specific script...');

  // Set the 'All' button as active initially and show all sections
  const allBtn = document.getElementById('all-btn');
  if (allBtn) {
      allBtn.setAttribute('data-category', 'all');
      allBtn.classList.add('active');
  }
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
       section.style.display = 'block'; // Ensure section is visible
       const content = section.querySelector('.section-content');
       if(content) {
           content.style.display = 'block'; // Ensure content is visible
           content.style.maxHeight = 'none'; // Remove max-height constraint
           content.style.paddingTop = '1rem'; // Ensure padding is set
           content.style.paddingBottom = '1.5rem';
       }
  });
  
  // Add listeners to quick links dynamically using data attributes
  const quickLinks = document.querySelectorAll('.quick-links a');
  quickLinks.forEach(link => {
      // Remove previous listener if any (safety measure)
      link.removeEventListener('click', handleQuickLinkClick); 
      // Add the new listener
      link.addEventListener('click', handleQuickLinkClick);
  });
});

// Define the handler function separately
function handleQuickLinkClick(event) {
    event.preventDefault();
    const category = this.getAttribute('data-category'); 
    if (category) {
        filterAcnsCategory(category);
    }
} 