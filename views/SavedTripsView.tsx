import React from 'react';
import { useTravelData } from '../contexts/TravelDataContext';
import { Button } from '../components/Button';

const SavedTripsView: React.FC = () => {
  const { savedRecommendations, loadingItinerary, generateItineraryForRec, exportItinerary } = useTravelData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-3">
          <i className="fas fa-bookmark text-[#ff8000]"></i> Saved Trips
        </h2>
        <span className="text-xs font-medium text-[#567]">{savedRecommendations.length} saved</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savedRecommendations.length > 0 ? savedRecommendations.map(rec => (
          <div key={rec.id} className="bg-[#1b2228] p-6 rounded border border-[#2c3440] hover:bg-[#202830] transition-colors group relative flex flex-col h-full">
            <h3 className="text-xl font-black text-white leading-tight">{rec.name}</h3>
            <p className="text-[#9ab] text-[13px] italic mt-2 border-l-2 border-[#2c3440] pl-3">"{rec.reason}"</p>

            <div className="mt-4 flex-grow">
              {!rec.itinerary ? (
                <Button variant="ghost" className="w-full !px-0" onClick={() => generateItineraryForRec(rec)} isLoading={loadingItinerary === rec.id}>
                  <i className="fas fa-wand-magic-sparkles text-[#ff8000]"></i> PLAN 3-DAY ITINERARY
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#ff8000]">3-Day Planner</span>
                    <Button variant="ghost" className="!p-1 !text-[8px]" onClick={() => exportItinerary(rec)}>
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
          <div className="col-span-full py-16 text-center border border-dashed border-[#2c3440] rounded-lg">
            <i className="fas fa-compass text-[#2c3440] text-5xl mb-4"></i>
            <p className="text-[#567] text-sm font-semibold mb-2">No saved trips yet</p>
            <p className="text-[#456] text-xs">Save AI recommendations from the History tab to plan your adventures!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedTripsView;
