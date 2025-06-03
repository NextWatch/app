/**
 * API integration for NextWatch app
 * Handles external API calls to OMDB and Gemini
 */

const API = {
  /**
   * Search for movies/shows using OMDB API
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  searchOMDB: async function(query) {
    try {
      const response = await fetch(`${CONFIG.OMDB_API.BASE_URL}?apikey=${CONFIG.OMDB_API.API_KEY}&s=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.Response === 'True') {
        return data.Search;
      } else {
        console.error('OMDB search error:', data.Error);
        return [];
      }
    } catch (error) {
      console.error('OMDB API error:', error);
      return [];
    }
  },
  
  /**
   * Get detailed information for a movie/show by title
   * @param {string} title - Movie/show title
   * @param {string} year - Optional year to improve match accuracy
   * @returns {Promise<Object>} Movie/show details
   */
  getMovieDetailsByTitle: async function(title, year = '') {
    try {
      let url = `${CONFIG.OMDB_API.BASE_URL}?apikey=${CONFIG.OMDB_API.API_KEY}&t=${encodeURIComponent(title)}`;
      
      // Add year if provided for more accurate results
      if (year) {
        url += `&y=${year}`;
      }
      
      console.log(`Fetching OMDB details for title: "${title}"${year ? ` (${year})` : ''}`);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.Response === 'True') {
        return data;
      } else {
        console.error('OMDB title search error:', data.Error);
        return null;
      }
    } catch (error) {
      console.error('OMDB API error:', error);
      return null;
    }
  },
  
  /**
   * Get detailed information for a movie/show by IMDB ID
   * @param {string} imdbID - IMDB ID
   * @returns {Promise<Object>} Movie/show details
   */
  getMovieDetails: async function(imdbID) {
    try {
      const response = await fetch(`${CONFIG.OMDB_API.BASE_URL}?apikey=${CONFIG.OMDB_API.API_KEY}&i=${imdbID}&plot=full`);
      const data = await response.json();
      
      if (data.Response === 'True') {
        return data;
      } else {
        console.error('OMDB details error:', data.Error);
        return null;
      }
    } catch (error) {
      console.error('OMDB API error:', error);
      return null;
    }
  },
  
  /**
   * Call Gemini API
   * @param {string} prompt - Prompt text
   * @param {Array} history - Chat history
   * @returns {Promise<string>} AI response
   */
  callGemini: async function(prompt, history = []) {
    // Use the user's API key or fall back to the default key
    const apiKey = Storage.getApiKey() || CONFIG.GEMINI_API.DEFAULT_KEY;
    
    if (!apiKey) {
      throw new Error('No API key provided. Please add your Gemini API key in Settings.');
    }
    
    try {
      const contents = [];
      
      // Add history to contents, but filter out system messages
      // as Gemini API doesn't support system role
      history.forEach(msg => {
        if (msg.role !== 'system') {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      });
      
      // Add current prompt
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });
      
      console.log('Sending to Gemini API:', JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: CONFIG.GEMINI_API.MAX_TOKENS,
          temperature: 0.7
        }
      }));
      
      const response = await fetch(`${CONFIG.GEMINI_API.BASE_URL}${CONFIG.GEMINI_API.MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: CONFIG.GEMINI_API.MAX_TOKENS,
            temperature: 0.7
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Gemini API error:', data.error);
        throw new Error(data.error.message || 'Error calling Gemini API');
      }
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Unexpected Gemini API response format:', data);
        throw new Error('Unexpected response format from Gemini API');
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  },
  
  /**
   * Get plot explanation (with or without spoilers)
   * @param {Object} movie - Movie/show details
   * @param {boolean} spoilers - Whether to include spoilers
   * @returns {Promise<string>} Plot explanation
   */
  getPlotExplanation: async function(movie, spoilers = false) {
    const prompt = spoilers 
      ? `Provide a detailed explanation of the plot for "${movie.Title}" (${movie.Year}), including all major plot points, twists, and the ending. Include spoilers as this is a full plot explanation.`
      : `Provide a brief explanation of the premise for "${movie.Title}" (${movie.Year}) without revealing any major plot twists or the ending. This should be spoiler-free and just give a general idea of what the story is about.`;
    
    try {
      return await this.callGemini(prompt);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get recommendations based on watchlist
   * @returns {Promise<Array>} Recommendations
   */
  getRecommendations: async function() {
    const watchlist = Storage.getWatchlist();
    
    if (watchlist.length === 0) {
      return [];
    }
    
    // Filter to highly rated titles (4+ stars)
    const highlyRated = watchlist.filter(item => item.userRating && item.userRating >= 4);
    
    // If no highly rated titles, use all titles
    const titlesToUse = highlyRated.length > 0 ? highlyRated : watchlist;
    
    // Create prompt with titles and plots
    let prompt = 'Based on these movies and TV shows I enjoy:\n\n';
    
    titlesToUse.forEach((item, index) => {
      prompt += `${index + 1}. "${item.Title}" (${item.Year})`;
      if (item.userRating) {
        prompt += ` - My rating: ${item.userRating}/5`;
      }
      if (item.Plot) {
        prompt += `\nPlot: ${item.Plot}\n`;
      }
      prompt += '\n';
    });
    
    prompt += `\nPlease recommend 10 Korean drama TV series I might enjoy. Format your response as a simple numbered list with ONLY the title and year in parentheses, like this:
	1.	Crash Landing on You (2019)
	2.	Vincenzo (2021)

Do not include any additional information, descriptions, or explanations. Just provide a numbered list with the title and year for each recommendation.`;
    
    try {
      console.log('Sending recommendations prompt:', prompt);
      const response = await this.callGemini(prompt);
      console.log('Received recommendations response:', response);
      
      // Parse recommendations from response
      const recommendationTitles = this.extractRecommendationTitles(response);
      console.log('Extracted recommendation titles:', recommendationTitles);
      
      // Fetch details for each recommendation from OMDB
      const recommendationsWithDetails = await this.fetchRecommendationDetails(recommendationTitles);
      console.log('Recommendations with details:', recommendationsWithDetails);
      
      // Save recommendations to storage
      Storage.saveRecommendations(recommendationsWithDetails);
      
      return recommendationsWithDetails;
    } catch (error) {
      console.error('Recommendations error:', error);
      throw error;
    }
  },
  
  /**
   * Extract clean movie titles from Gemini response
   * @param {string} response - Gemini response text
   * @returns {Array} Array of {title, year} objects
   */
  extractRecommendationTitles: function(response) {
    const recommendations = [];
    
    // Split response by lines
    const lines = response.split('\n');
    
    // Regular expressions to match different title formats
    const patterns = [
      // Standard numbered format: "1. The Matrix (1999)"
      /^\d+\.?\s*(.+?)\s*\((\d{4})\)$/,
      
      // Format with quotes: '1. "The Matrix" (1999)'
      /^\d+\.?\s*["'](.+?)["']\s*\((\d{4})\)$/,
      
      // Bullet point format: "• The Matrix (1999)"
      /^[•*-]\s*(.+?)\s*\((\d{4})\)$/,
      
      // Format with quotes and bullet: '• "The Matrix" (1999)'
      /^[•*-]\s*["'](.+?)["']\s*\((\d{4})\)$/,
      
      // Title with dash and description: "The Matrix (1999) - A sci-fi..."
      /^(?:\d+\.?\s*)?(.+?)\s*\((\d{4})\)\s*-.*$/,
      
      // Just title and year: "The Matrix (1999)"
      /^(.+?)\s*\((\d{4})\)$/
    ];
    
    // Process each line
    lines.forEach(line => {
      // Skip empty lines
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Try each pattern until we find a match
      for (const pattern of patterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          recommendations.push({
            title: match[1].trim(),
            year: match[2]
          });
          break;
        }
      }
    });
    
    // If we couldn't extract any recommendations, try a more aggressive approach
    if (recommendations.length === 0) {
      console.log("No recommendations found with standard parsing, trying fallback method");
      
      // Look for any movie title pattern: Something (YEAR)
      const titleYearPattern = /([^(]+)\((\d{4})\)/g;
      let match;
      
      while ((match = titleYearPattern.exec(response)) !== null) {
        recommendations.push({
          title: match[1].trim(),
          year: match[2]
        });
      }
    }
    
    return recommendations;
  },
  
  /**
   * Fetch details for each recommendation from OMDB
   * @param {Array} recommendationTitles - Array of {title, year} objects
   * @returns {Promise<Array>} Array of recommendation objects with OMDB details
   */
  fetchRecommendationDetails: async function(recommendationTitles) {
    const recommendationsWithDetails = [];
    
    // Process each recommendation sequentially to avoid rate limiting
    for (const rec of recommendationTitles) {
      try {
        // Get details from OMDB
        const details = await this.getMovieDetailsByTitle(rec.title, rec.year);
        
        if (details) {
          // Add to recommendations with OMDB details
          recommendationsWithDetails.push({
            title: details.Title,
            year: details.Year,
            imdbID: details.imdbID,
            poster: details.Poster,
            plot: details.Plot,
            genre: details.Genre,
            director: details.Director,
            actors: details.Actors,
            imdbRating: details.imdbRating,
            runtime: details.Runtime,
            type: details.Type
          });
        } else {
          // If OMDB lookup fails, add with original info
          recommendationsWithDetails.push({
            title: rec.title,
            year: rec.year,
            poster: 'N/A',
            plot: 'No details available',
            imdbID: null
          });
        }
      } catch (error) {
        console.error(`Error fetching details for "${rec.title}":`, error);
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return recommendationsWithDetails;
  }
};
