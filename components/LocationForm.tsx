
import React, { useState, useEffect, useRef } from 'react';
import { LocationType, TravelLocation } from '../types';
import { US_STATES, COMMON_COUNTRIES } from '../constants';
import { Button } from './Button';
import { StarRating } from './StarRating';

interface LocationFormProps {
  onAdd: (location: Omit<TravelLocation, 'id'>) => void;
}

export const LocationForm: React.FC<LocationFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>(LocationType.COUNTRY);
  const [rating, setRating] = useState(4);
  const [likeInput, setLikeInput] = useState('');
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikeInput, setDislikeInput] = useState('');
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = type === LocationType.STATE ? US_STATES : COMMON_COUNTRIES;
    if (name.trim().length > 0) {
      const filtered = list.filter(item => 
        item.toLowerCase().includes(name.toLowerCase())
      ).slice(0, 8); // Slightly more suggestions for better choice
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setHighlightedIndex(-1);
  }, [name, type]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddLike = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && likeInput.trim()) {
      e.preventDefault();
      setLikes([...likes, likeInput.trim()]);
      setLikeInput('');
    }
  };

  const handleAddDislike = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && dislikeInput.trim()) {
      e.preventDefault();
      setDislikes([...dislikes, dislikeInput.trim()]);
      setDislikeInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (val: string) => {
    setName(val);
    setShowSuggestions(false);
  };

  const removeLike = (index: number) => setLikes(likes.filter((_, i) => i !== index));
  const removeDislike = (index: number) => setDislikes(dislikes.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name,
      type,
      rating,
      likes,
      dislikes,
      dateVisited: date
    });

    setName('');
    setLikes([]);
    setDislikes([]);
    setRating(4);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1b2228] p-8 rounded border border-[#2c3440] shadow-2xl space-y-8 max-w-2xl mx-auto relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 relative" ref={containerRef}>
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Location Name</label>
          <div className="relative group">
            <i className={`fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs transition-colors ${showSuggestions ? 'text-[#00e054]' : 'text-[#567]'}`}></i>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => name.trim().length > 0 && setShowSuggestions(suggestions.length > 0)}
              className="w-full bg-[#2c3440] pl-10 pr-4 py-2.5 rounded-sm border-none text-white text-sm outline-none focus:ring-1 focus:ring-[#456] transition-all placeholder:text-[#456]"
              placeholder={type === LocationType.STATE ? "Find a State..." : "Find a Country..."}
              required
              autoComplete="off"
            />
            {/* Custom Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1b2228] border border-[#456] rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="bg-[#2c3440] px-3 py-1.5 border-b border-[#456] flex justify-between items-center">
                  <span className="text-[8px] font-black text-[#567] uppercase tracking-widest">Suggestions</span>
                  <span className="text-[8px] font-black text-[#00e054] uppercase tracking-widest">{type}</span>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectSuggestion(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between group ${
                      idx === highlightedIndex ? 'bg-[#343d4b] text-[#00e054]' : 'text-[#def] hover:bg-[#202830]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fas fa-location-dot text-[10px] ${idx === highlightedIndex ? 'opacity-100' : 'opacity-20'}`}></i>
                      <span>{item}</span>
                    </div>
                    {idx === highlightedIndex && (
                      <span className="text-[8px] opacity-40 italic">Press Enter</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {/* No Results found state */}
            {name.length > 2 && !showSuggestions && name !== suggestions[0] && (
               <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1b2228] border border-[#456] p-3 text-center rounded-sm z-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#567]">New Entry</p>
               </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Location Type</label>
          <div className="flex bg-[#2c3440] p-0.5 rounded-sm">
            <button
              type="button"
              onClick={() => { setType(LocationType.COUNTRY); setName(''); }}
              className={`flex-1 py-2 rounded-sm text-[10px] font-black uppercase tracking-tighter transition-all ${type === LocationType.COUNTRY ? 'bg-[#456] text-white shadow-sm' : 'text-[#9ab] hover:text-white'}`}
            >
              Country
            </button>
            <button
              type="button"
              onClick={() => { setType(LocationType.STATE); setName(''); }}
              className={`flex-1 py-2 rounded-sm text-[10px] font-black uppercase tracking-tighter transition-all ${type === LocationType.STATE ? 'bg-[#456] text-white shadow-sm' : 'text-[#9ab] hover:text-white'}`}
            >
              State
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest">Your Rating</label>
          <StarRating rating={rating} showNumber size="md" />
        </div>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.5" 
          value={rating}
          onChange={(e) => setRating(parseFloat(e.target.value))}
          className="w-full h-1 bg-[#2c3440] rounded-lg appearance-none cursor-pointer accent-[#00e054]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-[#00e054] uppercase tracking-widest block">Highs</label>
          <input 
            type="text" 
            value={likeInput}
            onChange={(e) => setLikeInput(e.target.value)}
            onKeyDown={handleAddLike}
            className="w-full bg-[#2c3440] px-4 py-2 rounded-sm text-sm text-white outline-none border-none focus:ring-1 focus:ring-[#00e054]/30"
            placeholder="Add a high..."
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-2">
            {likes.map((item, idx) => (
              <span key={idx} className="bg-[#00e054]/10 text-[#00e054] px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 border border-[#00e054]/20">
                {item}
                <button type="button" onClick={() => removeLike(idx)} className="hover:text-white opacity-50"><i className="fas fa-times"></i></button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Lows</label>
          <input 
            type="text" 
            value={dislikeInput}
            onChange={(e) => setDislikeInput(e.target.value)}
            onKeyDown={handleAddDislike}
            className="w-full bg-[#2c3440] px-4 py-2 rounded-sm text-sm text-white outline-none border-none focus:ring-1 focus:ring-red-500/30"
            placeholder="Add a low..."
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-2">
            {dislikes.map((item, idx) => (
              <span key={idx} className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 border border-red-500/20">
                {item}
                <button type="button" onClick={() => removeDislike(idx)} className="hover:text-white opacity-50"><i className="fas fa-times"></i></button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-[#2c3440]">
        <div>
          <label className="text-[9px] font-black text-[#567] uppercase tracking-widest block mb-1">Date Logged</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-[12px] text-white font-bold bg-transparent outline-none border-none cursor-pointer"
          />
        </div>
        <Button type="submit" variant="primary" className="px-8 py-3">
           SAVE LOG
        </Button>
      </div>
    </form>
  );
};
