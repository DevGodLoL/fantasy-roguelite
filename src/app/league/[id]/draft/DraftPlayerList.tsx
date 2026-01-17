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
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                    <div className="text-xs text-white animate-pulse">Drafting...</div>
                </div>
            )}
            <PlayerList players={players} canDraft={canDraft && !isPending} onDraft={handleDraft} />
        </div>
    );
}
