/**
 * Storage management for NextWatch app
 * Handles localStorage operations for persistent data
 */

const Storage = {
  /**
   * Initialize storage functionality
   */
  init: function() {
    console.log('Storage initialized');
  },
  
  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   */
  save: function(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Storage save error:', error);
      return false;
    }
  },
  
  /**
   * Load data from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} Stored data or default value
   */
  load: function(key, defaultValue = null) {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return defaultValue;
      }
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Storage load error:', error);
      return defaultValue;
    }
  },
  
  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   */
  remove: function(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },
  
  /**
   * Clear all app data from localStorage
   */
  clearAll: function() {
    try {
      // Only clear app-specific keys
      Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Storage clearAll error:', error);
      return false;
    }
  },
  
  /**
   * Get watchlist from storage
   * @returns {Array} Watchlist array
   */
  getWatchlist: function() {
    return this.load(CONFIG.STORAGE_KEYS.WATCHLIST, []);
  },
  
  /**
   * Save watchlist to storage
   * @param {Array} watchlist - Watchlist array
   */
  saveWatchlist: function(watchlist) {
    return this.save(CONFIG.STORAGE_KEYS.WATCHLIST, watchlist);
  },
  
  /**
   * Add item to watchlist
   * @param {Object} item - Item to add
   * @returns {boolean} Success status
   */
  addToWatchlist: function(item) {
    const watchlist = this.getWatchlist();
    
    // Check if item already exists
    const exists = watchlist.some(i => i.imdbID === item.imdbID);
    if (exists) {
      return false;
    }
    
    // Add timestamp for sorting by recently added
    item.addedAt = new Date().toISOString();
    
    watchlist.push(item);
    return this.saveWatchlist(watchlist);
  },
  
  /**
   * Remove item from watchlist
   * @param {string} imdbID - IMDB ID of item to remove
   * @returns {boolean} Success status
   */
  removeFromWatchlist: function(imdbID) {
    const watchlist = this.getWatchlist();
    const newWatchlist = watchlist.filter(item => item.imdbID !== imdbID);
    
    if (newWatchlist.length === watchlist.length) {
      return false; // Item not found
    }
    
    return this.saveWatchlist(newWatchlist);
  },
  
  /**
   * Update item in watchlist
   * @param {string} imdbID - IMDB ID of item to update
   * @param {Object} updates - Properties to update
   * @returns {boolean} Success status
   */
  updateWatchlistItem: function(imdbID, updates) {
    const watchlist = this.getWatchlist();
    const index = watchlist.findIndex(item => item.imdbID === imdbID);
    
    if (index === -1) {
      return false; // Item not found
    }
    
    watchlist[index] = { ...watchlist[index], ...updates };
    return this.saveWatchlist(watchlist);
  },
  
  /**
   * Get chat history for a specific movie/show
   * @param {string} imdbID - IMDB ID
   * @returns {Array} Chat history array
   */
  getChatHistory: function(imdbID) {
    const allHistory = this.load(CONFIG.STORAGE_KEYS.CHAT_HISTORY, {});
    return allHistory[imdbID] || [];
  },
  
  /**
   * Save chat history for a specific movie/show
   * @param {string} imdbID - IMDB ID
   * @param {Array} history - Chat history array
   */
  saveChatHistory: function(imdbID, history) {
    const allHistory = this.load(CONFIG.STORAGE_KEYS.CHAT_HISTORY, {});
    allHistory[imdbID] = history;
    return this.save(CONFIG.STORAGE_KEYS.CHAT_HISTORY, allHistory);
  },
  
  /**
   * Clear chat history for a specific movie/show
   * @param {string} imdbID - IMDB ID
   */
  clearChatHistory: function(imdbID) {
    const allHistory = this.load(CONFIG.STORAGE_KEYS.CHAT_HISTORY, {});
    if (allHistory[imdbID]) {
      delete allHistory[imdbID];
      return this.save(CONFIG.STORAGE_KEYS.CHAT_HISTORY, allHistory);
    }
    return true;
  },
  
  /**
   * Clear all chat history
   */
  clearAllChatHistory: function() {
    return this.save(CONFIG.STORAGE_KEYS.CHAT_HISTORY, {});
  },
  
  /**
   * Get Gemini API key
   * @returns {string|null} API key or null if not set
   */
  getApiKey: function() {
    return this.load(CONFIG.STORAGE_KEYS.API_KEY, null);
  },
  
  /**
   * Save Gemini API key
   * @param {string} apiKey - API key
   */
  saveApiKey: function(apiKey) {
    return this.save(CONFIG.STORAGE_KEYS.API_KEY, apiKey);
  },
  
  /**
   * Get dark mode setting
   * @returns {boolean} Whether dark mode is enabled
   */
  getDarkMode: function() {
    return this.load(CONFIG.STORAGE_KEYS.DARK_MODE, false);
  },
  
  /**
   * Save dark mode setting
   * @param {boolean} enabled - Whether dark mode is enabled
   */
  saveDarkMode: function(enabled) {
    return this.save(CONFIG.STORAGE_KEYS.DARK_MODE, enabled);
  },
  
  /**
   * Save recommendations
   * @param {Array} recommendations - Recommendations array
   */
  saveRecommendations: function(recommendations) {
    return this.save(CONFIG.STORAGE_KEYS.RECOMMENDATIONS, recommendations);
  },
  
  /**
   * Get recommendations
   * @returns {Array} Recommendations array
   */
  getRecommendations: function() {
    return this.load(CONFIG.STORAGE_KEYS.RECOMMENDATIONS, []);
  },
  
  /**
   * Save active tab
   * @param {string} tabId - ID of active tab
   */
  saveActiveTab: function(tabId) {
    return this.save(CONFIG.STORAGE_KEYS.ACTIVE_TAB, tabId);
  },
  
  /**
   * Get active tab
   * @returns {string} ID of active tab
   */
  getActiveTab: function() {
    return this.load(CONFIG.STORAGE_KEYS.ACTIVE_TAB, 'home-screen');
  },
  
  /**
   * Save home content
   * @param {Object} content - Home content object
   */
  saveHomeContent: function(content) {
    return this.save(CONFIG.STORAGE_KEYS.HOME_CONTENT, content);
  },
  
  /**
   * Get home content
   * @returns {Object} Home content object
   */
  getHomeContent: function() {
    return this.load(CONFIG.STORAGE_KEYS.HOME_CONTENT, {});
  },
  
  /**
   * Save similar shows for a specific movie/show
   * @param {string} imdbID - IMDB ID
   * @param {Array} shows - Similar shows array
   */
  saveSimilarShows: function(imdbID, shows) {
    const allSimilarShows = this.load(CONFIG.STORAGE_KEYS.SIMILAR_SHOWS, {});
    allSimilarShows[imdbID] = shows;
    return this.save(CONFIG.STORAGE_KEYS.SIMILAR_SHOWS, allSimilarShows);
  },
  
  /**
   * Get similar shows for a specific movie/show
   * @param {string} imdbID - IMDB ID
   * @returns {Array} Similar shows array
   */
  getSimilarShows: function(imdbID) {
    const allSimilarShows = this.load(CONFIG.STORAGE_KEYS.SIMILAR_SHOWS, {});
    return allSimilarShows[imdbID] || [];
  },
  
  /**
   * Add movie to recently viewed
   * @param {Object} movie - Movie object
   */
  addToRecentlyViewed: function(movie) {
    const recentlyViewed = this.getRecentlyViewed();
    
    // Remove if already exists
    const filtered = recentlyViewed.filter(item => item.imdbID !== movie.imdbID);
    
    // Add to beginning of array
    filtered.unshift({
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
      Type: movie.Type,
      viewedAt: new Date().toISOString()
    });
    
    // Limit to 10 items
    const limited = filtered.slice(0, 10);
    
    return this.save(CONFIG.STORAGE_KEYS.RECENTLY_VIEWED, limited);
  },
  
  /**
   * Get recently viewed movies
   * @returns {Array} Recently viewed movies
   */
  getRecentlyViewed: function() {
    return this.load(CONFIG.STORAGE_KEYS.RECENTLY_VIEWED, []);
  }
};
