import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './lib/cors';
import { verifyIdToken } from './lib/firebaseAdmin';
import { checkGeminiRateLimit } from './lib/rateLimit';
import { type GeminiAction, runGeminiAction } from './lib/geminiServer';

export const config = {
  maxDuration: 60,
};

const VALID_ACTIONS = new Set<GeminiAction>([
  'getAIRecommendations',
  'getSquadActivitySuggestions',
  'getTravelMuseInsights',
  'analyzeLogImage',
  'performSemanticSearch',
  'generateTravelDNA',
  'getLocationDetails',
  'generateItinerary',
  'geocodeLocation',
]);

function getBearerToken(req: VercelRequest): string | null {
  const h = req.headers.authorization;
  if (!h || typeof h !== 'string') return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header', code: 'UNAUTHENTICATED' });
  }

  let uid: string;
  try {
    uid = await verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHENTICATED' });
  }

  if (!(await checkGeminiRateLimit(uid))) {
    return res.status(429).json({ error: 'Too many AI requests. Try again in a minute.', code: 'RATE_LIMITED' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const action = body?.action as string | undefined;
  if (!action || !VALID_ACTIONS.has(action as GeminiAction)) {
    return res.status(400).json({ error: 'Missing or invalid action', code: 'BAD_REQUEST' });
  }

  try {
    const result = await runGeminiAction(action as GeminiAction, body.payload);
    return res.status(200).json({ result });
  } catch (err) {
    console.error('[api/gemini]', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message, code: 'GEMINI_ERROR' });
  }
}
