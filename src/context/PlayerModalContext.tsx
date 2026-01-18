"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { getPlayerDetails, PlayerDetails } from "@/app/actions/get-player-details";
import PlayerDetailModal from "@/components/PlayerDetailModal";

interface PlayerModalContextType {
    openPlayerModal: (playerId: string, leagueId?: string) => void;
    closePlayerModal: () => void;
}

const PlayerModalContext = createContext<PlayerModalContextType | undefined>(undefined);

export function PlayerModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [playerData, setPlayerData] = useState<PlayerDetails | null>(null);

    const openPlayerModal = async (playerId: string, leagueId?: string) => {
        setIsOpen(true);
        setIsLoading(true);
        setPlayerData(null); // Reset previous data
        try {
            const data = await getPlayerDetails(playerId, leagueId);
            setPlayerData(data);
        } catch (error) {
            console.error("Failed to fetch player details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const closePlayerModal = () => {
        setIsOpen(false);
    };

    return (
        <PlayerModalContext.Provider value={{ openPlayerModal, closePlayerModal }}>
            {children}
            {isOpen && (
                <PlayerDetailModal
                    isLoading={isLoading}
                    player={playerData}
                    onClose={closePlayerModal}
                />
            )}
        </PlayerModalContext.Provider>
    );
}

export function usePlayerModal() {
    const context = useContext(PlayerModalContext);
    if (context === undefined) {
        throw new Error("usePlayerModal must be used within a PlayerModalProvider");
    }
    return context;
}
