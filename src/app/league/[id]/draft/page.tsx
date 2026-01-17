import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pickPlayer, startDraft, autoDraft } from "./actions";
import { revalidatePath } from "next/cache";

// The user's team name
const USER_TEAM_NAME = "The DevGods";
const TOTAL_ROUNDS = 15;

// Format player name as "F. LastName" (handles Jr., Sr., II, III suffixes)
function formatPlayerName(fullName: string): string {
    const suffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];
    const parts = fullName.split(' ');

    if (parts.length === 1) return fullName;

    const firstName = parts[0];
    const firstInitial = firstName.charAt(0) + '.';

    // Check if last part is a suffix
    const lastPart = parts[parts.length - 1];
    const hasSuffix = suffixes.includes(lastPart);

    if (hasSuffix && parts.length >= 3) {
        // Name like "Travis Etienne Jr." -> "T. Etienne Jr."
        const lastName = parts[parts.length - 2];
        return `${firstInitial} ${lastName} ${lastPart}`;
    } else {
        // Normal name like "Josh Allen" -> "J. Allen"
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

    const league = await prisma.league.findUnique({
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
    const isUserTurn = activeTeam.name === USER_TEAM_NAME;
    const userTeam = league.teams.find(t => t.name === USER_TEAM_NAME);
    const userTeamIndex = league.teams.findIndex(t => t.name === USER_TEAM_NAME);

    // Build the draft board grid
    // grid[round][teamIndex] = pick or null
    const draftBoard: (typeof draft.picks[0] | null)[][] = [];
    for (let r = 0; r < TOTAL_ROUNDS; r++) {
        draftBoard[r] = new Array(numTeams).fill(null);
    }

    // Populate the board with picks
    for (const pick of draft.picks) {
        const pickIndex = pick.pickNumber - 1;
        const round = Math.floor(pickIndex / numTeams);
        const posInRound = pickIndex % numTeams;

        // Snake: even rounds go reverse
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
    const draftedPlayerIds = await prisma.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => slots.map((s) => s.playerId) as string[]);

    const availablePlayers = await prisma.player.findMany({
        where: { id: { notIn: draftedPlayerIds } },
        orderBy: { name: "asc" },
    });

    // Position colors
    const posColors: Record<string, string> = {
        QB: "text-red-400 bg-red-500/10",
        RB: "text-green-400 bg-green-500/10",
        WR: "text-blue-400 bg-blue-500/10",
        TE: "text-orange-400 bg-orange-500/10",
        K: "text-purple-400 bg-purple-500/10",
        DST: "text-yellow-400 bg-yellow-500/10",
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans overflow-hidden flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <Link href={`/league/${leagueId}`} className="text-zinc-500 hover:text-white transition-colors text-sm">
                        ← {league.name}
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <h1 className="font-black uppercase tracking-tighter text-lg">Draft Board</h1>
                    <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold">
                        Round {currentRound} · Pick {draft.currentPick}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {draft.status === 'drafting' && !isUserTurn && (
                        <form action={async () => {
                            "use server";
                            for (let i = 0; i < numTeams; i++) {
                                const result = await autoDraft(leagueId, draft.id);
                                if (!result.success || result.isUserTurn) break;
                            }
                            revalidatePath(`/league/${leagueId}/draft`);
                        }}>
                            <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full transition-all animate-pulse">
                                ⚡ Simulate AI Picks
                            </button>
                        </form>
                    )}
                    {draft.status === 'pre_draft' && (
                        <form action={async () => {
                            "use server";
                            await startDraft(draft.id, leagueId);
                        }}>
                            <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full transition-all">
                                Start Draft
                            </button>
                        </form>
                    )}
                    {draft.status === 'completed' && (
                        <Link
                            href={`/league/${leagueId}/waivers`}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full transition-all"
                        >
                            Go to Waivers →
                        </Link>
                    )}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${draft.status === 'drafting'
                        ? isUserTurn
                            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                            : 'bg-blue-500/20 text-blue-400'
                        : draft.status === 'completed'
                            ? 'bg-zinc-700 text-zinc-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                        {draft.status === 'drafting'
                            ? isUserTurn
                                ? '🎯 YOUR PICK!'
                                : `${activeTeam.name} picking...`
                            : draft.status.replace('_', ' ').toUpperCase()
                        }
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Available Players */}
                <aside className="w-[280px] border-r border-white/5 flex flex-col bg-zinc-950/30 shrink-0">
                    <div className="p-3 border-b border-white/5">
                        <input
                            type="text"
                            placeholder="Search players..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {availablePlayers.map((player) => (
                            <div
                                key={player.id}
                                className="group flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/[0.02]"
                            >
                                <div className="min-w-0">
                                    <div className="font-bold text-xs truncate">{player.name}</div>
                                    <div className="text-[9px] text-zinc-500 font-mono">
                                        <span className={posColors[player.position]?.split(' ')[0] || 'text-zinc-400'}>{player.position}</span> · {player.teamAbbr}
                                    </div>
                                </div>
                                {draft.status === 'drafting' && isUserTurn && userTeam && (
                                    <form action={async () => {
                                        "use server";
                                        await pickPlayer(leagueId, draft.id, userTeam.id, player.id);
                                    }}>
                                        <button className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-emerald-500 text-white text-[9px] font-bold uppercase rounded transition-all">
                                            Draft
                                        </button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Center: Draft Board Grid */}
                <main className="flex-1 overflow-auto p-4">
                    <div className="min-w-max">
                        {/* Team Headers */}
                        <div className="flex sticky top-0 z-10 bg-[#020202]">
                            <div className="w-12 shrink-0 p-2 text-[10px] font-black text-zinc-600 uppercase">Rd</div>
                            {league.teams.map((team, idx) => {
                                const isUser = team.name === USER_TEAM_NAME;
                                const isPicking = team.id === activeTeam.id && draft.status === 'drafting';
                                return (
                                    <div
                                        key={team.id}
                                        className={`w-28 shrink-0 p-2 text-center border-l border-white/5 ${isPicking
                                            ? isUser
                                                ? 'bg-emerald-500/20'
                                                : 'bg-blue-500/20'
                                            : isUser
                                                ? 'bg-emerald-500/5'
                                                : ''
                                            }`}
                                    >
                                        <div className={`text-[10px] font-black truncate ${isUser ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                            {team.name.split(' ').slice(-1)[0]}
                                        </div>
                                        {isUser && <div className="text-[8px] text-emerald-500/50">YOU</div>}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Draft Grid */}
                        {Array.from({ length: TOTAL_ROUNDS }, (_, roundIdx) => {
                            const isCurrentRound = roundIdx + 1 === currentRound;
                            return (
                                <div key={roundIdx} className={`flex border-t border-white/5 ${isCurrentRound ? 'bg-white/[0.02]' : ''}`}>
                                    {/* Round Number */}
                                    <div className={`w-12 shrink-0 p-2 flex items-center justify-center text-xs font-black ${isCurrentRound ? 'text-blue-400' : 'text-zinc-700'}`}>
                                        {roundIdx + 1}
                                    </div>

                                    {/* Team Cells */}
                                    {league.teams.map((team, teamIdx) => {
                                        const pick = draftBoard[roundIdx][teamIdx];
                                        const isUser = team.name === USER_TEAM_NAME;

                                        // Is this the current pick cell?
                                        const isEvenRound = (roundIdx + 1) % 2 === 0;
                                        const expectedTeamIdx = isEvenRound ? numTeams - pickInRound : pickInRound - 1;
                                        const isCurrentCell = isCurrentRound && teamIdx === expectedTeamIdx && draft.status === 'drafting';

                                        return (
                                            <div
                                                key={teamIdx}
                                                className={`w-28 shrink-0 h-14 p-1 border-l border-white/5 flex items-center justify-center ${isCurrentCell
                                                    ? isUser
                                                        ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50 ring-inset'
                                                        : 'bg-blue-500/20 ring-2 ring-blue-500/50 ring-inset animate-pulse'
                                                    : isUser
                                                        ? 'bg-emerald-500/[0.03]'
                                                        : ''
                                                    }`}
                                            >
                                                {pick ? (
                                                    <div className={`w-full h-full rounded-lg p-1.5 flex flex-col justify-center ${posColors[pick.player?.position || ''] || 'bg-zinc-800/50'}`}>
                                                        <div className="text-[9px] font-black truncate text-white/90">
                                                            {pick.player ? formatPlayerName(pick.player.name) : ''}
                                                        </div>
                                                        <div className="text-[8px] text-white/40 truncate">
                                                            {pick.player?.position} · {pick.player?.teamAbbr}
                                                        </div>
                                                    </div>
                                                ) : isCurrentCell ? (
                                                    <div className="text-[10px] text-zinc-500 animate-pulse">
                                                        {isUser ? '👆 Pick!' : '...'}
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full rounded-lg border border-dashed border-white/5" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Right: Your Roster */}
                <aside className="w-[200px] border-l border-white/5 bg-zinc-950/40 p-4 shrink-0 overflow-y-auto">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 mb-4">Your Roster</h2>
                    <div className="space-y-1">
                        {draft.picks
                            .filter(p => p.team.name === USER_TEAM_NAME)
                            .map(pick => (
                                <div key={pick.id} className={`text-xs p-2 rounded-lg ${posColors[pick.player?.position || ''] || 'bg-zinc-800/50'}`}>
                                    <div className="font-bold truncate">{pick.player ? formatPlayerName(pick.player.name) : ''}</div>
                                    <div className="text-[9px] opacity-60">{pick.player?.position} · Rd {pick.round}</div>
                                </div>
                            ))
                        }
                        {draft.picks.filter(p => p.team.name === USER_TEAM_NAME).length === 0 && (
                            <div className="text-xs text-zinc-600 italic">No picks yet</div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-white/5">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Positions</h3>
                        <div className="grid grid-cols-2 gap-1 text-[9px]">
                            <div className="text-red-400">● QB</div>
                            <div className="text-green-400">● RB</div>
                            <div className="text-blue-400">● WR</div>
                            <div className="text-orange-400">● TE</div>
                            <div className="text-purple-400">● K</div>
                            <div className="text-yellow-400">● DST</div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
