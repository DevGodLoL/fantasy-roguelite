"use client";

interface Mission {
    id: string;
    code: string;
    name: string;
    description: string;
    type: string;
    targetValue: number;
    targetPosition?: string | null;
    rewardType: string;
    rewardValue: number;
    progress: number;
    isCompleted: boolean;
}

interface MissionsPanelProps {
    missions: Mission[];
    isFinal: boolean;
}

const REWARD_ICONS: Record<string, string> = {
    gold: "🪙",
    rerolls: "🔄",
    artifact: "✨"
};

export default function MissionsPanel({ missions, isFinal }: MissionsPanelProps) {
    if (missions.length === 0) return null;

    const completedCount = missions.filter(m => m.isCompleted).length;

    return (
        <div className="mb-8 p-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-sm border border-indigo-500/20 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wide">Weekly Missions</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Complete objectives for bonus rewards</p>
                    </div>
                </div>
                {isFinal && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${completedCount === missions.length
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : completedCount > 0
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {completedCount}/{missions.length} Complete
                    </div>
                )}
            </div>

            {/* Mission Cards */}
            <div className="space-y-3">
                {missions.map((mission) => {
                    const progressPercent = Math.min(100, (mission.progress / mission.targetValue) * 100);

                    return (
                        <div
                            key={mission.id}
                            className={`relative p-4 rounded-xl border transition-all ${mission.isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : isFinal
                                        ? 'bg-red-500/5 border-red-500/20 opacity-60'
                                        : 'bg-zinc-900/50 border-zinc-700/50'
                                }`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                {/* Mission Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-white">{mission.name}</span>
                                        {mission.isCompleted && (
                                            <span className="text-emerald-400 text-lg">✓</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-400">{mission.description}</p>

                                    {/* Progress Bar */}
                                    {isFinal && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                                                <span>Progress</span>
                                                <span>{mission.progress.toFixed(1)} / {mission.targetValue}</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${mission.isCompleted
                                                            ? 'bg-emerald-500'
                                                            : 'bg-zinc-600'
                                                        }`}
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Reward */}
                                <div className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg ${mission.isCompleted
                                        ? 'bg-emerald-500/20 border border-emerald-500/30'
                                        : 'bg-zinc-800/50 border border-zinc-700/50'
                                    }`}>
                                    <span className="text-lg">{REWARD_ICONS[mission.rewardType] || "🎁"}</span>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${mission.isCompleted ? 'text-emerald-400' : 'text-zinc-300'
                                            }`}>
                                            +{mission.rewardValue}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 uppercase">
                                            {mission.rewardType}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary when final */}
            {isFinal && completedCount > 0 && (
                <div className="mt-4 pt-4 border-t border-indigo-500/20">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Total Rewards Earned:</span>
                        <div className="flex items-center gap-4">
                            {Object.entries(
                                missions
                                    .filter(m => m.isCompleted)
                                    .reduce((acc, m) => {
                                        acc[m.rewardType] = (acc[m.rewardType] || 0) + m.rewardValue;
                                        return acc;
                                    }, {} as Record<string, number>)
                            ).map(([type, value]) => (
                                <div key={type} className="flex items-center gap-1 text-emerald-400 font-bold">
                                    <span>{REWARD_ICONS[type]}</span>
                                    <span>+{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
