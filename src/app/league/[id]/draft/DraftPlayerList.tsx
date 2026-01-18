"use client";

import { useTransition } from "react";
import PlayerList from "./PlayerList";

interface Player {
    id: string;
    name: string;
    position: string;
    teamAbbr: string | null;
    adp: number;
}

interface DraftPlayerListProps {
    players: Player[];
    canDraft: boolean;
    leagueId: string;
    draftId: string;
    teamId: string;
    pickPlayerAction: (
        leagueId: string,
        draftId: string,
        teamId: string,
        playerId: string
    ) => Promise<void>;
}

export default function DraftPlayerList({
    players,
    canDraft,
    leagueId,
    draftId,
    teamId,
    pickPlayerAction,
}: DraftPlayerListProps) {
    const [isPending, startTransition] = useTransition();

    const handleDraft = (playerId: string) => {
        startTransition(async () => {
            await pickPlayerAction(leagueId, draftId, teamId, playerId);
        });
    };

    return (
        <div className="relative">
            {isPending && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-3xl animate-pulse shadow-[0_0_30px_rgba(147,51,234,0.4)] mb-4">
                        ⚔️
                    </div>
                    <div className="text-sm font-black text-purple-400 uppercase tracking-widest animate-pulse">
                        Summoning Warrior...
                    </div>
                    <div className="text-xs text-zinc-500 mt-2">
                        The fates are being written
                    </div>
                </div>
            )}
            <PlayerList
                players={players}
                canDraft={canDraft && !isPending}
                onDraft={handleDraft}
                leagueId={leagueId}
            />
        </div>
    );
}
