
# PRD: WanderLog - Personal Travel Tracker (v1.4)

**Version:** 1.4  
**Status:** Feature Complete / Enhanced AI Utilities  
**Author:** Senior Product Engineer  

## 1. Executive Summary
WanderLog is a high-end, AI-powered travel journaling platform designed for modern explorers. It provides a sleek, dark-mode interface to document memories, track global progress through a dedicated analytics dashboard, and discover new destinations through grounded AI recommendations and personalized planning tools.

## 2. Product Objectives
*   **Memory Preservation:** Provide a high-fidelity interface for logging travel experiences including ratings, pros, and cons.
*   **Progress Analytics:** Quantify travel history with a real-time dashboard showing progress against global benchmarks (US States, World Countries).
*   **Intelligent Discovery:** Leverage Google Maps and Search grounding via Gemini to suggest new locations based on deep profile context and historical sentiment.
*   **Automated Planning:** Convert bucket-list dreams into actionable 3-day itineraries with the click of a button.
*   **Self-Discovery (New):** Visualize travel "DNA" using a radar chart derived from AI analysis of user logs.
*   **Visual Exploration (New):** Experience trip history through density-based heatmapping.

## 3. Functional Requirements

### 3.1. Analytics Dashboard
*   **State Tracking:** Visual progress bar and counter for the 50 US States.
*   **Country Tracking:** Counter for unique countries visited against a global baseline.
*   **Travel DNA (New):** A 6-axis radar chart visualizing Nature, Culture, Adventure, Relaxation, Food, and Urban scores. AI-analyzed from history and sentiment.

### 3.2. Travel Journaling (Core)
*   **Log Entry:** Location Name (with typeahead suggestions), Type (State/Country), Star Rating (0-5), Pros (Highs), Cons (Lows), and Visit Date.
*   **Sharing:** Integrated Web Share API support to export formatted summaries of travel logs.

### 3.3. Profile & Interest Engine
*   **Expanded Styles:** Selection from 50+ predefined travel styles.
*   **Custom Styles:** Ability to add user-defined travel styles.

### 3.4. AI Recommendations (Grounded)
*   **Grounded Context:** Uses `googleMaps` and `googleSearch` tools to provide real-world verified suggestions.

### 3.5. Automated Planning
*   **Itinerary Generator:** Uses Gemini AI to generate a structured 3-day itinerary for wishlist destinations.

### 3.6. Interactive Cartography (Enhanced)
*   **Heatmapping (New):** Toggleable density heatmap overlay using visited locations and their ratings.
*   **Controls:** Manual zoom, destination recentering, and live coordinate display.

## 4. Technical Specifications
*   **AI SDK:** `@google/genai` (Gemini 3 Flash).
*   **Mapping:** Leaflet.js with CartoDB Dark Matter tiles and Leaflet.heat plugin.
*   **Charts:** Custom SVG implementation for radar chart visualization.

## 5. UI/UX Design Standards
*   **Aesthetics:** High-contrast dark mode inspired by premium creative tools.
*   **Progressive Revelation:** Complex AI data (like DNA and itineraries) is revealed through smooth "Magic" interactions.

## 6. Security & Permissions
*   **Geolocation:** Opt-in permission for localized travel tips.
*   **Data Sovereignty:** All journal data remains on the user's local device.
