import React, { useRef, useState } from 'react';
import { TravelLocation, LocationType, UserProfile } from '../types';
import { Button } from './Button';

interface StatsCardProps {
    locations: TravelLocation[];
    profile: UserProfile;
}

type CardTheme = 'dark' | 'ocean' | 'sunset' | 'forest';

const themes: Record<CardTheme, { bg: string; accent: string; text: string; secondary: string }> = {
    dark: { bg: 'linear-gradient(135deg, #14181c 0%, #1f2937 100%)', accent: '#00e054', text: '#ffffff', secondary: '#9ab' },
    ocean: { bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', accent: '#40bcf4', text: '#ffffff', secondary: '#94a3b8' },
    sunset: { bg: 'linear-gradient(135deg, #2d1b3d 0%, #44243d 100%)', accent: '#ff8000', text: '#ffffff', secondary: '#c4b5fd' },
    forest: { bg: 'linear-gradient(135deg, #0d2818 0%, #1a4d2e 100%)', accent: '#4ade80', text: '#ffffff', secondary: '#86efac' },
};

export const StatsCard: React.FC<StatsCardProps> = ({ locations, profile }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<CardTheme>('dark');
    const [isGenerating, setIsGenerating] = useState(false);

    const countries = new Set(locations.filter(l => l.type === LocationType.COUNTRY).map(l => l.name));
    const states = new Set(locations.filter(l => l.type === LocationType.STATE).map(l => l.name));
    const years = new Set(locations.map(l => new Date(l.dateVisited).getFullYear()));
    const avgRating = locations.length > 0
        ? (locations.reduce((sum, l) => sum + l.rating, 0) / locations.length).toFixed(1)
        : '0';

    const currentTheme = themes[theme];

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);

        try {
            // Use html2canvas if available, otherwise just copy to clipboard
            const html2canvas = (window as any).html2canvas;
            if (html2canvas) {
                const canvas = await html2canvas(cardRef.current, {
                    backgroundColor: null,
                    scale: 2,
                });
                const link = document.createElement('a');
                link.download = `travel-muse-stats-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                // Fallback: copy stats to clipboard
                const stats = `🌍 My Travel Stats\n\n${countries.size} Countries\n${states.size} US States\n${locations.length} Trips\n${years.size} Years of Travel\n⭐ ${avgRating} Avg Rating\n\nTracked with Travel Muse`;
                await navigator.clipboard.writeText(stats);
                alert('Stats copied to clipboard! (Install html2canvas for image export)');
            }
        } catch (e) {
            console.error('Error generating card:', e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-3">
                    <i className="fas fa-id-card text-[#e040fb]"></i> Stats Card Generator
                </h2>
            </div>

            {/* Theme Selector */}
            <div>
                <label className="text-xs font-bold text-[#567] uppercase tracking-wider block mb-3">Choose Theme</label>
                <div className="flex gap-3">
                    {(Object.keys(themes) as CardTheme[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${theme === t
                                ? 'ring-2 ring-[#00e054] ring-offset-2 ring-offset-[#14181c]'
                                : 'opacity-60 hover:opacity-100'
                                }`}
                            style={{ background: themes[t].bg }}
                        >
                            <span style={{ color: themes[t].accent }}>{t}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview Card */}
            <div className="flex justify-center">
                <div
                    ref={cardRef}
                    className="w-[400px] p-8 rounded-2xl shadow-2xl"
                    style={{ background: currentTheme.bg }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black"
                            style={{ backgroundColor: currentTheme.accent, color: '#14181c' }}
                        >
                            {profile.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-black" style={{ color: currentTheme.text }}>{profile.name}</h3>
                            <p className="text-sm font-medium" style={{ color: currentTheme.secondary }}>Travel Stats 2024</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="text-4xl font-black mb-1" style={{ color: currentTheme.accent }}>{countries.size}</div>
                            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: currentTheme.secondary }}>Countries</div>
                        </div>
                        <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="text-4xl font-black mb-1" style={{ color: currentTheme.accent }}>{states.size}</div>
                            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: currentTheme.secondary }}>US States</div>
                        </div>
                        <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="text-4xl font-black mb-1" style={{ color: currentTheme.text }}>{locations.length}</div>
                            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: currentTheme.secondary }}>Total Trips</div>
                        </div>
                        <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="text-4xl font-black mb-1" style={{ color: currentTheme.text }}>⭐ {avgRating}</div>
                            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: currentTheme.secondary }}>Avg Rating</div>
                        </div>
                    </div>

                    {/* Years badge */}
                    <div className="text-center mb-6">
                        <span
                            className="inline-block px-4 py-2 rounded-full text-sm font-bold"
                            style={{ backgroundColor: currentTheme.accent, color: '#14181c' }}
                        >
                            {years.size} Years of Adventures
                        </span>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <div className="flex items-center justify-center gap-2">
                            <i className="fas fa-location-arrow" style={{ color: currentTheme.accent }}></i>
                            <span className="text-sm font-bold" style={{ color: currentTheme.secondary }}>Travel Muse</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-center gap-4">
                <Button variant="primary" onClick={handleDownload} isLoading={isGenerating}>
                    <i className="fas fa-download"></i> Download Card
                </Button>
                <Button variant="ghost" onClick={() => {
                    const stats = `🌍 My Travel Stats\n\n${countries.size} Countries\n${states.size} US States\n${locations.length} Trips\n${years.size} Years of Travel\n⭐ ${avgRating} Avg Rating\n\nTracked with Travel Muse`;
                    navigator.clipboard.writeText(stats);
                    alert('Stats copied to clipboard!');
                }}>
                    <i className="fas fa-copy"></i> Copy Text
                </Button>
            </div>
        </div>
    );
};
