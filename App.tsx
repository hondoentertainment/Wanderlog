import React, { useState, useEffect, useMemo, Suspense, lazy, useRef } from 'react';
import { TravelLocation, LocationType, UserProfile, SavedRecommendation, AIRecommendation, ItineraryDay, TravelDNA, VibeType, TravelMuseInsight, SquadTrip, CompanionType } from './types';
import { filterLocationsByCompanion } from './utils/filterByCompanion';
import { CompanionFilterChips } from './components/CompanionFilterChips';
import { runPostLoginMigrations } from './services/cloudMigrations';
import { E2E_MOCK_LOCATIONS } from './utils/e2eFixtures';
import { loadAppData, saveToCloud } from './services/storageService';
import { publishLocation, unpublishLocation, shouldPublishToDiscoveryFeed } from './services/publicLocationService';
import { recordSocialActivity } from './services/activityFeedService';
import { squadTripService, mergeSquadTrips } from './services/squadTripService';
import { offlineQueue } from './services/offlineQueue';
import { getCachedTravelDNA, setCachedTravelDNA } from './utils/dnaCache';
import { getLocationDetails, geocodeLocation, generateItinerary, generateTravelDNA, performSemanticSearch, exportItineraryToICS, getTravelMuseInsights, getAIRecommendations, analyzeLogImage, analyzeVoiceCommand } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './components/Toast';
import { Shimmer, DashboardShimmer } from './components/Shimmer';

// Lazy Loaded Components for Code Splitting
const LocationForm = lazy(() => import('./components/LocationForm').then(m => ({ default: m.LocationForm })));
const Recommendations = lazy(() => import('./components/Recommendations').then(m => ({ default: m.Recommendations })));
const Profile = lazy(() => import('./components/Profile').then(m => ({ default: m.Profile })));
const MapModal = lazy(() => import('./components/MapModal').then(m => ({ default: m.MapModal })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const DiscoveryFeed = lazy(() => import('./components/DiscoveryFeed').then(m => ({ default: m.DiscoveryFeed })));
const Timeline = lazy(() => import('./components/Timeline').then(m => ({ default: m.Timeline })));
const TravelMuse = lazy(() => import('./components/TravelMuse').then(m => ({ default: m.TravelMuse })));
const SquadHub = lazy(() => import('./components/SquadHub').then(m => ({ default: m.SquadHub })));
const BucketList = lazy(() => import('./components/BucketList').then(m => ({ default: m.BucketList })));
const CollaborativeList = lazy(() => import('./components/CollaborativeList').then(m => ({ default: m.CollaborativeList })));
const CollaborativeListsOverview = lazy(() => import('./components/CollaborativeList').then(m => ({ default: m.CollaborativeListsOverview })));
const ShareModal = lazy(() => import('./components/ShareModal').then(m => ({ default: m.ShareModal })));
const TravelMilestones = lazy(() => import('./components/TravelMilestones').then(m => ({ default: m.TravelMilestones })));
const TripComparison = lazy(() => import('./components/TripComparison').then(m => ({ default: m.TripComparison })));
const StatsCard = lazy(() => import('./components/StatsCard').then(m => ({ default: m.StatsCard })));
const AchievementBadges = lazy(() => import('./components/AchievementBadges').then(m => ({ default: m.AchievementBadges })));
const AskJules = lazy(() => import('./components/AskJules').then(m => ({ default: m.AskJules })));
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const DiscoveryIntelligence = lazy(() => import('./components/DiscoveryIntelligence').then(m => ({ default: m.DiscoveryIntelligence })));
const CreatorDashboard = lazy(() => import('./components/CreatorDashboard').then(m => ({ default: m.CreatorDashboard })));
const AgencyPortal = lazy(() => import('./components/AgencyPortal').then(m => ({ default: m.AgencyPortal })));
const ARViewfinder = lazy(() => import('./components/ARViewfinder').then(m => ({ default: m.ARViewfinder })));
const AutoExecutor = lazy(() => import('./components/AutoExecutor').then(m => ({ default: m.AutoExecutor })));
const RwaHotelInvest = lazy(() => import('./components/RwaHotelInvest').then(m => ({ default: m.RwaHotelInvest })));
const SharedTripView = lazy(() => import('./components/SharedTripView').then(m => ({ default: m.SharedTripView })));
const PwaPrompt = lazy(() => import('./components/PwaPrompt').then(m => ({ default: m.PwaPrompt })));
const FriendsHub = lazy(() => import('./components/FriendsHub').then(m => ({ default: m.FriendsHub })));

import { Button } from './components/Button';
import { AccountMenu } from './components/AccountMenu';
import { parseSquadJoinCode } from './utils/squadJoinCode';
import { StarRating } from './components/StarRating';
import { ReceiptScanner } from './components/ReceiptScanner';
import { WalkmanMode } from './components/WalkmanMode';

const HighlightText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  try {
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-[#00e054]/30 text-white rounded-sm px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  } catch (e) {
    return <span>{text}</span>;
  }
};

const OmniBox: React.FC<{
  onLog: (name: string) => void;
  onSearch: (q: string) => void;
  onAsk: (q: string) => void;
  onImageUpload?: (file: File) => void;
  onVoiceTranscription?: (text: string) => void;
  isLoading?: boolean;
}> = ({ onLog, onSearch, onAsk, onImageUpload, onVoiceTranscription, isLoading }) => {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setValue(transcript);
        setIsListening(false);
        if (onVoiceTranscription) onVoiceTranscription(transcript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [onVoiceTranscription]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      if (value.startsWith('?')) {
        onAsk(value.substring(1).trim());
      } else if (value.toLowerCase().startsWith('go ')) {
        onLog(value.substring(3).trim());
      } else {
        onSearch(value.trim());
      }
      setValue('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <div className="relative group w-full max-w-2xl mx-auto">
      <div className="absolute inset-0 bg-[#00e054]/5 blur-xl group-focus-within:bg-[#00e054]/10 transition-all rounded-full" />
      <div className={`relative flex items-center bg-[#1b2228]/80 backdrop-blur-md border border-[#2c3440] rounded-full px-6 py-4 focus-within:border-[#00e054]/50 transition-all shadow-2xl ${isLoading ? 'animate-pulse ring-1 ring-[#00e054]/30' : ''}`}>
        <i className={`fas ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-search'} text-[#567] mr-4 group-focus-within:text-[#00e054] transition-colors`} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          id="main-search-input"
          placeholder="Explore your journey... 🌍"
          className="bg-transparent border-none outline-none text-white w-full text-lg placeholder-[#567] font-medium"
        />
        <div className="flex gap-4 items-center pl-4 border-l border-[#2c3440]">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[#567] hover:text-[#00e054] transition-colors"
            title="Upload photo to log trip"
          >
            <i className="fas fa-camera text-lg"></i>
          </button>
          <button
            onClick={toggleListening}
            className={`transition-colors ${isListening ? 'text-[#00e054] animate-pulse' : 'text-[#567] hover:text-[#00e054]'}`}
            title="Talk to Jules (Voice Log)"
          >
            <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-slash'} text-lg`}></i>
          </button>
          <div className="hidden group-focus-within:flex gap-2">
            <kbd className="px-2 py-1 bg-[#2c3440] text-[10px] text-[#567] rounded uppercase font-black">Enter</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{
  user: any;
  onViewChange: (v: any) => void;
  currentView: string;
  onOmniLog: (name: string) => void;
  onOmniSearch: (q: string) => void;
  onOmniAsk: (q: string) => void;
  onOmniImageUpload: (file: File) => void;
  onOmniVoiceTranscription?: (text: string) => void;
  isOmniLoading?: boolean;
  onSimulateAlert?: () => void;
  onOpenScanner?: () => void;
  onOpenAgency?: () => void;
  onOpenAR?: () => void;
  onOpenAutoExec?: () => void;
  onOpenWatch?: () => void;
}> = ({ user, onViewChange, currentView, onOmniLog, onOmniSearch, onOmniAsk, onOmniImageUpload, onOmniVoiceTranscription, isOmniLoading, onSimulateAlert, onOpenScanner, onOpenAgency, onOpenAR, onOpenAutoExec, onOpenWatch }) => {
  const { signInWithGoogle } = useAuth();

  return (
    <header className="sticky top-0 z-50 px-6 py-8 flex flex-col items-center gap-8">
      <div className="w-full max-w-7xl flex justify-between items-center">
        <button
          onClick={() => onViewChange('history')}
          className="flex items-center gap-3 transition-transform hover:scale-105"
        >
          <div className="w-10 h-10 bg-[#2c3440] rounded-full flex items-center justify-center border-2 border-[#00e054] shadow-[0_0_15px_rgba(0,224,84,0.3)]">
            <i className="fas fa-location-arrow text-[#00e054]"></i>
          </div>
          <span className="text-white font-black tracking-tighter text-xl uppercase italic">Travel Muse</span>
        </button>

        <nav className="hidden md:flex bg-[#1b2228]/60 backdrop-blur-lg border border-[#2c3440] rounded-full px-2 py-1.5 shadow-xl">
          {[
            { id: 'history', icon: 'fa-globe', label: 'World' },
            { id: 'discovery', icon: 'fa-compass', label: 'Expedition' },
            { id: 'savedtrips', icon: 'fa-map', label: 'Trips' },
            { id: 'squad', icon: 'fa-users', label: 'Squad' },
            { id: 'bucketlist', icon: 'fa-bookmark', label: 'Bucket' },
          ].map(item => (
            <button
              key={item.id}
              data-testid={`nav-${item.id}`}
              onClick={() => onViewChange(item.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${currentView === item.id ? 'bg-[#00e054] text-[#14181c]' : 'text-[#567] hover:text-white'
                }`}
            >
              <i className={`fas ${item.icon}`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {user ? (
            <AccountMenu onNavigate={(v) => onViewChange(v)} />
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-white text-[#14181c] px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#00e054] transition-all"
            >
              Join Wanderlog
            </button>
          )}

          {/* VC Demo Hook: Proactive Jules */}
          {user && onSimulateAlert && (
            <button
              onClick={onSimulateAlert}
              className="bg-[#00e054]/10 text-[#00e054] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00e054]/30 hover:bg-[#00e054] hover:text-[#14181c] transition-all ml-2"
              title="Simulate Ambient AI Discovery Alert"
            >
              <i className="fas fa-bell mr-2"></i>
              Demo Alert
            </button>
          )}

          {/* VC Demo Hook: Agency Mode SaaS */}
          {user && onOpenAgency && (
            <button
              onClick={onOpenAgency}
              className="bg-[#40bcf4]/10 text-[#40bcf4] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#40bcf4]/30 hover:bg-[#40bcf4] hover:text-[#14181c] transition-all ml-2 flex items-center gap-2"
              title="Enter B2B Travel Agent SaaS Mode"
            >
              <i className="fas fa-building"></i>
              <span className="hidden md:inline">Agency Mode</span>
            </button>
          )}

          {/* VC Demo Hook: AR Spatial Lens */}
          {user && onOpenAR && (
            <button
              onClick={onOpenAR}
              className="bg-[#00e054]/10 text-[#00e054] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00e054]/30 hover:bg-[#00e054] hover:text-[#14181c] transition-all ml-2 group hidden lg:inline-flex"
              title="Launch Spatial AR Lens"
            >
              <i className="fas fa-vr-cardboard mr-2 group-hover:animate-pulse"></i>
              AR Mode
            </button>
          )}

          {/* VC Demo Hook: Autonomous Execution */}
          {user && onOpenAutoExec && (
            <button
              onClick={onOpenAutoExec}
              className="bg-[#bc1888]/10 text-[#bc1888] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#bc1888]/30 hover:bg-[#bc1888] hover:text-[#14181c] transition-all ml-2 flex items-center gap-2 group hidden lg:inline-flex"
              title="Trigger Autonomous Agent"
            >
              <i className="fas fa-bolt group-hover:text-yellow-400"></i>
              <span>Auto-Exec</span>
            </button>
          )}

          {/* VC Demo Hook: Watch HUD */}
          {user && onOpenWatch && (
            <button
              onClick={onOpenWatch}
              className="bg-black text-[#fff] px-3 py-2 rounded-full text-[12px] font-black uppercase tracking-widest border border-[#333] hover:bg-[#333] transition-all ml-2 hidden lg:inline-flex"
              title="Demo Apple Watch Haptics"
            >
              <i className="fab fa-apple"></i>
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl flex items-center justify-center gap-4">
        <div className="flex-1">
          <OmniBox
            onLog={onOmniLog}
            onSearch={onOmniSearch}
            onAsk={onOmniAsk}
            onImageUpload={onOmniImageUpload}
            onVoiceTranscription={onOmniVoiceTranscription}
            isLoading={isOmniLoading}
          />
        </div>
        {onOpenScanner && (
          <button
            onClick={onOpenScanner}
            className="w-14 h-14 shrink-0 bg-[#1b2228]/80 backdrop-blur-md rounded-full border border-[#2c3440] flex items-center justify-center text-[#567] hover:text-[#00e054] hover:border-[#00e054] transition-all shadow-2xl group"
            title="Scan Paper Itinerary / Receipt"
          >
            <i className="fas fa-file-invoice text-xl group-hover:scale-110 transition-transform"></i>
          </button>
        )}
      </div>
    </header>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#14181c] selection:bg-[#00e054]/50">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_#1b2228_0%,_#14181c_100%)] pointer-events-none" />
      {children}
    </div>
  );
};

const App: React.FC = () => {
  const [publicTripViewId, setPublicTripViewId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/shared/')) {
      const id = window.location.pathname.split('/shared/')[1];
      if (id) setPublicTripViewId(id);
    }
  }, []);

  // --- High Performance Initialization (Cloud-Only) ---
  const [locations, setLocations] = useState<TravelLocation[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([]);
  const [squadTrips, setSquadTrips] = useState<SquadTrip[]>([]);
  const [currentView, setCurrentView] = useState<'history' | 'savedtrips' | 'profile' | 'add' | 'squad' | 'bucketlist' | 'compare' | 'statscard' | 'jules' | 'badges' | 'sharedlists' | 'collaborative' | 'creator' | 'agency' | 'friends' | 'discovery'>('history');
  const [selectedCollaborativeListId, setSelectedCollaborativeListId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalTrip, setShareModalTrip] = useState<TravelLocation | null>(null);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showARViewfinder, setShowARViewfinder] = useState(false);
  const [showAutoExec, setShowAutoExec] = useState(false);
  const [showWatchHUD, setShowWatchHUD] = useState(false);
  const [showRwaInvest, setShowRwaInvest] = useState<TravelLocation | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | LocationType>('all');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'rating' | 'date'>('date');
  const [companionFilter, setCompanionFilter] = useState<CompanionType | null>(null);

  const displayLocations = useMemo(
    () => filterLocationsByCompanion(locations, companionFilter),
    [locations, companionFilter],
  );

  const [activeMap, setActiveMap] = useState<{ name: string; coords: { lat: number; lng: number; zoom?: number } } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<string | null>(null);
  const [loadingItinerary, setLoadingItinerary] = useState<string | null>(null);
  const [loadingDNA, setLoadingDNA] = useState(false);

function AddRoute() {
  const navigate = useNavigate();
  const { addLocation } = useTravelData();
  return (
    <LazyLocationForm onAdd={(loc) => { addLocation(loc); navigate('/history'); }} />
  );
}

  const [museInsights, setMuseInsights] = useState<TravelMuseInsight[]>([]);
  const [isLoadingMuse, setIsLoadingMuse] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [proactiveAIResults, setProactiveAIResults] = useState<AIRecommendation[]>([]);

  // Perceptual Speed Optimization
  const [loadingData, setLoadingData] = useState(true);

  /** Must stay with top-level hooks (before conditional returns below). */
  const [prefilledLocation, setPrefilledLocation] = useState<Partial<TravelLocation> | null>(null);

function SquadRoute() {
  const { squadTrips, createSquad, joinSquad, updateSquad, deleteSquad } = useTravelData();
  return (
    <LazySquadHub
      trips={squadTrips}
      onCreate={createSquad}
      onJoin={joinSquad}
      onUpdate={updateSquad}
      onDelete={deleteSquad}
    />
  );
}

  useEffect(() => {
    const handleOnline = () => {
      console.log('App is back online. Processing offline queue...');
      offlineQueue.processQueue();
      showToast('Back online! Syncing data...', 'info');
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      offlineQueue.processQueue();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [showToast]);

  const e2eGuestProfile = useMemo((): UserProfile | null => {
    if (import.meta.env.VITE_E2E_FIXTURES !== 'true') return null;
    return {
      name: 'Traveler',
      bio: 'Exploring the world one step at a time.',
      travelStyle: ['Adventure'],
      bucketList: [],
      customTravelStyles: [],
    };
  }, []);

  useEffect(() => {
    if (e2eGuestProfile && !user) {
      setLocations(E2E_MOCK_LOCATIONS);
      setProfile(e2eGuestProfile);
      setLoadingData(false);
    }
  }, [user, e2eGuestProfile]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!user) {
        if (e2eGuestProfile) {
          setLocations(E2E_MOCK_LOCATIONS);
          setProfile(e2eGuestProfile);
          setLoadingData(false);
          return;
        }
        setLocations([]);
        setProfile({
          name: 'Traveler',
          bio: 'Exploring the world one step at a time.',
          travelStyle: ['Adventure'],
          bucketList: [],
          customTravelStyles: []
        });
        setSavedRecommendations([]);
        setSquadTrips([]);
        setLoadingData(false);
        return;
      }
      try {
        const [data, cloudSquads] = await Promise.all([
          loadAppData(user.uid),
          squadTripService.fetchCloudSquadTrips(user.uid).catch(() => [] as SquadTrip[]),
        ]);
        if (mounted) {
          const migratedLocations = (data.locations || []).map(l => ({
            ...l,
            isVisited: l.isVisited ?? true
          }));
          setLocations(migratedLocations);
          const profileWithSearch = {
            ...data.profile,
            searchName: data.profile.searchName ?? data.profile.name?.trim().toLowerCase(),
            publishToDiscoveryFeed: data.profile.publishToDiscoveryFeed ?? true,
          };
          setProfile(profileWithSearch);
          setSavedRecommendations(data.savedRecommendations || []);
          const mergedSquads = mergeSquadTrips(data.squadTrips || [], cloudSquads);
          setSquadTrips(mergedSquads);
          runPostLoginMigrations(user.uid, profileWithSearch, mergedSquads).catch(() => undefined);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        if (mounted) setLoadingData(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [user]);

  const unifiedSearchResults = useMemo(() => {
    const allItems = [
      ...displayLocations.map(l => ({ ...l, resultType: 'location' as const })),
      ...squadTrips.map(t => ({ ...t, resultType: 'trip' as const }))
    ];

    return allItems
      .filter(item => {
        const cleanSearch = searchTerm.toLowerCase().trim();
        const words = cleanSearch.split(' ').filter(w => w.length > 2);

        // 1. Check Local Key Match
        let isLocalMatch = false;
        if (cleanSearch) {
          if (item.resultType === 'location') {
            const matchesText = item.name.toLowerCase().includes(cleanSearch) ||
              words.some(w => item.name.toLowerCase().includes(w));
            const matchesType = filterType === 'all' || item.type === filterType;
            const matchesRating = item.rating >= filterMinRating;
            isLocalMatch = matchesText && matchesType && matchesRating;
          } else {
            isLocalMatch = (item.name?.toLowerCase().includes(cleanSearch) || false) ||
              (item.destination?.toLowerCase().includes(cleanSearch) || false) ||
              (item.items?.some(act => act.toLowerCase().includes(cleanSearch)) || false) ||
              words.some(w => (item.name?.toLowerCase().includes(w) || false) || (item.destination?.toLowerCase().includes(w) || false));
          }
        } else {
          isLocalMatch = true; // Show all if no search term
        }

        // 2. Check Semantic Match (if active)
        const isSemanticMatch = semanticResultIds?.includes(item.id) || false;

        // Union: Show if either found it
        return isLocalMatch || isSemanticMatch;
      })
      .sort((a, b) => {
        const aDate = a.resultType === 'location' ? a.dateVisited : a.createdAt;
        const bDate = b.resultType === 'location' ? b.dateVisited : b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }, [displayLocations, squadTrips, searchTerm, filterType, filterMinRating, sortOrder, semanticResultIds]);

  useEffect(() => {
    if (!profile || !user || loadingData) return;
    const timer = setTimeout(() => {
      saveToCloud(user.uid, { locations, profile, savedRecommendations, squadTrips });
    }, 2000);
    return () => clearTimeout(timer);
  }, [locations, profile, savedRecommendations, squadTrips, user, loadingData]);

  if (publicTripViewId) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#14181c] flex items-center justify-center text-[#00e054]">Loading Travel Story...</div>}>
        <SharedTripView 
          tripId={publicTripViewId} 
          onJoin={() => {
            setPublicTripViewId(null);
            window.history.pushState({}, '', '/');
          }}
          onHome={() => {
            setPublicTripViewId(null);
            window.history.pushState({}, '', '/');
          }}
        />
      </Suspense>
    );
  }

  if (authLoading) return <div className="min-h-screen bg-[#14181c] flex items-center justify-center text-[#00e054]">Loading...</div>;

  const handleAddLocation = (newLoc: Omit<TravelLocation, 'id'>) => {
    const location: TravelLocation = { ...newLoc, id: crypto.randomUUID(), isVisited: true };
    setLocations(prev => [location, ...prev]);
    setCurrentView('history');
    showToast(`${newLoc.name} added! 🎉`, 'success');
    handleRefreshMuse();
    if (user?.uid) {
      publishLocation(user.uid, location, profile ?? undefined)
        .then(() => {
          if (shouldPublishToDiscoveryFeed(location, profile ?? undefined)) {
            void recordSocialActivity({
              actorId: user.uid,
              actorName: profile?.name || user.displayName || 'Traveler',
              type: 'trip_logged',
              summary: `Logged ${location.name}${location.photoUrls?.length ? ' with photos' : ''}`,
            }).catch(() => undefined);
          }
        })
        .catch(() => {
          showToast('Saved locally; discovery feed publish failed.', 'info');
        });
    }
  };

  const handleCreateSquad = (trip: SquadTrip) => {
    const withMembers: SquadTrip = {
      ...trip,
      memberIds: user?.uid ? [...new Set([user.uid, ...(trip.memberIds ?? [])])] : trip.memberIds,
    };
    setSquadTrips((prev) => [...prev, withMembers]);
    if (user?.uid) {
      squadTripService.syncSquadTrip(user.uid, withMembers).catch(() => showToast('Squad saved locally; cloud sync failed.', 'info'));
    }
  };

  const handleUpdateSquad = (trip: SquadTrip) => {
    setSquadTrips((prev) => prev.map((t) => (t.id === trip.id ? trip : t)));
    if (user?.uid) {
      squadTripService.syncSquadTrip(user.uid, trip).catch(() => undefined);
    }
  };

  const handleDeleteSquad = (id: string) => {
    setSquadTrips((prev) => prev.filter((t) => t.id !== id));
    if (user?.uid) {
      squadTripService.deleteSquadTrip(id, user.uid).catch(() => undefined);
    }
  };

  const handleJoinSquad = async (code: string) => {
    const parsed = parseSquadJoinCode(code);
    if (!parsed || !user?.uid) {
      showToast('Invalid join code', 'error');
      return;
    }

    try {
      let tripId = parsed.squadId;
      if (!tripId) {
        tripId = (await squadTripService.resolveTripIdFromJoinCode(code)) || '';
      }

      if (tripId) {
        const joined = await squadTripService.joinSquadTrip(tripId, user.uid);
        if (joined) {
          setSquadTrips((prev) => {
            const exists = prev.some((t) => t.id === joined.id);
            return exists ? prev.map((t) => (t.id === joined.id ? joined : t)) : [...prev, joined];
          });
          showToast(`Joined squad: ${joined.name}`, 'success');
          setCurrentView('squad');
          return;
        }
      }

      const trip: SquadTrip = {
        id: parsed.squadId || crypto.randomUUID(),
        name: parsed.name,
        destination: parsed.destination,
        members: parsed.members ?? [],
        items: [],
        joinCode: code,
        createdAt: new Date().toISOString(),
        memberIds: [user.uid],
      };
      handleCreateSquad(trip);
      showToast(`Joined squad: ${trip.name}`, 'success');
      setCurrentView('squad');
    } catch {
      showToast('Could not join squad', 'error');
    }
  };

  const handleDeleteLocation = (id: string) => {
    const locationToDelete = locations.find(l => l.id === id);
    if (!locationToDelete) return;

    // Optimistic delete
    setLocations(prev => prev.filter(l => l.id !== id));
    if (selectedLocationId === id) setSelectedLocationId(null);
    if (user?.uid) {
      unpublishLocation(id, user.uid).catch(() => undefined);
    }

    // Show undo toast
    showToast(`${locationToDelete.name} deleted`, 'info', {
      label: 'UNDO',
      onClick: () => {
        setLocations(prev => [locationToDelete, ...prev]);
      }
    });
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile({
      ...newProfile,
      searchName: newProfile.name.trim().toLowerCase(),
    });
  };

  const handleAddToBucketList = (item: string) => {
    if (profile && !profile.bucketList.includes(item)) {
      setProfile({ ...profile, bucketList: [...profile.bucketList, item] });
      showToast(`${item} added to bucket list!`, 'success');
    }
  };

  const handleRefreshDNA = async (e?: any) => {
    if (!profile || locations.length === 0) return;

    // Check if it's a manual click (force refresh)
    const isManualClick = e && e.type === 'click';

    setLoadingDNA(true);
    try {
      if (!isManualClick) {
        const cached = getCachedTravelDNA();
        if (cached) {
          setProfile({ ...profile, dna: cached });
          setLoadingDNA(false);
          return;
        }
      }
      const dna = await generateTravelDNA(locations, profile);
      setCachedTravelDNA(dna);
      setProfile({ ...profile, dna });
    } catch (e) { } finally { setLoadingDNA(false); }
  };

  const handleRefreshMuse = async () => {
    if (!profile || locations.length === 0) return;
    setIsLoadingMuse(true);
    try {
      const insights = await getTravelMuseInsights(locations, profile);
      setMuseInsights(insights);
    } catch (e) { } finally { setIsLoadingMuse(false); }
  };

  const handleSaveRecommendation = async (rec: AIRecommendation) => {
    if (locations.some(l => l.name === rec.name && !l.isVisited)) {
      showToast("Already in your wishlist!", 'info');
      return;
    }
    const newLoc: TravelLocation = {
      id: crypto.randomUUID(),
      name: rec.name,
      type: rec.type,
      rating: 0,
      likes: [],
      dislikes: [],
      dateVisited: new Date().toISOString(),
      isVisited: false,
      wishlistData: { discoveryRationale: rec.reason }
    };
    setLocations(prev => [newLoc, ...prev]);
    showToast(`${rec.name} saved for later! ✨`, 'success');
  };

  const handleOmniLog = (name: string) => {
    setCurrentView('add');
    showToast(`Logging: ${name}`, 'info');
  };

  const handleOmniSearch = async (q: string) => {
    setSemanticResultIds(null); // Clear previous semantic hits for a fresh local-first result
    const query = q.toLowerCase();
    let cleanSearch = q;

    // Intent Detection: Ratings (e.g., "5 stars", "rating > 4")
    const ratingMatch = query.match(/(\d)\s*stars?/) || query.match(/rating\s*>\s*(\d)/);
    if (ratingMatch) {
      setFilterMinRating(parseInt(ratingMatch[1]));
      cleanSearch = cleanSearch.replace(ratingMatch[0], '').trim();
    } else {
      setFilterMinRating(0); // Reset if not explicitly requested
    }

    // Intent Detection: Types (City, Country, etc.)
    if (query.includes('city') || query.includes('cities')) {
      setFilterType(LocationType.CITY);
      cleanSearch = cleanSearch.replace(/cities|city/gi, '').trim();
    } else if (query.includes('country') || query.includes('countries')) {
      setFilterType(LocationType.COUNTRY);
      cleanSearch = cleanSearch.replace(/countries|country/gi, '').trim();
    } else if (query.includes('landmark') || query.includes('landmarks')) {
      setFilterType(LocationType.LANDMARK);
      cleanSearch = cleanSearch.replace(/landmarks|landmark/gi, '').trim();
    } else {
      setFilterType('all');
    }

    setSearchTerm(cleanSearch);
    setCurrentView('history');
    setProactiveAIResults([]);

    // Automatically trigger semantic search for deep discovery
    if (cleanSearch.length > 3) {
      setIsSearchingAI(true);
      try {
        const ids = await performSemanticSearch(cleanSearch, locations, squadTrips);
        setSemanticResultIds(ids);

        if (ids.length < 2) {
          const recs = await getAIRecommendations(locations, profile!, undefined, 'cultural');
          setProactiveAIResults(recs);
        }
      } catch (e) {
        console.error("Semantic search failed", e);
      } finally {
        setIsSearchingAI(false);
      }
    }
  };

  const handleOmniImageUpload = async (file: File) => {
    setIsSearchingAI(true);
    showToast("Analyzing your travel photo...", 'info');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeLogImage(base64);
        setPrefilledLocation(result);
        setCurrentView('add');
        showToast("AI detected your location! Verify and save.", 'success');
      };
    } catch (e) {
      showToast("Photo analysis failed.", 'error');
    } finally {
      setIsSearchingAI(false);
    }
  };

  const handleOmniVoiceTranscription = async (text: string) => {
    setIsSearchingAI(true);
    showToast("Jules is listening... Extracting journey details.", 'info');
    try {
      const result = await analyzeVoiceCommand(text);
      setPrefilledLocation(result);
      setCurrentView('add');
      showToast("Voice log processed! Confirm details.", 'success');
    } catch (e) {
      showToast("Voice analysis failed.", 'error');
    } finally {
      setIsSearchingAI(false);
    }
  };

  const handleOmniAsk = (q: string) => {
    setCurrentView('jules');
  };

  const handleViewMap = (loc: TravelLocation) => {
    setActiveMap({ name: loc.name, coords: loc.coordinates || { lat: 0, lng: 0 } });
  };

  const handleSemanticSearch = async () => {
    if (!semanticSearchQuery.trim()) return;
    setIsSearchingAI(true);
    try {
      const ids = await performSemanticSearch(semanticSearchQuery, locations);
      setSemanticResultIds(ids);
    } catch (e) { } finally { setIsSearchingAI(false); }
  };

  const handleSimulateAlert = () => {
    // VC Demo: Simulate a proactive push notification based on DNA
    const highestTrait = profile?.dna ?
      Object.entries(profile.dna).sort(([, a], [, b]) => (b as number) - (a as number))[0][0] :
      'culture';

    const alerts = {
      food: "🍣 Proximity Alert: You're 2 blocks from a Michelin-star omakase. Your Food DNA is 98%—want me to grab a 7 PM reservation?",
      nature: "🌲 Weather Update: Tomorrow morning is perfect for the Hidden Waterfall trail you've been eyeing. Shall I add it to the itinerary?",
      culture: "🏛️ Curator Note: The Louvre has a rare exhibit opening in 30 mins matching your Renaissance interest. Get tickets?",
      adventure: "🌋 Spontaneous: A last-minute heli-skiing slot opened up for tomorrow based on your Chamonix log. Book it?",
      relaxation: "💆‍♀️ Recharge: You've walked 12 miles today. There's a highly-rated onsen 5 minutes away. Routing you there?",
      urban: "🏙️ Nightlife: The speakeasy you saved in your bucket list has a secret password tonight. Want it?"
    };

    const alertText = alerts[highestTrait as keyof typeof alerts] || alerts.culture;

    showToast(alertText, 'success');
  };

  if (!profile) return <div className="min-h-screen bg-[#14181c] flex items-center justify-center text-[#00e054]">Initializing Profile...</div>;

  return (
    <Layout>
      {showARViewfinder && (
        <Suspense fallback={null}>
          <ARViewfinder onClose={() => setShowARViewfinder(false)} />
        </Suspense>
      )}
      {showAutoExec && (
        <Suspense fallback={null}>
          <AutoExecutor onClose={() => setShowAutoExec(false)} />
        </Suspense>
      )}
      {showRwaInvest && (
        <Suspense fallback={null}>
          <RwaHotelInvest location={showRwaInvest} onClose={() => setShowRwaInvest(null)} />
        </Suspense>
      )}
      {showWatchHUD && (
        <div className="fixed bottom-4 right-4 z-[99] bg-[#0a0a0b] border-[6px] border-[#1b2228] p-3 rounded-[32px] w-40 h-48 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-500 cursor-pointer group hover:scale-105 transition-transform" onClick={() => setShowWatchHUD(false)}>
          <div className="absolute top-1 right-1 w-1.5 h-6 bg-[#2c3440] rounded-l-full"></div>
          <i className="fas fa-map-marker-alt text-[#00e054] text-4xl mb-3 animate-bounce shadow-[0_0_15px_rgba(0,224,84,0.5)] rounded-full text-shadow-glow"></i>
          <h4 className="text-white font-black uppercase text-sm text-center tracking-tight mb-1 group-hover:text-[#00e054] transition-colors">Turn Left</h4>
          <p className="text-[#9ab] text-[10px] text-center font-bold">Speakeasy in 40ft.</p>
          <div className="mt-2 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e054] animate-pulse"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e054] animate-pulse" style={{ animationDelay: '75ms' }}></span>
          </div>
        </div>
      )}
      {showReceiptScanner && (
        <ReceiptScanner
          onClose={() => setShowReceiptScanner(false)}
          onScanned={(loc) => {
            handleAddLocation(loc);
            setShowReceiptScanner(false);
          }}
        />
      )}
      <WalkmanMode onExtracted={(loc) => handleAddLocation(loc)} />

      <Header
        user={user}
        onViewChange={setCurrentView}
        currentView={currentView}
        onOmniLog={handleOmniLog}
        onOmniSearch={handleOmniSearch}
        onOmniAsk={handleOmniAsk}
        onOmniImageUpload={handleOmniImageUpload}
        onOmniVoiceTranscription={handleOmniVoiceTranscription}
        isOmniLoading={isSearchingAI}
        onSimulateAlert={handleSimulateAlert}
        onOpenScanner={() => setShowReceiptScanner(true)}
        onOpenAgency={() => setCurrentView('agency')}
        onOpenAR={() => setShowARViewfinder(true)}
        onOpenAutoExec={() => setShowAutoExec(true)}
        onOpenWatch={() => setShowWatchHUD(prev => !prev)}
      />

      <main className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        {/* Local/Ghost Mode Banner Removed */}

        <Suspense fallback={<DashboardShimmer />}>
          {currentView === 'add' && (
            <LocationForm
              onAdd={(loc) => {
                handleAddLocation(loc);
                setPrefilledLocation(null);
              }}
              prefilledData={prefilledLocation}
            />
          )}
          {currentView === 'profile' && (
            <Profile
              profile={profile}
              locations={locations}
              onUpdate={handleUpdateProfile}
              onOpenCreatorHub={() => setCurrentView('creator')}
              companionFilter={companionFilter}
              onCompanionFilterChange={setCompanionFilter}
            />
          )}
          {currentView === 'creator' && <CreatorDashboard onBack={() => setCurrentView('profile')} />}
          {currentView === 'agency' && <AgencyPortal onBack={() => setCurrentView('history')} />}
          {currentView === 'discovery' && <DiscoveryFeed />}
          {currentView === 'friends' && <FriendsHub />}
          {currentView === 'squad' && (
            <SquadHub
              trips={squadTrips}
              userId={user?.uid}
              userName={user?.displayName || 'Anonymous'}
              userAvatar={user?.photoURL}
              onCreate={handleCreateSquad}
              onJoin={handleJoinSquad}
              onUpdate={handleUpdateSquad}
              onDelete={handleDeleteSquad}
            />
          )}
          {currentView === 'bucketlist' && <BucketList items={profile.bucketList} onAdd={handleAddToBucketList} onRemove={(i) => setProfile({ ...profile, bucketList: profile.bucketList.filter(x => x !== i) })} />}
          {currentView === 'sharedlists' && user && (
            selectedCollaborativeListId ? (
              <CollaborativeList
                listId={selectedCollaborativeListId}
                userId={user.uid}
                userName={user.displayName || 'Anonymous'}
                friends={[]}
                onBack={() => setSelectedCollaborativeListId(null)}
              />
            ) : (
              <CollaborativeListsOverview
                userId={user.uid}
                onSelectList={(id) => setSelectedCollaborativeListId(id)}
                onCreateList={() => setCurrentView('add')}
              />
            )
          )}
          {currentView === 'jules' && <AskJules locations={locations} profile={profile!} />}
          {currentView === 'badges' && <AchievementBadges locations={locations} />}

          {currentView === 'history' && (
            <div className="space-y-12">
              <Dashboard locations={displayLocations} dna={profile.dna} onRefreshDNA={handleRefreshDNA} />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Your World</h2>
                  <p
                    data-testid="memories-count"
                    className="text-[#567] text-sm font-bold uppercase tracking-widest mt-1"
                  >
                    {displayLocations.length} Memories{companionFilter ? ` (${companionFilter})` : ''}
                    {companionFilter && locations.length !== displayLocations.length ? ` · ${locations.length} total` : ''}
                  </p>
                  <CompanionFilterChips
                    selected={companionFilter}
                    onChange={setCompanionFilter}
                    className="mt-4"
                  />
                </div>

                <div className="flex items-center gap-4 bg-[#1b2228]/40 p-2 rounded-full border border-[#2c3440]">
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-transparent text-[10px] font-black uppercase text-[#def] outline-none px-4">
                    <option value="all">Everywhere</option>
                    <option value={LocationType.CITY}>Cities</option>
                    <option value={LocationType.STATE}>States</option>
                    <option value={LocationType.COUNTRY}>Countries</option>
                    <option value={LocationType.LANDMARK}>Landmarks</option>
                  </select>
                  <div className="w-px h-6 bg-[#2c3440] mx-2" />
                  <div className="flex bg-[#2c3440] rounded-full p-1 border border-[#2c3440]">
                    <input
                      type="text"
                      placeholder="Smart Search..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!e.target.value) setSemanticResultIds(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleOmniSearch(searchTerm)}
                      className="bg-transparent border-none outline-none text-xs font-bold text-white px-3 w-64"
                    />
                    <Button variant="ghost" className="!p-1 !text-[10px]" onClick={() => handleOmniSearch(searchTerm)} isLoading={isSearchingAI}><i className="fas fa-brain"></i></Button>
                  </div>
                </div>
              </div>

              {semanticResultIds && unifiedSearchResults.length > 0 && (
                <div className="bg-[#00e054]/5 border border-[#00e054]/20 p-6 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                  <div className="w-12 h-12 rounded-full bg-[#00e054] flex items-center justify-center text-black shrink-0">
                    <i className="fas fa-brain"></i>
                  </div>
                  <div>
                    <h4 className="text-[#00e054] font-black uppercase tracking-widest text-xs mb-1">Jules' Spotlight</h4>
                    <p className="text-[#def] text-sm font-medium">I've discovered these memories and trips based on the <span className="text-[#00e054]">conceptual vibe</span> of your search for "{searchTerm}".</p>
                  </div>
                </div>
              )}

              {locations.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-[#2c3440] rounded-3xl bg-[#1b2228]/20 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-[#2c3440] rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-book-open text-3xl text-[#567]"></i>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Your Journey Begins Here</h3>
                  <p className="text-[#9ab] text-sm font-medium mb-8 max-w-md mx-auto">Start adding visited locations to build your personal travel story and unlock your Travel DNA.</p>
                  <Button
                    className="bg-[#00e054] text-black hover:bg-[#00c044] font-bold px-8 py-6 rounded-xl text-lg shadow-[0_0_20px_rgba(0,224,84,0.2)] hover:shadow-[0_0_30px_rgba(0,224,84,0.4)] transition-all"
                    onClick={() => {
                      const searchInput = document.getElementById('main-search-input');
                      if (searchInput) {
                        searchInput.focus();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Log Your First Memory
                  </Button>
                </div>
              ) : unifiedSearchResults.length === 0 ? (
                <div className="space-y-12">
                  <div className="py-24 text-center border-2 border-dashed border-[#2c3440] rounded-3xl">
                    <i className="fas fa-ghost text-4xl text-[#2c3440] mb-4"></i>
                    <p className="text-[#567] font-black uppercase tracking-widest text-xs">No results found for "{searchTerm}"</p>
                  </div>

                  {proactiveAIResults.length > 0 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#00e054] flex items-center justify-center text-black text-xs">
                          <i className="fas fa-robot"></i>
                        </div>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">Jules' Recommendations</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {proactiveAIResults.map((rec, idx) => (
                          <div key={idx} className="bg-[#1b2228]/40 border border-[#00e054]/20 p-8 rounded-2xl hover:border-[#00e054]/50 transition-all group">
                            <span className="text-[10px] font-black text-[#00e054] uppercase tracking-widest mb-2 block">{rec.type}</span>
                            <h4 className="text-xl font-black text-white mb-4 group-hover:text-[#00e054] transition-colors">{rec.name}</h4>
                            <p className="text-[#9ab] text-xs leading-relaxed mb-6 italic">"{rec.reason}"</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full bg-[#00e054]/10 hover:bg-[#00e054] hover:text-black border border-[#00e054]/20"
                              onClick={() => handleSaveRecommendation(rec)}
                            >
                              Add to Bucket List
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {unifiedSearchResults.map((item) => (
                    item.resultType === 'location' ? (
                      item.isVisited ? (
                        <div key={item.id} className="group bg-[#1b2228]/60 backdrop-blur-sm border border-[#2c3440] rounded-2xl overflow-hidden hover:border-[#00e054]/40 transition-all duration-500">
                          <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <span className="text-[10px] font-black text-[#00e054] uppercase tracking-[0.2em] mb-2 block">{item.type}</span>
                                <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-[#00e054] transition-colors line-clamp-1">
                                  <HighlightText text={item.name} highlight={searchTerm} />
                                </h3>
                              </div>
                              <div className="bg-[#2c3440] w-12 h-12 rounded-xl flex items-center justify-center text-xl">
                                {item.type === LocationType.COUNTRY ? '🌍' : item.type === LocationType.STATE ? '📍' : '🏙️'}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mb-8">
                              <StarRating rating={item.rating} size="sm" />
                              <span className="text-[10px] font-black text-[#567] uppercase tracking-widest">{new Date(item.dateVisited).getFullYear()}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="bg-[#2c3440]/50 hover:bg-[#00e054] hover:text-[#14181c]" onClick={() => handleViewMap(item)}>Map</Button>
                              <Button variant="ghost" size="sm" className="bg-[#2c3440]/50 hover:bg-[#40bcf4] hover:text-[#14181c]" onClick={() => { setSelectedLocationId(item.id); setCurrentView('savedtrips'); }}>Detail</Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-[#2c3440]/50 hover:bg-white hover:text-[#14181c]"
                                onClick={() => {
                                  setShareModalTrip(item);
                                  setShareModalOpen(true);
                                }}
                              >
                                <i className="fas fa-share-alt" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={item.id} className="group bg-[#141d26] backdrop-blur-sm border border-[#40bcf4]/20 rounded-2xl overflow-hidden hover:border-[#40bcf4]/50 transition-all duration-500 relative">
                          <div className="absolute top-4 right-4 bg-[#40bcf4]/10 text-[#40bcf4] text-[8px] font-black uppercase px-2 py-1 rounded-full border border-[#40bcf4]/20 italic">Wishlist</div>
                          <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <span className="text-[10px] font-black text-[#40bcf4] uppercase tracking-[0.2em] mb-2 block">{item.type}</span>
                                <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-[#40bcf4] transition-colors line-clamp-1">
                                  <HighlightText text={item.name} highlight={searchTerm} />
                                </h3>
                              </div>
                              <div className="bg-[#2c3440] w-12 h-12 rounded-xl flex items-center justify-center text-xl">✨</div>
                            </div>
                            <div className="mb-8">
                              <p className="text-[#9ab] text-xs line-clamp-2 leading-relaxed">
                                {item.wishlistData?.discoveryRationale || "Matches your travel DNA. Explore the vibes and plan your next story."}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="ghost" size="sm" className="w-full bg-[#40bcf4]/10 hover:bg-[#40bcf4] hover:text-[#14181c] border border-[#40bcf4]/20" onClick={() => { setSelectedLocationId(item.id); setCurrentView('savedtrips'); }}>
                                Why You'll Like This
                              </Button>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="flex-1 bg-[#2c3440]/50 hover:bg-white hover:text-black">Map</Button>
                                <Button variant="ghost" size="sm" className="flex-1 bg-[#2c3440]/50 hover:bg-[#00e054] hover:text-black" onClick={() => handleAddLocation({ ...item, isVisited: true })}>Log Visit</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div key={item.id} className="group bg-[#1b2228]/60 backdrop-blur-sm border border-[#40bcf4]/20 rounded-2xl overflow-hidden hover:border-[#40bcf4]/50 transition-all duration-500 relative">
                        <div className="absolute top-4 right-4 bg-[#40bcf4]/20 text-[#40bcf4] text-[8px] font-black uppercase px-2 py-1 rounded-full border border-[#40bcf4]/30">Squad Trip</div>
                        <div className="p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <span className="text-[10px] font-black text-[#40bcf4] uppercase tracking-[0.2em] mb-2 block">{item.destination}</span>
                              <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-[#40bcf4] transition-colors line-clamp-1">
                                <HighlightText text={item.name} highlight={searchTerm} />
                              </h3>
                            </div>
                            <div className="bg-[#2c3440] w-12 h-12 rounded-xl flex items-center justify-center text-xl">👥</div>
                          </div>
                          <div className="flex -space-x-2 mb-8">
                            {(item.members || []).slice(0, 5).map((m, i) => (
                              <div key={i} title={m?.name || 'Explorer'} className="w-8 h-8 rounded-full bg-[#2c3440] border-2 border-[#1b2228] flex items-center justify-center text-[10px] font-black text-white uppercase overflow-hidden">
                                {m?.name?.charAt(0) || '?'}
                              </div>
                            ))}
                            {(item.members || []).length > 5 && (
                              <div className="w-8 h-8 rounded-full bg-[#1b2228] border-2 border-[#2c3440] flex items-center justify-center text-[8px] font-black text-[#567]">
                                +{item.members.length - 5}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="w-full bg-[#40bcf4]/10 hover:bg-[#40bcf4] hover:text-[#14181c] border border-[#40bcf4]/20" onClick={() => setCurrentView('squad')}>
                              View Board
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Timeline Flow */}
              <div className="mt-24 mb-12 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#00e054]/10 flex items-center justify-center">
                  <i className="fas fa-route text-[#00e054] text-xs"></i>
                </div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Timeline</h3>
              </div>
              <Timeline
                topBucketItem={profile?.bucketList?.[0]}
                locations={displayLocations}
                onTravel={(loc) => {
                  setSelectedLocationId(loc.id);
                  setCurrentView('savedtrips');
                }}
                onShare={(loc) => {
                  setShareModalTrip(loc);
                  setShareModalOpen(true);
                }}
                onInvest={(loc) => setShowRwaInvest(loc)}
              />
            </div>
          )}

          {currentView === 'savedtrips' && (
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Your Stories</h2>
                {selectedLocationId && <Button variant="ghost" onClick={() => setSelectedLocationId(null)} className="text-[#567] hover:text-white">Close</Button>}
              </div>

              {selectedLocationId ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {(() => {
                    const loc = displayLocations.find(l => l.id === selectedLocationId) ?? locations.find(l => l.id === selectedLocationId);
                    if (!loc) return null;
                    return loc.isVisited ? (
                      <Timeline
                        topBucketItem={profile?.bucketList?.[0]}
                        locations={[loc]}
                        onTravel={() => { }}
                        onInvest={(l) => setShowRwaInvest(l)}
                      />
                    ) : (
                      <DiscoveryIntelligence
                        location={loc}
                        visitedLocations={displayLocations.filter(l => l.isVisited)}
                        profile={profile!}
                        onLogVisit={(l) => handleAddLocation({ ...l, isVisited: true })}
                        onSaveToWishlist={(name) => showToast(`${name} is safe in your wishlist!`, 'success')}
                      />
                    );
                  })()}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <Recommendations visitedLocations={locations} profile={profile} onSave={handleSaveRecommendation} savedNames={savedRecommendations.map(s => s.name)} />
                    <TravelMuse insights={museInsights} isLoading={isLoadingMuse} />
                  </div>
                </div>
              ) : locations.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-[#2c3440] rounded-3xl bg-[#1b2228]/20 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-[#2c3440] rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-book-open text-3xl text-[#567]"></i>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Your Journey Begins Here</h3>
                  <p className="text-[#9ab] text-sm font-medium mb-8 max-w-md mx-auto">Start adding visited locations to build your personal travel story and unlock your Travel DNA.</p>
                  <Button
                    className="bg-[#00e054] text-black hover:bg-[#00c044] font-bold px-8 py-6 rounded-xl text-lg shadow-[0_0_20px_rgba(0,224,84,0.2)] hover:shadow-[0_0_30px_rgba(0,224,84,0.4)] transition-all"
                    onClick={() => {
                      const searchInput = document.getElementById('main-search-input');
                      if (searchInput) {
                        searchInput.focus();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Log Your First Memory
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayLocations.slice(0, 6).map(loc => (
                    <div key={loc.id} onClick={() => setSelectedLocationId(loc.id)} className="cursor-pointer bg-[#1b2228]/40 border border-[#2c3440] p-6 rounded-2xl hover:bg-[#1b2228]/60 transition-all text-center group">
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🗺️</div>
                      <h4 className="text-white font-black uppercase tracking-widest text-sm mb-1">{loc.name}</h4>
                      <p className="text-[#567] text-[10px] uppercase font-black tracking-widest">Open Story</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Suspense>
      </main>

      {activeMap && (
        <MapModal isOpen={!!activeMap} onClose={() => setActiveMap(null)} locationName={activeMap.name} center={activeMap.coords} />
      )}

      {/* Share Modal */}
      {shareModalOpen && shareModalTrip && user && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareModalTrip(null);
          }}
          resource="trip"
          trip={shareModalTrip}
          userId={user.uid}
          userName={user.displayName || 'Anonymous'}
          userAvatar={user.photoURL}
          stats={{
            countries: new Set(locations.filter(l => l.type === LocationType.COUNTRY).map(l => l.name)).size,
            states: new Set(locations.filter(l => l.type === LocationType.STATE).map(l => l.name)).size,
          }}
        />
      )}

      {showRwaInvest && profile && (
        <Suspense fallback={null}>
          <RwaHotelInvest
            location={showRwaInvest}
            userCredits={profile.wanderlogCredits ?? 50000}
            onPurchaseComplete={(cost, assetName) => {
              const currentVault = profile.vault || [];
              const currentBal = profile.wanderlogCredits ?? 50000;
              const updatedProfile = { 
                ...profile, 
                wanderlogCredits: currentBal - cost,
                vault: [...currentVault, assetName] 
              };
              setProfile(updatedProfile);
              if (user) {
                saveToCloud(user.uid, { locations, profile: updatedProfile, squadTrips, savedRecommendations });
              }
            }}
            onClose={() => setShowRwaInvest(null)}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <PwaPrompt />
      </Suspense>
    </Layout>
  );
};

export default App;
