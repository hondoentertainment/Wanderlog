import type { VercelRequest, VercelResponse } from '@vercel/node';

function isAllowedOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.endsWith('.vercel.app')) return true;
    const allowed = process.env.ALLOWED_ORIGIN;
    if (allowed) {
      const list = allowed.split(',').map((s) => s.trim()).filter(Boolean);
      if (list.includes(origin)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function applyCors(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
