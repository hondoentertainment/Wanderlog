
import React, { useState } from 'react';
import { SquadTrip, SquadMember } from '../types';
import { Button } from './Button';
import { getSquadActivitySuggestions } from '../services/geminiService';

interface SquadHubProps {
  trips: SquadTrip[];
  onCreate: (trip: SquadTrip) => void;
  onJoin: (code: string) => void;
  onUpdate: (trip: SquadTrip) => void;
  onDelete: (id: string) => void;
}

export const SquadHub: React.FC<SquadHubProps> = ({ trips, onCreate, onJoin, onUpdate, onDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  
  const [newTripName, setNewTripName] = useState('');
  const [newTripDest, setNewTripDest] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberStyle, setNewMemberStyle] = useState('Adventure');
  const [tempMembers, setTempMembers] = useState<SquadMember[]>([]);

  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newTripName || !newTripDest) return;
    
    const trip: SquadTrip = {
      id: crypto.randomUUID(),
      name: newTripName,
      destination: newTripDest,
      members: tempMembers,
      items: [],
      createdAt: new Date().toISOString(),
      joinCode: btoa(JSON.stringify({ name: newTripName, destination: newTripDest, members: tempMembers }))
    };
    
    onCreate(trip);
    setNewTripName('');
    setNewTripDest('');
    setTempMembers([]);
    setIsCreating(false);
  };

  const handleJoin = () => {
    if (!joinCodeInput.trim()) return;
    onJoin(joinCodeInput);
    setJoinCodeInput('');
    setIsJoining(false);
  };

  const addMember = () => {
    if (!newMemberName) return;
    setTempMembers([...tempMembers, { name: newMemberName, style: newMemberStyle }]);
    setNewMemberName('');
  };

  const generateAIActivities = async (trip: SquadTrip) => {
    setLoadingSuggestions(trip.id);
    try {
      const suggestions = await getSquadActivitySuggestions(trip);
      const updated = { ...trip, items: [...new Set([...trip.items, ...suggestions])] };
      onUpdate(updated);
    } catch (e) {
      alert("Failed to get suggestions.");
    } finally {
      setLoadingSuggestions(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Join code copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b border-[#2c3440] pb-4">
        <div>
          <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest flex items-center gap-2">
            Squad Hub
          </h2>
          <p className="text-[10px] text-[#567] font-bold mt-1 uppercase tracking-tighter italic">Plan bucket-list trips with the crew</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setIsJoining(true)}>JOIN SQUAD</Button>
          <Button variant="primary" onClick={() => setIsCreating(true)}>START SQUAD</Button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-[#1b2228] p-6 rounded border border-[#00e054]/30 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-white font-black uppercase text-xs mb-4">Launch New Squad Trip</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input 
              placeholder="Trip Name (e.g. Summer in Tokyo)" 
              className="bg-[#2c3440] px-4 py-2 rounded-sm text-xs text-white outline-none"
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
            />
            <input 
              placeholder="Destination" 
              className="bg-[#2c3440] px-4 py-2 rounded-sm text-xs text-white outline-none"
              value={newTripDest}
              onChange={(e) => setNewTripDest(e.target.value)}
            />
          </div>
          
          <div className="bg-[#14181c] p-4 rounded mb-4">
            <label className="text-[9px] font-black uppercase text-[#567] block mb-2">Members & Vibes</label>
            <div className="flex gap-2 mb-3">
              <input 
                placeholder="Name" 
                className="flex-grow bg-[#2c3440] px-3 py-1.5 rounded-sm text-[11px] text-white"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
              <select 
                className="bg-[#2c3440] text-[11px] text-white px-2 rounded-sm outline-none"
                value={newMemberStyle}
                onChange={(e) => setNewMemberStyle(e.target.value)}
              >
                <option>Adventure</option>
                <option>Culture</option>
                <option>Foodie</option>
                <option>Relaxation</option>
                <option>Nightlife</option>
              </select>
              <Button variant="secondary" onClick={addMember}>ADD</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tempMembers.map((m, i) => (
                <span key={i} className="text-[10px] bg-[#2c3440] text-[#9ab] px-2 py-1 rounded-sm border border-white/5">
                  {m.name} ({m.style})
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreating(false)}>CANCEL</Button>
            <Button variant="primary" onClick={handleCreate}>GENERATE JOIN CODE</Button>
          </div>
        </div>
      )}

      {isJoining && (
        <div className="bg-[#1b2228] p-6 rounded border border-[#40bcf4]/30 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-white font-black uppercase text-xs mb-4 italic">Enter Encrypted Join Code</h3>
          <textarea 
            placeholder="Paste squad code here..." 
            className="w-full h-20 bg-[#2c3440] p-4 rounded-sm text-[10px] font-mono text-white outline-none resize-none mb-4"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsJoining(false)}>CANCEL</Button>
            <Button variant="primary" onClick={handleJoin}>SYNC SQUAD</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.length > 0 ? trips.map(trip => (
          <div key={trip.id} className="bg-[#1b2228] border border-[#2c3440] rounded flex flex-col hover:border-[#456] transition-all group">
            <div className="p-5 border-b border-[#2c3440] flex justify-between items-start">
              <div>
                <h3 className="text-white font-black uppercase text-sm tracking-tighter">{trip.name}</h3>
                <p className="text-[10px] text-[#40bcf4] font-black tracking-widest mt-1 uppercase">{trip.destination}</p>
              </div>
              <button onClick={() => onDelete(trip.id)} className="text-[#567] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-trash text-[10px]"></i>
              </button>
            </div>
            
            <div className="p-5 flex-grow space-y-4">
               <div>
                  <span className="text-[9px] font-black text-[#567] uppercase block mb-2 tracking-widest">Squad Members</span>
                  <div className="flex flex-wrap gap-1.5">
                    {trip.members.map((m, i) => (
                      <span key={i} className="text-[8px] font-black uppercase px-2 py-0.5 bg-[#14181c] text-[#9ab] border border-white/5 rounded-full" title={m.style}>
                        {m.name}
                      </span>
                    ))}
                  </div>
               </div>

               <div>
                  <span className="text-[9px] font-black text-[#567] uppercase block mb-2 tracking-widest">Planned Activities</span>
                  <div className="space-y-1.5">
                    {trip.items.length > 0 ? trip.items.map((it, i) => (
                      <div key={i} className="text-[11px] text-[#def] font-medium flex items-center gap-2">
                        <i className="fas fa-check text-[8px] text-[#00e054]"></i>
                        {it}
                      </div>
                    )) : (
                      <p className="text-[10px] text-[#567] italic uppercase">List is empty</p>
                    )}
                  </div>
               </div>
            </div>

            <div className="p-5 bg-[#14181c]/30 flex flex-col gap-2 border-t border-[#2c3440]">
               <Button 
                variant="ghost" 
                className="w-full !justify-start group/magic" 
                onClick={() => generateAIActivities(trip)}
                isLoading={loadingSuggestions === trip.id}
               >
                 <i className="fas fa-wand-magic-sparkles text-[#ff8000] group-hover/magic:scale-125 transition-transform"></i>
                 <span className="text-[10px] font-black tracking-widest">CONSULT SQUAD MUSE</span>
               </Button>
               <Button variant="secondary" className="w-full !text-[9px]" onClick={() => copyCode(trip.joinCode)}>
                 <i className="fas fa-copy"></i> SHARE JOIN CODE
               </Button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-16 text-center border border-dashed border-[#2c3440] opacity-30">
             <i className="fas fa-users text-2xl mb-3"></i>
             <p className="text-[10px] font-black uppercase tracking-widest">No Squads Active</p>
          </div>
        )}
      </div>
    </div>
  );
};
