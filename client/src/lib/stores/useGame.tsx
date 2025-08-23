import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "room-setup" | "role-select" | "playing" | "ended";
export type PlayerRole = "navigator" | "guide" | null;
export type GameMode = "create" | "join" | null;

interface GameState {
  phase: GamePhase;
  playerRole: PlayerRole;
  gameMode: GameMode;
  roomCode: string | null;
  
  // Actions
  start: () => void;
  restart: () => void;
  end: () => void;
  setRole: (role: PlayerRole) => void;
  selectRole: () => void;
  createGame: () => void;
  joinGame: (code: string) => void;
  setGameMode: (mode: GameMode) => void;
}

// Helper to generate room codes
const generateRoomCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Helper to get room code from URL
const getRoomCodeFromURL = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
};

export const useGame = create<GameState>()(
  subscribeWithSelector((set) => ({
    phase: "ready",
    playerRole: null,
    gameMode: null,
    roomCode: null,
    
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
      set(() => ({ 
        phase: "ready", 
        playerRole: null, 
        gameMode: null, 
        roomCode: null 
      }));
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
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
    },

    setGameMode: (mode: GameMode) => {
      set(() => ({ gameMode: mode }));
    },

    createGame: () => {
      const roomCode = generateRoomCode();
      // Add room code to URL
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomCode);
      window.history.replaceState({}, '', url.toString());
      
      set(() => ({ 
        phase: "room-setup", 
        gameMode: "create", 
        roomCode 
      }));
    },

    joinGame: (code: string) => {
      // Add room code to URL
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      window.history.replaceState({}, '', url.toString());
      
      set(() => ({ 
        phase: "room-setup", 
        gameMode: "join", 
        roomCode: code 
      }));
    }
  }))
);
