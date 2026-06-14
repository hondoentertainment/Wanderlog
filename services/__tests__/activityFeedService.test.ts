import { describe, it, expect, vi } from 'vitest';

vi.mock('../firebaseConfig', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'a1' }),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

import { recordSocialActivity } from '../activityFeedService';
import { addDoc } from 'firebase/firestore';

describe('activityFeedService', () => {
  it('records social activities', async () => {
    await recordSocialActivity({
      actorId: 'u1',
      actorName: 'Kyle',
      type: 'trip_logged',
      summary: 'Logged Paris with photos',
    });
    expect(addDoc).toHaveBeenCalled();
  });
});
