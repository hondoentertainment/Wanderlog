# PRD: Wanderlog - Autonomous Travel & Spatial Platform (v2.0)

**Version:** 2.0  
**Status:** Production Ready with Autonomous AI & P2P Mesh Mode
**Author:** Senior Product Engineer  
**Live URL:** https://wanderlog-travel-tracker.vercel.app

**Canonical app:** The production Vite app lives at the **repository root** (`npm run dev`). The nested `Wanderlog/` folder is legacy — see `Wanderlog/LEGACY.md`.

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
*   **AI SDK:** `@google/genai` (Gemini) via `/api/gemini` in production
*   **Authentication:** Firebase Authentication (Google + email)
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
*   **Firestore Rules:** User data isolated by UID; squads use `ownerId` + `memberIds`.
*   **Geolocation:** Opt-in permission for localized travel tips.
*   **Data Privacy:** User data stored securely in Firebase, accessible only to authenticated user.

---

## 7. Recommended Next Steps

### Operational (you run locally)
See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full checklist.

1. **Verify** — `npm run verify` (unit + build + E2E)
2. **Deploy Firebase** — copy `.firebaserc.example` → `.firebaserc`, then `npm run firebase:deploy:rules`
3. **Vercel env** — `GEMINI_API_KEY` (server), `VITE_FIREBASE_*`, optional `GEMINI_REQUIRE_AUTH`, `VITE_POSTHOG_KEY`, `VITE_FIREBASE_VAPID_KEY`
4. **GitHub** — push to `main`; optional manual Firebase deploy via Actions (`firebase-deploy.yml` + `FIREBASE_TOKEN` secret)

### Production-grade (implemented in code)
- `vercel.json` — SPA rewrites (`/shared/:tripId`) + security headers
- Firestore rules — squad self-join, social activity feed, discovery unpublish
- Storage rules — authenticated photo reads
- Account deletion — full cloud purge (squads, join codes, discovery)
- Gemini proxy — optional auth, Upstash distributed rate limits, dev parity
- FCM server delivery — `/api/push/notify` + client wiring for friend requests
- Social activity feed — Friends hub shows friend trip logs and connections
- Friend search — Firestore keyword index + optional Algolia
- Tailwind bundled via Vite (no runtime CDN)
- FCM service worker — build-time Firebase config injection

### Future enhancements
- Algolia sync automation (index ETL / Firebase Extension)
- Richer social feed (comments, reactions)
