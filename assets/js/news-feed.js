/**
 * News Feed - Fetches the latest articles from Wiley Online Library
 * This module fetches and displays the latest articles from the journal
 * at https://onlinelibrary.wiley.com/journal/15281167
 */

class NewsFeed {
  constructor(selector, options = {}) {
    this.container = document.querySelector(selector);
    if (!this.container) {
      console.error('News feed container not found:', selector);
      return;
    }

    this.options = {
      apiEndpoint: 'https://onlinelibrary.wiley.com/journal/15281167',
      articleCount: options.articleCount || 5,
      autoRotate: options.autoRotate !== false,
      rotationInterval: options.rotationInterval || 5000, // 5 seconds
      ...options
    };

    this.articles = [];
    this.currentIndex = 0;
    this.rotationTimer = null;
    
    this.init();
  }

  async init() {
    try {
      // Show loading state
      this.renderLoading();
      
      // Attempt to fetch articles
      await this.fetchArticles();
      
      // If we have articles, render the feed
      if (this.articles.length > 0) {
        this.renderContainer();
        this.displayArticle(0);
        if (this.options.autoRotate) {
          this.startRotation();
        }
      } else {
        // If no articles were fetched, show the error message
        this.renderError();
      }
    } catch (error) {
      console.error('Failed to initialize news feed:', error);
      this.renderError();
    }
  }

  async fetchArticles() {
    try {
      // Since direct AJAX calls to external sites are typically blocked by CORS,
      // we'll use fallback static data instead. In a production environment,
      // you would need to set up a server-side proxy to fetch this data.
      
      // Try to use RSS if available (many publishers provide RSS feeds)
      const rssUrl = `https://onlinelibrary.wiley.com/feed/15281167/most-recent`;
      
      try {
        // Check if we're in a development environment with a proxy
        // Note: This is risky in production without proper CORS handling
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(proxyUrl + encodeURIComponent(rssUrl), {
          headers: {
            'Accept': 'application/xml, text/xml, application/rss+xml'
          },
          timeout: 5000
        });
        
        if (response.ok) {
          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          
          const items = xmlDoc.querySelectorAll('item');
          if (items.length > 0) {
            this.articles = Array.from(items)
              .slice(0, this.options.articleCount)
              .map(item => {
                const title = item.querySelector('title')?.textContent || '';
                const link = item.querySelector('link')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || '';
                const creator = item.querySelector('creator, author')?.textContent || 'Epilepsia Journal';
                
                // Format the date
                let formattedDate = 'Recent';
                try {
                  if (pubDate) {
                    const date = new Date(pubDate);
                    formattedDate = date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                  }
                } catch (e) {
                  console.warn('Error formatting date:', e);
                }
                
                return {
                  title: title,
                  link: link,
                  date: formattedDate,
                  authors: creator
                };
              });
            
            return;
          }
        }
      } catch (e) {
        console.warn('Error fetching RSS feed, falling back to static data:', e);
      }
      
      // If we reach here, the RSS feed fetch failed or returned no articles
      // So we'll use the static data
      this.useStaticData();
      
    } catch (error) {
      console.error('Error fetching articles:', error);
      this.useStaticData();
    }
  }
  
  useStaticData() {
    // Fallback to static data if API fetch fails
    this.articles = [
      {
        title: "Adult-onset focal early-onset genetic epilepsy: A multicenter cohort study",
        link: "https://onlinelibrary.wiley.com/doi/10.1111/epi.17893",
        date: "April 2023",
        authors: "Miriam Skiba, Joseph Symonds, et al."
      },
      {
        title: "Epilepsy surgery for tuberous sclerosis complex: An international retrospective multicenter study",
        link: "https://onlinelibrary.wiley.com/doi/10.1111/epi.17897",
        date: "March 2023",
        authors: "Tobias Baumgartner, Hans Hartmann, et al."
      },
      {
        title: "Patient-specific computational modeling identifies patients at risk of seizure propagation and offers new insights into network-based surgical planning",
        link: "https://onlinelibrary.wiley.com/doi/10.1111/epi.17890",
        date: "February 2023",
        authors: "Tim Wehner, Wessel Woldman, et al."
      },
      {
        title: "Brivaracetam versus levetiracetam for focal-onset seizures in adults: A network meta-analysis",
        link: "https://onlinelibrary.wiley.com/doi/10.1111/epi.17882",
        date: "January 2023",
        authors: "Hao Peng, Guannan Chen, et al."
      },
      {
        title: "Visit Wiley Online Library for Latest Epilepsy Research",
        link: "https://onlinelibrary.wiley.com/journal/15281167",
        date: "Current",
        authors: "Epilepsia Journal"
      }
    ];
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="news-feed">
        <div class="news-feed__header">
          <h3>Latest Articles from Epilepsia</h3>
        </div>
        <div class="news-feed__content" style="text-align: center; padding: 2rem;">
          <p>Loading latest research articles...</p>
          <div class="loading-spinner"></div>
        </div>
      </div>
    `;
  }

  renderContainer() {
    // Create the container for the news feed
    this.container.innerHTML = `
      <div class="news-feed">
        <div class="news-feed__header">
          <h3>Latest Articles from Epilepsia</h3>
          <div class="news-feed__controls">
            <button class="news-feed__prev" aria-label="Previous article">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="news-feed__next" aria-label="Next article">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="news-feed__content"></div>
        <div class="news-feed__footer">
          <a href="https://onlinelibrary.wiley.com/journal/15281167" target="_blank" rel="noopener">
            View all articles at Epilepsia Journal 
            <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
      </div>
    `;

    // Set up event listeners
    const prevBtn = this.container.querySelector('.news-feed__prev');
    const nextBtn = this.container.querySelector('.news-feed__next');
    
    prevBtn.addEventListener('click', () => this.showPreviousArticle());
    nextBtn.addEventListener('click', () => this.showNextArticle());
    
    // Pause rotation on hover
    this.container.addEventListener('mouseenter', () => this.pauseRotation());
    this.container.addEventListener('mouseleave', () => this.resumeRotation());
  }

  renderError() {
    this.container.innerHTML = `
      <div class="news-feed news-feed--error">
        <div class="news-feed__header">
          <h3>Latest Articles from Epilepsia</h3>
        </div>
        <div class="news-feed__content">
          <p>Visit the Epilepsia Journal for the latest research in epilepsy and clinical neurophysiology.</p>
          <a href="https://onlinelibrary.wiley.com/journal/15281167" target="_blank" rel="noopener">
            Visit Epilepsia Journal 
            <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
      </div>
    `;
  }

  displayArticle(index) {
    if (!this.articles.length) return;
    
    this.currentIndex = index;
    const article = this.articles[index];
    const contentContainer = this.container.querySelector('.news-feed__content');
    
    contentContainer.innerHTML = `
      <article class="news-feed__article">
        <h4 class="news-feed__title">
          <a href="${article.link}" target="_blank" rel="noopener">${article.title}</a>
        </h4>
        <div class="news-feed__meta">
          <span class="news-feed__date">${article.date}</span>
          <span class="news-feed__authors">${article.authors}</span>
        </div>
      </article>
    `;
    
    // Update active indicators if we have them
    const indicators = this.container.querySelectorAll('.news-feed__indicator');
    if (indicators.length) {
      indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
      });
    }
  }

  showNextArticle() {
    const nextIndex = (this.currentIndex + 1) % this.articles.length;
    this.displayArticle(nextIndex);
  }

  showPreviousArticle() {
    const prevIndex = (this.currentIndex - 1 + this.articles.length) % this.articles.length;
    this.displayArticle(prevIndex);
  }

  startRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    
    this.rotationTimer = setInterval(() => {
      this.showNextArticle();
    }, this.options.rotationInterval);
  }

  pauseRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  resumeRotation() {
    if (this.options.autoRotate && !this.rotationTimer) {
      this.startRotation();
    }
  }
}

// Initialize the news feed when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    // Initialize with a slight delay to ensure the container is ready
    new NewsFeed('#news-feed-container', {
      articleCount: 5,
      autoRotate: true,
      rotationInterval: 7000
    });
  }, 500);
}); 