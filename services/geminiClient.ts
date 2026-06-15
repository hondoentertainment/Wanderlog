import { auth } from './firebaseConfig';

export interface GeminiProxyRequest {
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

export interface GeminiProxyResponse {
  response?: string;
  error?: string;
}

const useProxy =
  import.meta.env.PROD || import.meta.env.VITE_USE_GEMINI_PROXY === 'true';

export function shouldUseGeminiProxy(): boolean {
  return useProxy;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function callGeminiProxy(payload: GeminiProxyRequest): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as GeminiProxyResponse;
  if (!res.ok) {
    throw new Error(data.error || `Gemini proxy failed (${res.status})`);
  }
  return data.response ?? '';
}
