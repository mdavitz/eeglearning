/**
 * News Ticker - Shows the latest articles from multiple epilepsy journals in the header
 * Sources: Epilepsia, Epilepsy Currents, and Neurology
 */

class NewsTicker {
  constructor(selector, options = {}) {
    this.container = document.querySelector(selector);
    if (!this.container) {
      console.error('News ticker container not found:', selector);
      return;
    }

    this.options = {
      sources: [
        {
          name: 'Epilepsia',
          url: 'https://onlinelibrary.wiley.com/journal/15281167',
          rssUrl: 'https://onlinelibrary.wiley.com/feed/15281167/most-recent'
        },
        {
          name: 'Epilepsy Currents',
          url: 'https://journals.sagepub.com/home/EPI',
          rssUrl: 'https://journals.sagepub.com/action/showFeed?ui=0&mi=ehikzz&ai=2b4&jc=epicy&type=etoc&feed=rss'
        },
        {
          name: 'Neurology',
          url: 'https://www.neurology.org/collection/epilepsy-seizures',
          rssUrl: 'https://www.neurology.org/rss/current.xml'
        }
      ],
      articleCount: options.articleCount || 20,
      scrollSpeed: options.scrollSpeed || 60, // Scroll duration in seconds (changed from 658)
      siteColors: {
        blue: '#0066cc', // Site's blue color
        white: '#ffffff'  // Header icon white color
      },
      ...options
    };

    this.articles = [];
    this.isMobile = window.innerWidth <= 768;
    
    // Listen for window resize events to update mobile status
    window.addEventListener('resize', this.handleResize.bind(this));
    
    this.init();
  }
  
  handleResize() {
    this.isMobile = window.innerWidth <= 768;
    // Re-render if articles are loaded
    if (this.articles.length) {
      this.displayArticles();
    }
  }

  async init() {
    try {
      // Start with static data to show something immediately
      this.useStaticData();
      this.renderTicker();
      this.displayArticles();
      
      // Attempt to fetch articles from all sources in background
      await this.fetchAllArticles();
      
      // Only update UI if we actually got articles
      if (this.articles.length > 0) {
        // Update display with fresh data
        this.displayArticles();
      }
    } catch (error) {
      console.error('Failed to initialize news ticker:', error);
      // Already showing static data, so just continue
    }
  }

  async fetchAllArticles() {
    try {
      // Create array to hold all articles
      let allArticles = [];
      
      // Log which sources we're attempting to fetch
      console.log(`Attempting to fetch from ${this.options.sources.length} sources:`, 
        this.options.sources.map(s => s.name).join(', '));
      
      // Try to fetch from each source
      for (const source of this.options.sources) {
        try {
          console.log(`Fetching from ${source.name}...`);
          const articles = await this.fetchArticlesFromSource(source);
          
          if (articles && articles.length) {
            console.log(`✅ Success: Got ${articles.length} articles from ${source.name}`);
            // Add source information to each article
            articles.forEach(article => {
              article.source = source.name;
              article.sourceUrl = source.url;
            });
            
            allArticles = [...allArticles, ...articles];
          } else {
            console.warn(`⚠️ No articles found from ${source.name}`);
          }
        } catch (e) {
          console.warn(`❌ Error fetching from ${source.name}:`, e);
        }
      }
      
      // Log overall results
      console.log(`Retrieved ${allArticles.length} total articles from all sources`);
      
      // If we got any articles, use them
      if (allArticles.length > 0) {
        // Sort by date (newest first) and take most recent ones
        this.sortAndFilterArticles(allArticles);
        
        // Randomly shuffle the articles for display
        this.randomizeArticles(allArticles);
        
        // Use the new articles
        this.articles = allArticles;
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Continue with static data (already loaded)
    }
  }
  
  async fetchArticlesFromSource(source) {
    try {
      // Use a more reliable CORS proxy
      const proxyUrl = 'https://corsproxy.io/?';
      console.log(`Fetching RSS from: ${source.rssUrl} via proxy`);
      
      const response = await fetch(proxyUrl + encodeURIComponent(source.rssUrl), {
        headers: {
          'Accept': 'application/xml, text/xml, application/rss+xml'
        },
        timeout: 8000
      });
      
      if (!response.ok) {
        console.warn(`HTTP error ${response.status} for ${source.name}`);
        return [];
      }
      
      const xmlText = await response.text();
      console.log(`Got ${xmlText.length} bytes of XML data for ${source.name}`);
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.warn(`XML parsing error for ${source.name}:`, parserError.textContent);
        return [];
      }
      
      // Try different XML feed structures - some feeds use 'item', others use 'entry'
      let items = xmlDoc.querySelectorAll('item');
      
      // If no items found, try to find entries (Atom format vs RSS)
      if (items.length === 0) {
        console.log(`No 'item' elements found for ${source.name}, trying 'entry' elements`);
        items = xmlDoc.querySelectorAll('entry');
      }
      
      if (items.length === 0) {
        console.warn(`No items or entries found in feed for ${source.name}`);
        return [];
      }
      
      console.log(`Found ${items.length} items in feed for ${source.name}`);
      
      return Array.from(items).map(item => {
        // Try different element names for different feed formats
        const title = 
          item.querySelector('title')?.textContent || 
          item.querySelector('h1')?.textContent || 
          'No title';
          
        // Try different ways links might be formatted
        let link = '';
        const linkElement = item.querySelector('link');
        if (linkElement) {
          // Some feeds have link as text content, others as an href attribute
          link = linkElement.textContent || linkElement.getAttribute('href') || '';
        }
        
        // If no direct link, try alternate approaches based on feed format
        if (!link) {
          const guidElement = item.querySelector('guid');
          if (guidElement) {
            link = guidElement.textContent || '';
          }
        }
        
        // Backup if we still have no link
        if (!link) {
          link = source.url; // At least link to the journal homepage
        }
        
        // Try various date formats
        let pubDate = 
          item.querySelector('pubDate')?.textContent || 
          item.querySelector('published')?.textContent ||
          item.querySelector('updated')?.textContent || 
          '';
        
        // Parse the date
        let date = new Date();
        try {
          if (pubDate) {
            date = new Date(pubDate);
          }
        } catch (e) {
          console.warn(`Error parsing date for ${source.name}:`, e);
        }
        
        return {
          title: title,
          link: link,
          date: date, // Store as Date object for sorting
          formattedDate: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        };
      });
    } catch (e) {
      console.warn(`Error fetching from ${source.name}:`, e);
      return [];
    }
  }
  
  sortAndFilterArticles(articles) {
    if (!articles || !articles.length) return articles;
    
    // Sort by date (newest first)
    articles.sort((a, b) => {
      // If we have actual dates, use them
      if (a.date && b.date) {
        return b.date - a.date;
      }
      return 0; // Keep original order if no dates
    });
    
    // Filter to only include articles from the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const recentArticles = articles.filter(article => {
      if (article.date) {
        const articleMonth = article.date.getMonth();
        const articleYear = article.date.getFullYear();
        return (articleMonth === currentMonth && articleYear === currentYear) || 
               // Also include articles from last month if we're in the first week of the month
               (now.getDate() <= 7 && 
                ((articleMonth === currentMonth - 1 && articleYear === currentYear) || 
                 (currentMonth === 0 && articleMonth === 11 && articleYear === currentYear - 1)));
      }
      return true; // Include articles without dates
    });
    
    // If we have enough recent articles, use only those
    if (recentArticles.length >= 5) {
      return recentArticles.slice(0, this.options.articleCount);
    }
    
    // Otherwise use all articles but still limit to the requested count
    return articles.slice(0, this.options.articleCount);
  }
  
  randomizeArticles(articles) {
    // Shuffle the articles for random display
    for (let i = articles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [articles[i], articles[j]] = [articles[j], articles[i]];
    }
    return articles;
  }
  
  useStaticData() {
    // Fallback to static data if API fetch fails
    this.articles = [
      {
        title: "Adult-onset focal early-onset genetic epilepsy: A multicenter cohort study",
        link: "https://onlinelibrary.wiley.com/doi/10.1111/epi.17893",
        source: "Epilepsia",
        formattedDate: "May 2024"
      },
      {
        title: "Epilepsy surgery for tuberous sclerosis complex: An international retrospective study",
        link: "https://onlinelibrary.wiley.com/doi/10.1111/epi.17897",
        source: "Epilepsia",
        formattedDate: "May 2024"
      },
      {
        title: "Identifying Barriers to Antiseizure Medication Adherence Among Adults With Epilepsy",
        link: "https://journals.sagepub.com/doi/full/10.1177/15357597231168505",
        source: "Epilepsy Currents",
        formattedDate: "April 2024"
      },
      {
        title: "The role of EEG in the diagnosis and classification of epilepsy syndromes",
        link: "https://journals.sagepub.com/doi/full/10.1177/15357597231167419",
        source: "Epilepsy Currents",
        formattedDate: "April 2024"
      },
      {
        title: "Evaluation of Nonmotor Seizures With Stereo-EEG",
        link: "https://www.neurology.org/doi/10.1212/WNL.0000000000207426",
        source: "Neurology",
        formattedDate: "May 2024"
      },
      {
        title: "Treatment Response of Childhood Absence Epilepsy in a High-Resolution EEG Study",
        link: "https://www.neurology.org/doi/10.1212/WNL.0000000000207306",
        source: "Neurology",
        formattedDate: "April 2024"
      }
    ];
  }

  renderTicker() {
    // Create the ticker layout
    this.container.innerHTML = `
      <div class="news-ticker">
        <div class="news-ticker__scroll-container">
          <div class="news-ticker__scrolling-content"></div>
        </div>
      </div>
    `;

    // Add CSS for the scrolling banner
    if (!document.getElementById('news-ticker-styles')) {
      const style = document.createElement('style');
      style.id = 'news-ticker-styles';
      style.textContent = `
        /* News ticker container */
        .news-ticker {
          display: flex;
          align-items: center;
          background: transparent;
          overflow: hidden;
          height: 42px;
          width: 100%;
        }
        
        /* Scroll container */
        .news-ticker__scroll-container {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        
        /* Scrolling content */
        .news-ticker__scrolling-content {
          display: flex;
          align-items: center;
          position: absolute;
          white-space: nowrap;
          will-change: transform;
          padding-left: 100%;
          height: 100%;
          transform: translateX(0);
          transition: transform 0.2s linear;
        }
        
        /* Each news item */
        .news-ticker__item {
          display: inline-flex;
          align-items: center;
          margin-right: 50px;
          font-size: 15px;
        }
        
        /* News item links */
        .news-ticker__item a {
          color: ${this.options.siteColors.white};
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
          letter-spacing: 0.2px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .news-ticker__item a:hover {
          color: ${this.options.siteColors.white};
          text-decoration: underline;
          opacity: 0.9;
        }
        
        /* Source badges */
        .news-ticker__item-source {
          font-weight: 600;
          margin-right: 10px;
          color: ${this.options.siteColors.white};
          background-color: ${this.options.siteColors.blue};
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 13px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        /* Different background colors for different sources */
        .news-ticker__item-source[data-source="Epilepsy Currents"] {
          background-color: #5a84e4;
        }
        
        .news-ticker__item-source[data-source="Neurology"] {
          background-color: #3d4db7;
        }
        
        /* Mobile adjustments */
        @media (max-width: 768px) {
          .news-ticker {
            height: 38px;
          }
          
          .news-ticker__item {
            font-size: 14px;
            margin-right: 40px;
          }
          
          .news-ticker__item-source {
            font-size: 12px;
            padding: 3px 8px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Event listeners
    this.container.addEventListener('mouseenter', () => this.pauseRotation());
    this.container.addEventListener('mouseleave', () => this.resumeRotation());
    
    // Start the animation manually instead of using CSS animation
    this.setupAnimation();
  }

  setupAnimation() {
    // Calculate the appropriate speed
    this.scrollContainer = this.container.querySelector('.news-ticker__scrolling-content');
    if (!this.scrollContainer) return;
    
    // Default scroll values
    this.animationSpeed = 90; // pixels per second (increased from 60, 50% faster)
    this.scrollPosition = 0;
    this.isPaused = false;
    this.lastFrameTime = null;
    
    // Start animation loop
    this.startAnimation();
  }
  
  startAnimation() {
    // Use requestAnimationFrame for smooth animation
    if (!this.animationFrameId) {
      this.lastFrameTime = performance.now();
      this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }
  }
  
  animate(timestamp) {
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }
    
    // Calculate elapsed time
    const elapsed = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    if (!this.isPaused) {
      // Calculate the distance to move based on elapsed time and speed
      const pixelsToMove = (this.animationSpeed * elapsed) / 1000;
      this.scrollPosition -= pixelsToMove;
      
      // Reset when scrolled completely
      const containerWidth = this.container.clientWidth;
      const contentWidth = this.scrollContainer.scrollWidth;
      
      if (Math.abs(this.scrollPosition) >= contentWidth) {
        this.scrollPosition = 0;
      }
      
      // Apply the transform
      this.scrollContainer.style.transform = `translateX(${this.scrollPosition}px)`;
    }
    
    // Continue animation
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  displayArticles() {
    // Populate all articles into the scrolling banner
    if (!this.articles.length) return;
    
    const scrollContainer = this.container.querySelector('.news-ticker__scrolling-content');
    if (!scrollContainer) return;
    
    // Clear previous content
    scrollContainer.innerHTML = '';
    
    // Add all articles to the scrolling banner
    this.articles.forEach(article => {
      const articleEl = document.createElement('div');
      articleEl.className = 'news-ticker__item';
      
      // Add source
      const sourceEl = document.createElement('span');
      sourceEl.className = 'news-ticker__item-source';
      sourceEl.textContent = article.source || '';
      sourceEl.setAttribute('data-source', article.source || ''); // For source-specific styling
      
      // Create link element
      const linkEl = document.createElement('a');
      linkEl.href = article.link;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener';
      linkEl.textContent = article.title;
      linkEl.title = `${article.source}: ${article.title}`;
      
      // Build the DOM structure
      articleEl.appendChild(sourceEl);
      articleEl.appendChild(linkEl);
      
      // Add to scrolling container
      scrollContainer.appendChild(articleEl);
    });
    
    // Reset position when content changes
    if (this.scrollContainer) {
      this.scrollPosition = 0;
      this.scrollContainer.style.transform = `translateX(${this.scrollPosition}px)`;
      
      // Adjust speed based on content length
      const contentWidth = scrollContainer.scrollWidth;
      const containerWidth = this.container.clientWidth;
      
      // Adjust speed: slower for longer content (increased by 50%)
      this.animationSpeed = Math.max(62, Math.min(120, 90 * (containerWidth / contentWidth * 2)));
    }
  }

  pauseRotation() {
    // Pause the animation
    this.isPaused = true;
  }

  resumeRotation() {
    // Resume the animation
    this.isPaused = false;
  }
}

// Initialize the news ticker when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    // Initialize with a slight delay to ensure the container is ready
    new NewsTicker('#news-ticker-container', {
      articleCount: 10,
      siteColors: {
        blue: '#0066cc', // Site's blue color
        white: '#ffffff'  // Header icon white color
      }
    });
  }, 500);
}); 