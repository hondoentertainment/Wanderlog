import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { MapModal } from './MapModal';
import { MobileNav } from './MobileNav';
import { useTravelData } from '../contexts/TravelDataContext';

const navItems = [
  { path: '/history', label: 'History', icon: 'fa-clock-rotate-left' },
  { path: '/saved', label: 'Saved', icon: 'fa-bookmark' },
  { path: '/bucketlist', label: 'Bucket List', icon: 'fa-list-check' },
  { path: '/compare', label: 'Compare', icon: 'fa-scale-balanced' },
  { path: '/statscard', label: 'Stats Card', icon: 'fa-id-card' },
  { path: '/squad', label: 'Squads', icon: 'fa-user-group' },
];

interface AppLayoutProps {
  user: User;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ user }) => {
  const navigate = useNavigate();
  const { profile, activeMap, setActiveMap, locations, setLocations } = useTravelData();

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#14181c] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-location-arrow text-[#00e054] text-4xl animate-pulse"></i>
          <p className="text-[#9ab] mt-4 text-sm font-bold uppercase tracking-widest">Loading WanderLog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14181c] text-[#9ab] selection:bg-[#00c030] selection:text-white pb-24">
      {activeMap && (
        <MapModal
          name={activeMap.name}
          coords={activeMap.coords}
          onClose={() => setActiveMap(null)}
          onSaveView={(c) => setLocations(prev => prev.map(l => l.id === activeMap.id ? { ...l, coordinates: c } : l))}
          allLocations={locations}
        />
      )}

      <header className="bg-[#1b2228] sticky top-0 z-40 border-b border-[#2c3440]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1
              className="text-white font-black tracking-tighter text-2xl flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/history')}
            >
              <i className="fas fa-location-arrow text-[#00e054]"></i> TRAVEL MUSE
            </h1>
            <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 transition-all hover:text-white ${isActive ? 'text-white border-b-2 border-[#00e054] pb-1' : 'text-[#9ab]'}`
                  }
                >
                  <i className={`fas ${item.icon} text-xs`}></i>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/add')}
              className="bg-[#00e054] hover:bg-[#00c030] text-[#14181c] px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> LOG
            </button>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-1.5 rounded-sm hover:bg-[#2c3440] transition-all group ${isActive ? 'bg-[#2c3440]' : ''}`
              }
            >
              <div className="hidden sm:block text-right">
                <span className="block text-[10px] font-black text-white uppercase tracking-tighter leading-none">
                  {user.displayName || profile.name}
                </span>
                <span className="block text-[8px] font-bold text-[#567] uppercase tracking-widest mt-0.5 group-hover:text-[#9ab] transition-colors">
                  View Profile
                </span>
              </div>
              <div className="w-8 h-8 rounded-full border border-[#456] bg-[#2c3440] flex items-center justify-center text-[11px] font-black text-white overflow-hidden group-hover:border-[#00e054] transition-all relative">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user.displayName || profile.name).charAt(0)
                )}
              </div>
            </NavLink>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <MobileNav />
    </div>
  );
};
