import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QUESTS, QuestDefinition, QUEST_RARITY_CONFIG, getVisibleQuestsSorted } from "@/lib/game-data/quests";
import { Trophy, Flame, Sparkles, Lock } from "lucide-react";

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
    const evaluateQuest = (quest: QuestDefinition): { current: number; target: number; completed: boolean } => {
        let current = 0;
        const target = quest.requirement.target;

        switch (quest.requirement.type) {
            case 'wins':
                current = wins;
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
            case 'gold_spent':
                current = userTeam.gold; // Simplified
                break;
            case 'waiver_claims':
                current = waiverClaimCount;
                break;
            case 'playoff_seed':
                current = userTeam.playoffSeed ? (5 - userTeam.playoffSeed) : 0;
                break;
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
            completed: current >= target
        };
    };

    // Get quests sorted by rarity
    const sortedQuests = getVisibleQuestsSorted();
    const hiddenQuests = QUESTS.filter(q => q.category === 'hidden');

    // Count stats
    const completedCount = QUESTS.filter(q => evaluateQuest(q).completed).length;
    const legendaryCount = sortedQuests.filter(q => q.rarity === 'legendary').length;
    const completedLegendary = sortedQuests.filter(q => q.rarity === 'legendary' && evaluateQuest(q).completed).length;

    // Group by rarity for section headers
    const legendaryQuests = sortedQuests.filter(q => q.rarity === 'legendary');
    const epicQuests = sortedQuests.filter(q => q.rarity === 'epic');
    const rareQuests = sortedQuests.filter(q => q.rarity === 'rare');
    const commonQuests = sortedQuests.filter(q => q.rarity === 'common');

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
                        const { current, target, completed } = evaluateQuest(quest);
                        const progress = Math.min(100, (current / target) * 100);
                        const config = QUEST_RARITY_CONFIG[quest.rarity];

                        return (
                            <div
                                key={quest.id}
                                className={`
                                    relative p-5 rounded-2xl border transition-all overflow-hidden group
                                    bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
                                    ${completed ? 'ring-2 ring-emerald-500/30' : 'hover:border-opacity-100'}
                                `}
                            >
                                {/* Completed Badge */}
                                {completed && (
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-md border border-emerald-500/30 flex items-center gap-1">
                                        <Trophy size={10} />
                                        Complete
                                    </div>
                                )}

                                {/* Tier Badge */}
                                {quest.tier && (
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-zinc-800/80 text-zinc-400 text-[10px] font-black uppercase rounded-md">
                                        Tier {quest.tier}
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`
                                        w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 border
                                        ${completed ? 'bg-emerald-500/20 border-emerald-500/30' : `bg-black/40 ${config.border}`}
                                    `}>
                                        {quest.icon}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2">
                                        {/* Title & Rarity */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className={`font-bold ${completed ? 'text-emerald-400' : 'text-white'}`}>
                                                {quest.name}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${config.badge}`}>
                                                {quest.rarity}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-zinc-400">
                                            {quest.description}
                                        </p>

                                        {/* Lore (Flavor Text) */}
                                        {quest.lore && (
                                            <p className="text-[11px] text-zinc-600 italic border-l-2 border-zinc-800 pl-3">
                                                "{quest.lore}"
                                            </p>
                                        )}

                                        {/* Progress Bar */}
                                        <div className="space-y-1 pt-1">
                                            <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${completed
                                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                            : quest.rarity === 'legendary'
                                                                ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                                                : quest.rarity === 'epic'
                                                                    ? 'bg-gradient-to-r from-purple-600 to-purple-400'
                                                                    : quest.rarity === 'rare'
                                                                        ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                                                                        : 'bg-gradient-to-r from-zinc-600 to-zinc-500'
                                                        }`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-zinc-500">
                                                <span className="font-mono">{Math.floor(current)} / {target}</span>
                                                <span className="font-bold">{Math.floor(progress)}%</span>
                                            </div>
                                        </div>

                                        {/* Reward */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase">Reward:</span>
                                            <span className={`text-sm font-bold ${config.text}`}>
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
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[15%] w-[50%] h-[40%] bg-amber-900/8 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[35%] bg-purple-900/6 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[60%] left-[60%] w-[30%] h-[30%] bg-blue-900/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-12 space-y-12">
                {/* Header */}
                <header className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/league/${leagueId}`}
                            className="text-zinc-500 hover:text-amber-400 transition-colors text-sm flex items-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Back to Command
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(251,191,36,0.3)]">
                                📜
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                    Quest Log
                                </h1>
                                <p className="text-zinc-500 text-sm mt-1">
                                    Complete challenges to earn legendary rewards
                                </p>
                            </div>
                        </div>

                        {/* Progress Summary */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="px-5 py-3 bg-zinc-900/60 border border-white/10 rounded-2xl text-center">
                                <div className="text-2xl font-black text-white">
                                    {completedCount}<span className="text-zinc-600">/{QUESTS.length}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Total</div>
                            </div>
                            <div className="px-5 py-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
                                <div className="text-2xl font-black text-amber-400">
                                    {completedLegendary}<span className="text-amber-600">/{legendaryCount}</span>
                                </div>
                                <div className="text-[10px] text-amber-500/60 uppercase font-bold">Legendary</div>
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

                {/* Quest Sections by Rarity */}
                <div className="space-y-12">
                    {renderQuestSection('Legendary Challenges', '👑', legendaryQuests, 'text-amber-400')}
                    {renderQuestSection('Epic Challenges', '💎', epicQuests, 'text-purple-400')}
                    {renderQuestSection('Rare Challenges', '⚔️', rareQuests, 'text-blue-400')}
                    {renderQuestSection('Common Challenges', '📋', commonQuests, 'text-zinc-400')}
                </div>

                {/* Hidden Quests Teaser */}
                <section className="space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="text-xl">❓</div>
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                            Hidden Challenges
                        </h2>
                        <div className="text-[10px] text-zinc-700">
                            {hiddenQuests.filter(q => evaluateQuest(q).completed).length}/{hiddenQuests.length} Discovered
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/30 to-transparent" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {hiddenQuests.map(quest => {
                            const { completed } = evaluateQuest(quest);

                            return (
                                <div
                                    key={quest.id}
                                    className={`
                                        p-6 rounded-2xl border text-center transition-all
                                        ${completed
                                            ? 'bg-gradient-to-br from-amber-900/30 to-amber-950/50 border-amber-500/40 shadow-[0_0_30px_rgba(251,191,36,0.15)]'
                                            : 'bg-zinc-900/30 border-dashed border-zinc-800 hover:border-zinc-700'
                                        }
                                    `}
                                >
                                    <div className={`text-4xl mb-3 ${completed ? '' : 'opacity-30'}`}>
                                        {completed ? quest.icon : '❓'}
                                    </div>
                                    <div className={`font-bold text-lg ${completed ? 'text-amber-400' : 'text-zinc-700'}`}>
                                        {completed ? quest.name : '???'}
                                    </div>
                                    <div className="text-xs text-zinc-600 mt-2">
                                        {completed ? (
                                            <span className="text-amber-500/80 italic">"{quest.lore}"</span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-1">
                                                <Lock size={12} />
                                                Complete to reveal...
                                            </span>
                                        )}
                                    </div>
                                    {completed && quest.reward && (
                                        <div className="mt-3 pt-3 border-t border-amber-500/20 text-amber-400 text-sm font-bold">
                                            🏅 {quest.reward.itemName}
                                        </div>
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
