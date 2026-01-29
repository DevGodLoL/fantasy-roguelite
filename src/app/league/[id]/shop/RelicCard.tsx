"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RelicCardProps {
    relic: {
        id: string;
        name: string;
        description: string;
        price: number;
        rarity: string;
        icon?: string;
    };
    userParams: {
        gold: number;
        teamId: string;
        leagueId: string;
    };
}

export default function RelicCard({ relic, userParams }: RelicCardProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const canAfford = userParams.gold >= relic.price;

    // Rarity Colors
    const getRarityColor = (r: string) => {
        switch (r) {
            case 'legendary': return 'border-amber-500/50 bg-amber-950/20 text-amber-500';
            case 'epic': return 'border-purple-500/50 bg-purple-950/20 text-purple-400';
            case 'rare': return 'border-blue-500/50 bg-blue-950/20 text-blue-400';
            default: return 'border-zinc-500/50 bg-zinc-900/50 text-zinc-400';
        }
    };

    const handlePurchase = async () => {
        if (!canAfford) return;

        startTransition(async () => {
            try {
                const res = await fetch(`/api/league/${userParams.leagueId}/shop/buy`, {
                    method: 'POST',
                    body: JSON.stringify({
                        teamId: userParams.teamId,
                        powerupId: relic.id
                    })
                });

                if (res.ok) {
                    toast.success(`${relic.name} acquired. Its power flows through the vault.`);
                    router.refresh();
                } else {
                    const error = await res.text();
                    toast.error(`The merchant refuses the trade: ${error || 'Unknown error'}`);
                }
            } catch (e) {
                console.error("Purchase failed", e);
                toast.error("A break in the commerce weave. Purchase failed.");
            }
        });
    };

    return (
        <div className={`relative group p-6 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.02] ${getRarityColor(relic.rarity)}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-lg bg-black/40 flex items-center justify-center text-2xl border border-white/10">
                    {relic.icon || "🏺"}
                </div>
                <div className="text-xs font-black uppercase tracking-widest opacity-70">
                    {relic.rarity}
                </div>
            </div>

            {/* Info */}
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white mb-2 group-hover:text-white transition-colors">
                {relic.name}
            </h3>
            <p className="text-sm font-medium opacity-80 mb-6 min-h-[3rem]">
                {relic.description}
            </p>

            {/* Price & Action */}
            <div className="flex items-center justify-between mt-auto">
                <div className="text-amber-400 font-black text-xl flex items-center gap-1">
                    <span>🪙</span> {relic.price}
                </div>

                <button
                    onClick={handlePurchase}
                    disabled={!canAfford || isPending}
                    className={`
                        px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest
                        transition-all flex items-center gap-2
                        ${canAfford
                            ? "bg-white text-black hover:bg-amber-400 hover:scale-105"
                            : "bg-white/5 text-zinc-500 cursor-not-allowed"}
                    `}
                >
                    {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Purchase"}
                </button>
            </div>
        </div>
    );
}
