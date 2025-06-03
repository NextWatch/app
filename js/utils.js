/**
 * Utility functions for NextWatch app
 * Contains helper functions used across the application
 */

const Utils = {
  /**
   * Initialize utility functions
   */
  init: function() {
    // Nothing to initialize
    console.log('Utils initialized');
  },
  
  /**
   * Creates and shows a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, info)
   */
  showToast: function(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, CONFIG.UI.ANIMATION_DURATION);
    }, CONFIG.UI.TOAST_DURATION);
  },
  
  /**
   * Format date to readable string
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate: function(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  
  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  truncateText: function(text, length = 100) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  },
  
  /**
   * Debounce function to limit function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce: function(func, wait = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  
  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },
  
  /**
   * Create star rating element
   * @param {number} rating - Current rating (0-5)
   * @param {boolean} editable - Whether rating can be changed
   * @param {Function} onChange - Callback when rating changes
   * @returns {HTMLElement} Star rating element
   */
  createStarRating: function(rating = 0, editable = false, onChange = null) {
    const container = document.createElement('div');
    container.className = 'star-rating';
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = `star ${i <= rating ? 'filled' : ''}`;
      star.innerHTML = '★';
      star.setAttribute('data-value', i);
      
      if (editable) {
        star.addEventListener('click', function(event) {
          const value = parseInt(this.getAttribute('data-value'));
          const stars = container.querySelectorAll('.star');
          
          stars.forEach(s => {
            const starValue = parseInt(s.getAttribute('data-value'));
            if (starValue <= value) {
              s.classList.add('filled');
            } else {
              s.classList.remove('filled');
            }
          });
          
          if (onChange) {
            onChange(value);
          }
          
          // Prevent event propagation
          event.stopPropagation();
        });
      }
      
      container.appendChild(star);
    }
    
    return container;
  },
  
  /**
   * Check if Gemini API key is valid
   * @param {string} apiKey - API key to validate
   * @returns {Promise<boolean>} Whether key is valid
   */
  validateGeminiApiKey: async function(apiKey) {
    try {
      const response = await fetch(`${CONFIG.GEMINI_API.BASE_URL}${CONFIG.GEMINI_API.MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello"
            }]
          }],
          generationConfig: {
            maxOutputTokens: 10
          }
        })
      });
      
      const data = await response.json();
      return !data.error;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  },
  
  /**
   * Add haptic feedback
   */
  hapticFeedback: function() {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  /**
   * Group array items by a key
   * @param {Array} array - Array to group
   * @param {string|Function} key - Key to group by
   * @returns {Object} Grouped object
   */
  groupBy: function(array, key) {
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }
};
