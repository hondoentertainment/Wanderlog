#!/usr/bin/env node
/**
 * Pre-deploy sanity check — validates required env var names are documented.
 * Does not require secrets to be set locally (CI uses placeholders).
 */
const requiredForProd = [
  'GEMINI_API_KEY',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
];

const optional = [
  'FIREBASE_SERVICE_ACCOUNT',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'GEMINI_REQUIRE_AUTH',
  'VITE_ALGOLIA_APP_ID',
  'VITE_ALGOLIA_SEARCH_KEY',
  'VITE_FIREBASE_VAPID_KEY',
];

const missing = requiredForProd.filter((key) => !process.env[key]?.trim());

if (process.env.CI === 'true' || process.env.VITE_CI_USE_FIREBASE_PLACEHOLDER === 'true') {
  console.log('Deploy env check: CI placeholder mode — skipping production secret validation.');
  process.exit(0);
}

if (missing.length > 0) {
  console.warn('Deploy env check: missing recommended production variables:');
  missing.forEach((k) => console.warn(`  - ${k}`));
  console.warn('Copy .env.example → .env.local or set these in Vercel before production deploy.');
  process.exit(1);
}

console.log('Deploy env check: required production variables present.');
optional.forEach((k) => {
  if (process.env[k]?.trim()) console.log(`  optional ${k}: set`);
});
