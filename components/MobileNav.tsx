import React from 'react';

interface MobileNavProps {
    currentView: string;
    onNavigate: (view: string) => void;
}

const navItems = [
    { id: 'history', label: 'Home', icon: 'fa-home' },
    { id: 'discovery', label: 'Explore', icon: 'fa-compass' },
    { id: 'jules', label: 'Jules', icon: 'fa-robot' },
    { id: 'squad', label: 'Squad', icon: 'fa-users' },
    { id: 'profile', label: 'Profile', icon: 'fa-user' },
];

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1b2228] border-t border-[#2c3440] z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all ${currentView === item.id
                            ? 'text-[#00e054]'
                            : 'text-[#567] hover:text-[#9ab]'
                            }`}
                    >
                        <i className={`fas ${item.icon} text-lg`}></i>
                        <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};
