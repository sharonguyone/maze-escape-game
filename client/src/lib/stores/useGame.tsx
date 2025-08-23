import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "role-select" | "playing" | "ended";
export type PlayerRole = "navigator" | "guide" | null;

interface GameState {
  phase: GamePhase;
  playerRole: PlayerRole;
  
  // Actions
  start: () => void;
  restart: () => void;
  end: () => void;
  setRole: (role: PlayerRole) => void;
  selectRole: () => void;
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set) => ({
    phase: "ready",
    playerRole: null,
    
    start: () => {
      set((state) => {
        // Only transition from role-select to playing
        if (state.phase === "role-select") {
          return { phase: "playing" };
        }
        return {};
      });
    },
    
    restart: () => {
      set(() => ({ phase: "ready", playerRole: null }));
    },
    
    end: () => {
      set((state) => {
        // Only transition from playing to ended
        if (state.phase === "playing") {
          return { phase: "ended" };
        }
        return {};
      });
    },
    
    setRole: (role: PlayerRole) => {
      set(() => ({ playerRole: role }));
    },
    
    selectRole: () => {
      set(() => ({ phase: "role-select" }));
    }
  }))
);
