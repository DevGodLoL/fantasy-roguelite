'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LeagueError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('League Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-zinc-900/50 border border-red-500/20 rounded-3xl p-10 text-center backdrop-blur-xl">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    💀
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4 tracking-tighter">
                    The Ritual Failed
                </h2>
                <p className="text-zinc-500 text-sm mb-10 leading-relaxed font-medium">
                    A dark energy has disrupted the connection to the realm. The archives may be temporarily inaccessible or the ley lines are unstable.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => reset()}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    >
                        🔄 Attempt Recovery
                    </button>

                    <Link
                        href="/leagues"
                        className="block w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase text-xs rounded-xl transition-all"
                    >
                        ← Retreat to Sanctuary
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest truncate">
                        Error ID: {error.digest || 'Internal Flux'}
                    </p>
                </div>
            </div>
        </div>
    );
}
