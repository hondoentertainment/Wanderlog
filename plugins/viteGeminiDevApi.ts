import type { Plugin } from 'vite';
import type { IncomingMessage } from 'node:http';
import { loadEnv } from 'vite';
import { checkRateLimit } from '../api/lib/rateLimit';

function devRateLimitKey(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : req.socket.remoteAddress;
  return ip || 'dev-local';
}

/** Dev-only middleware so `/api/gemini` works with `npm run dev` (mirrors api/gemini.ts). */
export function viteGeminiDevApi(): Plugin {
  return {
    name: 'vite-gemini-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const rate = checkRateLimit(devRateLimitKey(req), 40, 60_000);
        if (!rate.allowed) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Rate limit exceeded. Retry in ${rate.retryAfterSec}s.` }));
          return;
        }

        const env = loadEnv(server.config.mode, server.config.root, '');        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY missing in .env.local' }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString()) as {
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
          };

          const generationConfig: Record<string, unknown> = {
            temperature: body.temperature ?? 0.7,
            maxOutputTokens: body.maxOutputTokens ?? 2048,
          };
          if (body.responseMimeType) generationConfig.responseMimeType = body.responseMimeType;
          if (body.responseSchema) generationConfig.responseSchema = body.responseSchema;

          const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
          if (body.imageBase64) {
            parts.push({
              inlineData: { mimeType: body.imageMimeType || 'image/jpeg', data: body.imageBase64 },
            });
          }
          if (body.message?.trim()) parts.push({ text: body.message });

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                systemInstruction: body.systemInstruction
                  ? { parts: [{ text: body.systemInstruction }] }
                  : undefined,
                generationConfig,
                ...(body.tools?.length ? { tools: body.tools, toolConfig: body.toolConfig } : {}),
              }),
            },
          );

          if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: errText }));
            return;
          }

          const data = await geminiRes.json();
          const replyText =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I'm sorry, I couldn't generate a response.";

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ response: replyText }));
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unknown error';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}
