/**
 * Detail view functionality for NextWatch app
 * Handles movie/show detail display and AI interactions
 */

const Detail = {
  /**
   * Initialize detail view functionality
   */
  init: function() {
    this.detailModal = document.getElementById('detail-modal');
    this.detailContent = document.getElementById('detail-content');
    
    this.currentImdbID = null;
    this.currentMovie = null;
  },
  
  /**
   * Show detail view for a movie/show
   * @param {string} imdbID - IMDB ID
   */
  async showDetail(imdbID) {
    this.currentImdbID = imdbID;
    
    // Show loading state
    this.detailContent.innerHTML = '';
    const loadingSpinner = UI.showLoading(this.detailContent);
    
    // Open modal
    UI.openModal(this.detailModal);
    
    try {
      // Get movie details
      const movie = await API.getMovieDetails(imdbID);
      this.currentMovie = movie;
      
      // Remove loading spinner
      UI.hideLoading(loadingSpinner);
      
      if (!movie) {
        this.detailContent.innerHTML = `
          <div class="empty-state">
            <p>Failed to load details. Please try again.</p>
          </div>
        `;
        return;
      }
      
      // Check if in watchlist
      const watchlist = Storage.getWatchlist();
      const watchlistItem = watchlist.find(item => item.imdbID === imdbID);
      const inWatchlist = !!watchlistItem;
      
      // Create detail view
      this.renderDetailView(movie, inWatchlist);
      
      // Initialize plot explanation buttons
      this.initPlotButtons();
      
      // Initialize chat functionality
      this.initChat();
      
      // Load similar shows
      this.loadSimilarShows(movie);
      
    } catch (error) {
      console.error('Detail view error:', error);
      UI.hideLoading(loadingSpinner);
      
      this.detailContent.innerHTML = `
        <div class="empty-state">
          <p>Failed to load details. Please try again.</p>
        </div>
      `;
    }
  },
  
  /**
   * Render detail view
   * @param {Object} movie - Movie/show details
   * @param {boolean} inWatchlist - Whether item is in watchlist
   */
  renderDetailView(movie, inWatchlist) {
    const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'assets/no-poster.png';
    
    this.detailContent.innerHTML = `
      <div class="detail-header">
        <div class="detail-poster">
          <img src="${posterUrl}" alt="${movie.Title} poster">
        </div>
        <div class="detail-info">
          <h1 class="detail-title">${movie.Title}</h1>
          <div class="detail-meta">
            <span class="detail-year">${movie.Year}</span>
            <span class="detail-genre">${movie.Genre}</span>
            ${movie.imdbRating !== 'N/A' ? `<span class="detail-rating">★ ${movie.imdbRating}</span>` : ''}
            <span class="detail-runtime">${movie.Runtime}</span>
          </div>
          <div class="detail-actions">
            ${!inWatchlist ? 
              `<button class="button button-primary add-to-watchlist" data-id="${movie.imdbID}">
                <span>Add to Watchlist</span>
              </button>` : 
              `<button class="button button-danger remove-from-watchlist" data-id="${movie.imdbID}">
                <span>Remove from Watchlist</span>
              </button>`
            }
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h2 class="detail-section-title">Plot</h2>
        <div class="plot-buttons">
          <button class="button button-secondary" id="explain-no-spoilers">
            <span>📖 Explain Plot – No Spoilers</span>
          </button>
          <button class="button button-secondary" id="explain-with-spoilers">
            <span>💥 Explain Plot – With Spoilers</span>
          </button>
        </div>
        <div class="plot-content" id="plot-explanation">
          ${movie.Plot}
        </div>
      </div>
      
      <div class="detail-section">
        <h2 class="detail-section-title">Similar Shows</h2>
        <div class="similar-shows-container" id="similar-shows-container">
          <div class="loading-container"><div class="loading-spinner"></div></div>
        </div>
      </div>
      
      <div class="detail-section">
        <h2 class="detail-section-title">Cast</h2>
        <p>${movie.Actors}</p>
      </div>
      
      <div class="detail-section">
        <h2 class="detail-section-title">Director</h2>
        <p>${movie.Director}</p>
      </div>
      
      <div class="detail-section">
        <h2 class="detail-section-title">Ask Anything</h2>
        <div class="chat-container" id="chat-container">
          <div class="chat-messages" id="chat-messages"></div>
          <div class="chat-input-container">
            <input type="text" class="chat-input" id="chat-input" placeholder="Ask about this title...">
            <button class="chat-send-button" id="chat-send">
              <span>↑</span>
            </button>
          </div>
          <button class="button button-outline" id="clear-chat">
            <span>🗑️ Clear Chat History for This Show</span>
          </button>
        </div>
      </div>
    `;
    
    // Add watchlist button events
    const addButton = this.detailContent.querySelector('.add-to-watchlist');
    if (addButton) {
      addButton.addEventListener('click', () => {
        Watchlist.addToWatchlist(movie.imdbID);
        this.renderDetailView(movie, true);
      });
    }
    
    const removeButton = this.detailContent.querySelector('.remove-from-watchlist');
    if (removeButton) {
      removeButton.addEventListener('click', () => {
        Watchlist.removeFromWatchlist(movie.imdbID);
        this.renderDetailView(movie, false);
      });
    }
  },
  
  /**
   * Load similar shows based on current movie
   * @param {Object} movie - Current movie/show
   */
  async loadSimilarShows(movie) {
    const similarShowsContainer = document.getElementById('similar-shows-container');
    if (!similarShowsContainer) return;
    
    try {
      // Check if we have cached similar shows
      let similarShows = Storage.getSimilarShows(movie.imdbID);
      
      if (similarShows.length === 0) {
        // Get similar shows based on genre and year
        similarShows = await this.getSimilarShows(movie);
        
        // Cache the results
        Storage.saveSimilarShows(movie.imdbID, similarShows);
      }
      
      // Clear container
      similarShowsContainer.innerHTML = '';
      
      if (similarShows.length === 0) {
        similarShowsContainer.innerHTML = `
          <div class="empty-state">
            <p>No similar shows found.</p>
          </div>
        `;
        return;
      }
      
      // Create horizontal scroll container
      const scrollContainer = document.createElement('div');
      scrollContainer.className = 'horizontal-scroll';
      
      // Add similar shows
      similarShows.forEach(show => {
        // Convert to format expected by UI.createMovieCard
        const movieData = {
          imdbID: show.imdbID,
          Title: show.Title,
          Year: show.Year,
          Poster: show.Poster !== 'N/A' ? show.Poster : 'assets/no-poster.png',
          Type: show.Type || 'movie',
          Plot: show.Plot || '',
          imdbRating: show.imdbRating
        };
        
        // Create movie card
        const card = UI.createMovieCard(movieData, false);
        scrollContainer.appendChild(card);
      });
      
      similarShowsContainer.appendChild(scrollContainer);
      
    } catch (error) {
      console.error('Similar shows error:', error);
      similarShowsContainer.innerHTML = `
        <div class="empty-state">
          <p>Failed to load similar shows.</p>
        </div>
      `;
    }
  },
  
  /**
   * Get similar shows based on current movie
   * @param {Object} movie - Current movie/show
   * @returns {Promise<Array>} Similar shows
   */
  async getSimilarShows(movie) {
    const similarShows = [];
    
    try {
      // Extract genres
      const genres = movie.Genre.split(', ');
      
      // Get primary genre
      const primaryGenre = genres[0];
      
      // Get Korean dramas by genre from predefined lists
      const kdramas = {
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
      };
      
      // Map standard genres to our K-drama genres
      const genreMapping = {
        'Romance': ['Fake Dating', 'Enemies to Lovers', 'Friends to Lovers', 'Love at First Sight', 'True Love'],
        'Drama': ['Toxic Love', 'Right Person Wrong Time', 'Age Gaps'],
        'Comedy': ['Fake Dating', 'Friends to Lovers', 'Love at First Sight'],
        'Action': ['Right Person Wrong Time'],
        'Thriller': ['Toxic Love', 'Right Person Wrong Time'],
        'Crime': ['Right Person Wrong Time'],
        'Fantasy': ['My Demon', 'Doom at Your Service', 'Extraordinary You']
      };
      
      // Find matching K-drama genres
      let matchingGenres = [];
      genres.forEach(genre => {
        if (genreMapping[genre]) {
          matchingGenres = [...matchingGenres, ...genreMapping[genre]];
        }
      });
      
      // Remove duplicates
      matchingGenres = [...new Set(matchingGenres)];
      
      // If no matching genres, use all genres
      if (matchingGenres.length === 0) {
        matchingGenres = Object.keys(kdramas);
      }
      
      // Get titles from matching genres
      const titles = [];
      matchingGenres.forEach(genre => {
        if (kdramas[genre]) {
          titles.push(...kdramas[genre]);
        }
      });
      
      // Remove duplicates and current movie
      const uniqueTitles = [...new Set(titles)].filter(title => 
        title.toLowerCase() !== movie.Title.toLowerCase()
      );
      
      // Limit to 10 titles
      const limitedTitles = uniqueTitles.slice(0, 10);
      
      // Get details for each title
      for (const title of limitedTitles) {
        try {
          const details = await API.getMovieDetailsByTitle(title);
          if (details && details.imdbID !== movie.imdbID) {
            similarShows.push(details);
          }
        } catch (error) {
          console.error(`Error fetching details for "${title}":`, error);
        }
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // If we still don't have enough shows, search by primary genre
      if (similarShows.length < 5 && primaryGenre) {
        try {
          const results = await API.searchOMDB(primaryGenre);
          
          // Filter out current movie and already added shows
          const filteredResults = results.filter(result => 
            result.imdbID !== movie.imdbID && 
            !similarShows.some(show => show.imdbID === result.imdbID)
          );
          
          // Add up to 5 more shows
          for (let i = 0; i < Math.min(5, filteredResults.length); i++) {
            const details = await API.getMovieDetails(filteredResults[i].imdbID);
            if (details) {
              similarShows.push(details);
            }
          }
        } catch (error) {
          console.error(`Error searching for "${primaryGenre}":`, error);
        }
      }
      
    } catch (error) {
      console.error('Error getting similar shows:', error);
    }
    
    return similarShows;
  },
  
  /**
   * Initialize plot explanation buttons
   */
  initPlotButtons() {
    const noSpoilersButton = document.getElementById('explain-no-spoilers');
    const withSpoilersButton = document.getElementById('explain-with-spoilers');
    const plotExplanation = document.getElementById('plot-explanation');
    
    if (noSpoilersButton && withSpoilersButton && plotExplanation) {
      noSpoilersButton.addEventListener('click', async () => {
        // Show loading state
        plotExplanation.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        
        try {
          // Use default API key if user hasn't set one
          const apiKey = Storage.getApiKey() || CONFIG.GEMINI_API.DEFAULT_KEY;
          if (!apiKey) {
            plotExplanation.textContent = 'Please add your Gemini API key in Settings to use this feature.';
            return;
          }
          
          const explanation = await API.getPlotExplanation(this.currentMovie, false);
          plotExplanation.textContent = explanation;
        } catch (error) {
          console.error('Plot explanation error:', error);
          plotExplanation.textContent = 'Failed to get plot explanation. Please try again.';
        }
      });
      
      withSpoilersButton.addEventListener('click', async () => {
        // Confirm spoilers
        UI.showConfirmation('This will reveal spoilers. Are you sure?', async () => {
          // Show loading state
          plotExplanation.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
          
          try {
            // Use default API key if user hasn't set one
            const apiKey = Storage.getApiKey() || CONFIG.GEMINI_API.DEFAULT_KEY;
            if (!apiKey) {
              plotExplanation.textContent = 'Please add your Gemini API key in Settings to use this feature.';
              return;
            }
            
            const explanation = await API.getPlotExplanation(this.currentMovie, true);
            plotExplanation.textContent = explanation;
          } catch (error) {
            console.error('Plot explanation error:', error);
            plotExplanation.textContent = 'Failed to get plot explanation. Please try again.';
          }
        });
      });
    }
  },
  
  /**
   * Initialize chat functionality
   */
  initChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');
    const clearChat = document.getElementById('clear-chat');
    
    if (!chatInput || !chatSend || !chatMessages || !clearChat) {
      return;
    }
    
    // Load chat history
    const history = Storage.getChatHistory(this.currentImdbID);
    this.renderChatHistory(history);
    
    // Send message on button click
    chatSend.addEventListener('click', () => {
      this.sendChatMessage();
    });
    
    // Send message on Enter key
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.sendChatMessage();
      }
    });
    
    // Clear chat history
    clearChat.addEventListener('click', () => {
      UI.showConfirmation('Clear chat history for this show?', () => {
        Storage.clearChatHistory(this.currentImdbID);
        chatMessages.innerHTML = '';
        Utils.showToast('Chat history cleared', 'success');
      });
    });
  },
  
  /**
   * Send chat message
   */
  async sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Clear input
    chatInput.value = '';
    
    // Check if API key is set (use default if not set by user)
    const apiKey = Storage.getApiKey() || CONFIG.GEMINI_API.DEFAULT_KEY;
    if (!apiKey) {
      Utils.showToast('Please add your Gemini API key in Settings', 'error');
      return;
    }
    
    // Add user message to UI
    const userMessageEl = document.createElement('div');
    userMessageEl.className = 'chat-message user';
    userMessageEl.textContent = message;
    chatMessages.appendChild(userMessageEl);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Create AI message placeholder
    const aiMessageEl = document.createElement('div');
    aiMessageEl.className = 'chat-message ai';
    aiMessageEl.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px;"></div>';
    chatMessages.appendChild(aiMessageEl);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
      // Get chat history
      const history = Storage.getChatHistory(this.currentImdbID);
      
      // Create context-aware first message instead of system prompt
      let chatHistory = [...history]; // Copy history to avoid modifying original
      
      // If history is empty, add a context message as the first user message
      if (chatHistory.length === 0) {
        const movieContext = `I'm asking about the movie/show: ${this.currentMovie.Title} (${this.currentMovie.Year}).
Genre: ${this.currentMovie.Genre}
Director: ${this.currentMovie.Director}
Actors: ${this.currentMovie.Actors}
Plot: ${this.currentMovie.Plot}

Please keep your answers focused on this specific title.`;
        
        // Add context as first user message
        chatHistory.push({
          role: 'user',
          content: movieContext
        });
        
        // Add a generic AI response to the context
        chatHistory.push({
          role: 'model',
          content: `I'll help you with information about ${this.currentMovie.Title}. What would you like to know?`
        });
      }
      
      // Add user message to history
      chatHistory.push({
        role: 'user',
        content: message
      });
      
      // Get AI response
      const response = await API.callGemini(message, chatHistory);
      
      // Update AI message
      aiMessageEl.textContent = response;
      
      // Add AI response to history
      chatHistory.push({
        role: 'model',
        content: response
      });
      
      // Save updated history
      Storage.saveChatHistory(this.currentImdbID, chatHistory);
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
    } catch (error) {
      console.error('Chat error:', error);
      aiMessageEl.textContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error.message && error.message.includes('API key')) {
        aiMessageEl.textContent = 'Please check your Gemini API key in Settings.';
      }
    }
  },
  
  /**
   * Render chat history
   * @param {Array} history - Chat history
   */
  renderChatHistory(history) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Clear messages
    chatMessages.innerHTML = '';
    
    // Filter out system messages
    const visibleHistory = history.filter(msg => msg.role !== 'system');
    
    // Add messages to UI
    visibleHistory.forEach(msg => {
      const messageEl = document.createElement('div');
      messageEl.className = `chat-message ${msg.role === 'user' ? 'user' : 'ai'}`;
      messageEl.textContent = msg.content;
      chatMessages.appendChild(messageEl);
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
};
