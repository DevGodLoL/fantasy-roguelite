"use client";

import Link from "next/link";
import { useState } from "react";

interface TeamStats {
    id: string;
    name: string;
    ownerName: string;
    wins: number;
    losses: number;
    ties: number;
    pf: number;
    pa: number;
    streak: { type: 'W' | 'L' | 'T'; count: number };
}

interface StandingsTableProps {
    leagueId: string;
    teams: TeamStats[];
}

// Tier Logic
type Tier = 'ascended' | 'vanguard' | 'legion';

function getTier(rank: number): Tier {
    if (rank <= 2) return 'ascended';
    if (rank <= 5) return 'vanguard';
    return 'legion';
}

const TIER_CONFIG: Record<Tier, { icon: string, text: string, bg: string, border: string, glow: string }> = {
    ascended: {
        icon: '🔱',
        text: 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]',
        bg: 'bg-gradient-to-br from-amber-500 to-amber-700',
        border: 'border-amber-400/50',
        glow: 'shadow-amber-500/20'
    },
    vanguard: {
        icon: '🛡️',
        text: 'text-blue-400',
        bg: 'bg-gradient-to-br from-blue-500 to-blue-700',
        border: 'border-blue-400/50',
        glow: 'shadow-blue-500/20'
    },
    legion: {
        icon: '⚔️',
        text: 'text-zinc-600',
        bg: 'bg-zinc-800',
        border: 'border-white/10',
        glow: ''
    }
};

export default function StandingsTable({ leagueId, teams }: StandingsTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof TeamStats; direction: 'asc' | 'desc' } | null>({ key: 'wins', direction: 'desc' });

    const sortedTeams = [...teams].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'wins') {
            if (a.wins !== b.wins) return sortConfig.direction === 'asc' ? a.wins - b.wins : b.wins - a.wins;
            return b.pf - a.pf;
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key: keyof TeamStats) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof TeamStats) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return <span className="ml-1 text-purple-400">{sortConfig.direction === 'asc' ? '▴' : '▾'}</span>;
    };

    const isUserTeam = (name: string) => name === "The DevGods";

    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {/* Background Glint */}
            <div className="absolute -inset-x-full top-0 h-full w-full bg-gradient-to-r from-transparent via-white/[0.02] to-transparent skew-x-12 transition-all duration-1000 group-hover:inset-x-full pointer-events-none" />

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gradient-to-r from-zinc-900 to-black uppercase text-[10px] font-black tracking-[0.3em] text-zinc-500 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-6 w-20 text-center">Rank</th>
                            <th className="px-6 py-6 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('name')}>
                                Commander {getSortIndicator('name')}
                            </th>
                            <th className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('wins')}>
                                Campaign {getSortIndicator('wins')}
                            </th>
                            <th className="px-6 py-6 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('pf')}>
                                Prowess {getSortIndicator('pf')}
                            </th>
                            <th className="px-6 py-6 text-center hidden md:table-cell">
                                Momentum
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {sortedTeams.map((team, index) => {
                            const rank = index + 1;
                            const isUser = isUserTeam(team.name);
                            const tier = getTier(rank);
                            const config = TIER_CONFIG[tier];

                            return (
                                <tr
                                    key={team.id}
                                    className={`
                                        transition-all duration-300 group/row
                                        ${isUser ? 'bg-purple-500/[0.03]' : 'hover:bg-white/[0.02]'}
                                        relative
                                    `}
                                >
                                    {/* Rank */}
                                    <td className="px-6 py-8 text-center relative">
                                        {isUser && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-purple-500 rounded-r-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                                        )}
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-2xl font-black italic tracking-tighter ${config.text}`}>
                                                {rank < 10 ? `0${rank}` : rank}
                                            </span>
                                            {rank <= 3 && <span className="text-xs">{config.icon}</span>}
                                        </div>
                                    </td>

                                    {/* Commander */}
                                    <td className="px-6 py-8">
                                        <Link
                                            href={`/league/${leagueId}/team/${team.id}`}
                                            className="group/link flex items-center gap-5 outline-none"
                                        >
                                            {/* Sigil */}
                                            <div className={`
                                                relative w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black tracking-tighter
                                                transition-all duration-500 group-hover/link:scale-110 group-hover/link:rotate-3
                                                ${config.bg} ${config.border} border-2 shadow-lg ${config.glow}
                                            `}>
                                                {team.name.charAt(0)}
                                                {/* Corner Accent */}
                                                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white/20 rounded-tr-sm" />
                                            </div>

                                            <div className="flex flex-col space-y-1">
                                                <span className={`text-lg font-black uppercase tracking-tight transition-colors ${isUser ? 'text-purple-300' : 'text-white group-hover/link:text-purple-400'}`}>
                                                    {team.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                                        {team.ownerName}
                                                    </span>
                                                    {isUser && (
                                                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.2em] animate-pulse">
                                                            Your Legion
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </td>

                                    {/* Campaign Record */}
                                    <td className="px-6 py-8 text-center">
                                        <div className="inline-flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2 font-mono text-xl font-black">
                                                <span className="text-emerald-500">{team.wins}</span>
                                                <span className="text-zinc-700">/</span>
                                                <span className="text-red-500">{team.losses}</span>
                                            </div>
                                            <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                                W - L Record
                                            </div>
                                        </div>
                                    </td>

                                    {/* Prowess */}
                                    <td className="px-6 py-8 text-right">
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs font-black text-emerald-400/60 font-mono italic">ATK</span>
                                                <span className="text-lg font-black text-white italic tracking-tighter">{team.pf.toFixed(1)}</span>
                                            </div>
                                            <div className="h-1.5 w-32 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/5 hidden sm:block">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${rank <= 3 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-purple-600 to-blue-500'}`}
                                                    style={{ width: `${Math.min((team.pf / 1500) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[9px] font-black text-red-400/40 font-mono">DEF</span>
                                                <span className="text-sm font-bold text-zinc-500 font-mono tracking-tighter">{team.pa.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Momentum / Aura */}
                                    <td className="px-6 py-8 text-center hidden md:table-cell">
                                        {team.streak.count > 0 && (
                                            <div className="flex flex-col items-center gap-1 group/aura">
                                                <div className={`
                                                    relative w-10 h-10 rounded-full flex items-center justify-center text-lg
                                                    transition-transform duration-500 group-hover/aura:scale-125
                                                    ${team.streak.type === 'W'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                    }
                                                `}>
                                                    {team.streak.type === 'W' ? '🔥' : '💀'}
                                                    {/* Orbiting particles */}
                                                    <div className="absolute inset-0 rounded-full border border-dashed border-current opacity-20 animate-[spin_10s_linear_infinite]" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">
                                                    {team.streak.count}{team.streak.type === 'W' ? ' Burn' : ' Chill'}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
