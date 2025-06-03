/**
 * Watchlist functionality for NextWatch app
 * Handles watchlist operations and display
 */

const Watchlist = {
  /**
   * Initialize watchlist functionality
   */
  init: function() {
    this.watchlistContainer = document.getElementById('watchlist-container');
    this.watchlistFilter = document.getElementById('watchlist-filter');
    
    this.currentFilter = 'all';
    this.bindEvents();
    this.renderWatchlist();
  },
  
  /**
   * Bind event listeners
   */
  bindEvents: function() {
    // Filter buttons
    if (this.watchlistFilter) {
      const segments = this.watchlistFilter.querySelectorAll('.segment');
      segments.forEach(segment => {
        segment.addEventListener('click', () => {
          // Update active segment
          segments.forEach(s => s.classList.remove('active'));
          segment.classList.add('active');
          
          // Update filter and re-render
          this.currentFilter = segment.getAttribute('data-filter');
          this.renderWatchlist();
        });
      });
    }
  },
  
  /**
   * Render watchlist based on current filter
   */
  renderWatchlist: function() {
    const watchlist = Storage.getWatchlist();
    
    if (watchlist.length === 0) {
      UI.showEmptyState(this.watchlistContainer, 'Your watchlist is empty<br>Add shows from the search tab');
      return;
    }
    
    // Filter watchlist based on current filter
    let filteredList = [...watchlist];
    
    switch (this.currentFilter) {
      case 'rated':
        filteredList = watchlist.filter(item => item.userRating && item.userRating >= 1);
        break;
      case 'unrated':
        filteredList = watchlist.filter(item => !item.userRating || item.userRating === 0);
        break;
      case 'recent':
        filteredList = [...watchlist].sort((a, b) => {
          return new Date(b.addedAt) - new Date(a.addedAt);
        }).slice(0, 10);
        break;
    }
    
    if (filteredList.length === 0) {
      UI.showEmptyState(this.watchlistContainer, 'No items match the current filter');
      return;
    }
    
    // Group by year
    const groupedByYear = Utils.groupBy(filteredList, 'Year');
    const years = Object.keys(groupedByYear).sort((a, b) => b - a); // Sort years descending
    
    // Clear container
    this.watchlistContainer.innerHTML = '';
    
    // Create year groups
    years.forEach(year => {
      const yearGroup = document.createElement('div');
      yearGroup.className = 'watchlist-year-group';
      
      const yearTitle = document.createElement('h2');
      yearTitle.className = 'watchlist-year-title';
      yearTitle.textContent = year;
      yearGroup.appendChild(yearTitle);
      
      const grid = document.createElement('div');
      grid.className = 'watchlist-grid';
      
      // Add items for this year
      groupedByYear[year].forEach(item => {
        const card = UI.createMovieCard(item, true);
        grid.appendChild(card);
      });
      
      yearGroup.appendChild(grid);
      this.watchlistContainer.appendChild(yearGroup);
    });
  },
  
  /**
   * Add movie/show to watchlist
   * @param {string} imdbID - IMDB ID
   */
  async addToWatchlist(imdbID) {
    try {
      // Get full details
      const details = await API.getMovieDetails(imdbID);
      
      if (!details) {
        Utils.showToast('Failed to add to watchlist', 'error');
        return;
      }
      
      // Add to storage
      const success = Storage.addToWatchlist(details);
      
      if (success) {
        Utils.showToast(`Added "${details.Title}" to watchlist`, 'success');
        
        // Re-render watchlist if on watchlist screen
        if (document.querySelector('#watchlist-screen.active')) {
          this.renderWatchlist();
        }
        
        // Update search results to show item is in watchlist
        const searchCard = document.querySelector(`.card[data-id="${imdbID}"]`);
        if (searchCard) {
          const actionsDiv = searchCard.querySelector('.card-actions');
          if (actionsDiv) {
            actionsDiv.innerHTML = `
              <button class="button button-danger remove-from-watchlist" data-id="${imdbID}">
                <span>Remove</span>
              </button>
            `;
            
            // Add event listener to new button
            const removeButton = actionsDiv.querySelector('.remove-from-watchlist');
            if (removeButton) {
              removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromWatchlist(imdbID);
              });
            }
          }
        }
        
        // Force re-render of watchlist tab even if not active
        const watchlistTab = document.getElementById('watchlist-screen');
        if (watchlistTab) {
          const watchlistContainer = watchlistTab.querySelector('#watchlist-container');
          if (watchlistContainer) {
            // Store current active tab
            const currentActiveScreen = document.querySelector('.screen.active');
            
            // Temporarily make watchlist tab active to render it
            document.querySelectorAll('.screen').forEach(screen => {
              screen.classList.remove('active');
            });
            watchlistTab.classList.add('active');
            
            // Render watchlist
            this.renderWatchlist();
            
            // Restore original active tab
            document.querySelectorAll('.screen').forEach(screen => {
              screen.classList.remove('active');
            });
            if (currentActiveScreen) {
              currentActiveScreen.classList.add('active');
            }
          }
        }
      } else {
        Utils.showToast('Already in your watchlist', 'info');
      }
    } catch (error) {
      console.error('Add to watchlist error:', error);
      Utils.showToast('Failed to add to watchlist', 'error');
    }
  },
  
  /**
   * Remove movie/show from watchlist
   * @param {string} imdbID - IMDB ID
   */
  removeFromWatchlist(imdbID) {
    // Confirm removal
    UI.showConfirmation('Remove this title from your watchlist?', () => {
      const success = Storage.removeFromWatchlist(imdbID);
      
      if (success) {
        Utils.showToast('Removed from watchlist', 'success');
        
        // Re-render watchlist if on watchlist screen
        if (document.querySelector('#watchlist-screen.active')) {
          this.renderWatchlist();
        }
        
        // Update search results to show item is not in watchlist
        const searchCard = document.querySelector(`.card[data-id="${imdbID}"]`);
        if (searchCard) {
          const actionsDiv = searchCard.querySelector('.card-actions');
          if (actionsDiv) {
            actionsDiv.innerHTML = `
              <button class="button button-primary add-to-watchlist" data-id="${imdbID}">
                <span>Add to Watchlist</span>
              </button>
            `;
            
            // Add event listener to new button
            const addButton = actionsDiv.querySelector('.add-to-watchlist');
            if (addButton) {
              addButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToWatchlist(imdbID);
              });
            }
          }
        }
        
        // Force re-render of watchlist tab even if not active
        const watchlistTab = document.getElementById('watchlist-screen');
        if (watchlistTab) {
          const watchlistContainer = watchlistTab.querySelector('#watchlist-container');
          if (watchlistContainer) {
            // Store current active tab
            const currentActiveScreen = document.querySelector('.screen.active');
            
            // Temporarily make watchlist tab active to render it
            document.querySelectorAll('.screen').forEach(screen => {
              screen.classList.remove('active');
            });
            watchlistTab.classList.add('active');
            
            // Render watchlist
            this.renderWatchlist();
            
            // Restore original active tab
            document.querySelectorAll('.screen').forEach(screen => {
              screen.classList.remove('active');
            });
            if (currentActiveScreen) {
              currentActiveScreen.classList.add('active');
            }
          }
        }
      }
    });
  },
  
  /**
   * Update rating for a watchlist item
   * @param {string} imdbID - IMDB ID
   * @param {number} rating - New rating (1-5)
   */
  updateRating(imdbID, rating) {
    console.log(`Updating rating for ${imdbID} to ${rating}`);
    const success = Storage.updateWatchlistItem(imdbID, { userRating: rating });
    
    if (success) {
      Utils.showToast('Rating updated', 'success');
      
      // Clear recommendations cache to force refresh with new ratings
      Storage.saveRecommendations([]);
      
      // Re-render watchlist if on watchlist screen
      if (document.querySelector('#watchlist-screen.active')) {
        this.renderWatchlist();
      }
    } else {
      console.error('Failed to update rating');
      Utils.showToast('Failed to update rating', 'error');
    }
  },
  
  /**
   * Clear entire watchlist
   */
  clearWatchlist() {
    UI.showConfirmation('Are you sure you want to clear your entire watchlist?', () => {
      Storage.saveWatchlist([]);
      this.renderWatchlist();
      Utils.showToast('Watchlist cleared', 'success');
    });
  }
};
