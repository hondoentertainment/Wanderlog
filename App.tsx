
import React, { useState, useEffect, useMemo } from 'react';
import { TravelLocation, LocationType, UserProfile, SavedRecommendation, AIRecommendation, ItineraryDay, TravelDNA, TravelMuseInsight, SquadTrip } from './types';
import { loadAppData, saveAppData } from './services/storageService';
import { getLocationDetails, geocodeLocation, generateItinerary, generateTravelDNA, performSemanticSearch, exportItineraryToICS, getTravelMuseInsights } from './services/geminiService';
import { LocationForm } from './components/LocationForm';
import { Recommendations } from './components/Recommendations';
import { Button } from './components/Button';
import { Profile } from './components/Profile';
import { MapModal } from './components/MapModal';
import { StarRating } from './components/StarRating';
import { Dashboard } from './components/Dashboard';
import { Timeline } from './components/Timeline';
import { TravelMuse } from './components/TravelMuse';
import { SquadHub } from './components/SquadHub';

const App: React.FC = () => {
  const [locations, setLocations] = useState<TravelLocation[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([]);
  const [squadTrips, setSquadTrips] = useState<SquadTrip[]>([]);
  const [currentView, setCurrentView] = useState<'history' | 'wishlist' | 'profile' | 'add' | 'squad'>('history');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | LocationType>('all');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'rating' | 'date'>('date');

  const [activeMap, setActiveMap] = useState<{ id: string; name: string; coords: { lat: number; lng: number; zoom?: number } } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<string | null>(null);
  const [loadingItinerary, setLoadingItinerary] = useState<string | null>(null);
  const [loadingDNA, setLoadingDNA] = useState(false);

  const [semanticSearchQuery, setSemanticSearchQuery] = useState('');
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [semanticResultIds, setSemanticResultIds] = useState<string[] | null>(null);

  const [museInsights, setMuseInsights] = useState<TravelMuseInsight[]>([]);
  const [isLoadingMuse, setIsLoadingMuse] = useState(false);

  useEffect(() => {
    const { locations: savedLocs, profile: savedProfile, savedRecommendations: savedRecs, squadTrips: savedSquads } = loadAppData();
    setLocations(savedLocs);
    setProfile(savedProfile);
    setSavedRecommendations(savedRecs);
    setSquadTrips(savedSquads || []);
  }, []);

  useEffect(() => {
    if (profile) {
      saveAppData(locations, profile, savedRecommendations, squadTrips);
    }
  }, [locations, profile, savedRecommendations, squadTrips]);

  const handleAddLocation = (newLoc: Omit<TravelLocation, 'id'>) => {
    const location: TravelLocation = { ...newLoc, id: crypto.randomUUID() };
    setLocations(prev => [location, ...prev]);
    setCurrentView('history');
  };

  const handleDeleteLocation = (id: string) => {
    if (window.confirm("Are you sure?")) {
      setLocations(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleSemanticSearch = async () => {
    if (!semanticSearchQuery.trim()) {
      setSemanticResultIds(null);
      return;
    }
    setIsSearchingAI(true);
    try {
      const ids = await performSemanticSearch(semanticSearchQuery, locations);
      setSemanticResultIds(ids);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingAI(false);
    }
  };

  const handleExportItinerary = (rec: SavedRecommendation) => {
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

  const handleRefreshDNA = async () => {
    if (!profile || locations.length === 0) return;
    setLoadingDNA(true);
    try {
      const dna = await generateTravelDNA(locations, profile);
      setProfile({ ...profile, dna });
    } catch (e) {
      console.error("DNA Refresh failed", e);
    } finally {
      setLoadingDNA(false);
    }
  };

  const handleRefreshMuse = async () => {
    if (!profile || locations.length === 0) return;
    setIsLoadingMuse(true);

    let currentCoords: { latitude: number; longitude: number } | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      });
      currentCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) { }

    try {
      const insights = await getTravelMuseInsights(locations, profile, currentCoords);
      setMuseInsights(insights);
    } catch (e) {
      console.error("Muse refresh failed", e);
    } finally {
      setIsLoadingMuse(false);
    }
  };

  const handleCreateSquad = (trip: SquadTrip) => {
    setSquadTrips([...squadTrips, trip]);
  };

  const handleJoinSquad = (code: string) => {
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
        setSquadTrips([...squadTrips, newTrip]);
      }
    } catch (e) {
      alert("Invalid Squad Join Code.");
    }
  };

  const handleUpdateSquad = (updated: SquadTrip) => {
    setSquadTrips(squadTrips.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteSquad = (id: string) => {
    if (confirm("Delete this Squad Trip?")) {
      setSquadTrips(squadTrips.filter(s => s.id !== id));
    }
  };

  const handleShareLocation = async (loc: TravelLocation) => {
    const text = `Trip to ${loc.name}: ${loc.rating}/5 stars! ✅ Pros: ${loc.likes.join(', ')} #WanderLog`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Trip to ${loc.name}`, text, url: window.location.href });
      } catch (err) { }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Summary copied!');
    }
  };

  const handleUpdateProfile = (newProfile: UserProfile) => setProfile(newProfile);

  const handleSaveRecommendation = async (rec: AIRecommendation) => {
    if (savedRecommendations.some(s => s.name === rec.name)) return;
    const newId = crypto.randomUUID();
    const newSaved: SavedRecommendation = { ...rec, id: newId, dateSaved: new Date().toISOString() };
    setSavedRecommendations(prev => [newSaved, ...prev]);
    try {
      const details = await getLocationDetails(rec.name, rec.type);
      setSavedRecommendations(prev => prev.map(item => item.id === newId ? { ...item, ...details } : item));
    } catch (e) { }
  };

  const handleGenerateItinerary = async (rec: SavedRecommendation) => {
    if (loadingItinerary) return;
    setLoadingItinerary(rec.id);
    try {
      const itinerary = await generateItinerary(rec.name, rec.type, rec.description || '', rec.attractions || []);
      setSavedRecommendations(prev => prev.map(item => item.id === rec.id ? { ...item, itinerary } : item));
    } catch (e) {
      alert("AI planning failed.");
    } finally {
      setLoadingItinerary(null);
    }
  };

  const handleViewMap = async (loc: TravelLocation) => {
    if (loc.coordinates) {
      setActiveMap({ id: loc.id, name: loc.name, coords: loc.coordinates });
    } else {
      setIsGeocoding(loc.id);
      try {
        const coords = await geocodeLocation(loc.name, loc.type);
        if (coords) {
          setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, coordinates: coords } : l));
          setActiveMap({ id: loc.id, name: loc.name, coords });
        }
      } catch (e) { } finally { setIsGeocoding(null); }
    }
  };

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

  if (!profile) return (
    <div className="min-h-screen bg-[#14181c] flex items-center justify-center">
      <div className="text-center">
        <i className="fas fa-location-arrow text-[#00e054] text-4xl animate-pulse"></i>
        <p className="text-[#9ab] mt-4 text-sm font-bold uppercase tracking-widest">Loading WanderLog...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#14181c] text-[#9ab] selection:bg-[#00c030] selection:text-white pb-24">
      {activeMap && (
        <MapModal
          name={activeMap.name}
          coords={activeMap.coords}
          onClose={() => setActiveMap(null)}
          onSaveView={(c) => setLocations(prev => prev.map(l => l.id === activeMap.id ? { ...l, coordinates: c } : l))}
          allLocations={locations}
        />
      )}

      <header className="bg-[#1b2228] sticky top-0 z-40 border-b border-[#2c3440]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-white font-black tracking-tighter text-2xl flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('history')}>
              <i className="fas fa-location-arrow text-[#00e054]"></i> WANDERLOG
            </h1>
            <nav className="hidden md:flex items-center gap-6 text-[11px] font-black uppercase tracking-widest">
              {['history', 'wishlist', 'squad'].map(v => (
                <button
                  key={v}
                  onClick={() => setCurrentView(v as any)}
                  className={`transition-colors hover:text-white ${currentView === v ? 'text-white border-b-2 border-[#00e054] pb-1' : ''}`}
                >
                  {v === 'squad' ? 'Squads' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="primary" onClick={() => setCurrentView('add')}><i className="fas fa-plus"></i> LOG</Button>

            {/* Profile trigger in upper right corner */}
            <button
              onClick={() => setCurrentView('profile')}
              className={`flex items-center gap-3 px-2 py-1.5 rounded-sm hover:bg-[#2c3440] transition-all group ${currentView === 'profile' ? 'bg-[#2c3440]' : ''}`}
            >
              <div className="hidden sm:block text-right">
                <span className="block text-[10px] font-black text-white uppercase tracking-tighter leading-none">{profile.name}</span>
                <span className="block text-[8px] font-bold text-[#567] uppercase tracking-widest mt-0.5 group-hover:text-[#9ab] transition-colors">View Profile</span>
              </div>
              <div className="w-8 h-8 rounded border border-[#456] bg-[#2c3440] flex items-center justify-center text-[11px] font-black text-white overflow-hidden group-hover:border-[#00e054] transition-all">
                {profile.name.charAt(0)}
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {currentView === 'add' && <LocationForm onAdd={handleAddLocation} />}
        {currentView === 'profile' && <Profile profile={profile} onUpdate={handleUpdateProfile} />}
        {currentView === 'squad' && <SquadHub trips={squadTrips} onCreate={handleCreateSquad} onJoin={handleJoinSquad} onUpdate={handleUpdateSquad} onDelete={handleDeleteSquad} />}

        {currentView === 'wishlist' && (
          <div className="space-y-8">
            <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest border-b border-[#2c3440] pb-2">Your Wishlist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedRecommendations.length > 0 ? savedRecommendations.map(rec => (
                <div key={rec.id} className="bg-[#1b2228] p-6 rounded border border-[#2c3440] hover:bg-[#202830] transition-colors group relative flex flex-col h-full">
                  <h3 className="text-xl font-black text-white leading-tight">{rec.name}</h3>
                  <p className="text-[#9ab] text-[13px] italic mt-2 border-l-2 border-[#2c3440] pl-3">"{rec.reason}"</p>

                  <div className="mt-4 flex-grow">
                    {!rec.itinerary ? (
                      <Button variant="ghost" className="w-full !px-0" onClick={() => handleGenerateItinerary(rec)} isLoading={loadingItinerary === rec.id}>
                        <i className="fas fa-wand-magic-sparkles text-[#ff8000]"></i> PLAN 3-DAY ITINERARY
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-[#ff8000]">3-Day Planner</span>
                          <Button variant="ghost" className="!p-1 !text-[8px]" onClick={() => handleExportItinerary(rec)}>
                            <i className="fas fa-calendar-plus"></i> EXPORT .ICS
                          </Button>
                        </div>
                        {rec.itinerary.map(day => (
                          <div key={day.day} className="bg-[#2c3440]/30 p-2 rounded-sm text-[10px] text-[#9ab]">
                            <span className="font-black text-[#40bcf4]">Day {day.day}:</span> {day.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-16 text-center opacity-30 text-[10px] font-black uppercase tracking-widest border border-dashed border-[#2c3440]">Wishlist is empty</div>
              )}
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="space-y-12">
            <Dashboard locations={locations} dna={profile.dna} onRefreshDNA={handleRefreshDNA} isDNAlOading={loadingDNA} />

            <section className="bg-[#1b2228] p-6 rounded border border-[#2c3440]">
              <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-6">Proactive Muse Insights</h3>
              <TravelMuse insights={museInsights} isLoading={isLoadingMuse} onRefresh={handleRefreshMuse} />
            </section>

            <section className="bg-[#1b2228] p-6 rounded border border-[#2c3440]">
              <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-6">Chronological History</h3>
              <Timeline locations={locations} onTravel={handleViewMap} />
            </section>

            <Recommendations visitedLocations={locations} profile={profile} onSave={handleSaveRecommendation} savedNames={savedRecommendations.map(s => s.name)} />

            <section className="space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#2c3440] pb-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest">Diary</h2>
                  <div className="flex bg-[#2c3440] rounded-sm p-1">
                    <input
                      type="text"
                      placeholder="Semantic Search AI..."
                      value={semanticSearchQuery}
                      onChange={(e) => {
                        setSemanticSearchQuery(e.target.value);
                        if (!e.target.value) setSemanticResultIds(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                      className="bg-transparent border-none outline-none text-[11px] font-bold text-white px-2 w-48"
                    />
                    <Button variant="ghost" className="!p-1 !text-[10px]" onClick={handleSemanticSearch} isLoading={isSearchingAI}><i className="fas fa-brain"></i></Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <input type="text" placeholder="Filter name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#2c3440] px-4 py-1.5 rounded-sm text-[11px] font-bold text-white outline-none w-40" />
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-[#1b2228] text-[10px] font-black uppercase text-[#9ab] outline-none">
                    <option value="date">Sort: Recent</option>
                    <option value="rating">Sort: Highest Rated</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-[#2c3440]">
                {filteredLocations.length > 0 ? filteredLocations.map((loc) => (
                  <div key={loc.id} className="group flex items-center justify-between py-4 px-2 hover:bg-[#1b2228] transition-colors rounded">
                    <div className="flex items-center gap-6">
                      <div className="w-12 text-center text-[10px] font-black uppercase text-[#567]">{new Date(loc.dateVisited).getFullYear()}</div>
                      <div>
                        <h3 className="text-white text-lg font-black tracking-tight leading-none group-hover:text-[#40bcf4] transition-colors cursor-pointer" onClick={() => handleViewMap(loc)}>{loc.name}</h3>
                        <div className="flex items-center gap-3 mt-1"><StarRating rating={loc.rating} /><span className="text-[9px] font-black text-[#567] uppercase">{loc.type}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100">
                      <button onClick={() => handleShareLocation(loc)} className="text-[#567] hover:text-[#00e054]"><i className="fas fa-share-alt"></i></button>
                      <button onClick={() => handleDeleteLocation(loc.id)} className="text-[#567] hover:text-red-500"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">No logs found</div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
