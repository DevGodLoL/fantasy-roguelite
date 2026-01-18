"use client";

import { useState } from "react";
import { ensurePackOffers } from "./actions";

interface OpenPackButtonProps {
    leagueId: string;
    teamId: string;
    weekId: string;
}

export default function OpenPackButton({ leagueId, teamId, weekId }: OpenPackButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = async () => {
        setIsLoading(true);
        try {
            await ensurePackOffers(leagueId, teamId, weekId);
            // Action handles revalidation
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    return (
        <div className="mb-8 p-8 border border-dashed border-zinc-700 rounded-3xl bg-zinc-900/30 flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-bold text-zinc-300 mb-2">Weekly Supply Drop Available</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md">
                Open your weekly pack to discover artifacts that can boost your score or hinder your opponent.
            </p>
            <button
                onClick={handleOpen}
                disabled={isLoading}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        Opening... <span className="animate-spin">⚡</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <span className="text-xl">📦</span> Open Pack
                    </span>
                )}
            </button>
        </div>
    );
}
