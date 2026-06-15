import { describe, it, expect } from 'vitest';
import { hashJoinCode } from '../joinCodeHash';

describe('hashJoinCode', () => {
  it('returns a stable hex digest for the same input', async () => {
    const a = await hashJoinCode('abc');
    const b = await hashJoinCode('abc');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('differs for different codes', async () => {
    const a = await hashJoinCode('code-a');
    const b = await hashJoinCode('code-b');
    expect(a).not.toBe(b);
  });
});
