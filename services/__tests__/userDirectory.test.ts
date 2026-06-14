import { describe, it, expect } from 'vitest';
import { buildSearchKeywords } from '../userDirectory';

describe('buildSearchKeywords', () => {
  it('includes full name and word prefixes', () => {
    const keywords = buildSearchKeywords('Kyle Traveler');
    expect(keywords).toContain('kyle traveler');
    expect(keywords).toContain('kyle');
    expect(keywords).toContain('traveler');
    expect(keywords).toContain('ky');
  });

  it('returns empty array for blank names', () => {
    expect(buildSearchKeywords('  ')).toEqual([]);
  });
});
