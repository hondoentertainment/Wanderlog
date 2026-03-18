import React, { useState, useRef } from 'react';
import { Button } from './Button';

interface ReceiptScannerProps {
    onScanned: (result: any) => void;
    onClose: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanned, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleScan = async () => {
        if (!preview) return;
        setIsScanning(true);
        try {
            // Simulate Gemini OCR extraction delay
            setTimeout(() => {
                const mockResult = {
                    name: "Receipt OCR Scan",
                    type: "landmark",
                    rating: 5,
                    likes: ["Extracted from paper logic"],
                    dislikes: [],
                    dateVisited: new Date().toISOString(),
                    wishlistData: { discoveryRationale: "Extracted via Ambient Vision." }
                };
                setIsScanning(false);
                onScanned(mockResult);
            }, 3000);
        } catch (e) {
            console.error(e);
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1b2228] border border-[#2c3440] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 border-b border-[#2c3440] flex justify-between items-center bg-[#14181c]">
                    <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                        <i className="fas fa-receipt text-[#00e054]"></i> Omni-Receipt Scan
                    </h3>
                    <button onClick={onClose} className="text-[#567] hover:text-white transition-colors w-6 h-6 flex items-center justify-center">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6">
                    {!preview ? (
                        <div
                            className="border-2 border-dashed border-[#2c3440] rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-[#00e054] hover:bg-[#00e054]/5 transition-all group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-12 h-12 bg-[#2c3440] group-hover:bg-[#00e054] rounded-full flex items-center justify-center mb-3 transition-colors">
                                <i className="fas fa-camera text-xl text-[#567] group-hover:text-black"></i>
                            </div>
                            <span className="text-xs font-bold text-[#9ab] uppercase tracking-widest text-center px-4">Tap to capture receipt</span>
                            <span className="text-[10px] text-[#567] mt-1">or flight ticket</span>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="relative h-48 rounded-xl overflow-hidden border border-[#2c3440]">
                                <img src={preview} alt="Receipt preview" className="w-full h-full object-cover opacity-50" />
                                {isScanning && (
                                    <div className="absolute inset-0 bg-[#00e054]/20 flex flex-col items-center justify-center animate-pulse backdrop-blur-sm">
                                        <i className="fas fa-expand text-4xl text-[#00e054] mb-2 animate-spin-slow shadow-[0_0_20px_rgba(0,224,84,0.5)]"></i>
                                        <span className="text-[10px] font-black uppercase text-white tracking-widest shrink-0 bg-black/50 px-3 py-1 rounded-full">Extracting Data...</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setPreview(null)} disabled={isScanning} className="flex-1 border border-[#2c3440] hover:bg-[#2c3440]">Retake</Button>
                                <Button variant="primary" onClick={handleScan} isLoading={isScanning} className="flex-1 shadow-[0_0_15px_rgba(0,224,84,0.3)]">Analyze Data</Button>
                            </div>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
            </div>
        </div>
    );
};
