import { algoliasearch } from 'algoliasearch';
import { friendService } from './friendService';

export interface UserSearchResult {
  id: string;
  name: string;
  avatar?: string;
}

const algoliaAppId = import.meta.env.VITE_ALGOLIA_APP_ID as string | undefined;
const algoliaSearchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string | undefined;
const algoliaIndexName = (import.meta.env.VITE_ALGOLIA_INDEX_NAME as string | undefined) || 'userDirectory';

function isAlgoliaConfigured(): boolean {
  return Boolean(algoliaAppId?.trim() && algoliaSearchKey?.trim());
}

async function searchViaAlgolia(
  searchTerm: string,
  currentUserId: string,
): Promise<UserSearchResult[]> {
  const client = algoliasearch(algoliaAppId!, algoliaSearchKey!);
  const { hits } = await client.searchForHits<{ objectID: string; displayName?: string; avatarUrl?: string }>({
    requests: [{ indexName: algoliaIndexName, query: searchTerm, hitsPerPage: 10 }],
  });

  return hits
    .filter((hit) => hit.objectID !== currentUserId)
    .map((hit) => ({
      id: hit.objectID,
      name: hit.displayName || 'Traveler',
      avatar: hit.avatarUrl,
    }));
}

/** Algolia when configured; otherwise Firestore prefix + keyword search. */
export async function searchUsersByName(
  searchTerm: string,
  currentUserId: string,
): Promise<UserSearchResult[]> {
  if (isAlgoliaConfigured()) {
    try {
      return await searchViaAlgolia(searchTerm, currentUserId);
    } catch {
      // Fall through to Firestore
    }
  }
  return friendService.searchUsers(searchTerm, currentUserId);
}
