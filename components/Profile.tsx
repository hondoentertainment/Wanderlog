
import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { deleteUserData } from '../services/storageService';

interface ProfileProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

const PREDEFINED_TRAVEL_STYLES = [
  'Adventure', 'Luxury', 'Budget', 'Culture', 'Nature', 'Foodie', 'Relaxation', 'Solo', 'Family',
  'Backpacking', 'Road Trip', 'Sustainable', 'Ecotourism', 'Wellness', 'Spiritual', 'Voluntourism',
  'Business', 'Bleisure', 'Digital Nomad', 'Cruise', 'Safari', 'Skiing', 'Beach', 'Mountain',
  'Urban Exploration', 'Rural Retreat', 'Historical', 'Architecture', 'Art & Museums', 'Nightlife',
  'Shopping', 'Photography', 'Wildlife', 'Sports', 'Festivals', 'Music', 'Pilgrimage', 'Honeymoon',
  'Anniversary', 'Group Tours', 'Off-the-beaten-path', 'Flashpacking', 'Glamping', 'Camping',
  'Van Life', 'Medical Tourism', 'Educational', 'Ancestry', 'Extreme Sports', 'Slow Travel'
].sort();

export const Profile: React.FC<ProfileProps> = ({ profile, onUpdate }) => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newBucketItem, setNewBucketItem] = useState('');
  const [styleSearch, setStyleSearch] = useState('');
  const [customStyleInput, setCustomStyleInput] = useState('');

  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    ...profile,
    customTravelStyles: profile.customTravelStyles || []
  });

  const handleSave = () => {
    onUpdate(editedProfile);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (confirm("Log out of WanderLog?")) {
      await logout();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm("WARNING: This will permanently delete your travel history and profile data. This action cannot be undone. Are you sure?");
    if (confirmed && user) {
      setIsDeleting(true);
      try {
        await deleteUserData(user.uid);
        // After data deletion, we logout. 
        // Note: Actual Firebase account deletion usually requires re-authentication for security.
        // For this MVP, we clear the storage and logout.
        await logout();
      } catch (e) {
        alert("Failed to delete account data.");
        setIsDeleting(false);
      }
    }
  };

  const toggleStyle = (style: string) => {
    const current = editedProfile.travelStyle;
    const updated = current.includes(style)
      ? current.filter(s => s !== style)
      : [...current, style];
    setEditedProfile({ ...editedProfile, travelStyle: updated });
  };

  const clearStyles = () => {
    setEditedProfile({ ...editedProfile, travelStyle: [] });
  };

  const addBucketItem = () => {
    if (newBucketItem.trim()) {
      setEditedProfile({
        ...editedProfile,
        bucketList: [...editedProfile.bucketList, newBucketItem.trim()]
      });
      setNewBucketItem('');
    }
  };

  const removeBucketItem = (index: number) => {
    setEditedProfile({
      ...editedProfile,
      bucketList: editedProfile.bucketList.filter((_, i) => i !== index)
    });
  };

  const addCustomStyle = () => {
    const customStyles = editedProfile.customTravelStyles || [];
    if (customStyleInput.trim() && customStyles.length < 5) {
      const newStyle = customStyleInput.trim();
      if (!customStyles.includes(newStyle) && !PREDEFINED_TRAVEL_STYLES.includes(newStyle)) {
        setEditedProfile({
          ...editedProfile,
          customTravelStyles: [...customStyles, newStyle],
          travelStyle: [...editedProfile.travelStyle, newStyle]
        });
        setCustomStyleInput('');
      }
    }
  };

  const removeCustomStyle = (style: string) => {
    const customStyles = editedProfile.customTravelStyles || [];
    setEditedProfile({
      ...editedProfile,
      customTravelStyles: customStyles.filter(s => s !== style),
      travelStyle: editedProfile.travelStyle.filter(s => s !== style)
    });
  };

  const combinedStyles = useMemo(() => {
    const customStyles = editedProfile.customTravelStyles || [];
    return [...new Set([...PREDEFINED_TRAVEL_STYLES, ...customStyles])].sort();
  }, [editedProfile.customTravelStyles]);

  const filteredStyles = useMemo(() => {
    return combinedStyles.filter(s => s.toLowerCase().includes(styleSearch.toLowerCase()));
  }, [combinedStyles, styleSearch]);

  if (!isEditing) {
    return (
      <div className="bg-[#1b2228] border border-[#2c3440] rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="h-40 bg-gradient-to-b from-[#40bcf4]/20 to-[#1b2228] relative">
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="px-8 pb-10 relative">
          <div className="flex justify-between items-end -mt-16 mb-8 relative z-10">
            <div className="w-32 h-32 rounded border-4 border-[#1b2228] bg-[#2c3440] flex items-center justify-center text-white text-5xl font-black shadow-2xl">
              {profile.name.charAt(0)}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="border border-[#2c3440] hover:bg-red-500/10 hover:text-red-500 transition-all">
                Logout
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{profile.name} <span className="text-[#00e054] font-normal not-italic opacity-30">x</span> Travel Muse</h1>
              </div>

              <div className="pt-6">
                <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest mb-4">Travel Styles</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.travelStyle.length > 0 ? profile.travelStyle.map(style => (
                    <span key={style} className="bg-[#2c3440] text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter border border-white/5">
                      {style}
                    </span>
                  )) : (
                    <p className="text-[10px] text-[#567] italic font-black uppercase tracking-widest">No styles selected</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-[#567] uppercase tracking-widest border-b border-[#2c3440] pb-2">Bucket List</h3>
              <div className="space-y-3">
                {profile.bucketList.length > 0 ? profile.bucketList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <i className="fas fa-bookmark text-[#ff8000] text-[10px]"></i>
                    <span className="text-xs font-bold text-white tracking-tight">{item}</span>
                  </div>
                )) : (
                  <p className="text-[10px] text-[#567] italic font-black uppercase tracking-widest">No goals set yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1b2228] border border-[#2c3440] p-8 space-y-8 animate-in fade-in duration-300 rounded shadow-2xl max-w-3xl mx-auto">
      <div className="flex justify-between items-center border-b border-[#2c3440] pb-4">
        <h2 className="text-lg font-black text-white tracking-widest uppercase">Profile Settings</h2>
        <button onClick={() => setIsEditing(false)} className="text-[#567] hover:text-white transition-colors">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Display Name</label>
          <input
            type="text"
            value={editedProfile.name}
            onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
            className="w-full bg-[#2c3440] px-4 py-2.5 rounded-sm border-none text-white text-sm outline-none focus:ring-1 focus:ring-[#456]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Biography</label>
          <textarea
            rows={3}
            value={editedProfile.bio}
            onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
            className="w-full bg-[#2c3440] px-4 py-2.5 rounded-sm border-none text-white text-sm outline-none focus:ring-1 focus:ring-[#456] resize-none"
          />
        </div>

        <div className="space-y-6 pt-4 border-t border-[#2c3440]">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-[#9ab] uppercase tracking-widest">Travel Discovery Styles</h3>
            <span className="text-[8px] font-bold text-[#567] uppercase tracking-tighter">Influences AI Suggestions</span>
          </div>

          {/* Custom Style Addition */}
          <div className="space-y-3 bg-[#14181c] p-4 rounded-sm border border-[#2c3440]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-black text-[#567] uppercase tracking-widest block">Add Your Own Styles (Max 5)</label>
              <span className="text-[9px] font-bold text-[#456]">{(editedProfile.customTravelStyles || []).length}/5</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customStyleInput}
                onChange={(e) => setCustomStyleInput(e.target.value)}
                placeholder="e.g. Astro-Tourism"
                className="flex-grow bg-[#2c3440] px-3 py-2 rounded-sm text-[11px] font-bold text-white outline-none focus:ring-1 focus:ring-[#456]"
                disabled={(editedProfile.customTravelStyles || []).length >= 5}
              />
              <Button
                variant="secondary"
                onClick={addCustomStyle}
                className="!py-1"
                disabled={!customStyleInput.trim() || (editedProfile.customTravelStyles || []).length >= 5}
              >
                ADD
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(editedProfile.customTravelStyles || []).map(style => (
                <div key={style} className="flex items-center gap-1 bg-[#00c030]/10 border border-[#00c030]/30 px-2 py-0.5 rounded-sm">
                  <span className="text-[9px] font-black text-[#00c030] uppercase tracking-tighter">{style}</span>
                  <button onClick={() => removeCustomStyle(style)} className="text-[#00c030] hover:text-white transition-colors">
                    <i className="fas fa-times text-[8px]"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Predefined Styles ({editedProfile.travelStyle.length})</label>
              <button
                type="button"
                onClick={clearStyles}
                className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="relative group">
              <i className="fas fa-filter absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#567]"></i>
              <input
                type="text"
                placeholder="Search styles..."
                value={styleSearch}
                onChange={(e) => setStyleSearch(e.target.value)}
                className="w-full bg-[#2c3440] pl-8 pr-4 py-2 rounded-sm text-[11px] font-bold text-white outline-none focus:ring-1 focus:ring-[#456] mb-2"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar p-1">
              {filteredStyles.length > 0 ? filteredStyles.map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className={`px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all ${editedProfile.travelStyle.includes(style)
                    ? 'bg-[#00c030] text-white'
                    : 'bg-[#2c3440] text-[#9ab] hover:text-white'
                    }`}
                >
                  {style}
                </button>
              )) : (
                <p className="text-[10px] text-[#567] italic py-2 text-center w-full">No matching styles found</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#2c3440]">
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Bucket List Goals</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBucketItem}
              onChange={(e) => setNewBucketItem(e.target.value)}
              placeholder="e.g. Northern Lights in Iceland"
              className="flex-grow bg-[#2c3440] px-4 py-2 rounded-sm border-none text-sm text-white outline-none focus:ring-1 focus:ring-[#456]"
              onKeyDown={(e) => e.key === 'Enter' && addBucketItem()}
            />
            <Button variant="secondary" onClick={addBucketItem} className="!py-1">ADD</Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {editedProfile.bucketList.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[#2c3440] px-4 py-2 rounded-sm group">
                <span className="text-xs font-bold text-white tracking-tight">{item}</span>
                <button onClick={() => removeBucketItem(idx)} className="text-[#567] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <i className="fas fa-trash-alt text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 space-y-4">
          <Button variant="primary" className="w-full !py-3" onClick={handleSave}>
            SAVE PROFILE
          </Button>

          <div className="pt-4 border-t border-[#2c3440]">
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-all w-full text-center py-2"
            >
              {isDeleting ? 'DELETING DATA...' : 'PERMANENTLY DELETE ACCOUNT & DATA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
