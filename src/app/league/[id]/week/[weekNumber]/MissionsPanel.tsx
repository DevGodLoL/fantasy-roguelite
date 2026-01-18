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
        <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-sm border border-indigo-500/20 rounded-xl">
            {/* Header - More compact */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">Weekly Missions</h3>
                </div>
                {isFinal && (
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${completedCount === missions.length
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : completedCount > 0
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {completedCount}/{missions.length} Complete
                    </div>
                )}
            </div>

            {/* Mission Rows - Compact */}
            <div className="space-y-2">
                {missions.map((mission) => {
                    const progressPercent = Math.min(100, (mission.progress / mission.targetValue) * 100);

                    return (
                        <div
                            key={mission.id}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-all ${mission.isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : isFinal
                                        ? 'bg-red-500/5 border-red-500/20 opacity-60'
                                        : 'bg-zinc-900/50 border-zinc-700/50'
                                }`}
                        >
                            {/* Mission Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">{mission.name}</span>
                                    {mission.isCompleted && (
                                        <span className="text-emerald-400 text-sm">✓</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-zinc-400 truncate">{mission.description}</p>

                                {/* Compact Progress Bar (only for final) */}
                                {isFinal && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${mission.isCompleted ? 'bg-emerald-500' : 'bg-zinc-600'
                                                    }`}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-zinc-500 shrink-0">
                                            {mission.progress.toFixed(0)}/{mission.targetValue}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Reward Badge - Compact */}
                            <div className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${mission.isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-zinc-800/50 text-zinc-300'
                                }`}>
                                <span>{REWARD_ICONS[mission.rewardType] || "🎁"}</span>
                                <span className="font-bold">+{mission.rewardValue}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary when final */}
            {isFinal && completedCount > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Total Earned:</span>
                    <div className="flex items-center gap-3">
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
            )}
        </div>
    );
}
