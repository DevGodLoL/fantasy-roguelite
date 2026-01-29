"use client";

import Link from "next/link";
import { Swords, Map } from "lucide-react";

interface DungeonProgressProps {
    leagueId: string;
    currentFloor: number;
    floorName: string;
    totalFloors: number;
    completedFloors: number;
}

export default function DungeonProgress({
    leagueId,
    currentFloor,
    floorName,
    totalFloors,
    completedFloors
}: DungeonProgressProps) {
    const progressPercent = (completedFloors / totalFloors) * 100;

    return (
        <div className="relative bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden group hover:border-cyan-500/30 transition-all">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Map size={16} className="text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                            The Dungeon
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600">
                        {completedFloors}/{totalFloors}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Current Floor Display */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 border-2 border-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                        <Swords size={20} className="text-white animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                            Floor {currentFloor}
                        </div>
                        <div className="text-lg font-bold text-white font-serif italic truncate">
                            {floorName}
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <Link
                    href={`/league/${leagueId}/campaign`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                    <Map size={14} />
                    View Campaign Map
                </Link>
            </div>
        </div>
    );
}
