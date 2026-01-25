
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';

interface ProfileProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

const TRAVEL_STYLES = [
  'Adventure', 'Luxury', 'Budget', 'Culture', 'Nature', 'Foodie', 'Relaxation', 'Solo', 'Family',
  'Backpacking', 'Road Trip', 'Sustainable', 'Ecotourism', 'Wellness', 'Spiritual', 'Voluntourism',
  'Business', 'Bleisure', 'Digital Nomad', 'Cruise', 'Safari', 'Skiing', 'Beach', 'Mountain',
  'Urban Exploration', 'Rural Retreat', 'Historical', 'Architecture', 'Art & Museums', 'Nightlife',
  'Shopping', 'Photography', 'Wildlife', 'Sports', 'Festivals', 'Music', 'Pilgrimage', 'Honeymoon',
  'Anniversary', 'Group Tours', 'Off-the-beaten-path', 'Flashpacking', 'Glamping', 'Camping',
  'Van Life', 'Medical Tourism', 'Educational', 'Ancestry', 'Extreme Sports', 'Slow Travel'
].sort();

export const Profile: React.FC<ProfileProps> = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [newBucketItem, setNewBucketItem] = useState('');

  const handleSave = () => {
    onUpdate(editedProfile);
    setIsEditing(false);
  };

  const toggleStyle = (style: string) => {
    const current = editedProfile.travelStyle;
    const updated = current.includes(style)
      ? current.filter(s => s !== style)
      : [...current, style];
    setEditedProfile({ ...editedProfile, travelStyle: updated });
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
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-6">
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none">{profile.name}</h2>
                  <p className="text-[#89a] mt-4 leading-relaxed max-w-xl">{profile.bio}</p>
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

        <div className="space-y-4">
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Travel Styles ({editedProfile.travelStyle.length})</label>
          <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar p-1">
            {TRAVEL_STYLES.map(style => (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all ${
                  editedProfile.travelStyle.includes(style)
                    ? 'bg-[#00c030] text-white'
                    : 'bg-[#2c3440] text-[#9ab] hover:text-white'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-[#9ab] uppercase tracking-widest block">Bucket List</label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newBucketItem}
              onChange={(e) => setNewBucketItem(e.target.value)}
              placeholder="e.g. Iceland"
              className="flex-grow bg-[#2c3440] px-4 py-2 rounded-sm border-none text-white text-sm outline-none focus:ring-1 focus:ring-[#456]"
              onKeyDown={(e) => e.key === 'Enter' && addBucketItem()}
            />
            <Button onClick={addBucketItem} variant="secondary" type="button">ADD</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {editedProfile.bucketList.map((item, idx) => (
              <span key={idx} className="bg-[#2c3440] text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 border border-white/5">
                {item}
                <button type="button" onClick={() => removeBucketItem(idx)} className="text-[#567] hover:text-red-500">
                  <i className="fas fa-times"></i>
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-[#2c3440]">
        <Button onClick={handleSave} className="w-full !py-3" type="button">SAVE PROFILE</Button>
      </div>
    </div>
  );
};
