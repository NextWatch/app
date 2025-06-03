/**
 * Main application entry point for NextWatch app
 * Initializes all components and sets up event listeners
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  Utils.init();
  Storage.init();
  UI.init();
  Search.init();
  Watchlist.init();
  Recommendations.init();
  Detail.init();
  Settings.init();
  Home.init();
  
  // Add recently viewed section to home if available
  const recentlyViewed = Storage.getRecentlyViewed();
  if (recentlyViewed && recentlyViewed.length > 0) {
    Home.createRecentlyViewedSection(recentlyViewed);
  }
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
  
  // Set default API keys if not set
  if (!Storage.getApiKey()) {
    Storage.saveApiKey(CONFIG.GEMINI_API.DEFAULT_KEY);
  }
  
  console.log(`${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} initialized`);
});
