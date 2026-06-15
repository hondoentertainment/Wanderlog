
import React, { useState, useMemo, Suspense, lazy } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { exportService } from '../services/exportService';
import { TravelLocation } from '../types';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { TravelResume } from './TravelResume';
import { TravelStats } from './TravelStats';
import { CompanionsManager } from './CompanionsManager';
import { PrivacySettings } from './PrivacySettings';
import { CompanionType } from '../types';

const GlobeView = lazy(() => import('./GlobeView').then((m) => ({ default: m.GlobeView })));

interface ProfileProps {
  profile: UserProfile;
  locations: TravelLocation[];
  onUpdate: (profile: UserProfile) => void;
  onOpenCreatorHub?: () => void;
  companionFilter?: CompanionType | null;
  onCompanionFilterChange?: (companion: CompanionType | null) => void;
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

export const Profile: React.FC<ProfileProps> = ({
  profile,
  locations,
  onUpdate,
  onOpenCreatorHub,
  companionFilter,
  onCompanionFilterChange,
}) => {
  const [showGlobe, setShowGlobe] = useState(false);
  const { user, logout, deleteAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [name, setName] = useState(profile.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newBucketItem, setNewBucketItem] = useState('');
  const [styleSearch, setStyleSearch] = useState('');
  const [customStyleInput, setCustomStyleInput] = useState('');

  const { showToast } = useToast();

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

  const handleExportResume = async () => {
    setIsExporting(true);
    try {
      const profileContent = document.getElementById('profile-content');
      if (profileContent) {
        // Wait a beat for the hidden resume to render if needed
        await new Promise(resolve => setTimeout(resolve, 500));
        await exportService.generateTravelResume(profile, locations, 'resume-export-container');
        showToast('Travel resume exported successfully!', 'success');
      } else {
        throw new Error('Profile content not found for export.');
      }
    } catch (error) {
      console.error('Error exporting profile:', error);
      showToast('Failed to export travel resume.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm("WARNING: This will permanently delete your cloud data, photos, shared trips where you are the owner, and your login. This cannot be undone. Continue?");
    if (!confirmed || !user) return;
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch {
      // Toast handled in AuthContext
    } finally {
      setIsDeleting(false);
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
      <div id="profile-content" className="bg-[#1b2228] border border-[#2c3440] rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="h-80 bg-[#14181c] relative overflow-hidden flex items-center justify-center">
          {showGlobe ? (
            <Suspense fallback={<div className="h-full flex items-center justify-center text-[#567] text-[10px] font-black uppercase tracking-widest">Loading globe…</div>}>
              <GlobeView locations={locations} />
            </Suspense>
          ) : (
            <button
              type="button"
              onClick={() => setShowGlobe(true)}
              className="px-6 py-4 border border-dashed border-[#2c3440] rounded-xl text-[#567] hover:text-[#00e054] hover:border-[#00e054]/40 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <i className="fas fa-globe-americas mr-2" />
              Load 3D travel globe
            </button>
          )}
        </div>
        <div className="px-8 pb-10 relative">
          <div className="flex justify-between items-end -mt-16 mb-8 relative z-10">
            <div className="w-32 h-32 rounded border-4 border-[#1b2228] bg-[#2c3440] flex items-center justify-center text-white text-5xl font-black shadow-2xl">
              {profile.name.charAt(0)}
            </div>
            <div className="flex gap-2">
              <div className="flex gap-2">
                {!isEditing && (
                  <Button variant="ghost" onClick={handleExportResume} isLoading={isExporting} className="border border-[#40bcf4]/30 text-[#40bcf4] hover:bg-[#40bcf4]/10">
                    <i className="fas fa-file-pdf mr-2"></i> DOWNLOAD RESUME
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'CANCEL' : 'EDIT PROFILE'}
                </Button>
              </div>
              <Button variant="ghost" onClick={handleLogout} className="border border-[#2c3440] hover:bg-red-500/10 hover:text-red-500 transition-all">
                Logout
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">{profile.name} <span className="text-[#00e054] font-normal not-italic opacity-30">x</span> Travel Muse</h1>
              </div>

              <div className="pt-6 mt-6">
                <TravelStats locations={locations} profile={profile} />
              </div>

              <CompanionsManager
                locations={locations}
                selectedCompanion={companionFilter}
                onFilterChange={onCompanionFilterChange}
              />

              <PrivacySettings profile={profile} onProfileChange={onUpdate} />

              <div className="pt-6 border-t border-[#2c3440]">
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

              {/* Creator Hub Teaser (Phase 7 SaaS) */}
              {onOpenCreatorHub && (
                <div
                  className="mt-8 bg-gradient-to-r from-[#FBD315]/10 to-[#bc1888]/10 border border-[#FBD315]/30 rounded-xl p-6 flex items-center justify-between group hover:border-[#FBD315] hover:shadow-[0_0_20px_rgba(251,211,21,0.2)] transition-all cursor-pointer"
                  onClick={onOpenCreatorHub}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#14181c] flex items-center justify-center border border-[#FBD315] shadow-[0_0_10px_rgba(251,211,21,0.5)] group-hover:scale-110 transition-transform">
                      <i className="fas fa-crown text-xl text-[#FBD315]"></i>
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-black uppercase tracking-widest">Wanderlog Pro</h4>
                      <p className="text-[#9ab] text-[10px] mt-1 font-bold">Monetize your Travel DNA & sell itineraries.</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="!text-[10px] bg-[#FBD315] text-[#14181c] hover:bg-[#ffe340] hover:text-black font-black border-none" onClick={onOpenCreatorHub}>Go Pro</Button>
                </div>
              )}
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

        {/* Hidden Resume for Export Only */}
        <div className="fixed left-[-9999px] top-[-9999px] pointer-events-none origin-top" style={{ width: '210mm' }}>
          <TravelResume profile={profile} locations={locations} dna={profile.dna} />
        </div>
      </div>
    );
  }

  return (
    <div id="profile-content" className="bg-[#1b2228] border border-[#2c3440] p-8 space-y-8 animate-in fade-in duration-300 rounded shadow-2xl max-w-3xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-black text-white tracking-widest uppercase">Profile Settings</h2>
          <button onClick={() => setIsEditing(false)} className="text-[#567] hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
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
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Zero-UI Data Integrations</label>
          <div className="bg-[#14181c] p-5 rounded-lg border border-[#2c3440] flex items-center justify-between group hover:border-[#bc1888]/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-[#bc1888]/20 group-hover:scale-110 transition-transform">
                <i className="fab fa-instagram text-2xl"></i>
              </div>
              <div>
                <h4 className="text-white text-sm font-bold uppercase tracking-widest">Instagram Meta-Sync</h4>
                <p className="text-[#9ab] text-[10px] mt-0.5 max-w-[200px]">Autonomously build past itineraries via geotagged photo scraping.</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => {
              showToast("Authenticating with Meta...", "info");
              setTimeout(() => showToast("Scraping tags... 3 historical trips added to timeline!", "success"), 2500);
            }} className="!text-[10px] uppercase font-black tracking-widest"><i className="fas fa-link mr-1"></i> Connect</Button>
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
