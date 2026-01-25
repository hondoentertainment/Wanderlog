
import React, { useState, useEffect, useMemo } from 'react';
import { TravelLocation, LocationType, UserProfile, SavedRecommendation, AIRecommendation } from './types';
import { loadAppData, saveAppData } from './services/storageService';
import { getLocationDetails, geocodeLocation } from './services/geminiService';
import { LocationForm } from './components/LocationForm';
import { Recommendations } from './components/Recommendations';
import { Button } from './components/Button';
import { Profile } from './components/Profile';
import { MapModal } from './components/MapModal';
import { StarRating } from './components/StarRating';

const App: React.FC = () => {
  const [locations, setLocations] = useState<TravelLocation[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([]);
  const [currentView, setCurrentView] = useState<'history' | 'wishlist' | 'profile' | 'add'>('history');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | LocationType>('all');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'rating' | 'date'>('date');

  const [activeMap, setActiveMap] = useState<{ id: string; name: string; coords: { lat: number; lng: number; zoom?: number } } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<string | null>(null);

  useEffect(() => {
    const { locations: savedLocs, profile: savedProfile, savedRecommendations: savedRecs } = loadAppData();
    setLocations(savedLocs);
    setProfile(savedProfile);
    setSavedRecommendations(savedRecs);
  }, []);

  useEffect(() => {
    if (profile) {
      saveAppData(locations, profile, savedRecommendations);
    }
  }, [locations, profile, savedRecommendations]);

  const handleAddLocation = (newLoc: Omit<TravelLocation, 'id'>) => {
    const location: TravelLocation = {
      ...newLoc,
      id: crypto.randomUUID()
    };
    setLocations(prev => [location, ...prev]);
    setCurrentView('history');
  };

  const handleDeleteLocation = (id: string) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      setLocations(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  const handleSaveRecommendation = async (rec: AIRecommendation) => {
    if (savedRecommendations.some(s => s.name === rec.name)) return;
    
    const newId = crypto.randomUUID();
    const newSaved: SavedRecommendation = {
      ...rec,
      id: newId,
      dateSaved: new Date().toISOString()
    };
    
    setSavedRecommendations(prev => [newSaved, ...prev]);

    try {
      const details = await getLocationDetails(rec.name, rec.type);
      setSavedRecommendations(prev => 
        prev.map(item => item.id === newId ? { ...item, ...details } : item)
      );
    } catch (e) {
      console.error("Failed to enrich location details:", e);
    }
  };

  const handleDeleteSavedRecommendation = (id: string) => {
    setSavedRecommendations(prev => prev.filter(s => s.id !== id));
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
        } else {
          alert("Could not find coordinates.");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsGeocoding(null);
      }
    }
  };

  const handleSaveMapView = (newCoords: { lat: number; lng: number; zoom: number }) => {
    if (!activeMap) return;
    
    setLocations(prev => prev.map(loc => 
      loc.id === activeMap.id ? { ...loc, coordinates: newCoords } : loc
    ));
    
    // Also check wishlist just in case
    setSavedRecommendations(prev => prev.map(rec => 
      rec.id === activeMap.id ? { ...rec, coordinates: newCoords } : rec
    ));

    alert("Map view saved!");
  };

  const filteredLocations = useMemo(() => {
    return locations
      .filter(loc => {
        const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || loc.type === filterType;
        const matchesRating = loc.rating >= filterMinRating;
        return matchesSearch && matchesType && matchesRating;
      })
      .sort((a, b) => {
        if (sortOrder === 'rating') return b.rating - a.rating;
        return new Date(b.dateVisited).getTime() - new Date(a.dateVisited).getTime();
      });
  }, [locations, searchTerm, filterType, filterMinRating, sortOrder]);

  const savedNames = useMemo(() => savedRecommendations.map(s => s.name), [savedRecommendations]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#14181c] text-[#9ab] selection:bg-[#00c030] selection:text-white">
      {activeMap && (
        <MapModal 
          name={activeMap.name} 
          coords={activeMap.coords} 
          onClose={() => setActiveMap(null)}
          onSaveView={handleSaveMapView}
        />
      )}

      {/* Header */}
      <header className="bg-[#1b2228] sticky top-0 z-40 border-b border-[#2c3440]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-white font-black tracking-tighter text-2xl flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('history')}>
              <i className="fas fa-location-arrow text-[#00e054]"></i>
              WANDERLOG
            </h1>
            <nav className="hidden md:flex items-center gap-6 text-[11px] font-black uppercase tracking-widest">
              <button 
                onClick={() => setCurrentView('history')}
                className={`transition-colors hover:text-white ${currentView === 'history' ? 'text-white border-b-2 border-[#00e054] pb-1 mt-1' : ''}`}
              >
                Journal
              </button>
              <button 
                onClick={() => setCurrentView('wishlist')}
                className={`transition-colors hover:text-white ${currentView === 'wishlist' ? 'text-white border-b-2 border-[#00e054] pb-1 mt-1' : ''}`}
              >
                Wishlist
              </button>
              <button 
                onClick={() => setCurrentView('profile')}
                className={`transition-colors hover:text-white ${currentView === 'profile' ? 'text-white border-b-2 border-[#00e054] pb-1 mt-1' : ''}`}
              >
                Profile
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             <Button variant="primary" onClick={() => setCurrentView('add')}>
               <i className="fas fa-plus"></i> LOG
             </Button>
             <div className="w-8 h-8 rounded-full bg-[#456] flex items-center justify-center text-[10px] font-bold text-white cursor-pointer" onClick={() => setCurrentView('profile')}>
                {profile.name.charAt(0)}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {currentView === 'add' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl mx-auto">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-black tracking-widest uppercase">Add to your diary</h2>
                <button onClick={() => setCurrentView('history')} className="text-[#9ab] hover:text-white transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
             </div>
             <LocationForm onAdd={handleAddLocation} />
          </div>
        )}

        {currentView === 'profile' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Profile profile={profile} onUpdate={handleUpdateProfile} />
          </section>
        )}

        {currentView === 'wishlist' && (
          <section className="animate-in fade-in duration-300 space-y-8">
            <div className="flex justify-between items-baseline border-b border-[#2c3440] pb-2">
              <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest">Wishlist</h2>
              <span className="text-[10px] font-bold text-gray-600 tracking-tighter uppercase">{savedRecommendations.length} Destinations</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedRecommendations.length > 0 ? (
                savedRecommendations.map((rec) => (
                  <div key={rec.id} className="bg-[#1b2228] p-6 rounded border border-[#2c3440] hover:bg-[#202830] transition-colors group relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-[#40bcf4] tracking-widest mb-1 block">{rec.type}</span>
                        <h3 className="text-xl font-black text-white leading-tight">{rec.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-[#567] font-black uppercase tracking-tighter">Match</div>
                        <div className="text-lg font-black text-[#00e054]">{rec.suggestedRatingMatch}%</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[#9ab] text-[13px] leading-relaxed italic border-l-2 border-[#2c3440] pl-3">
                        "{rec.reason}"
                      </p>

                      {rec.description && (
                        <p className="text-[#89a] text-[12px] leading-relaxed">{rec.description}</p>
                      )}

                      {rec.attractions && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {rec.attractions.map((a, i) => (
                            <span key={i} className="text-[9px] font-black uppercase bg-[#2c3440] text-[#9ab] px-2 py-0.5 rounded tracking-tighter">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#2c3440] flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-3">
                        {rec.links?.map((link, lidx) => (
                          <a key={lidx} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-[#9ab] hover:text-white flex items-center gap-1.5">
                             <i className="fas fa-link text-[8px]"></i> {link.title}
                          </a>
                        ))}
                      </div>
                      <button onClick={() => handleDeleteSavedRecommendation(rec.id)} className="text-[#567] hover:text-red-500 transition-colors">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-[#567]">
                  <p className="text-xs font-black uppercase tracking-widest">Nothing in wishlist</p>
                </div>
              )}
            </div>
          </section>
        )}

        {currentView === 'history' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Recommendations Section */}
            <section>
              <Recommendations 
                visitedLocations={locations} 
                profile={profile} 
                onSave={handleSaveRecommendation}
                savedNames={savedNames}
              />
            </section>

            {/* History List */}
            <section className="space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#2c3440] pb-2">
                <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest">Diary</h2>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative group">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#567] group-focus-within:text-white transition-colors"></i>
                    <input 
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-[#2c3440] pl-10 pr-4 py-1.5 rounded-sm text-[11px] font-bold text-white outline-none focus:ring-1 focus:ring-[#456] w-40 transition-all"
                    />
                  </div>

                  {/* Type Filter */}
                  <div className="flex items-center bg-[#2c3440] rounded-sm p-0.5">
                    <button 
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter transition-all ${filterType === 'all' ? 'bg-[#456] text-white' : 'text-[#9ab] hover:text-white'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilterType(LocationType.COUNTRY)}
                      className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter transition-all ${filterType === LocationType.COUNTRY ? 'bg-[#456] text-white' : 'text-[#9ab] hover:text-white'}`}
                    >
                      Countries
                    </button>
                    <button 
                      onClick={() => setFilterType(LocationType.STATE)}
                      className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter transition-all ${filterType === LocationType.STATE ? 'bg-[#456] text-white' : 'text-[#9ab] hover:text-white'}`}
                    >
                      States
                    </button>
                  </div>

                  {/* Rating Filter */}
                  <select 
                    value={filterMinRating}
                    onChange={(e) => setFilterMinRating(parseFloat(e.target.value))}
                    className="bg-[#1b2228] text-[10px] font-black uppercase tracking-tighter text-[#9ab] outline-none cursor-pointer border-none"
                  >
                    <option value="0">Min Rating: All</option>
                    <option value="1">Rating: 1.0+</option>
                    <option value="2">Rating: 2.0+</option>
                    <option value="3">Rating: 3.0+</option>
                    <option value="4">Rating: 4.0+</option>
                    <option value="4.5">Rating: 4.5+</option>
                    <option value="5">Rating: 5.0</option>
                  </select>

                  {/* Sorting */}
                  <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-[#1b2228] text-[10px] font-black uppercase tracking-tighter text-[#9ab] outline-none cursor-pointer border-none border-l border-[#2c3440] pl-4"
                  >
                    <option value="date">Sort: Recent</option>
                    <option value="rating">Sort: Highest Rated</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <div key={loc.id} className="group flex items-center justify-between py-4 px-4 hover:bg-[#1b2228] border-b border-[#2c3440] transition-colors rounded">
                      <div className="flex items-center gap-6 flex-grow">
                        <div className="w-12 text-center text-[11px] font-black uppercase text-[#567] tracking-tighter">
                          {new Date(loc.dateVisited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div>
                          <h3 className="text-white text-lg font-black tracking-tight leading-none group-hover:text-[#40bcf4] transition-colors cursor-pointer" onClick={() => handleViewMap(loc)}>
                            {loc.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <StarRating rating={loc.rating} />
                            <span className="text-[9px] font-black uppercase text-[#567] tracking-widest">{loc.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                         <div className="hidden md:flex gap-1">
                            {loc.likes.slice(0, 3).map((l, i) => (
                              <span key={i} className="text-[9px] font-bold text-[#00e054] px-1.5 py-0.5 border border-[#00e054]/20 rounded-sm">
                                {l}
                              </span>
                            ))}
                         </div>
                         <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleViewMap(loc)}
                              className="text-[#567] hover:text-[#40bcf4] transition-colors"
                              title="Map"
                            >
                              <i className="fas fa-map-marker-alt"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="text-[#567] hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-[#567]">
                    <p className="text-xs font-black uppercase tracking-widest italic opacity-50">No matching logs found</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="mt-24 border-t border-[#2c3440] py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 text-[#567] font-black tracking-widest text-xs uppercase">
            <i className="fas fa-location-arrow text-[#00e054]"></i>
            WanderLog
          </div>
          <div className="text-[11px] text-[#567] uppercase tracking-widest font-bold text-center space-x-4">
             <span>Data by Gemini</span>
             <span className="opacity-30">/</span>
             <span>Maps by OSM</span>
             <span className="opacity-30">/</span>
             <span>Handcrafted Travel Logs</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
