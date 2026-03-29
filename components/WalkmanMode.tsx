import React, { useState, useEffect, useRef } from 'react';
import { extractLocationFromText } from '../services/geminiService';
import { useToast } from './Toast';

interface WalkmanModeProps {
    onExtracted: (result: any) => void;
}

export const WalkmanMode: React.FC<WalkmanModeProps> = ({ onExtracted }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const { showToast } = useToast();
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';
        } else {
            console.error("Speech Recognition API not supported in this browser.");
        }
    }, []);

    const toggleRecording = () => {
        if (isProcessing) return;
        
        if (isRecording) {
            setIsRecording(false);
            if (recognitionRef.current) recognitionRef.current.stop();
        } else {
            if (!recognitionRef.current) {
                showToast('Speech recognition is not supported in this browser.', 'error');
                return;
            }
            
            setIsRecording(true);
            
            recognitionRef.current.onresult = async (event: any) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                
                setIsRecording(false);
                setIsProcessing(true);
                
                try {
                    const extracted = await extractLocationFromText(transcript);
                    onExtracted(extracted);
                    showToast('Location logged from audio!', 'success');
                } catch (error) {
                    console.error(error);
                    showToast('Failed to parse audio transcript', 'error');
                } finally {
                    setIsProcessing(false);
                }
            };
            
            recognitionRef.current.onerror = (event: any) => {
                setIsRecording(false);
                if (event.error !== 'no-speech') {
                    showToast(`Microphone error: ${event.error}`, 'error');
                }
            };

            recognitionRef.current.start();
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[90] flex flex-col items-end gap-3 group">
            {isRecording && (
                <div className="bg-[#1b2228] border border-[#00e054] p-3 rounded-lg shadow-[0_0_20px_rgba(0,224,84,0.3)] animate-in slide-in-from-bottom-2 fade-in">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 h-4 items-end">
                            <div className="w-1 bg-[#00e054] rounded-full animate-bounce" style={{ height: '40%', animationDuration: '0.4s' }}></div>
                            <div className="w-1 bg-[#00e054] rounded-full animate-bounce" style={{ height: '80%', animationDuration: '0.3s' }}></div>
                            <div className="w-1 bg-[#00e054] rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.5s' }}></div>
                            <div className="w-1 bg-[#00e054] rounded-full animate-bounce" style={{ height: '60%', animationDuration: '0.4s' }}></div>
                            <div className="w-1 bg-[#00e054] rounded-full animate-bounce" style={{ height: '90%', animationDuration: '0.6s' }}></div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-[#00e054] tracking-widest ml-1">Listening...</span>
                    </div>
                    <p className="text-[8px] text-[#9ab] mt-1 text-right italic font-black uppercase">"Tap to end dictation"</p>
                </div>
            )}

            {isProcessing && (
                <div className="bg-[#1b2228] border border-[#40bcf4] p-3 rounded-lg shadow-[0_0_20px_rgba(64,188,244,0.3)] animate-in slide-in-from-bottom-2 fade-in">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-cog fa-spin text-[#40bcf4]"></i>
                        <span className="text-[10px] font-black uppercase text-[#40bcf4] tracking-widest">Parsing Vibe...</span>
                    </div>
                </div>
            )}

            <button
                onClick={toggleRecording}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isRecording ? 'bg-[#00e054] text-black scale-110 shadow-[0_0_30px_rgba(0,224,84,0.5)]' : isProcessing ? 'bg-[#40bcf4] text-black cursor-not-allowed shadow-[0_0_20px_rgba(64,188,244,0.4)]' : 'bg-[#1b2228] border-2 border-[#2c3440] text-white hover:border-[#00e054] hover:scale-105'}`}
            >
                <i className={`fas ${isRecording ? 'fa-stop' : isProcessing ? 'fa-spinner fa-spin' : 'fa-microphone'} text-xl`}></i>
            </button>
        </div>
    );
};
