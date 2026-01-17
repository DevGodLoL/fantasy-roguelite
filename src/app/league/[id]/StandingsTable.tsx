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

    return (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-sm text-left">
                <thead className="bg-white/5 uppercase text-[10px] font-black tracking-widest text-zinc-500">
                    <tr>
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('name')}>
                            Team {getSortIndicator('name')}
                        </th>
                        <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('wins')}>
                            W-L-T {getSortIndicator('wins')}
                        </th>
                        <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('pf')}>
                            PF {getSortIndicator('pf')}
                        </th>
                        <th className="px-6 py-4 text-right cursor-pointer hidden md:table-cell hover:text-white transition-colors" onClick={() => requestSort('pa')}>
                            PA {getSortIndicator('pa')}
                        </th>
                        <th className="px-6 py-4 text-center hidden md:table-cell">
                            Streak
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sortedTeams.map((team, index) => (
                        <tr key={team.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs text-zinc-500 italic">
                                {index + 1}
                            </td>
                            <td className="px-6 py-4 font-bold">
                                <Link href={`/league/${leagueId}/team/${team.id}`} className="group-hover:text-purple-400 transition-colors flex flex-col">
                                    <span className="text-base">{team.name}</span>
                                    <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-wider">{team.ownerName}</span>
                                </Link>
                            </td>
                            <td className="px-6 py-4 text-center font-bold">
                                <span className="text-white">{team.wins}</span>
                                <span className="text-zinc-600 px-1">-</span>
                                <span className="text-zinc-400">{team.losses}</span>
                                {team.ties > 0 && (
                                    <>
                                        <span className="text-zinc-600 px-1">-</span>
                                        <span className="text-zinc-500">{team.ties}</span>
                                    </>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-zinc-300">
                                {team.pf.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-zinc-500 hidden md:table-cell">
                                {team.pa.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 text-center hidden md:table-cell">
                                <span className={`text-[10px] font-black px-2 py-1 rounded ${team.streak.type === 'W' ? 'bg-green-500/20 text-green-400' :
                                        team.streak.type === 'L' ? 'bg-red-500/20 text-red-400' :
                                            'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    {team.streak.type}{team.streak.count}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
