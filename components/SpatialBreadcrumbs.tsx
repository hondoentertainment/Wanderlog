import React, { useState } from 'react';
import { Button } from './Button';

interface SpatialBreadcrumbsProps {
    onClose: () => void;
    onDrop: (note: string) => void;
}

export const SpatialBreadcrumbs: React.FC<SpatialBreadcrumbsProps> = ({ onClose, onDrop }) => {
    const [note, setNote] = useState('');

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1b2228] border border-[#2c3440] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-gradient-to-r from-[#40bcf4] to-[#bc1888] p-1">
                    <div className="bg-[#14181c] p-4 flex justify-between items-center">
                        <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                            <i className="fas fa-map-pin text-[#40bcf4]"></i> Drop Spatial Note
                        </h3>
                        <button onClick={onClose} className="text-[#567] hover:text-white transition-colors w-6 h-6 flex items-center justify-center">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-[10px] text-[#9ab] uppercase tracking-widest font-bold leading-relaxed">Anchor a persistent AR note for your Squad at this exact GPS coordinate.</p>

                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g., The speakeasy entrance is behind the second bookshelf..."
                        className="w-full bg-[#14181c] border border-[#2c3440] text-sm text-white rounded-lg p-3 outline-none focus:border-[#40bcf4] focus:ring-1 focus:ring-[#40bcf4]/50 resize-none h-24 shadow-inner"
                    />

                    <div className="flex gap-2 pt-2">
                        <Button variant="ghost" className="flex-1 border border-[#2c3440] hover:bg-[#2c3440]" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" className="flex-1 bg-[#40bcf4] text-black hover:bg-[#32a4d8] shadow-[0_0_15px_rgba(64,188,244,0.3)]" onClick={() => onDrop(note)} disabled={!note.trim()}>
                            Drop Pin
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
