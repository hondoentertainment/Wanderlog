import React, { useEffect, useState } from 'react';
import { SharedTrip, TravelLocation } from '../types';
import { shareService } from '../services/shareService';
import { ShareCard } from './ShareCard';
import { Button } from './Button';
import { Shimmer } from './Shimmer';

export const SharedTripView: React.FC<{
  tripId: string;
  onJoin: () => void;
  onHome: () => void;
}> = ({ tripId, onJoin, onHome }) => {
  const [loading, setLoading] = useState(true);
  const [sharedTrip, setSharedTrip] = useState<SharedTrip | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchTrip = async () => {
      try {
        const trip = await shareService.getSharedTrip(tripId);
        if (mounted) setSharedTrip(trip);
      } catch (err) {
        console.error('Failed to load shared trip', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTrip();
    return () => { mounted = false; };
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14181c] flex items-center justify-center p-6">
        <Shimmer className="w-full max-w-md h-96 rounded-2xl bg-[#1b2228]/50" />
      </div>
    );
  }

  if (!sharedTrip) {
    return (
      <div className="min-h-screen bg-[#14181c] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-[#2c3440] rounded-full flex items-center justify-center text-4xl mb-4">
          <i className="fas fa-ghost text-[#567]" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Trip Not Found</h2>
        <p className="text-[#9ab] max-w-sm">This travel memory might be private, deleted, or the link is invalid.</p>
        <Button onClick={onHome} variant="primary">Return Home</Button>
      </div>
    );
  }

  // Map SharedTrip back to TravelLocation for ShareCard compatibility
  const mappedLoc: TravelLocation = {
    id: sharedTrip.id,
    name: sharedTrip.name,
    type: sharedTrip.type,
    rating: sharedTrip.rating,
    likes: sharedTrip.highlights,
    dislikes: [],
    dateVisited: sharedTrip.visitDate,
    isVisited: true,
  };

  return (
    <div className="min-h-screen bg-[#14181c] flex flex-col items-center p-6 lg:p-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00e054] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#40bcf4] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl flex justify-between items-center z-10 mb-12">
        <button onClick={onHome} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2c3440] rounded-full flex items-center justify-center border-2 border-[#00e054]">
            <i className="fas fa-location-arrow text-[#00e054]"></i>
          </div>
          <span className="text-white font-black tracking-tighter text-xl uppercase italic">Wanderlog</span>
        </button>
        <Button onClick={onJoin} className="bg-white text-black hover:bg-[#00e054] tracking-widest text-xs uppercase font-black rounded-full px-6 py-2.5 shadow-xl transition-all">
          Join
        </Button>
      </div>

      <div className="z-10 w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-700">
        <ShareCard
          trip={mappedLoc}
          userName={sharedTrip.ownerName}
          userAvatar={sharedTrip.ownerAvatar}
          options={{ showStats: false, showHighlights: true, size: 'large' }}
        />
        
        <div className="mt-8 text-center space-y-4">
          <h3 className="text-xl font-black text-white">Create Your Own Travel DNA</h3>
          <p className="text-[#9ab] text-sm mb-6">Join Wanderlog for free to log your memories, discover your travel style, and share premium stories.</p>
          <Button onClick={onJoin} className="w-full bg-[#00e054] text-black hover:bg-[#00c044] font-bold py-4 text-lg rounded-xl shadow-[0_0_20px_rgba(0,224,84,0.3)] hover:shadow-[0_0_30px_rgba(0,224,84,0.4)] transition-all">
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};
