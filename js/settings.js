/**
 * Settings functionality for NextWatch app
 * Handles app settings and data management
 */

const Settings = {
  /**
   * Initialize settings functionality
   */
  init: function() {
    this.apiKeyInput = document.getElementById('gemini-api-key');
    this.saveApiKeyButton = document.getElementById('save-api-key');
    this.darkModeToggle = document.getElementById('dark-mode-toggle');
    this.clearWatchlistButton = document.getElementById('clear-watchlist');
    this.resetChatHistoryButton = document.getElementById('reset-chat-history');
    this.clearAllDataButton = document.getElementById('clear-all-data');
    
    this.loadSettings();
    this.bindEvents();
  },
  
  /**
   * Load saved settings
   */
  loadSettings: function() {
    // Load API key
    const apiKey = Storage.getApiKey();
    if (apiKey && this.apiKeyInput) {
      this.apiKeyInput.value = apiKey;
    }
    
    // Load dark mode setting
    const darkMode = Storage.getDarkMode();
    if (this.darkModeToggle) {
      this.darkModeToggle.checked = darkMode;
    }
  },
  
  /**
   * Bind event listeners
   */
  bindEvents: function() {
    // Save API key
    if (this.saveApiKeyButton) {
      this.saveApiKeyButton.addEventListener('click', async () => {
        await this.saveApiKey();
      });
    }
    
    // Dark mode toggle
    if (this.darkModeToggle) {
      this.darkModeToggle.addEventListener('change', () => {
        Storage.saveDarkMode(this.darkModeToggle.checked);
        document.body.classList.toggle('dark-mode', this.darkModeToggle.checked);
      });
    }
    
    // Clear watchlist
    if (this.clearWatchlistButton) {
      this.clearWatchlistButton.addEventListener('click', () => {
        Watchlist.clearWatchlist();
      });
    }
    
    // Reset chat history
    if (this.resetChatHistoryButton) {
      this.resetChatHistoryButton.addEventListener('click', () => {
        UI.showConfirmation('Are you sure you want to reset all chat history?', () => {
          Storage.clearAllChatHistory();
          Utils.showToast('Chat history reset', 'success');
        });
      });
    }
    
    // Clear all data
    if (this.clearAllDataButton) {
      this.clearAllDataButton.addEventListener('click', () => {
        UI.showConfirmation('Are you sure you want to clear all app data? This cannot be undone.', () => {
          Storage.clearAll();
          Utils.showToast('All data cleared', 'success');
          
          // Reload page to reset app state
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      });
    }
  },
  
  /**
   * Save and validate API key
   */
  async saveApiKey() {
    if (!this.apiKeyInput) return;
    
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      Utils.showToast('Please enter an API key', 'error');
      return;
    }
    
    // Show loading state
    this.saveApiKeyButton.disabled = true;
    this.saveApiKeyButton.textContent = 'Validating...';
    
    try {
      // Validate API key
      const isValid = await Utils.validateGeminiApiKey(apiKey);
      
      if (isValid) {
        // Save API key
        Storage.saveApiKey(apiKey);
        Utils.showToast('API key saved successfully', 'success');
        
        // Reset recommendations to force refresh with new API key
        Storage.saveRecommendations([]);
      } else {
        Utils.showToast('Invalid API key', 'error');
      }
    } catch (error) {
      console.error('API key validation error:', error);
      Utils.showToast('Failed to validate API key', 'error');
    } finally {
      // Reset button state
      this.saveApiKeyButton.disabled = false;
      this.saveApiKeyButton.textContent = 'Save';
    }
  }
};
