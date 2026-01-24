import Link from 'next/link';
import { Star } from 'lucide-react';
import { CommanderProfile } from '@/lib/game-logic/progression';

interface CommanderBadgeProps {
    profile: CommanderProfile;
    userId: string;
    className?: string;
}

export default function CommanderBadge({ profile, userId, className = '' }: CommanderBadgeProps) {
    return (
        <Link href={`/commander/${userId}`} className={`flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700/50 rounded-lg group relative hover:border-purple-500/50 transition-all ${className}`}>
            {/* Glow behind */}
            <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-1.5 relative z-10">
                <div className="w-5 h-5 rounded-full bg-black border border-zinc-700 flex items-center justify-center">
                    <Star size={10} className="text-emerald-400 fill-emerald-400/20" />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Commander</span>
                    <span className="text-xs font-black text-white">LVL {profile.level}</span>
                </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-12 h-1 bg-zinc-800 rounded-full ml-1 overflow-hidden relative z-10">
                <div
                    className="h-full bg-emerald-500/80 rounded-full transition-all duration-1000"
                    style={{ width: `${profile.progressPercent}%` }}
                />
            </div>

            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-48 p-3 bg-zinc-950 border border-white/10 rounded-xl shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none z-50">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Progress</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{profile.currentXP} / {profile.nextLevelXP} XP</span>
                </div>
                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${profile.progressPercent}%` }}
                    />
                </div>
                <div className="mt-2 text-[9px] text-zinc-500 leading-tight">
                    Play seasons to earn XP and unlock permanent perks.
                </div>
            </div>
        </Link>
    );
}
