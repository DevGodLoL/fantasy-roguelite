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

// Rank badges and styling
const RANK_CONFIG: Record<number, { icon: string; border: string; bg: string; glow: string }> = {
    1: { icon: "👑", border: "border-amber-500/50", bg: "bg-gradient-to-r from-amber-900/30 to-amber-950/20", glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]" },
    2: { icon: "🥈", border: "border-zinc-400/30", bg: "bg-gradient-to-r from-zinc-700/20 to-zinc-800/10", glow: "" },
    3: { icon: "🥉", border: "border-amber-700/30", bg: "bg-gradient-to-r from-amber-800/20 to-amber-900/10", glow: "" },
};

export default function StandingsTable({ leagueId, teams }: StandingsTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof TeamStats; direction: 'asc' | 'desc' } | null>({ key: 'wins', direction: 'desc' });

    const sortedTeams = [...teams].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Custom sort for Record/Wins priority
        if (sortConfig.key === 'wins') {
            // Primary: Wins
            if (a.wins !== b.wins) return sortConfig.direction === 'asc' ? a.wins - b.wins : b.wins - a.wins;
            // Secondary: PF
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
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Check if team is "The DevGods" (user team)
    const isUserTeam = (name: string) => name === "The DevGods";

    return (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-black/40 backdrop-blur-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-purple-900/20 to-purple-900/5 uppercase text-[10px] font-black tracking-widest text-zinc-500 border-b border-purple-500/20">
                    <tr>
                        <th className="px-4 py-4 w-16 text-center">Rank</th>
                        <th className="px-4 py-4 cursor-pointer hover:text-purple-400 transition-colors" onClick={() => requestSort('name')}>
                            Champion {getSortIndicator('name')}
                        </th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-purple-400 transition-colors" onClick={() => requestSort('wins')}>
                            Record {getSortIndicator('wins')}
                        </th>
                        <th className="px-4 py-4 text-right cursor-pointer hover:text-purple-400 transition-colors" onClick={() => requestSort('pf')}>
                            ⚔️ ATK {getSortIndicator('pf')}
                        </th>
                        <th className="px-4 py-4 text-right cursor-pointer hidden md:table-cell hover:text-purple-400 transition-colors" onClick={() => requestSort('pa')}>
                            🛡️ DEF {getSortIndicator('pa')}
                        </th>
                        <th className="px-4 py-4 text-center hidden md:table-cell">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sortedTeams.map((team, index) => {
                        const rank = index + 1;
                        const rankConfig = RANK_CONFIG[rank];
                        const isUser = isUserTeam(team.name);

                        return (
                            <tr
                                key={team.id}
                                className={`
                                    transition-all group
                                    ${rankConfig ? `${rankConfig.bg} ${rankConfig.glow}` : 'hover:bg-white/5'}
                                    ${isUser ? 'ring-1 ring-purple-500/30 bg-purple-900/10' : ''}
                                `}
                            >
                                {/* Rank */}
                                <td className="px-4 py-4 text-center">
                                    {rankConfig ? (
                                        <span className="text-2xl">{rankConfig.icon}</span>
                                    ) : (
                                        <span className="text-lg font-black text-zinc-600">#{rank}</span>
                                    )}
                                </td>

                                {/* Team Name */}
                                <td className="px-4 py-4 font-bold">
                                    <Link
                                        href={`/league/${leagueId}/team/${team.id}`}
                                        className="group-hover:text-purple-400 transition-colors flex items-center gap-3"
                                    >
                                        {/* Team Avatar */}
                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black
                                            ${rank === 1 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-black' :
                                                rank === 2 ? 'bg-gradient-to-br from-zinc-400 to-zinc-600 text-black' :
                                                    rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-black' :
                                                        isUser ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white' :
                                                            'bg-zinc-800 text-zinc-400'}
                                        `}>
                                            {team.name.charAt(0)}
                                        </div>

                                        <div className="flex flex-col">
                                            <span className={`text-base ${isUser ? 'text-purple-300' : 'text-white'}`}>
                                                {team.name}
                                                {isUser && <span className="ml-2 text-[10px] text-purple-400 uppercase">(You)</span>}
                                            </span>
                                            <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-wider">
                                                {team.ownerName}
                                            </span>
                                        </div>
                                    </Link>
                                </td>

                                {/* Record */}
                                <td className="px-4 py-4 text-center">
                                    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded-lg font-mono text-sm">
                                        <span className="text-emerald-400 font-black">{team.wins}</span>
                                        <span className="text-zinc-600">-</span>
                                        <span className="text-red-400">{team.losses}</span>
                                        {team.ties > 0 && (
                                            <>
                                                <span className="text-zinc-600">-</span>
                                                <span className="text-zinc-500">{team.ties}</span>
                                            </>
                                        )}
                                    </div>
                                </td>

                                {/* Points For (Attack) */}
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden hidden lg:block">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                                style={{ width: `${Math.min((team.pf / 1500) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-emerald-400">{team.pf.toFixed(1)}</span>
                                    </div>
                                </td>

                                {/* Points Against (Defense) */}
                                <td className="px-4 py-4 text-right hidden md:table-cell">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden hidden lg:block">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                                                style={{ width: `${Math.min((team.pa / 1500) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-red-400">{team.pa.toFixed(1)}</span>
                                    </div>
                                </td>

                                {/* Streak / Status */}
                                <td className="px-4 py-4 text-center hidden md:table-cell">
                                    {team.streak.count > 0 && (
                                        <span className={`
                                            inline-flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-lg
                                            ${team.streak.type === 'W'
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : team.streak.type === 'L'
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                            }
                                        `}>
                                            {team.streak.type === 'W' ? '🔥' : team.streak.type === 'L' ? '💀' : '⚖️'}
                                            {team.streak.type}{team.streak.count}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
