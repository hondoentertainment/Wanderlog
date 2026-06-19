import React, { useState, useEffect, useRef } from 'react';
import { SquadTrip, SquadMember, ChatMessage } from '../types';
import { Button } from './Button';
import { getSquadActivitySuggestions, getGeminiErrorMessage } from '../services/geminiService';
import { useToast } from './Toast';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { SquadChallenges } from './SquadChallenges';
import { SquadPayments } from './SquadPayments';
import { MeshNetworkP2P } from './MeshNetworkP2P';
import { encodeSquadJoinCode } from '../utils/squadJoinCode';

interface SquadHubProps {
  trips: SquadTrip[];
  userId?: string;
  userName?: string;
  userAvatar?: string | null;
  onCreate: (trip: SquadTrip) => void;
  onJoin: (code: string) => void;
  onUpdate: (trip: SquadTrip) => void;
  onDelete: (id: string) => void;
}

export const SquadHub: React.FC<SquadHubProps> = ({
  trips,
  userId,
  userName = 'Anonymous',
  userAvatar,
  onCreate,
  onJoin,
  onUpdate,
  onDelete
}) => {
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const [newTripName, setNewTripName] = useState('');
  const [newTripDest, setNewTripDest] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberStyle, setNewMemberStyle] = useState('Adventure');
  const [tempMembers, setTempMembers] = useState<SquadMember[]>([]);

  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newTripName || !newTripDest) return;

    const id = crypto.randomUUID();
    const trip: SquadTrip = {
      id,
      name: newTripName,
      destination: newTripDest,
      members: tempMembers,
      items: [],
      createdAt: new Date().toISOString(),
      joinCode: encodeSquadJoinCode({
        id,
        name: newTripName,
        destination: newTripDest,
        members: tempMembers,
      }),
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
    } catch (err) {
      showToast(getGeminiErrorMessage(err), 'error');
    } finally {
      setLoadingSuggestions(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Join code copied to clipboard!");
  };

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  return (
    <div data-testid="squad-hub" className="space-y-8 animate-in fade-in duration-500">
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
              {(tempMembers || []).map((m, i) => (
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

      {/* Selected Trip Detail View with Chat */}
      {selectedTrip ? (
        <SquadTripDetail
          trip={selectedTrip}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
          onBack={() => setSelectedTripId(null)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onGenerateAI={() => generateAIActivities(selectedTrip)}
          isGeneratingAI={loadingSuggestions === selectedTrip.id}
          onCopyCode={() => copyCode(selectedTrip.joinCode)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.length > 0 ? trips.map(trip => (
            <div
              key={trip.id}
              className="bg-[#1b2228] border border-[#2c3440] rounded flex flex-col hover:border-[#456] transition-all group cursor-pointer"
              onClick={() => setSelectedTripId(trip.id)}
            >
              <div className="p-5 border-b border-[#2c3440] flex justify-between items-start">
                <div>
                  <h3 className="text-white font-black uppercase text-sm tracking-tighter">{trip.name}</h3>
                  <p className="text-[10px] text-[#40bcf4] font-black tracking-widest mt-1 uppercase">{trip.destination}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }}
                  className="text-[#567] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-trash text-[10px]"></i>
                </button>
              </div>

              <div className="p-5 flex-grow space-y-4">
                <div>
                  <span className="text-[9px] font-black text-[#567] uppercase block mb-2 tracking-widest">Squad Members</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(trip.members || []).map((m, i) => (
                      <span key={i} className="text-[8px] font-black uppercase px-2 py-0.5 bg-[#14181c] text-[#9ab] border border-white/5 rounded-full" title={m.style}>
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-black text-[#567] uppercase block mb-2 tracking-widest">Planned Activities</span>
                  <div className="space-y-1.5">
                    {(trip.items || []).length > 0 ? (trip.items || []).slice(0, 3).map((it, i) => (
                      <div key={i} className="text-[11px] text-[#def] font-medium flex items-center gap-2">
                        <i className="fas fa-check text-[8px] text-[#00e054]"></i>
                        {it}
                      </div>
                    )) : (
                      <p className="text-[10px] text-[#567] italic uppercase">List is empty</p>
                    )}
                    {trip.items.length > 3 && (
                      <p className="text-[10px] text-[#567]">+{trip.items.length - 3} more</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-[#14181c]/30 flex flex-col gap-2 border-t border-[#2c3440]">
                <Button
                  variant="ghost"
                  className="w-full !justify-start group/magic"
                  onClick={(e) => { e.stopPropagation(); generateAIActivities(trip); }}
                  isLoading={loadingSuggestions === trip.id}
                >
                  <i className="fas fa-wand-magic-sparkles text-[#ff8000] group-hover/magic:scale-125 transition-transform"></i>
                  <span className="text-[10px] font-black tracking-widest">CONSULT SQUAD MUSE</span>
                </Button>
                <Button variant="secondary" className="w-full !text-[9px]" onClick={(e) => { e.stopPropagation(); copyCode(trip.joinCode); }}>
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
      )}
    </div>
  );
};

// Squad Trip Detail Component with Chat
interface SquadTripDetailProps {
  trip: SquadTrip;
  userId?: string;
  userName: string;
  userAvatar?: string | null;
  onBack: () => void;
  onUpdate: (trip: SquadTrip) => void;
  onDelete: (id: string) => void;
  onGenerateAI: () => void;
  isGeneratingAI: boolean;
  onCopyCode: () => void;
}

const SquadTripDetail: React.FC<SquadTripDetailProps> = ({
  trip,
  userId,
  userName,
  userAvatar,
  onBack,
  onUpdate,
  onDelete,
  onGenerateAI,
  isGeneratingAI,
  onCopyCode,
}) => {
  const [activeTab, setActiveTab] = useState<'activities' | 'chat' | 'challenges' | 'payments'>('activities');
  const [showMesh, setShowMesh] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to chat messages
  useEffect(() => {
    if (!trip.id) return;

    const q = query(
      collection(db, 'squadTrips', trip.id, 'chat'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          content: data.content,
          timestamp: data.timestamp?.toDate?.()
            ? data.timestamp.toDate().toISOString()
            : new Date().toISOString(),
        });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [trip.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !trip.id || !userId) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'squadTrips', trip.id, 'chat'), {
        userId,
        userName,
        userAvatar: userAvatar || null,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {} as { [date: string]: ChatMessage[] });

  return (
    <div className="bg-[#1b2228] border border-[#2c3440] rounded-lg overflow-hidden animate-in fade-in duration-300 relative">
      {showMesh && (
        <MeshNetworkP2P squad={trip} onClose={() => setShowMesh(false)} />
      )}
      {/* Header */}
      <div className="p-5 border-b border-[#2c3440] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-[#2c3440] flex items-center justify-center text-[#567] hover:text-white transition-colors"
          >
            <i className="fas fa-arrow-left text-xs" />
          </button>
          <div>
            <h3 className="text-white font-black uppercase text-sm tracking-tighter">{trip.name}</h3>
            <p className="text-[10px] text-[#40bcf4] font-black tracking-widest uppercase">{trip.destination}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMesh(true)}
            className="px-3 py-1.5 bg-[#00e054]/10 text-[#00e054] border border-[#00e054]/30 hover:bg-[#00e054] hover:text-[#14181c] text-[10px] font-black uppercase tracking-widest rounded transition-colors hidden sm:block"
            title="Simulate Zero-Latency Off-Grid Mesh Sync"
          >
            <i className="fas fa-network-wired mr-1 animate-pulse" /> MESH
          </button>
          <button
            onClick={onCopyCode}
            className="px-3 py-1.5 bg-[#2c3440] text-[#9ab] text-[10px] font-bold uppercase rounded hover:bg-[#456] transition-colors"
          >
            <i className="fas fa-copy mr-1" /> Copy Code
          </button>
          <button
            onClick={() => onDelete(trip.id)}
            className="w-8 h-8 rounded bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
          >
            <i className="fas fa-trash text-xs" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2c3440]">
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'activities'
            ? 'text-[#00e054] border-b-2 border-[#00e054]'
            : 'text-[#567] hover:text-white'
            }`}
        >
          <i className="fas fa-tasks mr-2" /> Activities ({trip.items.length})
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'challenges'
            ? 'text-[#00e054] border-b-2 border-[#00e054]'
            : 'text-[#567] hover:text-white'
            }`}
        >
          <i className="fas fa-trophy mr-2" /> Goals
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'payments'
            ? 'text-[#40bcf4] border-b-2 border-[#40bcf4]'
            : 'text-[#567] hover:text-white'
            }`}
        >
          <i className="fas fa-wallet mr-2" /> Ledger
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {activeTab === 'activities' ? (
          <div className="space-y-4">
            {/* Members */}
            <div>
              <span className="text-[9px] font-black text-[#567] uppercase block mb-2 tracking-widest">Squad Members</span>
              <div className="flex flex-wrap gap-2">
                {(trip.members || []).map((m, i) => (
                  <span key={i} className="text-[10px] font-black uppercase px-3 py-1.5 bg-[#14181c] text-[#9ab] border border-white/5 rounded-full" title={m.style}>
                    {m.name} <span className="text-[#567]">({m.style})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-[#567] uppercase tracking-widest">Planned Activities</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onGenerateAI}
                  isLoading={isGeneratingAI}
                >
                  <i className="fas fa-wand-magic-sparkles text-[#ff8000] mr-1" />
                  <span className="text-[10px]">AI Suggest</span>
                </Button>
              </div>

              <div className="space-y-2">
                {(trip.items || []).length > 0 ? trip.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#14181c] rounded border border-[#2c3440]">
                    <i className="fas fa-check text-[#00e054] text-xs" />
                    <span className="text-sm text-[#def]">{it}</span>
                  </div>
                )) : (
                  <div className="text-center py-8 border-2 border-dashed border-[#2c3440] rounded">
                    <p className="text-[#567] text-xs">No activities planned yet</p>
                    <Button
                      variant="ghost"
                      onClick={onGenerateAI}
                      isLoading={isGeneratingAI}
                      className="mt-2"
                    >
                      <i className="fas fa-wand-magic-sparkles text-[#ff8000] mr-1" />
                      Get AI Suggestions
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Join Code */}
            <div className="mt-6 p-4 bg-[#14181c] rounded border border-[#2c3440]">
              <span className="text-[9px] font-black text-[#567] uppercase block mb-2 tracking-widest">Join Code</span>
              <code className="text-[10px] font-mono text-[#40bcf4] break-all">{trip.joinCode}</code>
            </div>
          </div>
        ) : activeTab === 'challenges' ? (
          <SquadChallenges trip={trip} />
        ) : activeTab === 'payments' ? (
          <SquadPayments trip={trip} currentUserName={userName} />
        ) : (
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-comments text-4xl text-[#2c3440] mb-4" />
                  <p className="text-[#567] text-sm">No messages yet</p>
                  <p className="text-[#456] text-xs mt-2">Start the conversation!</p>
                </div>
              ) : (
                Object.entries(groupedMessages as { [date: string]: ChatMessage[] }).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-[10px] text-[#567] bg-[#14181c] px-3 py-1 rounded-full">{date}</span>
                    </div>
                    <div className="space-y-3">
                      {msgs.map((msg) => {
                        const isCurrentUser = msg.userId === userId;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-2 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                              {msg.userAvatar ? (
                                <img
                                  src={msg.userAvatar}
                                  alt={msg.userName}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#2c3440] flex items-center justify-center flex-shrink-0">
                                  <i className="fas fa-user text-[#567] text-xs" />
                                </div>
                              )}
                              <div className={`${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                                <span className="text-[9px] text-[#567] mb-0.5">{msg.userName}</span>
                                <div
                                  className={`px-3 py-2 rounded-lg text-sm ${isCurrentUser
                                    ? 'bg-[#00e054] text-[#14181c]'
                                    : 'bg-[#2c3440] text-white'
                                    }`}
                                >
                                  {msg.content}
                                </div>
                                <span className="text-[9px] text-[#567] mt-0.5">{formatTime(msg.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-[#2c3440]">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={isSending}
                className="flex-1 bg-[#14181c] border border-[#2c3440] rounded px-4 py-2 text-sm text-white placeholder-[#567] outline-none focus:border-[#00e054] disabled:opacity-50"
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isSending}
                disabled={!newMessage.trim()}
              >
                <i className="fas fa-paper-plane" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
