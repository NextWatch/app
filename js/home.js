/**
 * Home functionality for NextWatch app
 * Handles home screen content display with trending and genre-based sections
 */

const Home = {
  /**
   * Initialize home functionality
   */
  init: function() {
    this.homeContainer = document.getElementById('home-container');
    this.loadHomeContent();
  },
  
  /**
   * Load and display home content
   */
  async loadHomeContent() {
    // Show loading state
    this.homeContainer.innerHTML = '';
    const loadingSpinner = UI.showLoading(this.homeContainer);
    
    try {
      // Get predefined content
      const content = await this.getHomeContent();
      
      // Remove loading spinner
      UI.hideLoading(loadingSpinner);
      
      if (!content || Object.keys(content).length === 0) {
        UI.showEmptyState(this.homeContainer, 'Failed to load content. Please try again.');
        return;
      }
      
      // Clear container
      this.homeContainer.innerHTML = '';
      
      // Add trending section
      if (content.trending && content.trending.length > 0) {
        this.createFeaturedSection('Trending Now', content.trending);
      }
      
      // Add genre sections
      Object.keys(content.genres).forEach(genre => {
        if (content.genres[genre] && content.genres[genre].length > 0) {
          this.createGenreSection(genre, content.genres[genre]);
        }
      });
      
    } catch (error) {
      console.error('Home content error:', error);
      UI.hideLoading(loadingSpinner);
      UI.showEmptyState(this.homeContainer, 'Failed to load content. Please try again.');
    }
  },
  
  /**
   * Get home content (trending and genre-based)
   * @returns {Promise<Object>} Home content
   */
  async getHomeContent() {
    // This would normally fetch from an API, but we'll use predefined content for now
    const kdramas = {
      trending: [],
      genres: {
        'Fake Dating': [
          'My Demon',
          'No Gain No Love',
          'When the Phone Rings'
        ],
        'Enemies to Lovers': [
          'Doom at Your Service',
          'Shooting Stars',
          'The Judge from Hell',
          'Our Beloved Summer'
        ],
        'Friends to Lovers': [
          'More than Friends',
          'Fight for My Way',
          'Love Nextdoor',
          'Weightlifting Fairy Kim Bok-joo'
        ],
        'Toxic Love': [
          'The Smile has Left Your Eyes',
          'Doona',
          'Nevertheless',
          'Tempted: The Great Seducer'
        ],
        'True Love': [
          'Twinkling Watermelon',
          'Strong Girl Bong-Soon',
          'Crash Landing on You',
          'Descendant of the Sun'
        ],
        'Love at First Sight': [
          'Business Proposal',
          'Extraordinary You',
          'Lovestruck in the City',
          'The Heirs'
        ],
        'Right Person Wrong Time': [
          'Vincenzo',
          'Vagabond',
          'Crash Landing on You',
          'A Time Called You'
        ],
        'Age Gaps': [
          'Backstreet Rookie',
          '2521',
          'Something in the Rain',
          'The Glory'
        ]
      }
    };
    
    // Select a few popular titles for trending section
    kdramas.trending = [
      'Crash Landing on You',
      'Strong Girl Bong-Soon',
      'Business Proposal',
      'Vincenzo',
      'Descendants of the Sun',
      'My Demon',
      'The Glory'
    ];
    
    // Fetch details for all titles from OMDB
    const content = {
      trending: [],
      genres: {}
    };
    
    // Process trending titles
    for (const title of kdramas.trending) {
      try {
        const details = await API.getMovieDetailsByTitle(title);
        if (details) {
          content.trending.push(details);
        }
      } catch (error) {
        console.error(`Error fetching details for "${title}":`, error);
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Process genre titles
    for (const genre in kdramas.genres) {
      content.genres[genre] = [];
      
      for (const title of kdramas.genres[genre]) {
        try {
          const details = await API.getMovieDetailsByTitle(title);
          if (details) {
            content.genres[genre].push(details);
          }
        } catch (error) {
          console.error(`Error fetching details for "${title}":`, error);
        }
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Cache the content for future use
    Storage.saveHomeContent(content);
    
    return content;
  },
  
  /**
   * Create featured section with large cards
   * @param {string} title - Section title
   * @param {Array} items - Items to display
   */
  createFeaturedSection(title, items) {
    const section = document.createElement('div');
    section.className = 'featured-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);
    
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'horizontal-scroll featured';
    
    items.forEach(item => {
      // Convert OMDB data format to match the format expected by UI.createMovieCard
      const movieData = {
        imdbID: item.imdbID || `home-${item.Title.replace(/\s+/g, '-').toLowerCase()}`,
        Title: item.Title,
        Year: item.Year,
        Poster: item.Poster !== 'N/A' ? item.Poster : 'assets/no-poster.png',
        Type: item.Type || 'movie',
        Plot: item.Plot || '',
        imdbRating: item.imdbRating
      };
      
      // Create movie card
      const card = UI.createMovieCard(movieData, false);
      card.classList.add('featured-card');
      scrollContainer.appendChild(card);
    });
    
    section.appendChild(scrollContainer);
    this.homeContainer.appendChild(section);
  },
  
  /**
   * Create genre section
   * @param {string} genre - Genre name
   * @param {Array} items - Items to display
   */
  createGenreSection(genre, items) {
    const section = document.createElement('div');
    section.className = 'genre-section';
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = genre;
    section.appendChild(sectionTitle);
    
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'horizontal-scroll';
    
    items.forEach(item => {
      // Convert OMDB data format to match the format expected by UI.createMovieCard
      const movieData = {
        imdbID: item.imdbID || `home-${item.Title.replace(/\s+/g, '-').toLowerCase()}`,
        Title: item.Title,
        Year: item.Year,
        Poster: item.Poster !== 'N/A' ? item.Poster : 'assets/no-poster.png',
        Type: item.Type || 'movie',
        Plot: item.Plot || '',
        imdbRating: item.imdbRating
      };
      
      // Create movie card
      const card = UI.createMovieCard(movieData, false);
      scrollContainer.appendChild(card);
    });
    
    section.appendChild(scrollContainer);
    this.homeContainer.appendChild(section);
  },
  
  /**
   * Refresh home content
   */
  refreshHomeContent() {
    // Clear cached content
    Storage.saveHomeContent({});
    
    // Show toast
    Utils.showToast('Refreshing home content...', 'info');
    
    // Reload content
    this.loadHomeContent();
  }
};
