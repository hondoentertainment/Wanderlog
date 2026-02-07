import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { path: '/history', label: 'Home', icon: 'fa-home' },
    { path: '/saved', label: 'Saved', icon: 'fa-bookmark' },
    { path: '/compare', label: 'Compare', icon: 'fa-scale-balanced' },
    { path: '/statscard', label: 'Stats', icon: 'fa-id-card' },
];

export const MobileNav: React.FC = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1b2228] border-t border-[#2c3440] z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all ${isActive
                                ? 'text-[#00e054]'
                                : 'text-[#567] hover:text-[#9ab]'
                            }`
                        }
                    >
                        <i className={`fas ${item.icon} text-lg`}></i>
                        <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
