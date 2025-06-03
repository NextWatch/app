/**
 * UI management for NextWatch app
 * Handles UI interactions and component rendering
 */

const UI = {
  /**
   * Initialize UI components and event listeners
   */
  init: function() {
    this.initTabNavigation();
    this.initDarkMode();
    this.initModalHandlers();
    this.restoreActiveTab();
    
    // Add iOS safe area padding
    document.documentElement.style.setProperty(
      '--safe-area-inset-top',
      'env(safe-area-inset-top, 0px)'
    );
    document.documentElement.style.setProperty(
      '--safe-area-inset-bottom',
      'env(safe-area-inset-bottom, 0px)'
    );
  },
  
  /**
   * Initialize tab navigation
   */
  initTabNavigation: function() {
    const tabItems = document.querySelectorAll('.tab-item');
    
    tabItems.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetScreen = tab.getAttribute('data-screen');
        this.switchScreen(targetScreen);
        
        // Update active tab
        tabItems.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Save active tab to localStorage
        Storage.saveActiveTab(targetScreen);
        
        // Add haptic feedback
        Utils.hapticFeedback();
      });
    });
  },
  
  /**
   * Restore the active tab from localStorage
   */
  restoreActiveTab: function() {
    const activeTab = Storage.getActiveTab();
    if (activeTab) {
      const tabToActivate = document.querySelector(`.tab-item[data-screen="${activeTab}"]`);
      if (tabToActivate) {
        tabToActivate.click();
      }
    }
  },
  
  /**
   * Switch to a different screen
   * @param {string} screenId - ID of screen to switch to
   */
  switchScreen: function(screenId) {
    const screens = document.querySelectorAll('.screen');
    
    screens.forEach(screen => {
      if (screen.id === screenId) {
        screen.classList.add('active');
      } else {
        screen.classList.remove('active');
      }
    });
  },
  
  /**
   * Initialize dark mode
   */
  initDarkMode: function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const isDarkMode = Storage.getDarkMode();
    
    // Set initial state
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      if (darkModeToggle) {
        darkModeToggle.checked = true;
      }
    }
    
    // Add toggle event listener
    if (darkModeToggle) {
      darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        Storage.saveDarkMode(darkModeToggle.checked);
      });
    }
  },
  
  /**
   * Initialize modal handlers
   */
  initModalHandlers: function() {
    const detailModal = document.getElementById('detail-modal');
    const closeDetailModal = document.getElementById('close-detail-modal');
    
    if (closeDetailModal) {
      closeDetailModal.addEventListener('click', () => {
        this.closeModal(detailModal);
      });
    }
    
    // Close modal when clicking on backdrop
    if (detailModal) {
      const backdrop = detailModal.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          this.closeModal(detailModal);
        });
      }
    }
  },
  
  /**
   * Open a modal
   * @param {HTMLElement} modal - Modal element
   */
  openModal: function(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },
  
  /**
   * Close a modal
   * @param {HTMLElement} modal - Modal element
   */
  closeModal: function(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  /**
   * Create a movie/show card element
   * @param {Object} item - Movie/show data
   * @param {boolean} inWatchlist - Whether item is in watchlist
   * @returns {HTMLElement} Card element
   */
  createMovieCard: function(item, inWatchlist = false) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-id', item.imdbID);
    
    const posterUrl = item.Poster !== 'N/A' ? item.Poster : 'assets/no-poster.png';
    
    card.innerHTML = `
      <div class="card-poster">
        <img src="${posterUrl}" alt="${item.Title} poster" loading="lazy">
      </div>
      <div class="card-content">
        <h3 class="card-title">${item.Title}</h3>
        <div class="card-info">
          <span class="card-year">${item.Year}</span>
          <span class="card-genre">${item.Type || 'movie'}</span>
          ${item.imdbRating ? `<span class="card-rating">★ ${item.imdbRating}</span>` : ''}
        </div>
        ${inWatchlist ? '<div class="user-rating-container"><p class="rating-label">Your Rating:</p></div>' : ''}
        <div class="card-actions">
          ${!inWatchlist ? 
            `<button class="button button-primary add-to-watchlist" data-id="${item.imdbID}">
              <span>Add to Watchlist</span>
            </button>` : 
            `<button class="button button-danger remove-from-watchlist" data-id="${item.imdbID}">
              <span>Remove</span>
            </button>`
          }
        </div>
      </div>
    `;
    
    // Add click event to open detail view
    card.addEventListener('click', (e) => {
      // Don't open detail view if clicking on buttons or star ratings
      if (e.target.closest('.button') || e.target.closest('.star-rating')) {
        return;
      }
      
      // Only open detail view if we have a valid IMDB ID
      if (item.imdbID && !item.imdbID.startsWith('rec-')) {
        Detail.showDetail(item.imdbID);
      } else if (item.Title) {
        // For recommendations without IMDB ID, search for the title
        const searchTab = document.querySelector('.tab-item[data-screen="home-screen"]');
        if (searchTab) {
          searchTab.click();
        }
        
        // Set search input value and trigger search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.value = item.Title;
          searchInput.dispatchEvent(new Event('input'));
        }
      }
    });
    
    // Add watchlist button event
    const addButton = card.querySelector('.add-to-watchlist');
    if (addButton) {
      addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        Watchlist.addToWatchlist(item.imdbID);
      });
    }
    
    // Add remove button event
    const removeButton = card.querySelector('.remove-from-watchlist');
    if (removeButton) {
      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        Watchlist.removeFromWatchlist(item.imdbID);
      });
    }
    
    // Add user rating if in watchlist (always show rating UI for watchlist items)
    if (inWatchlist) {
      const ratingContainer = card.querySelector('.user-rating-container');
      if (ratingContainer) {
        const currentRating = item.userRating || 0;
        
        // Create star rating with proper event handling
        const starRating = Utils.createStarRating(currentRating, true, (rating) => {
          // Prevent event propagation
          event.stopPropagation();
          
          // Update rating in watchlist
          Watchlist.updateRating(item.imdbID, rating);
        });
        
        ratingContainer.appendChild(starRating);
      }
    }
    
    return card;
  },
  
  /**
   * Show loading spinner
   * @param {HTMLElement} container - Container to add spinner to
   * @returns {HTMLElement} Spinner element
   */
  showLoading: function(container) {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    loadingContainer.appendChild(spinner);
    container.appendChild(loadingContainer);
    
    return loadingContainer;
  },
  
  /**
   * Hide loading spinner
   * @param {HTMLElement} spinner - Spinner element to remove
   */
  hideLoading: function(spinner) {
    if (spinner && spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }
  },
  
  /**
   * Show empty state
   * @param {HTMLElement} container - Container to add empty state to
   * @param {string} message - Message to display
   */
  showEmptyState: function(container, message) {
    container.innerHTML = `
      <div class="empty-state">
        <p>${message}</p>
      </div>
    `;
  },
  
  /**
   * Create segmented control
   * @param {Array} segments - Array of segment objects {id, text}
   * @param {string} activeId - ID of active segment
   * @param {Function} onChange - Callback when segment changes
   * @returns {HTMLElement} Segmented control element
   */
  createSegmentedControl: function(segments, activeId, onChange) {
    const control = document.createElement('div');
    control.className = 'segmented-control';
    
    segments.forEach(segment => {
      const button = document.createElement('button');
      button.className = `segment ${segment.id === activeId ? 'active' : ''}`;
      button.setAttribute('data-id', segment.id);
      button.textContent = segment.text;
      
      button.addEventListener('click', () => {
        // Update active segment
        control.querySelectorAll('.segment').forEach(s => {
          s.classList.remove('active');
        });
        button.classList.add('active');
        
        // Call onChange callback
        if (onChange) {
          onChange(segment.id);
        }
        
        // Add haptic feedback
        Utils.hapticFeedback();
      });
      
      control.appendChild(button);
    });
    
    return control;
  },
  
  /**
   * Show confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Callback when confirmed
   */
  showConfirmation: function(message, onConfirm) {
    if (confirm(message)) {
      onConfirm();
    }
  }
};
