import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QUESTS, QuestDefinition, QUEST_RARITY_CONFIG, getVisibleQuestsSorted } from "@/lib/game-data/quests";
import { Trophy, Flame, Sparkles, Lock, ShieldCheck, Skull } from "lucide-react";
import React from "react";

export default async function QuestsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: { teams: true, matchups: true },
    });

    if (!league) return notFound();

    // Get user team
    const userTeam = league.teams.find(t => t.name === "The DevGods") || league.teams[0];

    // Calculate player stats for quest evaluation
    const userMatchups = league.matchups.filter(
        m => (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id) && m.status === 'final'
    );

    let wins = 0;
    let losses = 0;
    let highestScore = 0;
    let totalPoints = 0;
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let gamesPlayed = 0;
    let closeWins = 0;
    let blowoutWins = 0;
    let comebackWins = 0;
    let lossStreak = 0;

    for (const match of userMatchups) {
        const isHome = match.homeTeamId === userTeam.id;
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const oppScore = isHome ? match.awayScore : match.homeScore;

        gamesPlayed++;
        totalPoints += teamScore;
        if (teamScore > highestScore) highestScore = teamScore;

        const margin = teamScore - oppScore;

        if (teamScore > oppScore) {
            wins++;
            currentWinStreak++;
            if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;

            // Close win (within 5 points)
            if (margin > 0 && margin <= 5) closeWins++;
            // Blowout win (50+ margin)
            if (margin >= 50) blowoutWins++;
            // Comeback after 2+ losses
            if (lossStreak >= 2) comebackWins++;

            lossStreak = 0;
        } else {
            losses++;
            lossStreak++;
            currentWinStreak = 0;
        }
    }

    // Get artifact count
    const artifactCount = await db.teamPowerup.count({
        where: { teamId: userTeam.id, isConsumed: false },
    });

    // Get waiver claim count
    const waiverClaimCount = await db.waiverClaim.count({
        where: { teamId: userTeam.id, status: 'successful' },
    });

    // Calculate quest progress
    const evaluateQuest = (quest: QuestDefinition): { current: number; target: number; completed: boolean; failed?: boolean } => {
        let current = 0;
        const target = quest.requirement.target;
        let failed = false;

        switch (quest.requirement.type) {
            case 'wins':
                current = wins;
                // Perfect season fails if you have any losses
                if (quest.id === 'perfect_season' || quest.id === 'hidden_perfectionist') {
                    if (losses > 0) failed = true;
                }
                break;
            case 'losses':
                current = losses;
                break;
            case 'points_single':
                current = highestScore;
                break;
            case 'points_total':
                current = totalPoints;
                break;
            case 'streak':
            case 'win_streak':
                current = maxWinStreak;
                break;
            case 'artifacts_owned':
                current = artifactCount;
                break;
            case 'gold_earned':
                current = wins * 100; // estimated
                break;
            case 'gold_spent':
                current = 0;
                break;
            case 'waiver_claims':
                current = waiverClaimCount;
                break;
            case 'playoff_seed':
                const totalTeams = league.teams.length;
                const seed = userTeam.playoffSeed || totalTeams;
                // Lower seed is better, so we invert for progress
                current = Math.max(0, totalTeams - seed + 1);
                const adjustedTarget = totalTeams - target + 1;
                return {
                    current,
                    target: adjustedTarget,
                    completed: seed <= target,
                    failed: false
                };
            case 'games_played':
                current = gamesPlayed;
                break;
            case 'close_wins':
                current = closeWins;
                break;
            case 'blowout_wins':
                current = blowoutWins;
                break;
            case 'comeback_wins':
                current = comebackWins;
                break;
            default:
                current = 0;
        }

        return {
            current,
            target,
            completed: current >= target,
            failed
        };
    };

    const sortedQuests = getVisibleQuestsSorted();
    const hiddenQuests = QUESTS.filter(q => q.category === 'hidden');

    const completedCount = QUESTS.filter(q => evaluateQuest(q).completed).length;
    const legendaryCount = sortedQuests.filter(q => q.rarity === 'legendary').length;
    const completedLegendary = sortedQuests.filter(q => q.rarity === 'legendary' && evaluateQuest(q).completed).length;

    const renderQuestSection = (title: string, icon: React.ReactNode, quests: QuestDefinition[], accentColor: string) => (
        quests.length > 0 && (
            <section className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="text-xl">{icon}</div>
                    <h2 className={`text-xs font-black uppercase tracking-[0.3em] ${accentColor}`}>
                        {title}
                    </h2>
                    <div className="text-[10px] text-zinc-600">
                        {quests.filter(q => evaluateQuest(q).completed).length}/{quests.length}
                    </div>
                    <div className={`h-px flex-1 bg-gradient-to-r ${accentColor.replace('text-', 'from-')}/30 to-transparent`} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {quests.map(quest => {
                        const { current, target, completed, failed } = evaluateQuest(quest);
                        const progress = Math.min(100, (current / target) * 100);
                        const config = QUEST_RARITY_CONFIG[quest.rarity];

                        return (
                            <div
                                key={quest.id}
                                className={`
                                    relative p-5 rounded-2xl border transition-all overflow-hidden group
                                    bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
                                    ${completed ? 'ring-2 ring-emerald-500/30' : ''}
                                    ${failed ? 'opacity-60 grayscale-[0.5]' : 'hover:border-opacity-100'}
                                `}
                            >
                                <div className="absolute top-3 right-3 flex gap-2">
                                    {failed && (
                                        <div className="px-2 py-1 bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-md border border-red-500/30 flex items-center gap-1">
                                            <Skull size={10} />
                                            Failed
                                        </div>
                                    )}
                                    {completed && (
                                        <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-md border border-emerald-500/30 flex items-center gap-1">
                                            <Trophy size={10} />
                                            Complete
                                        </div>
                                    )}
                                    {!completed && !failed && quest.tier && (
                                        <div className="px-2 py-1 bg-zinc-800/80 text-zinc-400 text-[10px] font-black uppercase rounded-md">
                                            Tier {quest.tier}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className={`
                                        w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 border
                                        ${completed ? 'bg-emerald-500/20 border-emerald-500/30' : failed ? 'bg-red-500/10 border-red-500/20' : `bg-black/40 ${config.border}`}
                                    `}>
                                        {failed ? '💀' : quest.icon}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className={`font-bold ${completed ? 'text-emerald-400' : failed ? 'text-zinc-500' : 'text-white'}`}>
                                                {quest.name}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${config.badge}`}>
                                                {failed ? 'Locked' : quest.rarity}
                                            </span>
                                        </div>

                                        <p className="text-sm text-zinc-400">
                                            {quest.description}
                                        </p>

                                        <div className="space-y-2 pt-1">
                                            <div className="h-2 bg-black/40 rounded-full overflow-hidden relative">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${completed
                                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                        : failed
                                                            ? 'bg-zinc-800'
                                                            : quest.rarity === 'legendary'
                                                                ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                                                : quest.rarity === 'epic'
                                                                    ? 'bg-gradient-to-r from-purple-600 to-purple-400'
                                                                    : 'bg-gradient-to-r from-blue-600 to-blue-400'
                                                        }`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                                                <span className={`flex items-center gap-1.5 ${completed ? 'text-emerald-400' : failed ? 'text-red-500/70' : 'text-zinc-500'}`}>
                                                    {completed ? (
                                                        <>
                                                            <ShieldCheck size={12} className="shrink-0" />
                                                            Objective Met
                                                        </>
                                                    ) : failed ? (
                                                        <>
                                                            <Skull size={12} className="shrink-0" />
                                                            Impossible
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={12} className="shrink-0 animate-pulse" />
                                                            In Pursuit
                                                        </>
                                                    )}
                                                </span>

                                                <span className="font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                    {quest.requirement.type === 'playoff_seed'
                                                        ? `Seed #${userTeam.playoffSeed || '?'} / #${quest.requirement.target}`
                                                        : `${Math.floor(current)} / ${target}`
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase">Bounty:</span>
                                            <span className={`text-sm font-black ${completed ? 'text-emerald-500' : failed ? 'text-zinc-700 line-through decoration-red-900/50' : config.text}`}>
                                                {quest.reward.type === 'gold' && `💰 ${quest.reward.amount} Gold`}
                                                {quest.reward.type === 'reroll' && `🎲 ${quest.reward.amount} Rerolls`}
                                                {quest.reward.type === 'artifact' && `🎁 ${quest.reward.itemName}`}
                                                {quest.reward.type === 'title' && `🏅 Title: "${quest.reward.itemName}"`}
                                                {quest.reward.type === 'bonus_next_season' && `⭐ ${quest.reward.itemName}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        )
    );

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[15%] w-[50%] h-[40%] bg-amber-900/8 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[35%] bg-purple-900/6 blur-[150px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-12 space-y-12">
                <header className="space-y-6">
                    <Link href={`/league/${leagueId}`} className="text-zinc-500 hover:text-amber-400 transition-colors text-sm flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Back to Command
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-3xl shadow-xl">
                                📜
                            </div>
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    Quest Log
                                </h1>
                                <p className="text-zinc-500 text-sm">Legendary challenges for the chosen commanders</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="px-5 py-3 bg-zinc-900/60 border border-white/10 rounded-2xl text-center">
                                <div className="text-2xl font-black text-white">{completedCount}<span className="text-zinc-600">/{QUESTS.length}</span></div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Total</div>
                            </div>
                            <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center flex items-center gap-2">
                                <Flame size={20} className="text-emerald-400" />
                                <div>
                                    <div className="text-xl font-black text-emerald-400">{maxWinStreak}</div>
                                    <div className="text-[9px] text-emerald-500/60 uppercase font-bold">Best Streak</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="space-y-12">
                    {renderQuestSection('Legendary Challenges', '👑', sortedQuests.filter(q => q.rarity === 'legendary'), 'text-amber-400')}
                    {renderQuestSection('Epic Challenges', '💎', sortedQuests.filter(q => q.rarity === 'epic'), 'text-purple-400')}
                    {renderQuestSection('Rare Challenges', '⚔️', sortedQuests.filter(q => q.rarity === 'rare'), 'text-blue-400')}
                    {renderQuestSection('Common Challenges', '📋', sortedQuests.filter(q => q.rarity === 'common'), 'text-zinc-400')}
                </div>

                <section className="space-y-6 pt-12 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-zinc-900 rounded-lg border border-white/5">
                            <Lock size={16} className="text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Hidden Challenges</h2>
                            <div className="text-[10px] text-zinc-700 font-bold mt-1">
                                {hiddenQuests.filter(q => evaluateQuest(q).completed).length}/{hiddenQuests.length} Discovered
                            </div>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/30 to-transparent" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hiddenQuests.map(quest => {
                            const { completed } = evaluateQuest(quest);
                            return (
                                <div
                                    key={quest.id}
                                    className={`
                                        relative group p-6 rounded-[2rem] border transition-all duration-500
                                        ${completed
                                            ? 'bg-gradient-to-br from-amber-500/10 via-black to-black border-amber-500/30 shadow-2xl shadow-amber-900/10'
                                            : 'bg-zinc-950/50 border-white/5 opacity-40 hover:opacity-60 grayscale'
                                        }
                                    `}
                                >
                                    {/* Icon / Glyph */}
                                    <div className={`
                                        w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-3xl
                                        ${completed ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-700'}
                                    `}>
                                        {completed ? quest.icon : <Lock size={24} />}
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`font-black uppercase tracking-wider ${completed ? 'text-amber-400' : 'text-zinc-800'}`}>
                                                {completed ? quest.name : 'Unknown Feat'}
                                            </h3>
                                            {completed && (
                                                <div className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[9px] font-black text-amber-500 uppercase">
                                                    Discovered
                                                </div>
                                            )}
                                        </div>

                                        {completed ? (
                                            <>
                                                <p className="text-sm text-zinc-400 leading-relaxed">
                                                    {quest.description}
                                                </p>
                                                <p className="text-[11px] text-amber-500/60 italic font-medium leading-relaxed">
                                                    "{quest.lore}"
                                                </p>
                                                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Bounty Acquired:</span>
                                                    <span className="text-xs font-black text-amber-400">
                                                        {quest.reward.type === 'title' ? `🏅 "${quest.reward.itemName}"` :
                                                            quest.reward.type === 'gold' ? `💰 ${quest.reward.amount} Gold` :
                                                                quest.reward.type === 'artifact' ? `🎁 ${quest.reward.itemName}` :
                                                                    `⭐ ${quest.reward.itemName || 'Legacy Bonus'}`}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="py-4 flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-800 rounded-2xl bg-black/40">
                                                <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Requirement Hidden</div>
                                                <div className="w-12 h-1 bg-zinc-900 rounded-full" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Reveal Glow */}
                                    {completed && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent pointer-events-none rounded-[2rem]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
