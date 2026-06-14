import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AccountMenuProps {
  onNavigate: (view: 'profile' | 'friends') => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-full border-2 border-[#2c3440] hover:border-[#00e054] transition-all overflow-hidden shrink-0"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-[#1b2228] border border-[#2c3440] rounded-lg shadow-xl z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#def] hover:bg-[#2c3440] uppercase tracking-wider"
            onClick={() => {
              onNavigate('profile');
              setOpen(false);
            }}
          >
            <i className="fas fa-user mr-2 text-[#567]" />
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#def] hover:bg-[#2c3440] uppercase tracking-wider"
            onClick={() => {
              onNavigate('friends');
              setOpen(false);
            }}
          >
            <i className="fas fa-user-friends mr-2 text-[#567]" />
            Friends
          </button>
          <hr className="border-[#2c3440] my-1" />
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 uppercase tracking-wider"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            <i className="fas fa-sign-out-alt mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
