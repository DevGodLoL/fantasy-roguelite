import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pickPlayer, startDraft, autoDraft } from "./actions";
import DraftPlayerList from "./DraftPlayerList";

// The user's team name
const USER_TEAM_NAME = "The DevGods";
const TOTAL_ROUNDS = 15;

// Position color configurations with roguelite theme
const POSITION_CONFIG: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    QB: { bg: "from-red-600/30 to-red-900/40", text: "text-red-400", border: "border-red-500/40", glow: "shadow-[0_0_10px_rgba(239,68,68,0.2)]" },
    RB: { bg: "from-blue-600/30 to-blue-900/40", text: "text-blue-400", border: "border-blue-500/40", glow: "shadow-[0_0_10px_rgba(59,130,246,0.2)]" },
    WR: { bg: "from-emerald-600/30 to-emerald-900/40", text: "text-emerald-400", border: "border-emerald-500/40", glow: "shadow-[0_0_10px_rgba(16,185,129,0.2)]" },
    TE: { bg: "from-amber-600/30 to-amber-900/40", text: "text-amber-400", border: "border-amber-500/40", glow: "shadow-[0_0_10px_rgba(251,191,36,0.2)]" },
    K: { bg: "from-pink-600/30 to-pink-900/40", text: "text-pink-400", border: "border-pink-500/40", glow: "shadow-[0_0_10px_rgba(236,72,153,0.2)]" },
    DST: { bg: "from-cyan-600/30 to-cyan-900/40", text: "text-cyan-400", border: "border-cyan-500/40", glow: "shadow-[0_0_10px_rgba(34,211,238,0.2)]" },
};

// Format player name as "F. LastName" (handles Jr., Sr., II, III suffixes)
function formatPlayerName(fullName: string): string {
    const suffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];
    const parts = fullName.split(' ');

    if (parts.length === 1) return fullName;

    const firstName = parts[0];
    const firstInitial = firstName.charAt(0) + '.';

    const lastPart = parts[parts.length - 1];
    const hasSuffix = suffixes.includes(lastPart);

    if (hasSuffix && parts.length >= 3) {
        const lastName = parts[parts.length - 2];
        return `${firstInitial} ${lastName} ${lastPart}`;
    } else {
        const lastName = parts.slice(1).join(' ');
        return `${firstInitial} ${lastName}`;
    }
}

export default async function DraftRoom({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: { orderBy: { createdAt: "asc" } },
            draft: {
                include: {
                    picks: {
                        include: { player: true, team: true },
                        orderBy: { pickNumber: "asc" },
                    },
                },
            },
        },
    });

    if (!league || !league.draft) {
        notFound();
    }

    const { draft } = league;
    const numTeams = league.teams.length;

    // Calculate who is picking
    const currentPickIndex = draft.currentPick - 1;
    const currentRound = Math.floor(currentPickIndex / numTeams) + 1;
    const pickInRound = (currentPickIndex % numTeams) + 1;

    let activeTeamIndex;
    if (draft.format === "snake") {
        const isEvenRound = currentRound % 2 === 0;
        activeTeamIndex = isEvenRound ? numTeams - pickInRound : pickInRound - 1;
    } else {
        activeTeamIndex = pickInRound - 1;
    }
    const activeTeam = league.teams[activeTeamIndex];
    const isUserTurn = activeTeam?.name === USER_TEAM_NAME;
    const userTeam = league.teams.find(t => t.name === USER_TEAM_NAME);
    const userTeamIndex = league.teams.findIndex(t => t.name === USER_TEAM_NAME);

    // Build the draft board grid
    const draftBoard: (typeof draft.picks[0] | null)[][] = [];
    for (let r = 0; r < TOTAL_ROUNDS; r++) {
        draftBoard[r] = new Array(numTeams).fill(null);
    }

    // Populate the board with picks
    for (const pick of draft.picks) {
        const pickIndex = pick.pickNumber - 1;
        const round = Math.floor(pickIndex / numTeams);
        const posInRound = pickIndex % numTeams;

        let teamIdx;
        if (draft.format === "snake") {
            const isEvenRound = (round + 1) % 2 === 0;
            teamIdx = isEvenRound ? numTeams - posInRound - 1 : posInRound;
        } else {
            teamIdx = posInRound;
        }

        if (round < TOTAL_ROUNDS) {
            draftBoard[round][teamIdx] = pick;
        }
    }

    // Get drafted player IDs
    const draftedPlayerIds = await db.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => slots.map((s) => s.playerId) as string[]);

    const availablePlayers = await db.player.findMany({
        where: { id: { notIn: draftedPlayerIds } },
        orderBy: { adp: "asc" },
    });

    // Calculate draft progress
    const totalPicks = TOTAL_ROUNDS * numTeams;
    const picksMade = draft.picks.length;
    const progressPercent = Math.min((picksMade / totalPicks) * 100, 100);

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans overflow-hidden flex flex-col selection:bg-purple-500/30">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[5%] left-[10%] w-[40%] h-[40%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-blue-900/8 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-[50%] left-[60%] w-[20%] h-[20%] bg-amber-900/6 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HEADER - THE RITUAL COMMAND */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <header className="relative z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl shrink-0">
                <div className="flex items-center justify-between px-6 h-16">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/league/${leagueId}`}
                            className="text-zinc-500 hover:text-purple-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Return to Command
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-lg shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                                📜
                            </div>
                            <div>
                                <h1 className="font-black uppercase tracking-tighter text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                    The Sacred Draft
                                </h1>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                                    {draft.format} Format • {numTeams} Commanders
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Draft Progress */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Ritual Progress</div>
                                <div className="text-sm font-bold text-white">{picksMade} / {totalPicks} Chosen</div>
                            </div>
                            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10" />

                        {/* Round/Pick Indicator */}
                        <div className="px-4 py-2 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl">
                            <div className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Round {Math.min(currentRound, TOTAL_ROUNDS)}</div>
                            <div className="text-lg font-black text-white">Pick #{draft.currentPick}</div>
                        </div>

                        {/* Action Buttons */}
                        {draft.status === 'drafting' && !isUserTurn && (
                            <form action={async () => {
                                "use server";
                                await autoDraft(leagueId, draft.id);
                            }}>
                                <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
                                    ⚡ Summon AI Picks
                                </button>
                            </form>
                        )}
                        {draft.status === 'pre_draft' && (
                            <form action={async () => {
                                "use server";
                                await startDraft(draft.id, leagueId);
                            }}>
                                <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                    ⚔️ Begin the Ritual
                                </button>
                            </form>
                        )}
                        {draft.status === 'completed' && (
                            <Link
                                href={`/league/${leagueId}/schedule`}
                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            >
                                View Campaign →
                            </Link>
                        )}

                        {/* Status Badge */}
                        <div className={`
                            px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wide
                            ${draft.status === 'drafting'
                                ? isUserTurn
                                    ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                    : 'bg-gradient-to-r from-blue-600/30 to-blue-500/20 text-blue-400 border border-blue-500/40'
                                : draft.status === 'completed'
                                    ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/20 text-purple-400 border border-purple-500/40'
                                    : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50'
                            }
                        `}>
                            {draft.status === 'drafting'
                                ? isUserTurn
                                    ? '⚔️ YOUR TURN!'
                                    : `${activeTeam?.name?.split(' ').pop()} is choosing...`
                                : draft.status === 'completed'
                                    ? '✨ Ritual Complete'
                                    : 'Awaiting Ritual'
                            }
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Left: Available Souls (Players) */}
                <DraftPlayerList
                    players={availablePlayers}
                    canDraft={draft.status === 'drafting' && isUserTurn && !!userTeam}
                    leagueId={leagueId}
                    draftId={draft.id}
                    teamId={userTeam?.id || ''}
                    pickPlayerAction={pickPlayer}
                />

                {/* Center: The Ritual Board */}
                <main className="flex-1 overflow-auto p-4">
                    <div className="min-w-max">
                        {/* Team Headers */}
                        <div className="flex sticky top-0 z-10 bg-[#030303]/95 backdrop-blur-sm border-b border-white/10">
                            <div className="w-14 shrink-0 p-3 flex items-center justify-center">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Rd</span>
                            </div>
                            {league.teams.map((team, idx) => {
                                const isUser = team.name === USER_TEAM_NAME;
                                const isPicking = team.id === activeTeam?.id && draft.status === 'drafting';
                                return (
                                    <div
                                        key={team.id}
                                        className={`
                                            w-[120px] shrink-0 p-3 text-center border-l border-white/5 transition-all
                                            ${isPicking
                                                ? isUser
                                                    ? 'bg-gradient-to-b from-emerald-500/20 to-transparent border-b-2 border-b-emerald-500'
                                                    : 'bg-gradient-to-b from-blue-500/20 to-transparent border-b-2 border-b-blue-500'
                                                : isUser
                                                    ? 'bg-gradient-to-b from-purple-500/10 to-transparent'
                                                    : ''
                                            }
                                        `}
                                    >
                                        <div className={`text-xs font-black truncate ${isUser ? 'text-purple-400' : 'text-zinc-300'}`}>
                                            {team.name.split(' ').slice(-1)[0]}
                                        </div>
                                        {isUser && (
                                            <div className="text-[9px] text-purple-500/70 font-bold uppercase tracking-widest">
                                                ⚔️ You
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Draft Grid */}
                        {Array.from({ length: TOTAL_ROUNDS }, (_, roundIdx) => {
                            const isCurrentRound = roundIdx + 1 === currentRound && draft.status === 'drafting';
                            const isCompletedRound = roundIdx + 1 < currentRound || draft.status === 'completed';

                            return (
                                <div
                                    key={roundIdx}
                                    className={`
                                        flex border-t border-white/5 transition-all
                                        ${isCurrentRound ? 'bg-purple-500/5' : ''}
                                    `}
                                >
                                    {/* Round Number */}
                                    <div className={`
                                        w-14 shrink-0 p-3 flex items-center justify-center
                                        ${isCurrentRound
                                            ? 'text-purple-400'
                                            : isCompletedRound
                                                ? 'text-zinc-600'
                                                : 'text-zinc-700'
                                        }
                                    `}>
                                        <span className="text-sm font-black">{roundIdx + 1}</span>
                                    </div>

                                    {/* Team Cells */}
                                    {league.teams.map((team, teamIdx) => {
                                        const pick = draftBoard[roundIdx][teamIdx];
                                        const isUser = team.name === USER_TEAM_NAME;
                                        const posConfig = pick?.player?.position ? POSITION_CONFIG[pick.player.position] : null;

                                        // Is this the current pick cell?
                                        const isEvenRound = (roundIdx + 1) % 2 === 0;
                                        const expectedTeamIdx = isEvenRound ? numTeams - pickInRound : pickInRound - 1;
                                        const isCurrentCell = isCurrentRound && teamIdx === expectedTeamIdx;

                                        return (
                                            <div
                                                key={teamIdx}
                                                className={`
                                                    w-[120px] shrink-0 h-16 p-1.5 border-l border-white/5 flex items-center justify-center transition-all
                                                    ${isCurrentCell
                                                        ? isUser
                                                            ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50 ring-inset shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                                                            : 'bg-blue-500/20 ring-2 ring-blue-500/50 ring-inset animate-pulse'
                                                        : isUser
                                                            ? 'bg-purple-500/[0.03]'
                                                            : ''
                                                    }
                                                `}
                                            >
                                                {pick ? (
                                                    <div className={`
                                                        w-full h-full rounded-xl p-2 flex flex-col justify-center border transition-all
                                                        bg-gradient-to-br ${posConfig?.bg || 'from-zinc-700/30 to-zinc-800/40'} 
                                                        ${posConfig?.border || 'border-zinc-700/30'}
                                                        ${isUser ? 'ring-1 ring-purple-500/30' : ''}
                                                    `}>
                                                        <div className="text-[10px] font-black truncate text-white">
                                                            {pick.player ? formatPlayerName(pick.player.name) : ''}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className={`text-[9px] font-bold ${posConfig?.text || 'text-zinc-400'}`}>
                                                                {pick.player?.position}
                                                            </span>
                                                            <span className="text-[8px] text-zinc-500">
                                                                {pick.player?.teamAbbr}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : isCurrentCell ? (
                                                    <div className={`
                                                        w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center
                                                        ${isUser
                                                            ? 'border-emerald-500/50 text-emerald-400'
                                                            : 'border-blue-500/50 text-blue-400'
                                                        }
                                                    `}>
                                                        <span className="text-xs font-bold animate-pulse">
                                                            {isUser ? '⚔️ Choose!' : '...'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full rounded-xl border border-dashed border-white/5 bg-zinc-900/20" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Right: Your Army (Roster) */}
                <aside className="w-[240px] border-l border-white/10 bg-black/40 backdrop-blur-sm shrink-0 overflow-y-auto">
                    <div className="p-4 border-b border-white/10 bg-purple-500/5">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">⚔️</span>
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-widest text-purple-400">Your Army</h2>
                                <div className="text-[10px] text-zinc-500">Warriors recruited this ritual</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {(() => {
                            const rosterSlots = [
                                { type: "QB", count: 1, label: "Quarterback" },
                                { type: "RB", count: 2, label: "Running Back" },
                                { type: "WR", count: 2, label: "Wide Receiver" },
                                { type: "TE", count: 1, label: "Tight End" },
                                { type: "FLEX", count: 1, label: "Flex", accepts: ["RB", "WR", "TE"] },
                                { type: "DST", count: 1, label: "Defense" },
                                { type: "K", count: 1, label: "Kicker" },
                            ];
                            const benchCount = 6;

                            const userPicks = draft.picks.filter(p => p.team.name === USER_TEAM_NAME);

                            const picksByPosition: Record<string, typeof userPicks> = {};
                            for (const pick of userPicks) {
                                const pos = pick.player?.position || "UNKNOWN";
                                if (!picksByPosition[pos]) picksByPosition[pos] = [];
                                picksByPosition[pos].push(pick);
                            }

                            const filledSlots: { type: string; pick: typeof userPicks[0] | null }[] = [];
                            const usedPickIds = new Set<string>();

                            for (const slot of rosterSlots) {
                                for (let i = 0; i < slot.count; i++) {
                                    const acceptedPositions = slot.accepts || [slot.type];
                                    let assignedPick: typeof userPicks[0] | null = null;

                                    for (const pos of acceptedPositions) {
                                        const available = (picksByPosition[pos] || []).find(p => !usedPickIds.has(p.id));
                                        if (available) {
                                            assignedPick = available;
                                            usedPickIds.add(available.id);
                                            break;
                                        }
                                    }
                                    filledSlots.push({ type: slot.type, pick: assignedPick });
                                }
                            }

                            const benchPicks = userPicks.filter(p => !usedPickIds.has(p.id));

                            const slotCounts: Record<string, { filled: number; total: number }> = {};
                            for (const slot of rosterSlots) {
                                slotCounts[slot.type] = { filled: 0, total: slot.count };
                            }
                            for (const fs of filledSlots) {
                                if (fs.pick) slotCounts[fs.type].filled++;
                            }

                            return (
                                <>
                                    {/* Starter Positions */}
                                    <div className="space-y-3">
                                        {rosterSlots.map((slot) => {
                                            const slotsForType = filledSlots.filter(fs => fs.type === slot.type);
                                            const filled = slotCounts[slot.type].filled;
                                            const total = slotCounts[slot.type].total;
                                            const isFull = filled >= total;
                                            const posConfig = POSITION_CONFIG[slot.type];

                                            return (
                                                <div key={slot.type} className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${posConfig?.text || 'text-zinc-400'}`}>
                                                            {slot.type}
                                                        </span>
                                                        <span className={`text-[10px] font-bold ${isFull ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                            {filled}/{total}
                                                        </span>
                                                    </div>
                                                    {slotsForType.map((fs, idx) => {
                                                        const pickPosConfig = fs.pick?.player?.position ? POSITION_CONFIG[fs.pick.player.position] : posConfig;
                                                        return (
                                                            <div
                                                                key={`${slot.type}-${idx}`}
                                                                className={`
                                                                    p-2.5 rounded-xl text-xs border transition-all
                                                                    ${fs.pick
                                                                        ? `bg-gradient-to-br ${pickPosConfig?.bg || 'from-zinc-700/30 to-zinc-800/40'} ${pickPosConfig?.border || 'border-zinc-700/30'}`
                                                                        : 'bg-zinc-900/30 border-dashed border-zinc-700/30'
                                                                    }
                                                                `}
                                                            >
                                                                {fs.pick ? (
                                                                    <>
                                                                        <div className="font-bold truncate text-white">{fs.pick.player ? formatPlayerName(fs.pick.player.name) : ''}</div>
                                                                        <div className="text-[9px] text-zinc-400 mt-0.5">{fs.pick.player?.teamAbbr}</div>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-zinc-600 italic text-center">Empty</div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Bench */}
                                    <div className="pt-4 mt-4 border-t border-white/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🛡️</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reserve Bench</span>
                                            </div>
                                            <span className={`text-[10px] font-bold ${benchPicks.length >= benchCount ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                {benchPicks.length}/{benchCount}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {Array.from({ length: benchCount }, (_, idx) => {
                                                const benchPick = benchPicks[idx];
                                                const posConfig = benchPick?.player?.position ? POSITION_CONFIG[benchPick.player.position] : null;
                                                return (
                                                    <div
                                                        key={`bench-${idx}`}
                                                        className={`
                                                            p-2.5 rounded-xl text-xs border transition-all
                                                            ${benchPick
                                                                ? `bg-gradient-to-br ${posConfig?.bg || 'from-zinc-700/30 to-zinc-800/40'} ${posConfig?.border || 'border-zinc-700/30'}`
                                                                : 'bg-zinc-900/20 border-dashed border-zinc-800/30'
                                                            }
                                                        `}
                                                    >
                                                        {benchPick ? (
                                                            <>
                                                                <div className="font-bold truncate text-white">{benchPick.player ? formatPlayerName(benchPick.player.name) : ''}</div>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <span className={`text-[9px] font-bold ${posConfig?.text || 'text-zinc-400'}`}>
                                                                        {benchPick.player?.position}
                                                                    </span>
                                                                    <span className="text-[9px] text-zinc-500">{benchPick.player?.teamAbbr}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-zinc-700 italic text-center text-[10px]">—</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </aside>
            </div>
        </div>
    );
}
