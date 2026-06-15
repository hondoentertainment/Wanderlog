# Deploy & operational actions

Run these from the **repository root** after copying `.env.example` → `.env.local` (or Vercel env vars).

## 1. Verify locally (CI parity)

```bash
npm run verify
```

Runs unit tests, production build, and Playwright E2E.

Optional pre-deploy env check (requires real secrets locally):

```bash
npm run check:deploy-env
```

## 2. Firebase rules & indexes

1. Copy `.firebaserc.example` → `.firebaserc` and set your Firebase project id.
2. `firebase login` (once per machine).
3. Deploy:

```bash
npm run firebase:deploy:rules
```

Deploys `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

**Important:** Squad join, friend activity feed, and account deletion rely on the latest rules and indexes.

## 3. Vercel production

| Variable | Where |
|----------|--------|
| `GEMINI_API_KEY` | Server only |
| `VITE_FIREBASE_*` | Client build + server token verification |
| `FIREBASE_SERVICE_ACCOUNT` | Server JSON for `/api/push/notify` FCM delivery |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional distributed Gemini rate limits |
| `GEMINI_REQUIRE_AUTH` | Optional — block anonymous `/api/gemini` |
| `VITE_ALGOLIA_*` | Optional — Algolia user search (else Firestore keywords) |
| `VITE_POSTHOG_KEY` | Optional analytics |
| `VITE_FIREBASE_VAPID_KEY` | Optional web push |
| `VITE_ENABLE_APPLE_SIGNIN` | Apple Sign-In toggle |

`vercel.json` configures SPA rewrites and security headers. Tailwind is bundled at build time (no CDN).

```bash
npx vercel deploy --prod --yes
```

## 4. GitHub CI / CD

- **CI** — push to `main` / `master` runs `.github/workflows/ci.yml` (build + tests).
- **Production deploy** — `.github/workflows/deploy-vercel.yml` runs verify then deploys when secrets are set:
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- **Firebase rules** — manual workflow `.github/workflows/firebase-deploy.yml` with `FIREBASE_TOKEN` + `FIREBASE_PROJECT_ID`.

## 5. Post-deploy checks

- Sign in with Google on production URL.
- Friends → search → send request (server FCM if `FIREBASE_SERVICE_ACCOUNT` set).
- Friends → activity feed shows friend trip logs / connections.
- Squad → create trip → copy join code → join from second account.
- Profile → Privacy → enable push (requires VAPID key + HTTPS).
- Open a `/shared/:tripId` link directly (should load SPA, not 404).

## 6. Optional Algolia user index

When using Algolia, create index `userDirectory` with searchable attributes `displayName`, `searchName`. Sync records from Firestore `userDirectory` via your preferred ETL or Firebase Extension. Client search uses `VITE_ALGOLIA_SEARCH_KEY` (search-only).
