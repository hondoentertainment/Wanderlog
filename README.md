# PRD: WanderLog - Grounded AI Travel Journal (v1.1)

**Version:** 1.1  
**Status:** Implementation Complete / Maps Grounding Active  
**Author:** Senior Product Engineer  

## 1. Executive Summary
WanderLog is an AI-powered travel journaling platform that bridges the gap between memory and discovery. By combining user-provided sentiment (likes/dislikes) with real-world geographic data via **Google Maps Grounding**, the app provides actionable, verified recommendations. Users don't just get a name; they get a direct path to their next destination.

## 2. Updated Product Objectives
*   **Geographic Verification:** Ensure all AI recommendations correspond to real-world entities with verified Google Maps links.
*   **Contextual Discovery:** Use the user's current physical location (via Geolocation API) to ground recommendations in nearby relevance when appropriate.
*   **Verified Sources:** Provide "Proof of Recommendation" through grounding chunks that include map URIs and search-sourced snippets.

## 3. Functional Requirements

### 3.1. Travel Journaling (Core)
*   **Log Entry:** Location Name, Type (State/Country), Rating (0-10), Date, and tag-based Likes/Dislikes.
*   **Aggregation:** Automatic counters for unique countries and states visited.

### 3.2. Maps & Search Grounding
*   **Verified Recommendations:** The AI utilizes the `googleMaps` and `googleSearch` tools to validate suggested destinations.
*   **Grounding Links:** Each recommendation card displays "View on Maps" or "Source" links extracted from the model's metadata.
*   **Geolocation Integration:** The app requests browser `geolocation` permissions to pass the user's current coordinates to the Gemini model for localized context.

### 3.3. AI Recommendation Logic
*   **Model:** Transitioned to `gemini-2.5-flash-lite-latest` to support specialized grounding tools.
*   **Parsing Strategy:** Replaced strict JSON schemas with semi-structured text parsing to maintain compatibility with the Google Maps tool.
*   **Scoring:** Every recommendation includes a "Match Score" based on the alignment between history/profile and the suggested location.
*   **Enrichment:** Upon saving a recommendation to the wishlist, the app triggers a background task using `gemini-3-flash-preview` to fetch detailed descriptions and key attractions.

### 3.4. Wishlist & Profile
*   **Persistent Grounding:** Saved recommendations retain their original map and source links in the Wishlist view.
*   **Progressive Enrichment:** The Wishlist view displays enriched details (descriptions, attractions) as they are retrieved.
*   **Interest Context:** Profile "Bucket Lists" and "Travel Styles" are injected as high-priority constraints for the AI.

## 4. Technical Specifications
*   **AI SDK:** `@google/genai` (utilizing `tools: [{googleMaps: {}}, {googleSearch: {}}]`).
*   **Grounding Metadata:** Processing of `groundingMetadata.groundingChunks` to extract `maps.uri` and `web.uri`.
*   **Browser APIs:** 
    *   `navigator.geolocation`: Used to provide `latLng` context to the model.
    *   `localStorage`: Persistent state for history, profile, and saved recommendations.
*   **Frontend Stack:** React 19, Tailwind CSS, Font Awesome 6.

## 5. UI/UX Design Standards
*   **Grounded Visuals:** Grounded recommendations are distinguished by a map-marker icon.
*   **Actionable Links:** Small, pill-style link buttons on cards provide one-click access to Google Maps.
*   **Progressive Loading:** "Enriching details..." animations show the user that the AI is working to gather more info for their wishlist items.
*   **Dynamic States:** 
    *   "AI Ready to Recommend" empty state.
    *   Loading state with spinner and reassuring copy while the model queries live map data.

## 6. Security & Permissions
*   **Geolocation:** User must explicitly grant permission; app provides graceful fallback to "General" (Global) recommendations if denied.
*   **API Privacy:** API interactions are handled via environment variables with no user-exposed key management.

## 7. Future Roadmap
*   **Visual Analysis:** Allowing users to upload photos of places they liked to improve the "Style" matching.
*   **Route Planning:** Using Maps grounding to suggest a 3-day itinerary for recommended locations.
*   **Social Export:** Generating a "Shareable Map" of visited locations and wishlist items.