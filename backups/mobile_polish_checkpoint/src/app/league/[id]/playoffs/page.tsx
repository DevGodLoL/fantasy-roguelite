import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

const CHAPTER_NAMES: Record<number, string> = {
    15: "The Reckoning",
    16: "Phoenix Dawn",
    17: "Glory Eternal",
};

interface BracketMatchupProps {
    matchup?: any;
    leagueId: string;
    label?: string;
    placeholder?: string;
    isBye?: boolean;
    teamName?: string;
}

function BracketMatchup({ matchup, leagueId, label, placeholder, isBye, teamName }: BracketMatchupProps) {
    if (isBye) {
        return (
            <div className="w-60 h-24 flex flex-col justify-center px-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl opacity-80 shadow-lg">
                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label || "BYE"}</div>
                <div className="text-sm font-black text-zinc-300 truncate">{teamName || "Reserved Seed"}</div>
                <div className="text-[10px] text-zinc-600 italic mt-0.5">Automated Passage</div>
            </div>
        );
    }

    if (!matchup) {
        return (
            <div className="w-60 h-24 flex flex-col justify-center items-center px-4 bg-zinc-950 border border-dashed border-zinc-800/50 rounded-xl">
                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-700 mb-1">{label}</div>
                <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-tighter">{placeholder || "TBD"}</div>
            </div>
        );
    }

    const homeWon = matchup.status === 'final' && matchup.homeScore > matchup.awayScore;
    const awayWon = matchup.status === 'final' && matchup.awayScore > matchup.homeScore;

    return (
        <Link
            href={`/league/${leagueId}/week/${matchup.week.number}`}
            className="w-60 h-24 group relative block"
        >
            <div className={`
                absolute -inset-[1px] bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-[13px] opacity-0 group-hover:opacity-100 transition-opacity blur-[2px]
            `} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-full flex flex-col shadow-xl">
                <div className="bg-zinc-800/30 px-3 py-1.5 flex justify-between items-center border-b border-zinc-800/50">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
                    {matchup.status === 'live' && (
                        <span className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Live</span>
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        </span>
                    )}
                    {matchup.status === 'final' && (
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Complete</span>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-center gap-1.5 px-4">
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-black truncate pr-2 ${homeWon ? 'text-emerald-400' : matchup.status === 'final' ? 'text-zinc-600 italic' : 'text-zinc-300'}`}>
                            {homeWon && '🏆 '}{matchup.homeTeam.name.split(' ').pop()}
                        </span>
                        {matchup.status === 'final' && (
                            <span className={`text-sm font-black ${homeWon ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                {matchup.homeScore.toFixed(0)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-black truncate pr-2 ${awayWon ? 'text-emerald-400' : matchup.status === 'final' ? 'text-zinc-600 italic' : 'text-zinc-300'}`}>
                            {awayWon && '🏆 '}{matchup.awayTeam.name.split(' ').pop()}
                        </span>
                        {matchup.status === 'final' && (
                            <span className={`text-sm font-black ${awayWon ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                {matchup.awayScore.toFixed(0)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default async function PlayoffBracketPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: { orderBy: { playoffSeed: "asc" } },
            weeks: {
                where: { number: { gte: 15 } },
                include: {
                    matchups: {
                        include: {
                            homeTeam: true,
                            awayTeam: true,
                            week: true,
                        },
                    },
                },
            },
        },
    });

    if (!league) notFound();

    const matchups = league.weeks.flatMap(w => w.matchups);

    // Winners Bracket Matchups
    const wc1 = matchups.find(m => m.round === "wildcard" && (m.homeTeam.playoffSeed === 3 || m.awayTeam.playoffSeed === 3));
    const wc2 = matchups.find(m => m.round === "wildcard" && (m.homeTeam.playoffSeed === 4 || m.awayTeam.playoffSeed === 4));

    const semi1 = matchups.find(m => m.round === "semifinal" && (m.homeTeam.playoffSeed === 1 || m.awayTeam.playoffSeed === 1));
    const semi2 = matchups.find(m => m.round === "semifinal" && (m.homeTeam.playoffSeed === 2 || m.awayTeam.playoffSeed === 2));

    const championship = matchups.find(m => m.round === "championship");

    // Redemption Arc
    const rSemi1 = matchups.find(m => m.round === "consolation_semi" && (m.homeTeam.playoffSeed === 7 || m.awayTeam.playoffSeed === 7));
    const rSemi2 = matchups.find(m => m.round === "consolation_semi" && (m.homeTeam.playoffSeed === 8 || m.awayTeam.playoffSeed === 8));
    const rFinal = matchups.find(m => m.round === "consolation_final");
    const toiletBowl = matchups.find(m => m.round === "toilet_bowl");

    // Get Teams by Seed
    const seed1 = league.teams.find(t => t.playoffSeed === 1);
    const seed2 = league.teams.find(t => t.playoffSeed === 2);

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Header */}
            <header className="relative z-30 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/league/${leagueId}`}
                            className="text-zinc-500 hover:text-purple-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Command
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <h1 className="font-black uppercase tracking-tighter text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            🏆 The Playoff Gauntlet
                        </h1>
                    </div>
                </div>
            </header>

            <main className="relative z-10 p-6 md:p-12 lg:p-20 overflow-x-auto">
                <div className="max-w-7xl mx-auto min-w-[1000px]">
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* WINNERS BRACKET */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <section className="mb-32">
                        <div className="flex items-center gap-4 mb-16">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(147,51,234,0.3)]">👑</div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white">Championship Quest</h2>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">The Path to Eternal Glory</p>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent ml-4" />
                        </div>

                        <div className="flex items-center gap-0 relative">
                            {/* Column 1: Wild Card */}
                            <div className="w-64 space-y-40 py-20 flex flex-col justify-center">
                                <div className="relative">
                                    <BracketMatchup
                                        matchup={wc1}
                                        leagueId={leagueId}
                                        label="WC #1"
                                        placeholder="Seed #3 vs #6"
                                    />
                                    {/* Line to Semi */}
                                    <div className="absolute top-1/2 -right-8 w-8 h-px bg-zinc-800" />
                                </div>
                                <div className="relative">
                                    <BracketMatchup
                                        matchup={wc2}
                                        leagueId={leagueId}
                                        label="WC #2"
                                        placeholder="Seed #4 vs #5"
                                    />
                                    {/* Line to Semi */}
                                    <div className="absolute top-1/2 -right-8 w-8 h-px bg-zinc-800" />
                                </div>
                            </div>

                            {/* Connection Column for Elbows */}
                            <div className="w-12 h-[600px] relative pointer-events-none">
                                {/* Top Elbow */}
                                <div className="absolute top-[164px] right-0 w-full h-[100px] border-t border-r border-zinc-800 rounded-tr-2xl" />
                                <div className="absolute top-[264px] right-0 w-8 h-px bg-zinc-800" /> {/* Line to Semi 1 Matchup */}

                                {/* Bottom Elbow */}
                                <div className="absolute bottom-[164px] right-0 w-full h-[100px] border-b border-r border-zinc-800 rounded-br-2xl" />
                                <div className="absolute bottom-[264px] right-0 w-8 h-px bg-zinc-800" /> {/* Line to Semi 2 Matchup */}
                            </div>

                            {/* Column 2: Semifinals */}
                            <div className="w-72 space-y-24 flex flex-col justify-center px-8">
                                <div className="space-y-4 relative">
                                    <BracketMatchup
                                        isBye
                                        teamName={seed1?.name}
                                        label="SEED #1 (BYE)"
                                        leagueId={leagueId}
                                    />
                                    <BracketMatchup
                                        matchup={semi1}
                                        leagueId={leagueId}
                                        label="SEMIFINALS"
                                        placeholder="Seed #1 vs TBD"
                                    />
                                    {/* Line to Finals */}
                                    <div className="absolute top-1/2 -right-8 w-8 h-px bg-zinc-800" />
                                </div>
                                <div className="space-y-4 relative">
                                    <BracketMatchup
                                        isBye
                                        teamName={seed2?.name}
                                        label="SEED #2 (BYE)"
                                        leagueId={leagueId}
                                    />
                                    <BracketMatchup
                                        matchup={semi2}
                                        leagueId={leagueId}
                                        label="SEMIFINALS"
                                        placeholder="Seed #2 vs TBD"
                                    />
                                    {/* Line to Finals */}
                                    <div className="absolute top-1/2 -right-8 w-8 h-px bg-zinc-800" />
                                </div>
                            </div>

                            {/* Finals Connection */}
                            <div className="w-12 h-[600px] relative pointer-events-none">
                                <div className="absolute top-1/2 -translate-y-[150px] right-0 w-full h-[150px] border-t border-r border-zinc-800 rounded-tr-2xl" />
                                <div className="absolute bottom-1/2 translate-y-[150px] right-0 w-full h-[150px] border-b border-r border-zinc-800 rounded-br-2xl" />
                                <div className="absolute top-1/2 -translate-y-px right-[-40px] w-10 h-px bg-zinc-800" />
                            </div>

                            {/* Column 3: Championship */}
                            <div className="flex-1 flex flex-col justify-center pl-20">
                                <div className="relative p-[1.5px] rounded-[15px] bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-600 shadow-[0_0_60px_rgba(245,158,11,0.15)] group overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <div className="bg-black rounded-[14px]">
                                        <BracketMatchup
                                            matchup={championship}
                                            leagueId={leagueId}
                                            label="🏆 THE GRAND FINALE"
                                            placeholder="Battle for the Crown"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* REDEMPTION ARC */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <section>
                        <div className="flex items-center gap-4 mb-16">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-orange-700 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">🔥</div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white">Redemption Arc</h2>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Rise From The Ashes</p>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-red-500/20 to-transparent ml-4" />
                        </div>

                        <div className="flex gap-20 items-center justify-center pt-10">
                            {/* Column 1: Consolation Semis */}
                            <div className="flex flex-col gap-10">
                                <div className="relative">
                                    <BracketMatchup
                                        matchup={rSemi1}
                                        leagueId={leagueId}
                                        label="CONSO SEMI"
                                        placeholder="Seed #7 vs #10"
                                    />
                                    <div className="absolute top-1/2 -right-10 w-10 h-px bg-zinc-800" />
                                </div>
                                <div className="relative">
                                    <BracketMatchup
                                        matchup={rSemi2}
                                        leagueId={leagueId}
                                        label="CONSO SEMI"
                                        placeholder="Seed #8 vs #9"
                                    />
                                    <div className="absolute top-1/2 -right-10 w-10 h-px bg-zinc-800" />
                                </div>
                            </div>

                            {/* Connection Lines Redux */}
                            <div className="w-1 h-[200px] border-y border-r border-zinc-800 rounded-r-xl relative pointer-events-none">
                                <div className="absolute top-1/2 -translate-y-px -right-14 w-14 h-px bg-zinc-800" />
                                <div className="absolute top-1/4 -right-14 opacity-20 w-14 h-px bg-zinc-800" />
                                <div className="absolute bottom-1/4 -right-14 opacity-20 w-14 h-px bg-zinc-800" />
                            </div>

                            {/* Column 2: Finals */}
                            <div className="flex flex-col gap-12 pl-14">
                                <div className="space-y-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 text-center">Phoenix Final</div>
                                    <div className="p-[1px] rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                        <div className="bg-black rounded-[11px]">
                                            <BracketMatchup
                                                matchup={rFinal}
                                                leagueId={leagueId}
                                                label="FOR THE PHOENIX"
                                                placeholder="Semi Winners"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 text-center">Toilet Bowl</div>
                                    <BracketMatchup
                                        matchup={toiletBowl}
                                        leagueId={leagueId}
                                        label="LAST PLACE BATTLE"
                                        placeholder="Semi Losers"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Rewards Legend */}
                <section className="mt-32 max-w-4xl mx-auto p-10 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                    <h3 className="text-xs font-black uppercase tracking-[.4em] text-zinc-500 mb-10 text-center">The Spoils of War</h3>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl">🏆</div>
                                <h4 className="text-base font-black uppercase tracking-tight text-amber-500">The Champion</h4>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                Conquer the Winners Bracket to earn the <span className="text-white font-black">"CHAMPION"</span> title and <span className="text-emerald-400 font-black">+500 Gold</span> to your treasury. Your glory will be etched in the annals forever.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">🔥</div>
                                <h4 className="text-base font-black uppercase tracking-tight text-emerald-500">The Phoenix</h4>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                Rise from the ashes of the Redemption Arc. Winning the final grants the <span className="text-white font-black">"PHOENIX"</span> title and <span className="text-emerald-400 font-black">+50 Gold, +1 Reroll</span> for the next season.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
