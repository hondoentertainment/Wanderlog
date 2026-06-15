import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDeleteDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args: string[]) => ({ path: args.join('/') })),
  doc: vi.fn((...args: string[]) => ({ path: args.join('/') })),
  getDoc: (...a: unknown[]) => mockGetDoc(...a),
  getDocs: (...a: unknown[]) => mockGetDocs(...a),
  deleteDoc: (...a: unknown[]) => mockDeleteDoc(...a),
  setDoc: (...a: unknown[]) => mockSetDoc(...a),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('../firebaseConfig', () => ({
  auth: { currentUser: null },
  db: {},
  googleProvider: {},
}));

vi.mock('../storageService', () => ({
  deleteAllUserStorage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../shareService', () => ({
  shareService: {
    getUserSharedTrips: vi.fn().mockResolvedValue([]),
    deleteSharedTrip: vi.fn(),
  },
}));

vi.mock('../collaborativeBucketListService', () => ({
  collaborativeListService: {
    getOwnedLists: vi.fn().mockResolvedValue([]),
    deleteList: vi.fn(),
  },
}));

vi.mock('../userDirectory', () => ({
  deleteUserDirectoryEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../squadJoinLookup', () => ({
  deleteSquadJoinCode: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../publicLocationService', () => ({
  unpublishAllForUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../constants', () => ({
  STORAGE_KEY: 'test-storage-key',
}));

import { purgeUserCloudData } from '../accountDeletionService';

describe('purgeUserCloudData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        squadTrips: [{ id: 'trip-1', name: 'Test', destination: 'X', members: [], items: [], joinCode: '', createdAt: '' }],
      }),
    });
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  it('deletes user document and clears local storage key', async () => {
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    await purgeUserCloudData('user-abc');
    expect(mockDeleteDoc).toHaveBeenCalled();
    expect(removeItem).toHaveBeenCalledWith('test-storage-key');
    removeItem.mockRestore();
  });
});
