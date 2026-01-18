"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, ChevronRight, Zap } from "lucide-react";

interface SummoningStartOverlayProps {
    onComplete: () => void;
}

export default function SummoningStartOverlay({ onComplete }: SummoningStartOverlayProps) {
    const [step, setStep] = useState(0); // 0: Start, 1: Zoom, 2: Fade out

    useEffect(() => {
        // Sequence of animations
        const timer1 = setTimeout(() => setStep(1), 500); // Start zoom
        const timer2 = setTimeout(() => setStep(2), 2500); // Start fade
        const timer3 = setTimeout(onComplete, 3500); // Complete

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    if (step === 2) return null; // Or handle empty return if fading handled by CSS

    return (
        <div className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-1000 ${step === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className={`relative transition-transform duration-[2000ms] ease-in-out ${step >= 1 ? 'scale-[5] opacity-0' : 'scale-100 opacity-100'}`}>
                {/* Ancient Circle */}
                <div className="absolute inset-0 border-[4px] border-purple-500 rounded-full animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-4 border-[2px] border-amber-500 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-purple-900 to-black flex items-center justify-center relative overflow-hidden shadow-[0_0_100px_rgba(147,51,234,0.5)]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse" />

                    <div className="text-center relative z-10 space-y-2">
                        <div className="text-4xl">📜</div>
                        <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                            The Ritual
                        </h1>
                        <p className="text-[10px] text-purple-400 uppercase tracking-widest">Beginning...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
