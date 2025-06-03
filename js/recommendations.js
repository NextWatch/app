/**
 * Recommendations functionality for NextWatch app
 * Handles AI-powered recommendations based on user watchlist
 */

const Recommendations = {
  /**
   * Initialize recommendations functionality
   */
  init: function() {
    this.recommendationsContainer = document.getElementById('recommendations-container');
    this.loadRecommendations();
    
    // Add refresh button
    const refreshButton = document.createElement('button');
    refreshButton.className = 'button button-primary refresh-recommendations';
    refreshButton.innerHTML = '<span>Refresh Recommendations</span>';
    refreshButton.addEventListener('click', () => this.refreshRecommendations());
    
    // Add to the top of the recommendations screen
    const recommendationsScreen = document.getElementById('recommendations-screen');
    if (recommendationsScreen) {
      const screenContent = recommendationsScreen.querySelector('.screen-content');
      if (screenContent) {
        screenContent.insertBefore(refreshButton, screenContent.querySelector('h1').nextSibling);
      }
    }
  },
  
  /**
   * Load and display recommendations
   */
  async loadRecommendations() {
    // Check if API key is set
    const apiKey = Storage.getApiKey() || CONFIG.GEMINI_API.DEFAULT_KEY;
    if (!apiKey) {
      UI.showEmptyState(this.recommendationsContainer, 'Please add your Gemini API key in Settings to get recommendations');
      return;
    }
    
    // Check if watchlist has items
    const watchlist = Storage.getWatchlist();
    if (watchlist.length === 0) {
      UI.showEmptyState(this.recommendationsContainer, 'Add shows to your watchlist to get recommendations');
      return;
    }
    
    // Check if any shows have ratings
    const ratedShows = watchlist.filter(item => item.userRating && item.userRating > 0);
    if (ratedShows.length === 0) {
      UI.showEmptyState(this.recommendationsContainer, 'Rate shows in your watchlist to get personalized recommendations');
      return;
    }
    
    // Check if we have cached recommendations
    const cachedRecommendations = Storage.getRecommendations();
    
    // Show loading state
    this.recommendationsContainer.innerHTML = '';
    const loadingSpinner = UI.showLoading(this.recommendationsContainer);
    
    try {
      let recommendations;
      
      if (cachedRecommendations.length > 0) {
        // Use cached recommendations
        recommendations = cachedRecommendations;
      } else {
        // Get new recommendations
        recommendations = await API.getRecommendations();
      }
      
      // Remove loading spinner
      UI.hideLoading(loadingSpinner);
      
      if (!recommendations || recommendations.length === 0) {
        UI.showEmptyState(this.recommendationsContainer, 'Unable to generate recommendations. Please try again later.');
        return;
      }
      
      console.log('Displaying recommendations:', recommendations);
      
      // Clear container
      this.recommendationsContainer.innerHTML = '';
      
      // Create recommendations section
      const section = document.createElement('div');
      section.className = 'recommendations-section';
      
      const title = document.createElement('h2');
      title.className = 'recommendations-section-title';
      title.textContent = 'Recommended For You';
      section.appendChild(title);
      
      // Create grid for recommendations
      const grid = document.createElement('div');
      grid.className = 'recommendations-grid';
      
      // Add each recommendation as a movie card
      recommendations.forEach(item => {
        // Convert OMDB data format to match the format expected by UI.createMovieCard
        const movieData = {
          imdbID: item.imdbID || `rec-${item.title.replace(/\s+/g, '-').toLowerCase()}`,
          Title: item.title,
          Year: item.year,
          Poster: item.poster !== 'N/A' ? item.poster : 'assets/no-poster.png',
          Type: item.type || 'movie',
          Plot: item.plot || '',
          isRecommendation: true
        };
        
        // Create movie card using the same component as search results
        const card = UI.createMovieCard(movieData, false);
        grid.appendChild(card);
      });
      
      section.appendChild(grid);
      this.recommendationsContainer.appendChild(section);
      
    } catch (error) {
      console.error('Recommendations error:', error);
      UI.hideLoading(loadingSpinner);
      
      if (error.message && error.message.includes('API key')) {
        UI.showEmptyState(this.recommendationsContainer, 'Invalid Gemini API key. Please update it in Settings.');
      } else {
        UI.showEmptyState(this.recommendationsContainer, 'Failed to load recommendations. Please try again later.');
      }
    }
  },
  
  /**
   * Refresh recommendations
   */
  refreshRecommendations() {
    // Clear cached recommendations
    Storage.saveRecommendations([]);
    
    // Show toast
    Utils.showToast('Refreshing recommendations...', 'info');
    
    // Reload recommendations
    this.loadRecommendations();
  }
};
