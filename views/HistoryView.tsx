import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravelData } from '../contexts/TravelDataContext';
import { Dashboard } from '../components/Dashboard';
import { TravelMilestones } from '../components/TravelMilestones';
import { TravelMuse } from '../components/TravelMuse';
import { Timeline } from '../components/Timeline';
import { Recommendations } from '../components/Recommendations';
import { StarRating } from '../components/StarRating';
import { Button } from '../components/Button';

const HistoryView: React.FC = () => {
  const navigate = useNavigate();
  const {
    locations, profile, savedRecommendations,
    loadingDNA, refreshDNA,
    museInsights, isLoadingMuse, refreshMuse,
    viewMap, saveRecommendation,
    filteredLocations,
    searchTerm, setSearchTerm, sortOrder, setSortOrder,
    semanticSearchQuery, setSemanticSearchQuery, isSearchingAI, setSemanticResultIds,
    semanticSearch,
    shareLocation, deleteLocation,
  } = useTravelData();

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <Dashboard locations={locations} dna={profile.dna} onRefreshDNA={refreshDNA} isDNAlOading={loadingDNA} />

      <TravelMilestones locations={locations} />

      <section className="bg-[#1b2228] p-6 rounded border border-[#2c3440]">
        <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-6">
          <i className="fas fa-robot text-[#00e054] mr-2"></i>
          Jules · AI Travel Companion
        </h3>
        <TravelMuse insights={museInsights} isLoading={isLoadingMuse} onRefresh={refreshMuse} />
      </section>

      <section className="bg-[#1b2228] p-6 rounded border border-[#2c3440]">
        <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-6">Chronological History</h3>
        <Timeline locations={locations} onTravel={viewMap} />
      </section>

      <Recommendations
        visitedLocations={locations}
        profile={profile}
        onSave={saveRecommendation}
        savedNames={savedRecommendations.map(s => s.name)}
      />

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
                onKeyDown={(e) => e.key === 'Enter' && semanticSearch()}
                className="bg-transparent border-none outline-none text-[11px] font-bold text-white px-2 w-48"
              />
              <Button variant="ghost" className="!p-1 !text-[10px]" onClick={semanticSearch} isLoading={isSearchingAI}>
                <i className="fas fa-brain"></i>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Filter name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#2c3440] px-4 py-1.5 rounded-sm text-[11px] font-bold text-white outline-none w-40"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'rating' | 'date')}
              className="bg-[#1b2228] text-[10px] font-black uppercase text-[#9ab] outline-none"
            >
              <option value="date">Sort: Recent</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-[#2c3440]">
          {filteredLocations.length > 0 ? filteredLocations.map((loc) => (
            <div key={loc.id} className="group flex items-center justify-between py-4 px-3 hover:bg-[#1b2228] transition-colors rounded-lg">
              <div className="flex items-center gap-5">
                <div className="w-16 text-center">
                  <div className="text-[10px] font-bold text-[#567] uppercase">
                    {new Date(loc.dateVisited).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-lg font-black text-white">
                    {new Date(loc.dateVisited).getFullYear()}
                  </div>
                  {loc.dateEndVisited && (
                    <div className="text-[9px] font-bold text-[#00e054]">
                      {Math.ceil((new Date(loc.dateEndVisited).getTime() - new Date(loc.dateVisited).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </div>
                  )}
                </div>
                <div>
                  <h3
                    className="text-white text-lg font-bold tracking-tight leading-none group-hover:text-[#40bcf4] transition-colors cursor-pointer"
                    onClick={() => viewMap(loc)}
                  >
                    {loc.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <StarRating rating={loc.rating} />
                    <span className="text-[9px] font-bold text-[#567] uppercase">{loc.type}</span>
                    {loc.companions && loc.companions.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {loc.companions.map(c => (
                          <span key={c} className="text-[9px] font-bold text-[#9ab] bg-[#2c3440] px-1.5 py-0.5 rounded">
                            <i className={`fas ${c === 'solo' ? 'fa-user' : c === 'partner' ? 'fa-heart' : c === 'family' ? 'fa-users' : c === 'friends' ? 'fa-user-group' : 'fa-people-group'} mr-1`}></i>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => shareLocation(loc)} className="text-[#567] hover:text-[#00e054] p-2">
                  <i className="fas fa-share-alt"></i>
                </button>
                <button onClick={() => deleteLocation(loc.id)} className="text-[#567] hover:text-red-500 p-2">
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          )) : (
            <div className="py-16 text-center">
              <i className="fas fa-plane-departure text-[#2c3440] text-5xl mb-4"></i>
              <p className="text-[#567] text-sm font-semibold mb-2">No travel logs yet</p>
              <p className="text-[#456] text-xs mb-4">Start documenting your adventures!</p>
              <Button variant="primary" onClick={() => navigate('/add')}>
                <i className="fas fa-plus"></i> Log Your First Trip
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HistoryView;
