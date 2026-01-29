"use client";

import { useEffect, useState } from "react";
import { Shield, Zap, Coins, Trophy, Lock, Unlock, ArrowRight, RefreshCcw, Star } from "lucide-react";
import { TALENT_REGISTRY, getTalentByCode } from "@/lib/game-data/talents";
import { unlockTalent, resetTalents } from "@/app/actions/commander";
import { toast } from "sonner";

import { use } from "react";

export default function CommanderPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTalent, setActiveTalent] = useState<any>(null);

    async function fetchProfile() {
        const res = await fetch(`/api/user/${userId}/profile`);
        const data = await res.json();
        setProfile(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const handleUnlock = async (code: string) => {
        try {
            await unlockTalent(userId, code);
            toast.success("Talent unlocked. Your essence grows stronger.");
            await fetchProfile();
            setActiveTalent(getTalentByCode(code));
        } catch (e: any) {
            toast.error(`The void resists: ${e.message}`);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500" />
        </div>
    );

    const unlocked = JSON.parse(profile.unlockedTalents || "[]");

    return (
        <div className="min-h-screen bg-[#020202] text-white p-8 md:p-12 font-sans selection:bg-purple-500/30">
            {/* Header */}
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 px-4">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase italic">
                        The <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Sanctum</span>
                    </h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-[10px]">Commander Meta-Progression</p>
                </div>

                <div className="flex gap-4">
                    <StatBox icon={<Star className="text-purple-400" />} label="Level" value={profile.commanderLevel} />
                    <StatBox icon={<Zap className="text-amber-400" />} label="Points" value={profile.talentPoints} />
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 px-4">
                {/* Talent Tree Visualization */}
                <div className="lg:col-span-8 bg-zinc-900/20 border border-white/5 rounded-[3rem] p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50" />

                    <div className="relative z-10 space-y-16">
                        {[1, 2, 3].map(tier => (
                            <div key={tier} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Tier {tier}</h2>
                                    <div className="h-px flex-1 bg-zinc-800/50" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {TALENT_REGISTRY.filter(t => t.tier === tier).map(talent => (
                                        <TalentNode
                                            key={talent.code}
                                            talent={talent}
                                            isUnlocked={unlocked.includes(talent.code)}
                                            canUnlock={profile.talentPoints >= talent.pointsToUnlock && profile.commanderLevel >= talent.levelRequired && (!talent.dependencies || talent.dependencies.every(d => unlocked.includes(d)))}
                                            onSelect={() => setActiveTalent(talent)}
                                            isActive={activeTalent?.code === talent.code}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Talent Detail Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {activeTalent ? (
                        <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 sticky top-12 shadow-2xl">
                            <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-4">Talent Intel</div>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">{activeTalent.name}</h3>
                            <p className="text-zinc-400 leading-relaxed mb-8">{activeTalent.description}</p>

                            <div className="space-y-4 mb-8">
                                <DetailRow label="Tier" value={activeTalent.tier} />
                                <DetailRow label="Requirement" value={`Lvl ${activeTalent.levelRequired}`} />
                                <DetailRow label="Cost" value={`${activeTalent.pointsToUnlock} Pt`} />
                                {activeTalent.dependencies && <DetailRow label="Prerequisite" value={activeTalent.dependencies.join(", ")} />}
                            </div>

                            {unlocked.includes(activeTalent.code) ? (
                                <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 font-black uppercase tracking-[0.2em] text-center flex items-center justify-center gap-2">
                                    <Unlock size={16} /> Essence Linked
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleUnlock(activeTalent.code)}
                                    disabled={profile.talentPoints < activeTalent.pointsToUnlock || profile.commanderLevel < activeTalent.levelRequired}
                                    className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                                >
                                    Consume point
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-zinc-900/20 border border-dashed border-white/10 rounded-[2.5rem] p-12 text-center text-zinc-600">
                            <Shield size={48} className="mx-auto mb-6 opacity-20" />
                            <p className="font-bold uppercase tracking-widest text-xs">Select a Node to harmonize your essence</p>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (confirm("Reset all talents? You will regain your points, but your current build will be lost.")) {
                                resetTalents(userId)
                                    .then(() => {
                                        toast.success("The timeline has been reset.");
                                        fetchProfile();
                                    })
                                    .catch(() => toast.error("Failed to reset the timeline."));
                            }
                        }}
                        className="w-full py-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 hover:text-red-500/50 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={12} /> Reset Timeline
                    </button>
                </div>
            </main>
        </div>
    );
}

function TalentNode({ talent, isUnlocked, canUnlock, onSelect, isActive }: any) {
    return (
        <button
            onClick={onSelect}
            className={`
                relative p-6 rounded-3xl border transition-all duration-500 text-left group
                ${isUnlocked
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : (canUnlock ? 'bg-zinc-900/50 border-white/10 hover:border-white/30' : 'bg-transparent border-white/5 opacity-40 grayscale')}
                ${isActive ? 'ring-2 ring-white/20' : ''}
            `}
        >
            <div className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isUnlocked ? 'bg-purple-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                {isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
            </div>
            <h4 className="font-black uppercase italic tracking-tighter text-sm mb-1">{talent.name}</h4>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tier {talent.tier}</div>
        </button>
    );
}

function StatBox({ icon, label, value }: any) {
    return (
        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4">
            <div className="text-xl">{icon}</div>
            <div>
                <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">{label}</div>
                <div className="text-xl font-black leading-none">{value}</div>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: any) {
    return (
        <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
            <span className="text-zinc-600">{label}</span>
            <span className="text-zinc-300">{value}</span>
        </div>
    );
}
