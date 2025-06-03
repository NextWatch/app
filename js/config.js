/**
 * NextWatch App Configuration
 * Contains app-wide constants and configuration settings
 */

const CONFIG = {
  // App information
  APP_NAME: 'NextWatch',
  APP_VERSION: '1.0.0',
  APP_TAGLINE: 'Watch smarter. Track better.',
  
  // Local storage keys
  STORAGE_KEYS: {
    API_KEY: 'nextwatch_gemini_api_key',
    WATCHLIST: 'nextwatch_watchlist',
    CHAT_HISTORY: 'nextwatch_chat_history',
    DARK_MODE: 'nextwatch_dark_mode',
    RECOMMENDATIONS: 'nextwatch_recommendations',
    ACTIVE_TAB: 'nextwatch_active_tab',
    HOME_CONTENT: 'nextwatch_home_content',
    SIMILAR_SHOWS: 'nextwatch_similar_shows',
    RECENTLY_VIEWED: 'nextwatch_recently_viewed'
  },
  
  // API settings
  GEMINI_API: {
    MODEL: 'gemini-1.5-flash-latest',
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
    MAX_TOKENS: 1024,
    DEFAULT_KEY: 'AIzaSyDuSjazaZTKq4TJJGnpz8P8IvDOFqOA3cc' // User's provided key
  },
  
  // OMDB API for movie data
  OMDB_API: {
    BASE_URL: 'https://www.omdbapi.com/',
    API_KEY: '3ae61f1d' // User's provided key
  },
  
  // UI settings
  UI: {
    TOAST_DURATION: 3000, // milliseconds
    ANIMATION_DURATION: 300, // milliseconds
    MAX_SEARCH_RESULTS: 10
  }
};
