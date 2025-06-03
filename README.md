Build a fully responsive, offline-capable web app called **NextWatch** using only HTML, CSS, and JavaScript (no backend, no frameworks). The design must **closely follow Apple’s Human Interface Guidelines (HIG)** and feel like a native iOS 17+ app, suitable for Safari on iPhone and iPad.

---
🎯 PURPOSE:
NextWatch is a personal TV/movie tracker app with an IMDb-style interface but focused on **AI-enhanced experience**. Users can search for shows, view rich details, get spoiler-free and spoiler-filled plot explanations, ask in-context questions, and receive smart recommendations. All data is stored locally using `localStorage`, and Gemini API (via user key) handles all AI features.

---

🎨 DESIGN REQUIREMENTS:
- Follow Apple’s Human Interface Guidelines (HIG)
- Use **SF Pro / San Francisco** font or fallback to system UI fonts
- Minimalist flat UI with soft rounded corners and natural spring-based animations
- Buttons and controls must resemble native iOS components (e.g., segmented controls, bottom tab bar, clear inputs)
- No ripples or heavy shadows (unlike Material Design)
- Light mode default, optional Dark Mode toggle in Settings
- Blur modals, glassy surfaces, and native iOS-style feedback

---

📲 APP STRUCTURE: (Bottom Tab Navigation)

### 1. 🏠 Home (Search)
- iOS-style search bar with clear button
- Shows matching results in elegant rounded cards:
  - Poster, title, year, genre, rating, short cast
  - [➕ Add to Watchlist] button
- Empty State message:  
  “No results found. Please try a different title.”

---

### 2. 🎬 Detail View
- Appears as modal or fullscreen page
- Includes:
  - Large poster image
  - Title, genre, year, rating
  - [📖 Explain Plot – No Spoilers]
  - [💥 Explain Plot – With Spoilers]
- Under plot section: “Ask Anything” chat box
  - iMessage-style Gemini chat with persistent history
  - Only shows chat for the currently selected movie
  - Add [🗑️ Clear Chat History for This Show]

---

### 3. ⭐ Watchlist
- User’s saved shows displayed in card layout grouped by year
- Each card shows:
  - Poster, title, genre, user rating (editable stars)
  - Edit [✏️] and Delete [🗑️] buttons
- Filter section (segmented control style):
  - All | ★4+ | Unrated | Recently Added

---

### 4. 🤖 Recommendations
- Shows suggested by Gemini based on:
  - ✅ User’s highly rated titles (★4 or above)
  - ✅ Inferred story themes and tropes (e.g., “cold CEO x poor girl”, “contract marriage”, “revenge drama”)
  - ✅ Character dynamics (e.g., shy heroine, childhood crush, strong female lead)
  - ✅ Emotional tone/vibe (e.g., healing, heart-fluttering, dark thriller)

- Gemini prompt should analyze both ratings and plot dynamics of the user’s watchlist to return relevant recommendations.

- Display suggested titles in horizontally scrollable iOS-style cards:
  - Poster, title, short 1-line summary, [➕ Add to Watchlist] button



---

### 5. ⚙️ Settings
- Gemini API key input (stored in localStorage)
- Dark Mode toggle (iOS segmented switch)
- Reset/clear options with confirmation alerts:
  - [Clear Watchlist]
  - [Reset Chat History]
  - [Clear All Data]
- “About” section with short app description

---

🔧 TECHNICAL REQUIREMENTS:
- No backend, no database, no frameworks
- Use `localStorage` for data persistence
- All Gemini API calls must happen via user-provided key
- Use model: `gemini-1.5-flash-latest`
- Must be fully deployable to GitHub Pages
- Code must be modular and production-ready (HTML, CSS, JS)

---

📛 APP NAME: `NextWatch`  
📌 TAGLINE: “Watch smarter. Track better.”  
🎨 STYLE BASE: iOS 17+ Human Interface Guidelines  
🔑 AI Model: Gemini 1.5 Flash (key entered by user)

---

---

💡 BONUS UX (Optional):
- Use glassy modal effects (backdrop blur) like iOS  
- Animate tab transitions and modal openings with spring-based easing  
- Add iOS-safe-area padding for iPhones with gesture navigation  
- Use Material-safe `aria-labels` and accessibility tags

---

✅ Please generate a complete HTML, CSS, and JavaScript implementation of this UI — modular, clean, iOS-native styled, fully deployable via GitHub Pages with no external server required.

