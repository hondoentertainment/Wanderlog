import React, { useState, useRef, useEffect } from 'react';
import { JulesMessage, TravelLocation, UserProfile } from '../types';
import { askJules } from '../services/geminiService';

interface AskJulesProps {
    locations: TravelLocation[];
    profile: UserProfile;
}

const SUGGESTED_QUESTIONS = [
    "Where should I go next based on my travel history?",
    "Plan a weekend getaway for under $500",
    "What's a hidden gem similar to my favorite trips?",
    "Best time to visit Japan?",
    "How can I travel more sustainably?",
];

export const AskJules: React.FC<AskJulesProps> = ({ locations, profile }) => {
    const [messages, setMessages] = useState<JulesMessage[]>([
        {
            id: '1',
            role: 'jules',
            content: `Hey ${profile.name}! 👋 I'm Jules, your personal travel coach. I've been looking at your travel history and I'm excited to help you plan your next adventure! Ask me anything about destinations, trip planning, or travel tips.`,
            timestamp: new Date().toISOString(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (question?: string) => {
        const text = question || input.trim();
        if (!text || isLoading) return;

        const userMessage: JulesMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const response = await askJules(text, locations, profile, history);

            const julesMessage: JulesMessage = {
                id: crypto.randomUUID(),
                role: 'jules',
                content: response,
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, julesMessage]);
        } catch (error) {
            const errorMessage: JulesMessage = {
                id: crypto.randomUUID(),
                role: 'jules',
                content: "I'm having trouble connecting right now. Please try again in a moment! ✈️",
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] max-h-[600px]">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-[#2c3440]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00e054] to-[#40bcf4] rounded-full flex items-center justify-center shadow-lg shadow-[#00e054]/20">
                    <i className="fas fa-robot text-white text-lg"></i>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Ask Jules</h2>
                    <p className="text-[#567] text-xs">Your AI Travel Coach</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#00e054] rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-[#567] uppercase tracking-widest">Online</span>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${message.role === 'jules'
                                ? 'bg-gradient-to-br from-[#00e054] to-[#40bcf4]'
                                : 'bg-[#ff8000]'
                            }`}>
                            <i className={`fas ${message.role === 'jules' ? 'fa-robot' : 'fa-user'} text-white text-xs`}></i>
                        </div>

                        {/* Message Bubble */}
                        <div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'jules'
                                ? 'bg-[#1b2228] border border-[#2c3440] text-[#def]'
                                : 'bg-[#00e054]/20 border border-[#00e054]/30 text-white'
                            }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-[9px] text-[#567] mt-2">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#00e054] to-[#40bcf4]">
                            <i className="fas fa-robot text-white text-xs"></i>
                        </div>
                        <div className="bg-[#1b2228] border border-[#2c3440] p-3 rounded-lg">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-[#567] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-[#567] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-[#567] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 2 && (
                <div className="pb-4">
                    <p className="text-[10px] font-bold text-[#567] uppercase tracking-widest mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(q)}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-xs bg-[#1b2228] border border-[#2c3440] rounded-full text-[#9ab] hover:border-[#00e054] hover:text-white transition-colors disabled:opacity-50"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="pt-4 border-t border-[#2c3440]">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Jules anything about travel..."
                        disabled={isLoading}
                        className="flex-1 bg-[#1b2228] border border-[#2c3440] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#567] focus:border-[#00e054] focus:outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-3 bg-[#00e054] hover:bg-[#00c030] text-[#14181c] font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};
