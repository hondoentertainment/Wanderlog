/** Stable Firestore doc id for a squad join code (avoids invalid path characters in base64). */
export async function hashJoinCode(joinCode: string): Promise<string> {
  const data = new TextEncoder().encode(joinCode.trim());
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
