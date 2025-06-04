/**
 * Search functionality for NextWatch app
 * Handles search operations and results display
 */

const Search = {
  /**
   * Initialize search functionality
   */
  init: function() {
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    this.homeContainer = document.getElementById('home-container');
    
    this.bindEvents();
  },
  
  /**
   * Bind event listeners
   */
  bindEvents: function() {
    if (this.searchInput) {
      // Debounce search input to avoid excessive API calls
      this.searchInput.addEventListener('input', Utils.debounce(() => {
        const query = this.searchInput.value.trim();
        if (query.length >= 3) {
          this.performSearch(query);
        } else {
          this.clearResults();
        }
      }, 500));
    }
  },
  
  /**
   * Perform search
   * @param {string} query - Search query
   */
  async performSearch(query) {
    // Hide home container when search is performed
    if (this.homeContainer) {
      this.homeContainer.style.display = 'none';
    }

    // Show loading state
    this.searchResults.innerHTML = '';
    const loadingSpinner = UI.showLoading(this.searchResults);
    
    try {
      const results = await API.searchOMDB(query);
      
      // Remove loading spinner
      UI.hideLoading(loadingSpinner);
      
      if (results.length === 0) {
        this.searchResults.innerHTML = `
          <div class="empty-state">
            <p>No results found for "${query}"</p>
          </div>
        `;
        return;
      }
      
      // Clear results
      this.searchResults.innerHTML = '';
      
      // Get watchlist for comparison
      const watchlist = Storage.getWatchlist();
      const watchlistIds = watchlist.map(item => item.imdbID);
      
      // Display results
      results.forEach(result => {
        const inWatchlist = watchlistIds.includes(result.imdbID);
        const card = UI.createMovieCard(result, inWatchlist);
        this.searchResults.appendChild(card);
      });
      
    } catch (error) {
      console.error('Search error:', error);
      UI.hideLoading(loadingSpinner);
      
      this.searchResults.innerHTML = `
        <div class="empty-state">
          <p>Failed to search. Please try again.</p>
        </div>
      `;
    }
  },
  
  /**
   * Clear search results
   */
  clearResults: function() {
    this.searchResults.innerHTML = `
      <div class="empty-state">
        <p>Search for movies and TV shows</p>
      </div>
    `;
    // Show home container when search is cleared
    if (this.homeContainer) {
      this.homeContainer.style.display = '';
    }
  }
};
