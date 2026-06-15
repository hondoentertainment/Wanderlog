export const config = {
  runtime: 'edge',
};

import { clientRateLimitKey } from './lib/rateLimit';
import { checkRateLimitAsync } from './lib/rateLimitDistributed';

interface GeminiRequestBody {
  message?: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: object;
  temperature?: number;
  maxOutputTokens?: number;
  imageBase64?: string;
  imageMimeType?: string;
  tools?: unknown[];
  toolConfig?: unknown;
}

async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!res.ok) return null;
  const data = (await res.json()) as { users?: { localId?: string }[] };
  return data.users?.[0]?.localId ?? null;
}

function rateLimitKey(request: Request, uid: string | null): string {
  if (uid) return `uid:${uid}`;
  return clientRateLimitKey(request);
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const uid = idToken ? await verifyFirebaseIdToken(idToken) : null;

  const requireAuth = process.env.GEMINI_REQUIRE_AUTH === 'true';
  if (requireAuth && !uid) {
    return new Response(JSON.stringify({ error: 'Sign in required for AI requests.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const maxRequests = uid ? 40 : 12;
  const rate = await checkRateLimitAsync(rateLimitKey(request, uid), maxRequests, 60_000);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: `Rate limit exceeded. Retry in ${rate.retryAfterSec}s.` }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = (await request.json()) as GeminiRequestBody;
    const {
      message = '',
      systemInstruction,
      responseMimeType,
      responseSchema,
      temperature,
      maxOutputTokens,
      imageBase64,
      imageMimeType = 'image/jpeg',
      tools,
      toolConfig,
    } = body;

    if (!message.trim() && !imageBase64) {
      return new Response(JSON.stringify({ error: 'message or imageBase64 required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('Missing GEMINI_API_KEY in server environment.');
    }

    const generationConfig: Record<string, unknown> = {
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxOutputTokens ?? 2048,
    };
    if (responseMimeType) generationConfig.responseMimeType = responseMimeType;
    if (responseSchema) generationConfig.responseSchema = responseSchema;

    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
    }
    if (message.trim()) {
      parts.push({ text: message });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          generationConfig,
          ...(tools?.length ? { tools, toolConfig } : {}),
        }),
      },
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data = await geminiRes.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ response: replyText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
