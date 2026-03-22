import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { TravelLocation, LocationType, UserProfile, SavedRecommendation, AIRecommendation, TravelMuseInsight, SquadTrip } from '../types';
import { STORAGE_KEY } from '../constants';
import { auth } from '../services/firebaseConfig';
import { deleteUserCloudData, loadAppData, saveToCloud } from '../services/storageService';
import {
  exportItineraryToICS,
  generateItinerary,
  generateTravelDNA,
  geocodeLocation,
  getGeminiErrorMessage,
  getLocationDetails,
  getTravelMuseInsights,
  performSemanticSearch,
} from '../services/geminiService';
import { useToast } from '../components/Toast';

export interface TravelDataContextType {
  // Core data
  locations: TravelLocation[];
  profile: UserProfile | null;
  savedRecommendations: SavedRecommendation[];
  squadTrips: SquadTrip[];
  loadingData: boolean;

  // Map
  activeMap: { id: string; name: string; coords: { lat: number; lng: number; zoom?: number } } | null;
  setActiveMap: React.Dispatch<React.SetStateAction<TravelDataContextType['activeMap']>>;

  // Search & Filter
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterType: 'all' | LocationType;
  setFilterType: (v: 'all' | LocationType) => void;
  filterMinRating: number;
  setFilterMinRating: (v: number) => void;
  sortOrder: 'rating' | 'date';
  setSortOrder: (v: 'rating' | 'date') => void;
  semanticSearchQuery: string;
  setSemanticSearchQuery: (v: string) => void;
  isSearchingAI: boolean;
  semanticResultIds: string[] | null;
  setSemanticResultIds: (v: string[] | null) => void;

  // AI state
  museInsights: TravelMuseInsight[];
  isLoadingMuse: boolean;
  loadingDNA: boolean;
  loadingItinerary: string | null;

  // Derived
  filteredLocations: TravelLocation[];

  // Location handlers
  addLocation: (loc: Omit<TravelLocation, 'id'>) => void;
  deleteLocation: (id: string) => void;
  shareLocation: (loc: TravelLocation) => Promise<void>;
  viewMap: (loc: TravelLocation) => Promise<void>;

  // AI handlers
  semanticSearch: () => Promise<void>;
  refreshDNA: () => Promise<void>;
  refreshMuse: () => Promise<void>;

  // Recommendation handlers
  saveRecommendation: (rec: AIRecommendation) => Promise<void>;
  generateItineraryForRec: (rec: SavedRecommendation) => Promise<void>;
  exportItinerary: (rec: SavedRecommendation) => void;

  // Squad handlers
  createSquad: (trip: SquadTrip) => void;
  joinSquad: (code: string) => void;
  updateSquad: (updated: SquadTrip) => void;
  deleteSquad: (id: string) => void;

  // Profile handlers
  updateProfile: (profile: UserProfile) => void;
  addToBucketList: (item: string) => void;
  removeFromBucketList: (item: string) => void;
  deleteAccount: () => Promise<void>;

  // Map helpers
  setLocations: React.Dispatch<React.SetStateAction<TravelLocation[]>>;
}

const TravelDataContext = createContext<TravelDataContextType | undefined>(undefined);

export const TravelDataProvider: React.FC<{ userId: string; children: React.ReactNode }> = ({ userId, children }) => {
  const [locations, setLocations] = useState<TravelLocation[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([]);
  const [squadTrips, setSquadTrips] = useState<SquadTrip[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [activeMap, setActiveMap] = useState<TravelDataContextType['activeMap']>(null);
  const [loadingItinerary, setLoadingItinerary] = useState<string | null>(null);
  const [loadingDNA, setLoadingDNA] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | LocationType>('all');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'rating' | 'date'>('date');

  const [semanticSearchQuery, setSemanticSearchQuery] = useState('');
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [semanticResultIds, setSemanticResultIds] = useState<string[] | null>(null);

  const [museInsights, setMuseInsights] = useState<TravelMuseInsight[]>([]);
  const [isLoadingMuse, setIsLoadingMuse] = useState(false);

  const { showToast } = useToast();

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadAppData(userId);
        setLocations(data.locations);
        setProfile(data.profile);
        setSavedRecommendations(data.savedRecommendations);
        setSquadTrips(data.squadTrips || []);
      } catch (error) {
        console.error("Failed to load data", error);
        showToast("Failed to sync data", "error");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
    // Mount / userId only — showToast is stable for our purposes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Debounced Save to Cloud
  useEffect(() => {
    if (!profile || loadingData) return;
    const timer = setTimeout(() => {
      saveToCloud(userId, { locations, profile, savedRecommendations, squadTrips });
    }, 2000);
    return () => clearTimeout(timer);
  }, [locations, profile, savedRecommendations, squadTrips, userId, loadingData]);

  // --- Location Handlers ---

  const addLocation = (newLoc: Omit<TravelLocation, 'id'>) => {
    const location: TravelLocation = { ...newLoc, id: crypto.randomUUID() };
    setLocations(prev => [location, ...prev]);
    showToast(`${newLoc.name} added to your travel diary!`, 'success');
  };

  const deleteLocation = (id: string) => {
    if (window.confirm("Are you sure?")) {
      setLocations(prev => prev.filter(l => l.id !== id));
    }
  };

  const shareLocation = async (loc: TravelLocation) => {
    const text = `Trip to ${loc.name}: ${loc.rating}/5 stars! Pros: ${loc.likes.join(', ')} #WanderLog`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Trip to ${loc.name}`, text, url: window.location.href });
      } catch {
        /* user dismissed share sheet */
      }
    } else {
      await navigator.clipboard.writeText(text);
      showToast('Summary copied to clipboard!', 'info');
    }
  };

  const viewMap = async (loc: TravelLocation) => {
    if (loc.coordinates) {
      setActiveMap({ id: loc.id, name: loc.name, coords: loc.coordinates });
    } else {
      try {
        const coords = await geocodeLocation(loc.name, loc.type);
        if (coords) {
          setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, coordinates: coords } : l));
          setActiveMap({ id: loc.id, name: loc.name, coords });
        }
      } catch (err) {
        showToast(getGeminiErrorMessage(err), 'error');
      }
    }
  };

  // --- AI Handlers ---

  const semanticSearch = async () => {
    if (!semanticSearchQuery.trim()) {
      setSemanticResultIds(null);
      return;
    }
    setIsSearchingAI(true);
    try {
      const ids = await performSemanticSearch(semanticSearchQuery, locations);
      setSemanticResultIds(ids);
    } catch (err) {
      showToast(getGeminiErrorMessage(err), 'error');
    } finally {
      setIsSearchingAI(false);
    }
  };

  const refreshDNA = async () => {
    if (!profile || locations.length === 0) return;
    setLoadingDNA(true);
    try {
      const dna = await generateTravelDNA(locations, profile);
      setProfile({ ...profile, dna });
    } catch (err) {
      showToast(getGeminiErrorMessage(err), 'error');
    } finally {
      setLoadingDNA(false);
    }
  };

  const refreshMuse = async () => {
    if (!profile || locations.length === 0) return;
    setIsLoadingMuse(true);

    let currentCoords: { latitude: number; longitude: number } | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      });
      currentCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {
      /* geolocation denied or timeout */
    }

    try {
      const insights = await getTravelMuseInsights(locations, profile, currentCoords);
      setMuseInsights(insights);
    } catch (err) {
      showToast(getGeminiErrorMessage(err), 'error');
    } finally {
      setIsLoadingMuse(false);
    }
  };

  // --- Recommendation Handlers ---

  const saveRecommendation = async (rec: AIRecommendation) => {
    if (savedRecommendations.some(s => s.name === rec.name)) return;
    const newId = crypto.randomUUID();
    const newSaved: SavedRecommendation = { ...rec, id: newId, dateSaved: new Date().toISOString() };
    setSavedRecommendations(prev => [newSaved, ...prev]);
    try {
      const details = await getLocationDetails(rec.name, rec.type);
      setSavedRecommendations(prev => prev.map(item => item.id === newId ? { ...item, ...details } : item));
    } catch (err) {
      showToast(getGeminiErrorMessage(err), 'error');
    }
  };

  const generateItineraryForRec = async (rec: SavedRecommendation) => {
    if (loadingItinerary) return;
    setLoadingItinerary(rec.id);
    try {
      const itinerary = await generateItinerary(rec.name, rec.type, rec.description || '', rec.attractions || []);
      setSavedRecommendations(prev => prev.map(item => item.id === rec.id ? { ...item, itinerary } : item));
    } catch (err) {
      showToast(getGeminiErrorMessage(err), 'error');
    } finally {
      setLoadingItinerary(null);
    }
  };

  const exportItinerary = (rec: SavedRecommendation) => {
    if (!rec.itinerary) return;
    const icsContent = exportItineraryToICS(rec.name, rec.itinerary);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${rec.name}_itinerary.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Squad Handlers ---

  const createSquad = (trip: SquadTrip) => {
    setSquadTrips(prev => [...prev, trip]);
  };

  const joinSquad = (code: string) => {
    try {
      const decoded = JSON.parse(atob(code));
      if (decoded.name && decoded.destination) {
        const newTrip: SquadTrip = {
          ...decoded,
          id: crypto.randomUUID(),
          joinCode: code,
          createdAt: new Date().toISOString(),
          items: []
        };
        setSquadTrips(prev => [...prev, newTrip]);
      }
    } catch {
      showToast("Invalid Squad Join Code.", "error");
    }
  };

  const updateSquad = (updated: SquadTrip) => {
    setSquadTrips(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSquad = (id: string) => {
    if (window.confirm("Delete this Squad Trip?")) {
      setSquadTrips(prev => prev.filter(s => s.id !== id));
    }
  };

  // --- Profile Handlers ---

  const updateProfile = (newProfile: UserProfile) => setProfile(newProfile);

  const addToBucketList = (item: string) => {
    if (profile && !profile.bucketList.includes(item)) {
      setProfile({ ...profile, bucketList: [...profile.bucketList, item] });
      showToast(`${item} added to your bucket list!`, 'success');
    }
  };

  const removeFromBucketList = (item: string) => {
    if (profile) {
      setProfile({ ...profile, bucketList: profile.bucketList.filter(i => i !== item) });
      showToast(`${item} removed from bucket list`, 'info');
    }
  };

  const deleteAccount = useCallback(async () => {
    if (!window.confirm('Delete your account and all cloud data? This cannot be undone.')) return;
    try {
      await deleteUserCloudData(userId);
      localStorage.removeItem(STORAGE_KEY);
      await signOut(auth);
      showToast('Your cloud data was removed.', 'info');
    } catch {
      showToast('Could not fully delete account. Try again.', 'error');
    }
  }, [userId, showToast]);

  // --- Filtered Locations ---

  const filteredLocations = useMemo(() => {
    return locations
      .filter(loc => {
        if (semanticResultIds) return semanticResultIds.includes(loc.id);
        const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || loc.type === filterType;
        const matchesRating = loc.rating >= filterMinRating;
        return matchesSearch && matchesType && matchesRating;
      })
      .sort((a, b) => {
        if (sortOrder === 'rating') return b.rating - a.rating;
        return new Date(b.dateVisited).getTime() - new Date(a.dateVisited).getTime();
      });
  }, [locations, searchTerm, filterType, filterMinRating, sortOrder, semanticResultIds]);

  const value: TravelDataContextType = {
    locations, profile, savedRecommendations, squadTrips, loadingData,
    activeMap, setActiveMap,
    searchTerm, setSearchTerm, filterType, setFilterType,
    filterMinRating, setFilterMinRating, sortOrder, setSortOrder,
    semanticSearchQuery, setSemanticSearchQuery, isSearchingAI, semanticResultIds, setSemanticResultIds,
    museInsights, isLoadingMuse, loadingDNA, loadingItinerary,
    filteredLocations,
    addLocation, deleteLocation, shareLocation, viewMap,
    semanticSearch, refreshDNA, refreshMuse,
    saveRecommendation, generateItineraryForRec, exportItinerary,
    createSquad, joinSquad, updateSquad, deleteSquad,
    updateProfile, addToBucketList, removeFromBucketList, deleteAccount,
    setLocations,
  };

  return (
    <TravelDataContext.Provider value={value}>
      {children}
    </TravelDataContext.Provider>
  );
};

export const useTravelData = (): TravelDataContextType => {
  const context = useContext(TravelDataContext);
  if (!context) {
    throw new Error('useTravelData must be used within a TravelDataProvider');
  }
  return context;
};
