/**
 * ILAE Classification Page JavaScript
 * This module handles functionality for the ILAE classification cards
 */

document.addEventListener('DOMContentLoaded', function() {
  initILAEClassification();
});

/**
 * Initialize the ILAE classification page functionality
 */
function initILAEClassification() {
  // Get all ILAE cards
  const cards = document.querySelectorAll('.ilae-card');
  
  // Add click event listeners to each card
  cards.forEach(card => {
    card.addEventListener('click', function() {
      // Get data from card attributes
      const title = this.getAttribute('data-title') || '';
      const summary = this.getAttribute('data-summary') || 'No summary available';
      const eeg = this.getAttribute('data-eeg') || 'No specific EEG findings documented';
      const pdfLink = this.getAttribute('data-pdf') || '';
      
      // Populate modal content
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-overview').innerHTML = summary;
      document.getElementById('modal-eeg').innerHTML = eeg;
      
      // Handle PDF link if present
      const pdfContainer = document.getElementById('pdfLinkContainer');
      const pdfElement = document.getElementById('pdfLink');
      
      if (pdfLink && pdfContainer && pdfElement) {
        pdfElement.href = pdfLink;
        pdfContainer.style.display = 'block';
      } else if (pdfContainer) {
        pdfContainer.style.display = 'none';
      }
      
      // Show the modal
      const modal = document.getElementById('ilae-modal');
      if (modal) modal.style.display = 'flex';
    });
  });
  
  // Close modal when clicking the close button
  const closeButton = document.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      const modal = document.getElementById('ilae-modal');
      if (modal) modal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside the content
  const modal = document.getElementById('ilae-modal');
  if (modal) {
    modal.addEventListener('click', function(event) {
      if (event.target === this) {
        this.style.display = 'none';
      }
    });
  }
  
  // Set up search and filters
  setupFiltersAndSearch();
}

/**
 * Setup the filtering and search functionality
 */
function setupFiltersAndSearch() {
  const typeFilter = document.getElementById('type-filter');
  const ageFilter = document.getElementById('age-filter');
  const searchInput = document.getElementById('searchBar');
  const resetButton = document.getElementById('reset-filters');
  
  // Add event listeners to filters and search
  if (typeFilter) typeFilter.addEventListener('change', filterCards);
  if (ageFilter) ageFilter.addEventListener('change', filterCards);
  if (searchInput) searchInput.addEventListener('input', filterCards);
  
  // Reset button event listener
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      if (typeFilter) typeFilter.value = 'all';
      if (ageFilter) ageFilter.value = 'all';
      if (searchInput) searchInput.value = '';
      filterCards();
    });
  }
}

/**
 * Filter cards based on current filter and search values
 */
function filterCards() {
  const typeFilter = document.getElementById('type-filter')?.value || 'all';
  const ageFilter = document.getElementById('age-filter')?.value || 'all';
  const searchValue = document.getElementById('searchBar')?.value.toLowerCase() || '';
  const cards = document.querySelectorAll('.ilae-card');
  
  let visibleCount = 0;
  
  cards.forEach(card => {
    const cardType = card.getAttribute('data-type') || '';
    const cardAge = card.getAttribute('data-age') || '';
    const cardTitle = card.getAttribute('data-title')?.toLowerCase() || '';
    const cardSummary = card.getAttribute('data-summary')?.toLowerCase() || '';
    const cardContent = card.textContent.toLowerCase();
    
    // Check if card matches all filter criteria
    const typeMatch = typeFilter === 'all' || cardType === typeFilter;
    const ageMatch = ageFilter === 'all' || cardAge === ageFilter;
    const searchMatch = searchValue === '' || 
                        cardTitle.includes(searchValue) || 
                        cardSummary.includes(searchValue) || 
                        cardContent.includes(searchValue);
    
    // Show or hide card based on matches
    if (typeMatch && ageMatch && searchMatch) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Show/hide the no results message
  const noResults = document.getElementById('no-results');
  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }
  
  // Update section visibility - hide sections with no visible cards
  document.querySelectorAll('details').forEach(section => {
    const visibleCardsInSection = Array.from(section.querySelectorAll('.ilae-card')).filter(card => 
      card.style.display !== 'none'
    ).length;
    
    if (visibleCardsInSection === 0) {
      section.style.display = 'none';
    } else {
      section.style.display = '';
      // Open sections with visible cards
      section.open = true;
    }
  });
} 