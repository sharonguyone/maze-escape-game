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
  sharedPlayerPosition: { x: number; y: number } | null;
  
  // Actions
  start: () => void;
  restart: () => void;
  end: () => void;
  setRole: (role: PlayerRole) => void;
  selectRole: () => void;
  createGame: () => void;
  joinGame: (code: string) => void;
  setGameMode: (mode: GameMode) => void;
  updatePlayerPosition: (x: number, y: number) => void;
  initializePlayerPosition: (x: number, y: number) => void;
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

// Cross-device position sharing using HTTP API
const saveSharedPosition = async (roomCode: string, x: number, y: number) => {
  try {
    await fetch(`/api/position/${roomCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ x, y }),
    });
  } catch (error) {
    console.error('Failed to save position:', error);
  }
};

const loadSharedPosition = async (roomCode: string): Promise<{ x: number; y: number } | null> => {
  try {
    const response = await fetch(`/api/position/${roomCode}`);
    if (response.ok) {
      const data = await response.json();
      return { x: data.x, y: data.y };
    }
  } catch (error) {
    console.error('Failed to load position:', error);
  }
  return null;
};

export const useGame = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: "ready",
    playerRole: null,
    gameMode: null,
    roomCode: null,
    sharedPlayerPosition: null,
    
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
        roomCode: null,
        sharedPlayerPosition: null
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
    },

    updatePlayerPosition: (x: number, y: number) => {
      const state = get();
      if (state.roomCode) {
        // Save to shared storage
        saveSharedPosition(state.roomCode, x, y);
        // Update local state
        set(() => ({ sharedPlayerPosition: { x, y } }));
      }
    },

    initializePlayerPosition: async (x: number, y: number) => {
      const state = get();
      if (state.roomCode) {
        // Check if there's already a shared position
        const existing = await loadSharedPosition(state.roomCode);
        if (existing) {
          set(() => ({ sharedPlayerPosition: existing }));
        } else {
          // Initialize with starting position
          await saveSharedPosition(state.roomCode, x, y);
          set(() => ({ sharedPlayerPosition: { x, y } }));
        }
      }
    }
  }))
);
