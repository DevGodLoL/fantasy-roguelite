"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Lock, Swords, CheckCircle2, Skull, Trophy } from "lucide-react";

interface WeekNode {
    id: string;
    number: number;
    name: string;
    isCurrent: boolean;
    isCompleted: boolean;
    isLocked: boolean;
}

interface DungeonMapProps {
    leagueId: string;
    weeks: WeekNode[];
}

export default function DungeonMap({ leagueId, weeks }: DungeonMapProps) {
    const listRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to current week
    // Auto-scroll to current week
    // useEffect(() => {
    //     if (listRef.current) {
    //         const currentEl = listRef.current.querySelector('[data-current="true"]');
    //         if (currentEl) {
    //             currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //         }
    //     }
    // }, [weeks]);

    return (
        <div
            ref={listRef}
            className="relative bg-zinc-950/40 border border-white/5 rounded-3xl overflow-hidden max-h-[600px] overflow-y-auto custom-scrollbar group"
        >
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Path connector line */}
            <div className="absolute left-[2.25rem] top-8 bottom-8 w-0.5 bg-zinc-800 pointer-events-none" />

            <div className="relative z-10 p-6 space-y-6">
                {weeks.map((week, index) => {
                    // Determine Node Visuals
                    let icon = <Lock size={14} />;
                    let nodeColor = "bg-zinc-900 border-zinc-800 text-zinc-600";
                    let glow = "";
                    let textColor = "text-zinc-600";

                    if (week.isCompleted) {
                        icon = <CheckCircle2 size={16} />;
                        nodeColor = "bg-emerald-950 border-emerald-500/30 text-emerald-500";
                        textColor = "text-zinc-400";
                    } else if (week.isCurrent) {
                        icon = <Swords size={18} className="animate-pulse" />;
                        nodeColor = "bg-purple-600 border-purple-400 text-white";
                        glow = "shadow-[0_0_20px_rgba(147,51,234,0.5)] ring-4 ring-purple-500/10";
                        textColor = "text-white";
                    } else if (!week.isLocked) {
                        icon = <Skull size={16} />;
                        nodeColor = "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 transition-colors";
                        textColor = "text-zinc-400";
                    }

                    // Special Boss Node (Week 14/Final)
                    const isBossNode = index === weeks.length - 1;
                    if (isBossNode) {
                        icon = <Trophy size={16} />;
                        if (!week.isCompleted && !week.isCurrent) {
                            nodeColor = "bg-amber-950/30 border-amber-500/30 text-amber-500/50";
                        }
                    }

                    return (
                        <Link
                            key={week.id}
                            href={week.isLocked ? '#' : `/league/${leagueId}/week/${week.number}`}
                            data-current={week.isCurrent}
                            className={`
                                relative flex items-center gap-4 group/node transition-all
                                ${week.isLocked ? 'cursor-not-allowed opacity-60' : 'hover:translate-x-1'}
                            `}
                        >
                            {/* Node Icon */}
                            <div className={`
                                relative z-20 w-12 h-12 rounded-full flex items-center justify-center border-2
                                transition-all duration-300
                                ${nodeColor} ${glow}
                            `}>
                                {icon}
                            </div>

                            {/* Node Info */}
                            <div className={`flex flex-col flex-1 p-3 rounded-xl border border-transparent transition-all ${week.isCurrent ? "bg-white/5 border-white/5" : "group-hover/node:bg-white/[0.02]"}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${week.isCurrent ? "text-purple-400" : "text-zinc-500"}`}>
                                        {isBossNode ? "Final Boss" : `Floor ${week.number}`}
                                    </span>
                                    {week.isCurrent && (
                                        <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                                    )}
                                </div>

                                <span className={`text-sm font-bold font-serif italic ${textColor}`}>
                                    {week.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Scroll Shadow */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
        </div>
    );
}
