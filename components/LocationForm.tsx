
import React, { useState, useEffect, useRef } from 'react';
import { LocationType, TravelLocation, CompanionType } from '../types';
import { US_STATES, COMMON_COUNTRIES } from '../constants';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { analyzeLogImage } from '../services/geminiService';
import { uploadPhoto } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

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
  const [endDate, setEndDate] = useState('');
  const [companions, setCompanions] = useState<CompanionType[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const list = type === LocationType.STATE ? US_STATES : COMMON_COUNTRIES;
    if (name.trim().length > 0) {
      const filtered = list.filter(item =>
        item.toLowerCase().includes(name.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setHighlightedIndex(-1);
  }, [name, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScanPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extractedData = await analyzeLogImage(base64);
        if (extractedData.name) {
          setName(extractedData.name);
          showToast(`Detected: ${extractedData.name}`, 'success');
        }
        if (extractedData.dateVisited) setDate(extractedData.dateVisited);
        if (extractedData.likes) setLikes(prev => [...new Set([...prev, ...(extractedData.likes || [])])]);
      };
      reader.readAsDataURL(file);

      // Also add to photos if not already there
      if (!photos.some(p => p.name === file.name)) {
        setPhotos(prev => [...prev, file]);
        setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
      }
    } catch (err) {
      console.error(err);
      showToast("Scan failed. Try again.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + photos.length > 5) {
      showToast("Max 5 photos allowed", "info");
      return;
    }
    setPhotos(prev => [...prev, ...selectedFiles]);
    const newPreviews = (selectedFiles as File[]).map(file => URL.createObjectURL(file as Blob));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!user) {
      showToast("You must be logged in to save trips.", "error");
      return;
    }

    setIsUploading(true);
    let photoUrls: string[] = [];

    try {
      if (photos.length > 0) {
        showToast(`Uploading ${photos.length} photos...`, 'info');
        photoUrls = await Promise.all(photos.map(file => uploadPhoto(user.uid, file)));
      }

      onAdd({
        name,
        type,
        rating,
        likes,
        dislikes,
        dateVisited: date,
        dateEndVisited: endDate || undefined,
        companions: companions.length > 0 ? companions : undefined,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined
      });

      setName('');
      setLikes([]);
      setDislikes([]);
      setRating(4);
      setEndDate('');
      setCompanions([]);
      setPhotos([]);
      setPhotoPreviews([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save memory. Storage issue?", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1b2228] p-8 rounded border border-[#2c3440] shadow-2xl space-y-8 max-w-2xl mx-auto relative">
      <div className="flex justify-between items-center bg-[#14181c] p-3 rounded-sm border border-[#2c3440]/50 mb-4">
        <div className="flex items-center gap-3">
          <i className="fas fa-magic text-[#00e054]"></i>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#9ab]">AI-Assisted Pre-fill</span>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanPhoto} />
        <Button
          type="button"
          variant="ghost"
          className="!text-[9px]"
          onClick={() => fileInputRef.current?.click()}
          isLoading={isScanning}
        >
          <i className="fas fa-camera mr-1"></i> SCAN TO PRE-FILL
        </Button>
      </div>

      {/* Photo Gallery Upload */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Photo Gallery</label>
          <span className="text-[8px] font-bold text-[#567] uppercase tracking-tighter">{photos.length}/5 Photos</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {photoPreviews.map((preview, idx) => (
            <div key={idx} className="aspect-square bg-[#14181c] rounded-lg border border-[#2c3440] relative group overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl"
              >
                <i className="fas fa-times text-[10px]"></i>
              </button>
            </div>
          ))}

          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="aspect-square bg-[#2c3440]/30 border-2 border-dashed border-[#2c3440] rounded-lg flex flex-col items-center justify-center gap-1 hover:border-[#40bcf4]/50 hover:bg-[#40bcf4]/5 transition-all group"
            >
              <i className="fas fa-plus text-[#567] group-hover:text-[#40bcf4]"></i>
              <span className="text-[8px] font-black text-[#567] uppercase tracking-tighter group-hover:text-[#40bcf4]">Add Photo</span>
            </button>
          )}
        </div>
        <input
          type="file"
          ref={photoInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
        />
      </div>

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
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between group ${idx === highlightedIndex ? 'bg-[#343d4b] text-[#00e054]' : 'text-[#def] hover:bg-[#202830]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fas fa-location-dot text-[10px] ${idx === highlightedIndex ? 'opacity-100' : 'opacity-20'}`}></i>
                      <span>{item}</span>
                    </div>
                  </button>
                ))}
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
          type="range" min="0" max="5" step="0.5"
          value={rating}
          onChange={(e) => setRating(parseFloat(e.target.value))}
          className="w-full h-1 bg-[#2c3440] rounded-lg appearance-none cursor-pointer accent-[#00e054]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-[#00e054] uppercase tracking-widest block">Highs</label>
          <input
            type="text" value={likeInput}
            onChange={(e) => setLikeInput(e.target.value)}
            onKeyDown={handleAddLike}
            className="w-full bg-[#2c3440] px-4 py-2 rounded-sm text-sm text-white outline-none border-none focus:ring-1 focus:ring-[#00e054]/30"
            placeholder="Add a high..."
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
            type="text" value={dislikeInput}
            onChange={(e) => setDislikeInput(e.target.value)}
            onKeyDown={handleAddDislike}
            className="w-full bg-[#2c3440] px-4 py-2 rounded-sm text-sm text-white outline-none border-none focus:ring-1 focus:ring-red-500/30"
            placeholder="Add a low..."
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

      <div className="space-y-6 pt-6 border-t border-[#2c3440]">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-[#567] uppercase tracking-wider block mb-2">Start Date</label>
            <input
              type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#2c3440] px-3 py-2 rounded-sm text-sm text-white outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#567] uppercase tracking-wider block mb-2">End Date <span className="text-[#456]">(optional)</span></label>
            <input
              type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={date}
              className="w-full bg-[#2c3440] px-3 py-2 rounded-sm text-sm text-white outline-none"
            />
          </div>
        </div>

        {/* Companion Tags */}
        <div>
          <label className="text-[10px] font-bold text-[#567] uppercase tracking-wider block mb-2">Who'd you travel with?</label>
          <div className="flex flex-wrap gap-2">
            {(['solo', 'partner', 'family', 'friends', 'group'] as CompanionType[]).map(comp => (
              <button
                key={comp}
                type="button"
                onClick={() => {
                  if (companions.includes(comp)) {
                    setCompanions(companions.filter(c => c !== comp));
                  } else {
                    setCompanions([...companions, comp]);
                  }
                }}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase transition-all ${companions.includes(comp)
                  ? 'bg-[#00e054] text-[#14181c]'
                  : 'bg-[#2c3440] text-[#9ab] hover:bg-[#3c4450]'
                  }`}
              >
                <i className={`fas ${comp === 'solo' ? 'fa-user' : comp === 'partner' ? 'fa-heart' : comp === 'family' ? 'fa-users' : comp === 'friends' ? 'fa-user-group' : 'fa-people-group'} mr-1.5`}></i>
                {comp}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-6 border-t border-[#2c3440]">
        <Button type="submit" variant="primary" className="px-8 py-3" isLoading={isUploading}>
          {isUploading ? 'SAVING MEMORY...' : 'SAVE LOG'}
        </Button>
      </div>
    </form>
  );
};
