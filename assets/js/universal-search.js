/**
 * Universal Search - Apple Style
 * 
 * This file implements a site-wide search functionality that:
 * 1. Indexes content from all pages
 * 2. Provides real-time search results
 * 3. Allows users to navigate directly to search results
 * 4. Highlights search terms on the destination page
 */

// Use a self-executing function to avoid global namespace conflicts
(function() {

// Check if another search instance already exists
if (window.UniversalSearch) {
  console.warn('Another UniversalSearch instance already exists! Skipping initialization.');
  return;
}

const UniversalSearch = {
  // Configuration
  config: {
    minQueryLength: 2,
    debounceTime: 300,
    maxResults: 10,
    highlightClass: 'search-highlight',
    contentSelectors: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'li', 'td', 'th', '.card', '.section-detail'
    ],
    searchCache: {},
    // Pages to index (will scan for more)
    pagesToIndex: [
      'index.html',
      'epilepsy_rotation.html',
      'seizure_management.html',
      'ilae_classification.html',
      'natus_instructions.html',
      'acns_criteria.html',
      'eeg_atlas.html',
      'eeg_videos.html',
      'faq.html'
    ],
    // Skip these paths when indexing
    excludePaths: [
      'flappy_brain/',
      'assets/',
      'includes/'
    ],
    // List of medical acronyms to prioritize in search
    medicalAcronyms: [
      'ADR', 'AED', 'ASM', 'EEG', 'EMU', 'ICU', 'ILAE', 'LTM', 
      'MRI', 'NCSE', 'PDR', 'PNES', 'REM', 'SE', 'SUDEP'
    ],
    // Dynamic index built by crawling pages
    dynamicIndex: [],
    // Backup hardcoded index if crawling fails
    defaultIndex: [
      // These are hardcoded examples - will be replaced with dynamic content when indexing is implemented
      {
        title: "Seizure Management - Medications",
        content: "Anti-seizure medications (ASMs) with typical adult dosing ranges, common side effects, and therapeutic ranges.",
        url: "seizure_management.html#anti-seizure-medications",
        keywords: ["seizure", "medication", "ASM", "dosing", "side effects", "therapeutic"]
      },
      // Add explicit entry for ADR
      {
        title: "Adverse Drug Reactions (ADR)",
        content: "Information about adverse drug reactions (ADRs) for anti-seizure medications, including common and serious adverse effects.",
        url: "seizure_management.html#adverse-effects",
        keywords: ["ADR", "adverse drug reaction", "side effect", "complication", "medication", "drug", "toxicity"]
      },
      {
        title: "EEG Atlas - Normal Patterns",
        content: "Posterior Dominant Rhythm (PDR), sometimes called the alpha rhythm, is the normal background activity seen in awake adults.",
        url: "eeg_atlas.html#posterior-dominant-rhythm",
        keywords: ["EEG", "normal", "PDR", "alpha rhythm", "background"]
      },
      {
        title: "ILAE Classification",
        content: "Seizures are classified by whether they have a focal, generalized, or unknown onset.",
        url: "ilae_classification.html#seizure-types",
        keywords: ["ILAE", "classification", "focal", "generalized", "seizure"]
      },
      {
        title: "Status Epilepticus",
        content: "Management of convulsive status epilepticus follows a time-based protocol with different medications.",
        url: "seizure_management.html#status-epilepticus",
        keywords: ["status epilepticus", "convulsive", "emergency", "protocol"]
      },
      {
        title: "EEG Videos",
        content: "Educational videos showing various EEG patterns and seizure types.",
        url: "eeg_videos.html",
        keywords: ["EEG", "video", "educational", "patterns", "seizure"]
      },
      {
        title: "Natus & Persyst Instructions",
        content: "Instructions for using Natus NeuroWorks and Persyst software for EEG recording and analysis.",
        url: "natus_instructions.html",
        keywords: ["Natus", "Persyst", "software", "EEG", "recording", "analysis"]
      },
      {
        title: "Epilepsy Rotation",
        content: "Information about the epilepsy rotation, including expectations and resources.",
        url: "epilepsy_rotation.html",
        keywords: ["epilepsy", "rotation", "education", "EEG"]
      },
      {
        title: "ACNS Criteria",
        content: "Standardized terminology for EEG monitoring in critical care settings, including criteria for seizures and status epilepticus.",
        url: "acns_criteria.html",
        keywords: ["ACNS", "critical care", "terminology", "EEG", "monitoring"]
      }
    ]
  },
  
  // Track if initialized already
  initialized: false,
  
  // Initialize the search functionality
  init: function() {
    // Track the current page path for detecting navigation
    this.lastInitPath = window.location.pathname;
    
    // Prevent multiple initializations on the same page
    if (this.initialized && this.lastInitPath === window.location.pathname) {
      console.log('UniversalSearch already initialized on this page, skipping.');
      return;
    }
    
    console.log('UniversalSearch.init() called on ' + this.lastInitPath);
    
    // Reset state for new initialization
    this.initialized = false;
    this.searchInput = null;
    this.searchResults = null;
    
    // Get elements
    this.searchInput = document.getElementById('universal-search-input');
    this.searchResults = document.getElementById('search-results');
    this.searchClear = document.getElementById('search-clear');
    this.fullscreenSearch = document.getElementById('search-fullscreen');
    this.fullscreenSearchInput = document.getElementById('fullscreen-search-input');
    this.fullscreenSearchResults = document.getElementById('fullscreen-search-results');
    this.fullscreenSearchClear = document.getElementById('fullscreen-search-clear');
    this.closeFullscreenBtn = document.getElementById('search-close-fullscreen');
    
    // Set up event listeners if elements exist
    if (this.searchInput && this.searchResults) {
      // Clean up existing event listeners first
      this.cleanupEventListeners();
      
      // Set up new event listeners
      this.setupEventListeners();
      this.handleURLParameters();

      // Add direct click handler to ensure responsiveness
      this.searchInput.addEventListener('click', (e) => {
        // If there's content in the field, show results
        if (this.searchInput.value && this.searchInput.value.trim().length >= this.config.minQueryLength) {
          console.log('Click detected on search input with content, showing results');
          this.handleSearchInput(e);
        }
      });
      
      // Add focus handler too
      this.searchInput.addEventListener('focus', (e) => {
        // If there's content in the field, show results
        if (this.searchInput.value && this.searchInput.value.trim().length >= this.config.minQueryLength) {
          console.log('Focus detected on search input with content, showing results');
          this.handleSearchInput(e);
        }
      });

      // Debug log
      console.log('Search elements found:', {
        searchInput: this.searchInput,
        searchResults: this.searchResults
      });

      // Build search index
      if (!this.config.searchIndex || this.config.searchIndex.length === 0) {
        this.buildSearchIndex();
      }
      
      // Mark as initialized
      this.initialized = true;
      console.log('UniversalSearch successfully initialized');
    } else {
      console.error('Search elements not found:', {
        searchInput: this.searchInput,
        searchResults: this.searchResults
      });
    }
  },
  
  // Clean up any existing event listeners to prevent duplicates
  cleanupEventListeners: function() {
    // Create a clone of the search input and replace the original to remove all event listeners
    if (this.searchInput) {
      const parent = this.searchInput.parentNode;
      const clone = this.searchInput.cloneNode(true);
      if (parent) {
        parent.replaceChild(clone, this.searchInput);
        this.searchInput = clone;
      }
    }
    
    // Same for fullscreen search
    if (this.fullscreenSearchInput) {
      const parent = this.fullscreenSearchInput.parentNode;
      const clone = this.fullscreenSearchInput.cloneNode(true);
      if (parent) {
        parent.replaceChild(clone, this.fullscreenSearchInput);
        this.fullscreenSearchInput = clone;
      }
    }
    
    // Replace search results containers
    if (this.searchResults) {
      const parent = this.searchResults.parentNode;
      const clone = this.searchResults.cloneNode(false); // Clone without children
      if (parent) {
        parent.replaceChild(clone, this.searchResults);
        this.searchResults = clone;
      }
    }
    
    if (this.fullscreenSearchResults) {
      const parent = this.fullscreenSearchResults.parentNode;
      const clone = this.fullscreenSearchResults.cloneNode(false); // Clone without children
      if (parent) {
        parent.replaceChild(clone, this.fullscreenSearchResults);
        this.fullscreenSearchResults = clone;
      }
    }
  },
  
  // Build search index by crawling all pages
  buildSearchIndex: function() {
    console.log('Building search index...');
    
    // Use default index by default - will be replaced if dynamic indexing works
    this.config.searchIndex = this.config.defaultIndex;
    
    try {
      // Start with empty dynamic index
      this.config.dynamicIndex = [];
      
      // Process each predefined page
      this.config.pagesToIndex.forEach(page => {
        this.indexSinglePage(page);
      });
      
      // Use the newly built index if it has content
      if (this.config.dynamicIndex.length > 0) {
        console.log(`Successfully built dynamic index with ${this.config.dynamicIndex.length} entries`);
        this.config.searchIndex = this.config.dynamicIndex;
      } else {
        console.warn('Dynamic indexing failed, using default index');
      }
    } catch (error) {
      console.error('Error building search index:', error);
    }
  },
  
  // Index a single page synchronously (more reliable than async)
  indexSinglePage: function(url) {
    try {
      console.log('Indexing page:', url);
      
      // Create an XHR to fetch the page (works more reliably than fetch in some cases)
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false); // Synchronous for reliability
      xhr.send();
      
      if (xhr.status === 200) {
        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(xhr.responseText, 'text/html');
        
        // Get page title
        const pageTitle = doc.querySelector('title')?.textContent || 
                          doc.querySelector('h1')?.textContent || 
                          url.replace('.html', '').replace(/[_-]/g, ' ');
        
        console.log(`Indexing content from ${url} with title "${pageTitle}"`);
        
        // Extract content sections from page
        const sections = this.extractPageSections(doc, url, pageTitle);
        
        if (sections.length > 0) {
          console.log(`Added ${sections.length} sections from ${url}`);
          this.config.dynamicIndex.push(...sections);
        } else {
          console.warn(`No content found in ${url}`);
          
          // Add a basic entry if no sections found
          this.config.dynamicIndex.push({
            title: pageTitle,
            content: "Page content",
            url: url,
            keywords: [pageTitle.toLowerCase()]
          });
        }
      } else {
        console.error(`Failed to fetch ${url}: ${xhr.status}`);
      }
    } catch (error) {
      console.error(`Error indexing ${url}:`, error);
    }
  },
  
  // Extract sections from a page
  extractPageSections: function(doc, url, pageTitle) {
    const sections = [];
    
    try {
      // Get all text content from the page 
      const contentBlocks = [];
      
      // First specifically extract all links to create direct navigation entries
      const allLinks = doc.querySelectorAll('a[href]');
      console.log(`Found ${allLinks.length} links to index on page ${url}`);
      
      // Create a map to avoid duplicate link entries
      const linkMap = new Map();
      
      allLinks.forEach(link => {
        const linkText = link.textContent.trim();
        const linkHref = link.getAttribute('href');
        
        // Skip empty links, javascript links, or anchor-only links
        if (!linkText || !linkHref || 
            linkHref.startsWith('javascript:') || 
            linkHref === '#' ||
            linkHref.startsWith('mailto:')) {
          return;
        }
        
        // Skip links that are just icons or have no meaningful text
        if (linkText.length < 3 || link.querySelector('i.fa, i.fas, i.fab, i.far')) {
          return;
        }
        
        // Get any nearby context (parent paragraph or list item text)
        let contextText = '';
        let parentEl = link.parentElement;
        if (parentEl) {
          if (parentEl.tagName === 'LI') {
            contextText = parentEl.textContent.trim();
          } else if (parentEl.tagName === 'P') {
            contextText = parentEl.textContent.trim();
          } else if (parentEl.tagName === 'TD' || parentEl.tagName === 'TH') {
            const row = parentEl.closest('tr');
            if (row) {
              const cells = row.querySelectorAll('td, th');
              const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());
              contextText = cellTexts.join(' | ');
            }
          }
        }
        
        // Clean up the context by removing the link text if it's redundant
        if (contextText.length > linkText.length) {
          contextText = contextText.replace(linkText, '').trim();
          if (contextText) {
            contextText = ` - ${contextText}`;
          }
        } else {
          contextText = '';
        }
        
        // Resolve the URL
        let resolvedUrl = linkHref;
        if (!linkHref.includes('://') && !linkHref.startsWith('/')) {
          // It's a relative URL
          if (linkHref.startsWith('#')) {
            // It's an anchor link on the same page
            resolvedUrl = url + linkHref;
          } else {
            // It's a relative path
            const basePath = url.substring(0, url.lastIndexOf('/') + 1);
            resolvedUrl = basePath + linkHref;
          }
        }
        
        // Create a unique key for this link to avoid duplicates
        const linkKey = `${linkText}|${resolvedUrl}`;
        
        if (!linkMap.has(linkKey)) {
          linkMap.set(linkKey, {
            title: `${linkText}${contextText}`,
            content: `Link on page ${pageTitle}: ${linkText}${contextText ? ' - ' + contextText : ''}`,
            url: resolvedUrl,
            keywords: this.extractKeywordsFromLink(linkText, contextText)
          });
        }
      });
      
      // Add all unique links to the content blocks
      linkMap.forEach(linkData => {
        contentBlocks.push(linkData);
      });
      
      // First explicitly index all tables with their content
      const tables = doc.querySelectorAll('table');
      console.log(`Found ${tables.length} tables to index on page ${url}`);
      
      tables.forEach((table, tableIndex) => {
        const tableCaption = table.querySelector('caption')?.textContent || 
                            table.getAttribute('aria-label') || 
                            `Table ${tableIndex + 1}`;
        
        // Get table headers
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        
        // Process each row
        const rows = table.querySelectorAll('tr');
        let tableContent = '';
        
        rows.forEach(row => {
          // Get all cells in this row (both th and td)
          const cells = row.querySelectorAll('th, td');
          let rowContent = '';
          
          cells.forEach((cell, cellIndex) => {
            // Include header label if available
            const headerLabel = headers[cellIndex] ? `${headers[cellIndex]}: ` : '';
            rowContent += headerLabel + cell.textContent.trim() + ' | ';
            
            // Also capture any links within the cell
            const links = cell.querySelectorAll('a');
            links.forEach(link => {
              if (link.textContent && link.textContent.trim()) {
                rowContent += link.textContent.trim() + ' ';
              }
            });
          });
          
          if (rowContent.trim()) {
            tableContent += rowContent + '\n';
          }
        });
        
        if (tableContent.trim()) {
          const tableId = table.id || `table-${tableIndex}`;
          
          // Create an id for the table if it doesn't have one
          if (!table.id) {
            table.id = tableId;
          }
          
          contentBlocks.push({
            title: `${pageTitle} - ${tableCaption}`,
            content: tableContent,
            id: tableId
          });
        }
      });
      
      // Find headings and their content
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        const id = heading.id || this.createIdFromText(heading.textContent);
        let contentText = heading.textContent.trim();
        let nextEl = heading.nextElementSibling;
        
        // Collect content until next heading
        while (nextEl && !nextEl.matches('h1, h2, h3, h4, h5, h6')) {
          if (nextEl.textContent && nextEl.textContent.trim()) {
            contentText += ' ' + nextEl.textContent.trim();
          }
          nextEl = nextEl.nextElementSibling;
        }
        
        if (contentText.length > heading.textContent.length) {
          contentBlocks.push({
            title: heading.textContent.trim(),
            content: contentText,
            id: id
          });
          
          // Make sure heading has an ID for linking
          if (!heading.id) {
            heading.id = id;
          }
        }
      });
      
      // Specifically index individual rows in medication table (commonly searched)
      const medTable = doc.querySelector('#medicationsTableBody');
      if (medTable) {
        console.log(`Found medications table on page ${url}`);
        const rows = medTable.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            // First cell is usually the medication name
            const medName = cells[0].textContent.trim();
            
            // Collect all content from this row
            let medContent = '';
            cells.forEach(cell => {
              medContent += cell.textContent.trim() + ' ';
              
              // Also get any link text
              const links = cell.querySelectorAll('a');
              links.forEach(link => {
                if (link.textContent) {
                  medContent += link.textContent.trim() + ' ';
                }
              });
            });
            
            if (medName && medContent) {
              const medId = `med-${this.createIdFromText(medName)}`;
              
              // Create an anchor in the row if it doesn't have one
              if (!row.id) {
                row.id = medId;
              }
              
              contentBlocks.push({
                title: `${pageTitle} - ${medName}`,
                content: medContent,
                id: medId,
                keywords: [medName.toLowerCase(), 'medication', 'drug', 'seizure', 'epilepsy']
              });
            }
          }
        });
      }
      
      // If no headings with content, get paragraphs
      if (contentBlocks.length === 0) {
        const paragraphs = doc.querySelectorAll('p');
        if (paragraphs.length > 0) {
          let allContent = '';
          paragraphs.forEach(p => {
            allContent += ' ' + p.textContent.trim();
          });
          
          if (allContent.trim()) {
            contentBlocks.push({
              title: pageTitle,
              content: allContent.trim(),
              id: ''
            });
          }
        }
      }
      
      // If still no content, try getting all text
      if (contentBlocks.length === 0) {
        const body = doc.querySelector('body');
        if (body) {
          contentBlocks.push({
            title: pageTitle,
            content: body.textContent.trim().substring(0, 500),
            id: ''
          });
        }
      }
      
      // Convert content blocks to search index entries
      contentBlocks.forEach(block => {
        sections.push({
          title: block.title === pageTitle ? pageTitle : `${pageTitle} - ${block.title}`,
          content: block.content.substring(0, 300) + (block.content.length > 300 ? '...' : ''),
          url: block.id ? `${url}#${block.id}` : url,
          keywords: block.keywords || this.extractKeywords(block.content)
        });
      });
    } catch (error) {
      console.error('Error extracting page sections:', error);
    }
    
    return sections;
  },
  
  // Extract keywords from link text
  extractKeywordsFromLink: function(linkText, context) {
    const keywords = [];
    
    // Add the link text as a full keyword for exact matches
    keywords.push(linkText.toLowerCase());
    
    // Add individual words from the link text
    const linkWords = linkText.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    keywords.push(...linkWords);
    
    // Add words from context
    if (context) {
      const contextWords = context.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !keywords.includes(word));
      
      keywords.push(...contextWords);
    }
    
    // Add special handling for specific link types
    if (linkText.toLowerCase().includes('eeg') || context.toLowerCase().includes('eeg')) {
      keywords.push('eeg', 'electroencephalogram');
    }
    
    if (linkText.toLowerCase().includes('epilepsy') || context.toLowerCase().includes('epilepsy')) {
      keywords.push('epilepsy', 'seizure', 'guide');
    }
    
    // Add common variations
    if (linkText.toLowerCase().includes('index')) {
      keywords.push('index', 'list', 'directory', 'contents');
    }
    
    if (linkText.toLowerCase().includes('guide')) {
      keywords.push('guide', 'manual', 'instruction', 'handbook');
    }
    
    // Remove duplicates and return
    return [...new Set(keywords)].slice(0, 15);
  },
  
  // Create ID from text
  createIdFromText: function(text) {
    if (!text) return '';
    return text.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },
  
  // Extract keywords from content
  extractKeywords: function(content) {
    if (!content) return [];
    
    const commonWords = ['the', 'and', 'or', 'a', 'an', 'in', 'on', 'of', 'to', 'for', 'with', 'by'];
    
    return content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .filter((word, index, self) => self.indexOf(word) === index)
      .slice(0, 10);
  },

  // Set up all event listeners
  setupEventListeners: function() {
    // Setup search input event listeners
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
      
      // Check for clear button
      if (this.searchClear) {
        this.searchClear.addEventListener('click', () => {
          this.clearSearch(this.searchInput, this.searchResults);
        });
      }
    }
    
    // Setup fullscreen search if available
    if (this.fullscreenSearchInput) {
      this.fullscreenSearchInput.addEventListener('input', (e) => this.handleSearchInput(e, this.fullscreenSearchInput, this.fullscreenSearchResults));
      
      // Check for fullscreen clear button
      if (this.fullscreenSearchClear) {
        this.fullscreenSearchClear.addEventListener('click', () => {
          this.clearSearch(this.fullscreenSearchInput, this.fullscreenSearchResults);
        });
      }
      
      // Close fullscreen search when close button is clicked
      if (this.closeFullscreenBtn) {
        this.closeFullscreenBtn.addEventListener('click', () => {
          this.fullscreenSearch.classList.remove('active');
        });
      }
    }
  },
  
  // Handle search input event
  handleSearchInput: function(e, inputElement, resultsElement) {
    // Use provided elements or default to main search
    const input = inputElement || this.searchInput || e.target;
    const results = resultsElement || this.searchResults;
    
    if (!input || !results) {
      console.error('Search elements not available:', { input, results });
      return;
    }
    
    const query = input.value.trim();
    
    // Clear button visibility
    const clearBtn = input === this.fullscreenSearchInput ? this.fullscreenSearchClear : this.searchClear;
    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }
    
    // If query is empty, hide results
    if (!query || query.length < this.config.minQueryLength) {
      results.innerHTML = '';
      results.classList.remove('active');
      return;
    }
    
    // Check for special direct navigation
    if (this.handleDirectAcronymNavigation(query)) {
      return;
    }
    
    // Debounce the search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query, results);
    }, this.config.debounceTime);
  },
  
  // Handle direct navigation for specific acronyms
  handleDirectAcronymNavigation: function(query) {
    if (!query) return false;
    
    query = query.trim().toUpperCase();
    
    // Special handling for ADR
    if (query === 'ADR') {
      console.log('Direct navigation to ADR section');
      
      // Check if we need to navigate to ADR in Persyst tab
      const onNatusPage = window.location.pathname.includes('natus');
      if (onNatusPage && document.body.textContent.toLowerCase().includes('persyst') && 
          document.body.textContent.toLowerCase().includes('adverse drug reaction')) {
        console.log('Found ADR content in Persyst tab, navigating with tab=persyst parameter');
        window.location.href = '#persyst-section?search=ADR&tab=persyst';
        return true;
      }
      
      window.location.href = 'seizure_management.html#adverse-effects?search=ADR';
      return true;
    }
    
    // Special handling for other common acronyms
    const directLinks = {
      'ASM': 'seizure_management.html#anti-seizure-medications',
      'EMU': 'epilepsy_rotation.html#epilepsy-monitoring-unit',
      'ILAE': 'ilae_classification.html',
      'PDR': 'eeg_atlas.html#posterior-dominant-rhythm',
      'SUDEP': 'seizure_management.html#sudep',
      // Add persyst-specific content
      'PERSYST': 'natus_instructions.html#persyst-section?tab=persyst',
      'EEG REVIEW': 'natus_instructions.html#persyst-section?tab=persyst'
    };
    
    if (directLinks[query]) {
      console.log(`Direct navigation to ${query} section`);
      window.location.href = directLinks[query] + '&search=' + query;
      return true;
    }
    
    // Check for persyst-specific content navigation
    if (query.includes('PERSYST') || query === 'EEG SOFTWARE' || query === 'EEG ANALYSIS') {
      console.log('Direct navigation to Persyst tab');
      window.location.href = 'natus_instructions.html#persyst-section?tab=persyst&search=' + query;
      return true;
    }
    
    return false;
  },
  
  // Utility methods for debugging
  isElementVisible: function(el) {
    if (!el) return false;
    
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
  },
  
  getElementPosition: function(el) {
    if (!el) return null;
    
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  },
  
  // Clear the search input and results
  clearSearch: function(inputEl, resultsEl) {
    if (inputEl) {
      inputEl.value = '';
      inputEl.focus();
    }
    
    if (resultsEl) {
      resultsEl.innerHTML = '';
      resultsEl.classList.remove('active');
    }
  },
  
  // Perform the search
  performSearch: function(query, resultsContainer) {
    resultsContainer.innerHTML = '';
    resultsContainer.classList.add('active');
    
    // Cache results for performance
    if (this.config.searchCache[query]) {
      this.displayResults(this.config.searchCache[query], query, resultsContainer);
      return;
    }
    
    // Search the index
    const results = this.searchIndex(query);
    
    // Cache the results
    this.config.searchCache[query] = results;
    
    // Display the results
    this.displayResults(results, query, resultsContainer);
  },
  
  // Display the search results
  displayResults: function(results, query, resultsContainer) {
    // If no results found
    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'search-no-results';
      noResults.textContent = 'No results found for "' + query + '"';
      resultsContainer.appendChild(noResults);
      return;
    }
    
    // Create and append each result
    results.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      
      // Ensure URL is valid
      const url = result.item.url || '';
      resultItem.setAttribute('data-url', url);
      
      const titleEl = document.createElement('div');
      titleEl.className = 'search-result-title';
      titleEl.innerHTML = this.highlightMatch(result.item.title, query);
      
      const contextEl = document.createElement('div');
      contextEl.className = 'search-result-context';
      contextEl.innerHTML = this.highlightMatch(result.item.content, query);
      
      resultItem.appendChild(titleEl);
      resultItem.appendChild(contextEl);
      
      // Add click event to navigate to the result
      resultItem.addEventListener('click', () => {
        if (url && url !== 'null' && url !== 'undefined') {
          console.log('Navigating to search result:', url);
          window.location.href = url + (url.includes('?') ? '&' : '?') + 'search=' + encodeURIComponent(query);
        } else {
          console.error('Invalid URL for search result:', result.item);
        }
      });
      
      resultsContainer.appendChild(resultItem);
    });
  },
  
  // Highlight matching text in search results
  highlightMatch: function(text, query) {
    if (!query) return text;
    
    // Split the query into terms for highlighting
    const terms = query.split(/\s+/).map(term => term.trim()).filter(term => term.length > 0);
    let result = text;
    
    // Highlight each term
    terms.forEach(term => {
      const regex = new RegExp('(' + this.escapeRegExp(term) + ')', 'gi');
      result = result.replace(regex, '<span class="search-highlight">$1</span>');
    });
    
    return result;
  },
  
  // Handle URL parameters for highlighting content
  handleURLParameters: function() {
    // Check if there's a search parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const tabParam = urlParams.get('tab');
    
    // Check if we need to activate a specific tab first (like persyst)
    if (tabParam) {
      console.log('Tab parameter found in URL:', tabParam);
      
      // Try to activate the specified tab before processing search
      this.activateTabFromParameter(tabParam);
    }
    
    if (searchQuery) {
      console.log('Search query found in URL:', searchQuery);
      
      // Set search input value to the query
      if (this.searchInput) {
        this.searchInput.value = searchQuery;
      }
      
      // Special handling for pages that might have complex content
      const currentPage = window.location.pathname.split('/').pop();
      console.log('Current page:', currentPage);
      
      // Check if we're on a page that needs special handling
      const isComplexPage = currentPage === 'ilae_classification.html' || 
                            currentPage.includes('ilae') ||
                            (currentPage.includes('natus') && searchQuery.toLowerCase().includes('persyst'));
      
      // Wait for page to fully load before highlighting
      // Use a longer timeout for complex pages
      setTimeout(() => {
        console.log('Attempting to highlight content...');
        
        // Highlight the search terms on the page
        const highlighted = this.highlightContentOnPage(searchQuery);
        
        // Check for hash in the URL
        const hash = window.location.hash;
        if (hash) {
          console.log('Hash found in URL:', hash);
          // Try to scroll to the element with this ID
          const targetElement = document.getElementById(hash.substring(1));
          if (targetElement) {
            console.log('Scrolling to hash target');
            // First make sure it's visible
            this.ensureElementIsVisible(targetElement);
            // Then scroll to it
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add a visual indicator
            this.addTemporaryIndicator(targetElement);
            return;
          }
        }
        
        // If no hash or element not found, scroll to first highlight
        if (highlighted) {
          console.log('Scrolling to first highlight');
          // First make sure it's visible
          this.ensureElementIsVisible(highlighted);
          // Then scroll to it
          highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a visual indicator
          this.addTemporaryIndicator(highlighted);
        }
      }, isComplexPage ? 1200 : 800); // Longer delay for complex pages
    }
  },
  
  // Helper function to activate a tab from URL parameter
  activateTabFromParameter: function(tabName) {
    if (!tabName) return;
    
    tabName = tabName.toLowerCase();
    console.log('Trying to activate tab:', tabName);
    
    // First look for tab elements that might match the parameter
    const tabButtons = document.querySelectorAll('.nav-link, .nav-item, [role="tab"], .tab-button');
    let foundTab = false;
    
    tabButtons.forEach(btn => {
      const btnText = btn.textContent.toLowerCase();
      const btnTarget = btn.getAttribute('data-bs-target') || 
                      btn.getAttribute('data-target') || 
                      btn.getAttribute('href');
      
      // Check if this button matches the requested tab
      if (btnText.includes(tabName) || 
          (btnTarget && btnTarget.includes(tabName)) ||
          btn.id.toLowerCase().includes(tabName) ||
          btn.classList.contains(tabName + '-tab')) {
        
        console.log('Found matching tab button:', btnText);
        foundTab = true;
        
        // Remove active class from all sibling tabs
        const siblings = btn.parentElement.querySelectorAll('.nav-link, .nav-item, [role="tab"], .tab-button');
        siblings.forEach(sib => sib.classList.remove('active'));
        
        // Add active class to this tab
        btn.classList.add('active');
        
        // Try multiple methods to activate the tab
        try {
          // 1. Standard click
          btn.click();
          
          // 2. Dispatch click event (for some tab systems)
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          btn.dispatchEvent(clickEvent);
          
          // 3. If tab has a target, try to make it visible directly
          if (btnTarget) {
            const targetPanel = document.querySelector(btnTarget);
            if (targetPanel) {
              // Hide all sibling tabs first
              const allPanels = document.querySelectorAll('.tab-pane, [role="tabpanel"]');
              allPanels.forEach(panel => {
                panel.classList.remove('active', 'show');
                if (panel !== targetPanel) {
                  panel.style.display = 'none';
                }
              });
              
              // Show this tab
              targetPanel.classList.add('active', 'show');
              targetPanel.style.display = 'block';
            }
          }
        } catch (e) {
          console.error('Error activating tab:', e);
        }
      }
    });
    
    // If we didn't find a matching tab, try looking for a section with this name
    if (!foundTab) {
      // Special case for Persyst tab content
      if (tabName === 'persyst') {
        console.log('Looking for Persyst section to activate');
        
        const persystSections = document.querySelectorAll('[id*=persyst], [class*=persyst], [data-section=persyst]');
        if (persystSections.length > 0) {
          console.log(`Found ${persystSections.length} Persyst sections`);
          
          persystSections.forEach(section => {
            // Make sure this section is visible
            section.style.display = 'block';
            section.classList.add('active', 'show');
            section.classList.remove('hidden', 'd-none');
            
            // Find a parent tab container if exists
            const tabContainer = section.closest('.tab-content, .tab-container');
            if (tabContainer) {
              tabContainer.style.display = 'block';
            }
            
            // Now try to find and activate the corresponding tab button
            const sectionId = section.id;
            if (sectionId) {
              const tabButton = document.querySelector(`[href="#${sectionId}"], [data-bs-target="#${sectionId}"], [data-target="#${sectionId}"]`);
              if (tabButton) {
                tabButton.click();
              }
            }
          });
        }
      }
    }
  },
  
  // Ensure an element is visible by expanding any collapsed parent elements
  ensureElementIsVisible: function(element) {
    if (!element) return;
    
    // Check if element is inside a details element
    let parent = element.parentElement;
    while (parent) {
      // Handle details elements
      if (parent.tagName === 'DETAILS' && !parent.hasAttribute('open')) {
        console.log('Opening collapsed details element');
        parent.setAttribute('open', 'true');
      }
      
      // Handle Bootstrap tabs and similar tab implementations
      if (parent.classList.contains('tab-pane') || 
          parent.hasAttribute('role') && parent.getAttribute('role') === 'tabpanel') {
        
        // Make sure tab is visible
        console.log('Found content in tab panel, making it visible');
        parent.style.display = 'block';
        
        // Add active class for Bootstrap tabs
        parent.classList.add('active', 'show');
        
        // Try to find and activate the corresponding tab button
        const tabId = parent.id;
        if (tabId) {
          const tabButton = document.querySelector(`[data-bs-target="#${tabId}"], [data-target="#${tabId}"], [href="#${tabId}"], [aria-controls="${tabId}"]`);
          if (tabButton) {
            console.log('Activating tab button for', tabId);
            // Remove active class from all siblings
            const allTabButtons = tabButton.parentElement.querySelectorAll('[role="tab"], .nav-link');
            allTabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to this tab button
            tabButton.classList.add('active');
            
            // Trigger a click event to ensure any associated JavaScript runs
            try {
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              
              tabButton.dispatchEvent(clickEvent);
            } catch (e) {
              console.error('Failed to trigger click event on tab button:', e);
            }
          }
        }
      }
      
      // Handle ILAE and Natus/Persyst specific elements
      if (parent.classList.contains('classification-content') || 
          parent.classList.contains('ilae-content') ||
          parent.id && (parent.id.toLowerCase().includes('ilae') ||
                        parent.id.toLowerCase().includes('natus') ||
                        parent.id.toLowerCase().includes('persyst'))) {
        console.log('Found special content section, ensuring visibility');
        parent.style.display = 'block';
        parent.classList.remove('hidden', 'd-none', 'collapse');
        parent.classList.add('show');
      }
      
      // Specific handling for Natus/Persyst tab or sections
      if (parent.classList.contains('natus-content') || 
          parent.classList.contains('persyst-content') ||
          (parent.id && (parent.id.toLowerCase().includes('natus') || 
                         parent.id.toLowerCase().includes('persyst'))) ||
          (parent.getAttribute('data-tab') && 
           (parent.getAttribute('data-tab').includes('natus') || 
            parent.getAttribute('data-tab').includes('persyst')))) {
        console.log('Found Natus/Persyst specific content, ensuring visibility');
        parent.style.display = 'block';
        parent.classList.remove('hidden', 'd-none', 'collapse');
        parent.classList.add('show', 'active');
        
        // Look for any parent tab containers to make them visible too
        let tabContainer = parent.closest('.tab-content, .tabs-container');
        if (tabContainer) {
          tabContainer.style.display = 'block';
        }
        
        // Try to activate the corresponding tab - look for various selector patterns
        const tabButtons = document.querySelectorAll('.nav-link, .nav-item, [role="tab"]');
        tabButtons.forEach(btn => {
          const text = btn.textContent.toLowerCase();
          const dataTarget = btn.getAttribute('data-bs-target') || btn.getAttribute('data-target') || btn.getAttribute('href');
          
          if ((text.includes('natus') || text.includes('persyst')) ||
              (dataTarget && (dataTarget.includes('natus') || dataTarget.includes('persyst')))) {
            console.log('Found and activating Natus/Persyst tab button');
            
            // Remove active class from siblings
            const siblings = btn.parentElement.querySelectorAll('.nav-link, .nav-item, [role="tab"]');
            siblings.forEach(sib => sib.classList.remove('active'));
            
            // Add active class
            btn.classList.add('active');
            
            // Trigger click event
            try {
              btn.click();
            } catch (e) {
              console.error('Error clicking tab button:', e);
            }
          }
        });
      }
      
      // Check if element is hidden by CSS
      if (parent.style && (
          parent.style.display === 'none' || 
          parent.style.visibility === 'hidden' || 
          parent.classList.contains('hidden') || 
          parent.classList.contains('collapsed') ||
          parent.classList.contains('d-none'))) {
        console.log('Making hidden element visible');
        parent.style.display = '';
        parent.style.visibility = '';
        parent.classList.remove('hidden', 'collapsed', 'd-none');
        parent.classList.add('show');
      }
      
      // Move up to next parent
      parent = parent.parentElement;
    }
  },
  
  // Add a temporary highlight indicator to draw attention to the element
  addTemporaryIndicator: function(element) {
    if (!element) return;
    
    // Add a small delay to ensure scrolling is complete
    setTimeout(() => {
      // Create an overlay indicator
      const indicator = document.createElement('div');
      indicator.className = 'search-target-indicator';
      indicator.style.position = 'absolute';
      indicator.style.pointerEvents = 'none';
      indicator.style.zIndex = '99999'; // Extremely high z-index to ensure visibility
      
      // Add to document first (required for accurate positioning)
      document.body.appendChild(indicator);
      
      // Position function that can be called initially and on scroll/resize
      const positionIndicator = () => {
        // Get the latest position of the element
        const rect = element.getBoundingClientRect();
        
        // Account for scroll position and add a small margin
        // Adjusted vertical position to be higher than before
        indicator.style.top = (window.scrollY + rect.top - 10) + 'px';
        indicator.style.left = (window.scrollX + rect.left - 5) + 'px';
        indicator.style.width = (rect.width + 10) + 'px';
        indicator.style.height = (rect.height + 20) + 'px'; // Make taller to ensure it covers the content
      };
      
      // Initial positioning
      positionIndicator();
      
      // Update position on scroll and resize for better accuracy
      const scrollHandler = () => positionIndicator();
      window.addEventListener('scroll', scrollHandler);
      window.addEventListener('resize', scrollHandler);
      
      // Animated pulse effect
      let opacity = 1;
      const pulseAnimation = setInterval(() => {
        opacity = opacity === 1 ? 0.2 : 1;
        indicator.style.opacity = opacity;
      }, 500);
      
      // Remove after a delay
      setTimeout(() => {
        clearInterval(pulseAnimation);
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('resize', scrollHandler);
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        }, 2000);
      }, 5000);
    }, 100); // Short delay to ensure element is properly scrolled into view
  },
  
  // Helper function to continue highlighting after tab change
  continueHighlightingAfterTabChange: function(query, terms) {
    const contentElements = [];
    
    // Scan visible tab panes
    const visibleTabPanes = document.querySelectorAll('.tab-pane.active, .tab-panel.active, [role="tabpanel"].active');
    visibleTabPanes.forEach(pane => {
      this.collectContentElements(pane, contentElements);
    });
    
    // Also scan for persyst-specific sections
    const persystSections = document.querySelectorAll('[id*=persyst], [class*=persyst], [data-section=persyst]');
    persystSections.forEach(section => {
      this.collectContentElements(section, contentElements);
    });
    
    // Also collect from tables, they often contain the data
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.closest('header') && !table.closest('#search-results')) {
        const cells = table.querySelectorAll('td, th');
        cells.forEach(cell => {
          if (cell.textContent.trim()) {
            contentElements.push(cell);
          }
        });
      }
    });
    
    console.log(`Found ${contentElements.length} content elements after tab change`);
    
    // Now perform the highlighting
    return this.performHighlighting(query, terms, contentElements);
  },
  
  // Highlight content on the page that matches the search query
  highlightContentOnPage: function(query) {
    if (!query) return null;
    console.log('Highlighting content for:', query);
    
    let firstHighlightElement = null;
    
    // Split the query into terms for highlighting
    const terms = query.split(/\s+/).map(term => term.trim()).filter(term => term.length > 2);
    
    // If no valid terms, return
    if (terms.length === 0) {
      console.log('No valid terms to highlight');
      return null;
    }
    
    try {
      // Remove any existing highlights first
      const existingHighlights = document.querySelectorAll('.' + this.config.highlightClass);
      existingHighlights.forEach(el => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent), el);
          parent.normalize(); // Combine adjacent text nodes
        }
      });
      
      // Check if we're looking for ADR content specifically
      const isSearchingForADR = query.toUpperCase() === 'ADR' || 
                               query.toLowerCase().includes('adverse drug') || 
                               query.toLowerCase().includes('side effect');
      
      // Check if we need to target persyst tab specifically
      const isPersystContent = isSearchingForADR && 
                              window.location.pathname.toLowerCase().includes('natus') &&
                              document.body.textContent.toLowerCase().includes('persyst');
      
      // If we're looking for ADR in persyst, activate persyst tab first
      if (isPersystContent) {
        console.log('Searching for ADR in persyst tab - activating persyst tab first');
        this.activateTabFromParameter('persyst');
        
        // Add small delay to let tab content load
        setTimeout(() => {
          // Continue with highlighting after tab is activated
          return this.continueHighlightingAfterTabChange(query, terms);
        }, 300);
        return null;
      }
      
      // Get all text elements - get specific rather than using content selectors
      const contentElements = [];
      
      // Check if we're on the Natus instructions page or any page with natus/persyst content
      const isNatusPage = window.location.pathname.includes('natus') || 
                        document.title.toLowerCase().includes('natus') ||
                        document.body.textContent.toLowerCase().includes('natus instructions');
      
      // Try to find and activate the natus/persyst tab if we're searching for related terms
      if (query.toLowerCase().includes('natus') || 
          query.toLowerCase().includes('persyst') || 
          query.toLowerCase().includes('eeg software') ||
          query.toLowerCase().includes('adr') ||
          query.toLowerCase().includes('adverse') ||
          isNatusPage) {
        console.log('Searching for Natus/Persyst content - trying to activate relevant tabs');
        
        // Look for natus/persyst tab buttons and activate them
        const tabButtons = document.querySelectorAll('.nav-link, .nav-item, [role="tab"]');
        let natusTabFound = false;
        
        tabButtons.forEach(btn => {
          const text = btn.textContent.toLowerCase();
          const dataTarget = btn.getAttribute('data-bs-target') || 
                           btn.getAttribute('data-target') || 
                           btn.getAttribute('href');
          
          if (text.includes('natus') || text.includes('persyst') ||
              (dataTarget && (dataTarget.includes('natus') || dataTarget.includes('persyst')))) {
            console.log('Found and activating Natus/Persyst tab button:', text);
            
            // Remove active class from siblings
            const siblings = btn.parentElement.querySelectorAll('.nav-link, .nav-item, [role="tab"]');
            siblings.forEach(sib => sib.classList.remove('active'));
            
            // Add active class
            btn.classList.add('active');
            natusTabFound = true;
            
            // Trigger click event
            try {
              // Try both click() and a manual click event
              btn.click();
              
              // Also try a custom event as backup
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              btn.dispatchEvent(clickEvent);
              
              // Try to get the target content and ensure it's visible
              if (dataTarget) {
                const targetPanel = document.querySelector(dataTarget);
                if (targetPanel) {
                  console.log('Found target panel for Natus/Persyst tab');
                  targetPanel.style.display = 'block';
                  targetPanel.classList.add('active', 'show');
                  targetPanel.classList.remove('hidden', 'd-none');
                  
                  // Specifically scan this panel for content
                  this.collectContentElements(targetPanel, contentElements);
                }
              }
            } catch (e) {
              console.error('Error activating tab button:', e);
            }
          }
        });
        
        if (natusTabFound) {
          // Add a small delay to let the tab content render
          setTimeout(() => {
            console.log('Re-scanning for content after tab activation');
            
            // Look for newly visible tab panes
            const visibleTabPanes = document.querySelectorAll('.tab-pane.active, .tab-panel.active, [role="tabpanel"].active');
            visibleTabPanes.forEach(pane => {
              this.collectContentElements(pane, contentElements);
            });
            
            // Continue with highlighting as before
            return this.performHighlighting(query, terms, contentElements);
          }, 200);
          return null;
        }
      }
      
      // First check for specialized content in tabs
      const tabPanels = document.querySelectorAll('.tab-pane, .tab-content, [role="tabpanel"]');
      if (tabPanels.length > 0) {
        console.log(`Found ${tabPanels.length} tab panels to check`);
        
        // Make sure all tab panels are visible for highlighting
        tabPanels.forEach(panel => {
          // Store original display state
          if (!panel.dataset.originalDisplay) {
            panel.dataset.originalDisplay = panel.style.display || '';
          }
          
          // Temporarily make visible
          if (panel.style.display === 'none' || !panel.classList.contains('active')) {
            console.log('Making tab panel temporarily visible');
            panel.style.display = 'block';
            panel.classList.add('temp-visible');
          }
          
          // Get all text elements from the panel
          this.collectContentElements(panel, contentElements);
        });
      }
      
      // Special handling for tables - they often contain the data users search for
      const tables = document.querySelectorAll('table');
      if (tables.length > 0) {
        console.log(`Found ${tables.length} tables to check for highlights`);
        
        // Process each table
        tables.forEach(table => {
          // Skip tables in the header or search results
          if (table.closest('header') || table.closest('#search-results') || 
              table.closest('.search-fullscreen')) {
            return;
          }
          
          // Process table cells
          const tableCells = table.querySelectorAll('td, th');
          console.log(`Found ${tableCells.length} cells in table`);
          
          tableCells.forEach(cell => {
            // Skip empty cells
            if (!cell.textContent.trim()) return;
            
            contentElements.push(cell);
          });
        });
      }
      
      // Add all common text elements
      this.collectContentElements(document.body, contentElements);
      
      console.log(`Found ${contentElements.length} content elements to search`);
      
      return this.performHighlighting(query, terms, contentElements);
    } catch (error) {
      console.error('Error highlighting content:', error);
      return null;
    }
  },
  
  // Helper function to perform the actual highlighting
  performHighlighting: function(query, terms, contentElements) {
    let firstHighlightElement = null;
    
    // First find exact matches for more accurate targeting
    let foundExactMatch = false;
    
    // Two-pass approach: first look for exact query matches
    contentElements.forEach(element => {
      if (element.textContent.toLowerCase().includes(query.toLowerCase())) {
        this.highlightElementContent(element, query);
        
        if (!firstHighlightElement) {
          firstHighlightElement = this.findBestScrollTarget(element);
          foundExactMatch = true;
        }
      }
    });
    
    // If no exact matches, highlight individual terms
    if (!foundExactMatch) {
      contentElements.forEach(element => {
        let hasMatch = false;
        
        // Check if any term matches before modifying the HTML
        for (const term of terms) {
          if (element.textContent.toLowerCase().includes(term.toLowerCase())) {
            hasMatch = true;
            break;
          }
        }
        
        if (hasMatch) {
          this.highlightElementContent(element, terms);
          
          if (!firstHighlightElement) {
            firstHighlightElement = this.findBestScrollTarget(element);
          }
        }
      });
    }
    
    // Add animation to highlights
    const highlights = document.querySelectorAll('.' + this.config.highlightClass);
    console.log(`Added ${highlights.length} highlights on the page`);
    
    highlights.forEach(highlight => {
      highlight.style.backgroundColor = 'rgba(255, 204, 0, 0.3)';
      highlight.style.animation = 'search-highlight-pulse 2s infinite';
      highlight.style.padding = '0 2px';
      highlight.style.borderRadius = '2px';
      highlight.style.fontWeight = 'bold';
    });
    
    // Restore hidden tab panels to their original state
    const tempVisiblePanels = document.querySelectorAll('.temp-visible');
    tempVisiblePanels.forEach(panel => {
      panel.classList.remove('temp-visible');
      if (panel.dataset.originalDisplay && 
          !panel.classList.contains('active') && 
          !panel.querySelector('.' + this.config.highlightClass)) {
        panel.style.display = panel.dataset.originalDisplay;
      }
    });
    
    return firstHighlightElement;
  },
  
  // Helper function to collect content elements from a container
  collectContentElements: function(container, contentElements) {
    if (!container) return;
    
    // Common text elements
    ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span', 'div'].forEach(selector => {
      container.querySelectorAll(selector).forEach(el => {
        // Skip elements in the header or search results
        if (!el.closest('header') && !el.closest('#search-results') && 
            !el.closest('.search-fullscreen') && el.textContent.trim() &&
            !el.querySelector('script')) { // Skip script containers
          
          // Check if it's a pure text container (no child elements)
          if (el.childElementCount === 0 || 
              (el.children.length === 1 && el.firstElementChild.tagName === 'A')) {
            contentElements.push(el);
          }
        }
      });
    });
    
    // Add all link elements as they're important navigation targets
    container.querySelectorAll('a[href]').forEach(link => {
      if (link.textContent.trim() && 
          !link.closest('header') && 
          !link.closest('#search-results') && 
          !link.closest('.search-fullscreen')) {
        contentElements.push(link);
      }
    });
  },
  
  // Find the best element to scroll to based on the highlighted element
  findBestScrollTarget: function(element) {
    // If this is a table cell, scroll to the containing row
    if (element.tagName === 'TD' || element.tagName === 'TH') {
      const row = element.closest('tr');
      if (row) {
        // Set the row ID if not present
        if (!row.id) {
          row.id = 'highlighted-row-' + Date.now();
        }
        return row;
      }
    }
    
    // For links, find a containing block element that might be more visible
    if (element.tagName === 'A') {
      let parent = element.parentElement;
      // Look up a few levels for a block element
      for (let i = 0; i < 3 && parent; i++) {
        if (parent.tagName === 'P' || parent.tagName === 'DIV' || 
            parent.tagName === 'LI' || parent.tagName === 'SECTION') {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
    
    // For headings, scroll to the heading itself
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
      // Set ID if not present
      if (!element.id) {
        element.id = 'highlighted-heading-' + Date.now();
      }
      return element;
    }
    
    // Default to the original element
    return element;
  },
  
  // Highlight content within an element
  highlightElementContent: function(element, queryOrTerms) {
    if (!element) return;
    
    let html = element.innerHTML;
    
    if (Array.isArray(queryOrTerms)) {
      // It's an array of terms
      queryOrTerms.forEach(term => {
        if (term.length > 2) {
          const safeRegex = new RegExp(`((?![^<>]*>)${this.escapeRegExp(term)})`, 'gi');
          html = html.replace(safeRegex, `<span class="${this.config.highlightClass}">$1</span>`);
        }
      });
    } else {
      // It's a single query string
      const query = queryOrTerms;
      const safeRegex = new RegExp(`((?![^<>]*>)${this.escapeRegExp(query)})`, 'gi');
      html = html.replace(safeRegex, `<span class="${this.config.highlightClass}">$1</span>`);
    }
    
    // Only update if we actually made changes
    if (html !== element.innerHTML) {
      element.innerHTML = html;
    }
  },
  
  // Escape special characters in a string for use in a RegExp
  escapeRegExp: function(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  // Search the index for matching content
  searchIndex: function(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);
    
    // Use the search index (dynamic or default)
    const searchIndex = this.config.searchIndex || this.config.defaultIndex;
    
    console.log(`Searching ${searchIndex.length} items in index for "${query}"`);
    
    // Check if query is a medical acronym (prioritize exact matches)
    const isAcronym = /^[A-Z]{2,5}$/.test(query);
    const isKnownAcronym = this.config.medicalAcronyms.includes(query.toUpperCase());
    
    // Check if this is likely a navigation search by looking for common nav terms
    const navTerms = ['index', 'guide', 'eeg', 'epilepsy', 'survival'];
    const isLikelyNavSearch = navTerms.some(term => queryLower.includes(term));
    
    // Search through the index
    searchIndex.forEach(item => {
      // Skip items with invalid URLs
      if (!item.url) return;
      
      // Make sure URL is valid
      if (item.url === 'null' || item.url === 'undefined') {
        item.url = 'index.html'; // Provide a default fallback
      }
      
      let score = 0;
      const titleLower = item.title ? item.title.toLowerCase() : '';
      const contentLower = item.content ? item.content.toLowerCase() : '';
      
      // Special handling for medical acronyms
      if (isAcronym || isKnownAcronym) {
        const exactAcronymRe = new RegExp(`\\b${query.toUpperCase()}\\b`);
        const looseAcronymRe = new RegExp(query.toUpperCase());
        
        // Very high score for exact acronym match in title (e.g., "ADR -" or "(ADR)")
        if (exactAcronymRe.test(item.title)) {
          score += 30;
        } 
        // High score for acronym appearing anywhere in title
        else if (looseAcronymRe.test(item.title)) {
          score += 20;
        }
        
        // Good score for exact acronym match in content
        if (exactAcronymRe.test(item.content)) {
          score += 15;
        }
        
        // Add score for keyword matches
        if (item.keywords && Array.isArray(item.keywords)) {
          if (item.keywords.includes(query.toUpperCase()) || 
              item.keywords.includes(query.toLowerCase())) {
            score += 10;
          }
        }
        
        // Handle specific acronyms with known locations
        if (query.toUpperCase() === 'ADR' && 
            (item.url.includes('adverse') || 
             item.url.includes('side-effect') || 
             titleLower.includes('adverse') ||
             contentLower.includes('adverse drug reaction'))) {
          score += 25; // Very high priority for ADR related content
        }
      }
      
      // Check for navigation links with exact or high-priority matches
      if (isLikelyNavSearch && contentLower.includes('link on page')) {
        // This is a link entry - check for exact matches with high priority
        
        // For "EEG Index" search
        if ((queryLower.includes('eeg') && queryLower.includes('index')) && 
            (titleLower.includes('eeg') && titleLower.includes('index'))) {
          score += 20; // Very high score for exact match
        }
        
        // For "Epilepsy Survival Guide" search
        if ((queryLower.includes('epilepsy') && queryLower.includes('guide')) && 
            (titleLower.includes('epilepsy') && 
             (titleLower.includes('guide') || titleLower.includes('survival')))) {
          score += 20; // Very high score for exact match
        }
        
        // For any link that exactly matches the search term
        if (titleLower === queryLower) {
          score += 25; // Highest score for perfect match
        }
        
        // Boost navigation links in general for likely nav searches
        score += 5;
      }
      
      // Regular title matches if we haven't scored yet
      if (score === 0 && titleLower.includes(queryLower)) {
        score += 10;
        
        // Boost score for medication matches (these are often specifically searched for)
        if (item.url.includes('#med-') || titleLower.includes('medication')) {
          score += 5;
        }
      }
      
      // Check for exact matches in content if we haven't scored yet
      if (score === 0 && contentLower.includes(queryLower)) {
        score += 5;
        
        // If query appears to be medication or medical term, give higher score to medical content
        const medTerms = ['mg', 'dose', 'dosing', 'medication', 'epilepsy', 'seizure', 'side effect'];
        if (medTerms.some(term => queryLower.includes(term))) {
          score += 3;
        }
      }
      
      // Check for partial matches in title if we still haven't scored
      if (score === 0) {
        queryTerms.forEach(term => {
          if (term.length > 2 && titleLower.includes(term)) {
            score += 2;
            
            // Extra boost for navigation terms in title
            if (navTerms.includes(term)) {
              score += 2;
            }
          }
        });
      }
      
      // Check for partial matches in content if we still haven't scored
      if (score === 0) {
        queryTerms.forEach(term => {
          if (term.length > 2 && contentLower.includes(term)) {
            score += 1;
            
            // Extra boost for table content matches
            if (item.url.includes('#table-') || item.url.includes('#med-')) {
              score += 0.5;
            }
          }
        });
      }
      
      // Check for keyword matches if we still haven't scored
      if (score === 0 && item.keywords && Array.isArray(item.keywords)) {
        item.keywords.forEach(keyword => {
          if (keyword && (keyword.includes(queryLower) || queryLower.includes(keyword))) {
            score += 3;
            
            // Boost navigation keywords for likely nav searches
            if (isLikelyNavSearch && navTerms.includes(keyword)) {
              score += 2;
            }
          }
        });
      }
      
      if (score > 0) {
        results.push({
          item: item,
          score: score
        });
      }
    });
    
    console.log(`Found ${results.length} results for "${query}"`);
    
    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);
    
    // Return only top results
    return results.slice(0, this.config.maxResults);
  },

  // Force reinitialize the search functionality
  reinitialize: function() {
    console.log('Explicitly reinitializing search');
    this.initialized = false;
    this.init();
  }
};

// Check for and remove old search.js script if it exists
function removeConflictingScripts() {
  const scripts = document.querySelectorAll('script[src*="search.js"]');
  if (scripts.length > 0) {
    console.warn(`Found ${scripts.length} potential conflicting search scripts. Will attempt to prevent initialization conflicts.`);
    
    // We can't remove the scripts but we can try to neutralize their functionality
    window.EEGSearch = {
      init: function() { 
        console.log('Prevented old EEGSearch.init from running');
        return false; 
      },
      performSearch: function() { 
        console.log('Prevented old EEGSearch.performSearch from running');
        return false; 
      }
    };
  }
}

// Make UniversalSearch available globally
window.UniversalSearch = UniversalSearch;

// Initialize after checking for conflicts
document.addEventListener('DOMContentLoaded', function() {
  console.log('Checking for search conflicts before initialization...');
  removeConflictingScripts();
  
  setTimeout(function() {
    console.log('Initializing UniversalSearch...');
    UniversalSearch.init();
  }, 100); // Small delay to ensure any conflicting scripts have tried to initialize
});

// Also initialize on page loads (for single-page navigation)
window.addEventListener('load', function() {
  // Wait a short time to allow DOM to be fully ready
  setTimeout(function() {
    // Only initialize if not already initialized or if we're on a different page than before
    if (!UniversalSearch.initialized || 
        UniversalSearch.lastInitPath !== window.location.pathname) {
      console.log('Re-initializing search on page load');
      
      // Reset initialization state if we're on a new page
      if (UniversalSearch.lastInitPath !== window.location.pathname) {
        console.log('New page detected, resetting search state');
        UniversalSearch.initialized = false;
        
        // Clear any cached search results when navigating to a new page
        UniversalSearch.config.searchCache = {};
      }
      
      // Special handling for pages that might have complex content or tabs
      const currentPage = window.location.pathname.split('/').pop();
      const isILAEPage = currentPage === 'ilae_classification.html' || 
                        currentPage.includes('ilae');
      const isNatusPage = currentPage === 'natus_instructions.html' || 
                         currentPage.includes('natus') ||
                         currentPage.includes('persyst');
      
      if (isILAEPage || isNatusPage) {
        console.log(`Special page detected (${isILAEPage ? 'ILAE' : 'Natus/Persyst'}), using special initialization`);
        // Add a longer delay for complex pages
        setTimeout(function() {
          UniversalSearch.init();
        }, 500);
      } else {
        UniversalSearch.init();
      }
    }
  }, 200);
});

})(); // End of self-executing function 