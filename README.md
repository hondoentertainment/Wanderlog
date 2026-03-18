# PRD: Wanderlog - Autonomous Travel & Spatial Platform (v2.0)

**Version:** 2.0  
**Status:** Production Ready with Autonomous AI & P2P Mesh Mode
**Author:** Senior Product Engineer  
**Live URL:** https://wanderlog-travel-tracker.vercel.app

## 1. Executive Summary
Wanderlog v2.0 is a deep tech evolution, expanding from a high-end personal travel tracker into an **autonomous travel companion, enterprise B2B hub, and spatial platform**. It features squad collaboration, creator monetization via paywalled itineraries, a B2B travel agency CRM overlay, Augmented Reality (AR) spatial discovery viewing, autonomous flight-rebooking execution (Auto-Exec), and zero-latency P2P mesh syncing for off-grid collaborative traversal.

## 2. Product Objectives
*   **Memory Preservation:** Provide a high-fidelity interface for logging travel experiences including ratings, pros, and cons.
*   **Progress Analytics:** Quantify travel history with a real-time dashboard showing progress against global benchmarks (US States, World Countries).
*   **Intelligent Discovery:** Leverage Google Maps and Search grounding via Gemini to suggest new locations based on deep profile context and historical sentiment.
*   **Automated Planning:** Convert bucket-list dreams into actionable 3-day itineraries with the click of a button.
*   **Self-Discovery:** Visualize travel "DNA" using a radar chart derived from AI analysis of user logs.
*   **Visual Exploration:** Experience trip history through density-based heatmapping.
*   **Cross-Device Sync (New v1.5):** Seamlessly access travel data across all devices via Firebase Cloud Firestore.
*   **Collaborative Squads (v2.0):** Multi-player trip planning, bill splitting (Ledger), and shared activities.
*   **Spatial Computing (v2.0):** AR Viewfinder for real-world POI overlay and simulated physical spatial drops.
*   **Agentic Execution (v2.0):** Jules autonomously books flights, translates calls, and provides dynamic Apple Watch haptic meshes.

## 3. Functional Requirements

### 3.1. Authentication (New v1.5)
*   **Google Sign-In:** One-click authentication via Firebase Authentication with Google provider.
*   **Session Persistence:** Automatic session restoration on return visits.
*   **Profile Integration:** Display user's Google profile photo and name in header.

### 3.2. Cloud Sync (New v1.5)
*   **Real-Time Sync:** Automatic debounced sync to Firestore on data changes (2-second debounce).
*   **Offline Support:** Local storage fallback when cloud is unavailable.
*   **Data Migration:** Automatic upload of local data to cloud on first login.
*   **Conflict Resolution:** Cloud-first strategy with local fallback on errors.

### 3.3. Analytics Dashboard
*   **State Tracking:** Visual progress bar and counter for the 50 US States.
*   **Country Tracking:** Counter for unique countries visited against a global baseline.
*   **Travel DNA:** A 6-axis radar chart visualizing Nature, Culture, Adventure, Relaxation, Food, and Urban scores. AI-analyzed from history and sentiment.

### 3.4. Travel Journaling (Core)
*   **Log Entry:** Location Name (with typeahead suggestions), Type (State/Country), Star Rating (0-5), Pros (Highs), Cons (Lows), and Visit Date.
*   **Sharing:** Integrated Web Share API support to export formatted summaries of travel logs.

### 3.5. Profile & Interest Engine
*   **Expanded Styles:** Selection from 50+ predefined travel styles.
*   **Custom Styles:** Ability to add user-defined travel styles.

### 3.6. AI Recommendations (Grounded)
*   **Grounded Context:** Uses `googleMaps` and `googleSearch` tools to provide real-world verified suggestions.

### 3.7. Automated Planning
*   **Itinerary Generator:** Uses Gemini AI to generate a structured 3-day itinerary for wishlist destinations.

### 3.8. Interactive Cartography (Enhanced)
*   **Heatmapping:** Toggleable density heatmap overlay using visited locations and their ratings.
*   **Controls:** Manual zoom, destination recentering, and live coordinate display.

## 4. Technical Specifications
*   **Frontend:** React 19 with TypeScript, Vite build system
*   **AI SDK:** `@google/genai` (Gemini 3 Flash)
*   **Authentication:** Firebase Authentication (Google provider)
*   **Database:** Firebase Cloud Firestore
*   **Mapping:** Leaflet.js with CartoDB Dark Matter tiles and Leaflet.heat plugin
*   **Charts:** Custom SVG implementation for radar chart visualization
*   **Styling:** Tailwind CSS via CDN
*   **Hosting:** Vercel (Production)

## 5. UI/UX Design Standards
*   **Aesthetics:** High-contrast dark mode inspired by premium creative tools.
*   **Progressive Revelation:** Complex AI data (like DNA and itineraries) is revealed through smooth "Magic" interactions.
*   **Loading States:** Branded loading screens with animated icons during data sync.

## 6. Security & Permissions
*   **Authentication:** Secure Google OAuth 2.0 via Firebase.
*   **Firestore Rules:** User data isolated by UID (users/{userId}).
*   **Geolocation:** Opt-in permission for localized travel tips.
*   **Data Privacy:** User data stored securely in Firebase, accessible only to authenticated user.

---

## 7. Recommended Next Steps

### High Priority
1. **Firestore Security Rules** - Configure proper read/write rules in Firebase Console:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

2. **Environment Variables** - Move Firebase config to environment variables for security:
   - Create `.env` file with `VITE_FIREBASE_API_KEY`, etc.
   - Update `firebaseConfig.ts` to use `import.meta.env`

3. **Error Boundary** - Add React Error Boundary component to catch and display errors gracefully.

### Medium Priority
4. **Logout Functionality** - Add visible logout button in profile/header area.

5. **Delete Account** - Allow users to delete their cloud data and account.

6. **Photo Uploads** - Allow users to attach photos to travel logs (Firebase Storage).

7. **Trip Companions Manager** - Enhanced UI for managing travel companions.

### Future Enhancements
8. **Social Features** - Share trips publicly, follow other travelers.

9. **Travel Statistics Export** - Export travel stats as PDF or shareable image.

10. **PWA Support** - Enable offline-first experience with service worker.

11. **Push Notifications** - Remind users to log recent trips.

12. **Multi-Provider Auth** - Add Apple Sign-In, email/password options.
