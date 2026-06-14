import { GoogleGenAI, Type } from '@google/genai';
import { callGeminiProxy, shouldUseGeminiProxy } from './geminiClient';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiInstance;
}

export type GeminiGenerateConfig = {
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: object;
  tools?: unknown[];
  toolConfig?: unknown;
  temperature?: number;
  maxOutputTokens?: number;
};

function stripMarkdownJson(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

/**
 * Unified Gemini entry: uses /api/gemini in production (or when VITE_USE_GEMINI_PROXY=true).
 * Grounding tools are forwarded to /api/gemini when using the proxy.
 */
export async function geminiGenerate(
  prompt: string,
  config: GeminiGenerateConfig = {},
  model = 'gemini-2.0-flash',
): Promise<string> {
  const useProxy = shouldUseGeminiProxy() || !API_KEY;

  if (useProxy) {
    const text = await callGeminiProxy({
      message: prompt,
      systemInstruction: config.systemInstruction,
      responseMimeType: config.responseMimeType,
      responseSchema: config.responseSchema,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      tools: config.tools,
      toolConfig: config.toolConfig,
    });
    return stripMarkdownJson(text);
  }

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: config.systemInstruction,
      responseMimeType: config.responseMimeType,
      responseSchema: config.responseSchema,
      tools: config.tools,
      toolConfig: config.toolConfig,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
    },
  });

  return response.text || '';
}

export async function geminiGenerateJson<T>(
  prompt: string,
  schema: object,
  config: Omit<GeminiGenerateConfig, 'responseMimeType' | 'responseSchema'> = {},
): Promise<T> {
  const text = await geminiGenerate(prompt, {
    ...config,
    responseMimeType: 'application/json',
    responseSchema: schema,
  });
  return JSON.parse(text || '{}') as T;
}

/** Vision + JSON via server proxy (no client API key in prod). */
export async function geminiGenerateJsonWithImage<T>(
  prompt: string,
  imageBase64: string,
  schema: object,
  imageMimeType = 'image/jpeg',
): Promise<T> {
  const useProxy = shouldUseGeminiProxy() || !API_KEY;

  if (useProxy) {
    const text = await callGeminiProxy({
      message: prompt,
      imageBase64,
      imageMimeType,
      responseMimeType: 'application/json',
      responseSchema: schema,
    });
    return JSON.parse(stripMarkdownJson(text) || '{}') as T;
  }

  const response = await getAI().models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
      { text: prompt },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });
  return JSON.parse(response.text || '{}') as T;
}

export { Type };
