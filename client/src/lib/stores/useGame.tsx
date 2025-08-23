import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "room-setup" | "role-select" | "playing" | "level-complete" | "ended";
export type PlayerRole = "navigator" | "guide" | null;
export type GameMode = "create" | "join" | null;

interface GameState {
  phase: GamePhase;
  playerRole: PlayerRole;
  gameMode: GameMode;
  roomCode: string | null;
  sharedPlayerPosition: { x: number; y: number } | null;
  playerId: string | null;
  currentLevel: number;
  isCreator: boolean;
  
  // Actions
  start: () => void;
  restart: () => void;
  end: () => void;
  levelComplete: () => void;
  nextLevel: () => void;
  switchRoles: () => void;
  setRole: (role: PlayerRole) => Promise<void>;
  setCreatorRole: (role: PlayerRole) => Promise<void>;
  selectRole: () => void;
  createGame: () => void;
  joinGame: (code: string) => void;
  setGameMode: (mode: GameMode) => void;
  updatePlayerPosition: (x: number, y: number) => void;
  initializePlayerPosition: (x: number, y: number) => Promise<void>;
  broadcastWin: () => void;
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

// Game state synchronization functions
const updateGameState = async (roomCode: string, phase: string, currentLevel: number) => {
  try {
    await fetch(`/api/game-state/${roomCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phase, currentLevel }),
    });
  } catch (error) {
    console.error('Failed to update game state:', error);
  }
};

const loadGameState = async (roomCode: string): Promise<{ phase: string; currentLevel: number } | null> => {
  try {
    const response = await fetch(`/api/game-state/${roomCode}`);
    if (response.ok) {
      const data = await response.json();
      return { phase: data.phase, currentLevel: data.currentLevel };
    }
  } catch (error) {
    console.error('Failed to load game state:', error);
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
    playerId: null,
    currentLevel: 1,
    isCreator: false,
    
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
        sharedPlayerPosition: null,
        playerId: null,
        currentLevel: 1,
        isCreator: false
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

    levelComplete: () => {
      const state = get();
      if (state.roomCode) {
        updateGameState(state.roomCode, "level-complete", state.currentLevel);
      }
      set(() => ({ phase: "level-complete" }));
    },

    nextLevel: () => {
      set((state) => {
        const newLevel = state.currentLevel + 1;
        if (state.roomCode) {
          updateGameState(state.roomCode, "playing", newLevel);
        }
        return { 
          phase: "playing", 
          currentLevel: newLevel 
        };
      });
    },

    broadcastWin: () => {
      const state = get();
      if (state.roomCode) {
        updateGameState(state.roomCode, "level-complete", state.currentLevel);
      }
    },

    switchRoles: async () => {
      const state = get();
      if (state.roomCode && state.isCreator) {
        try {
          const response = await fetch(`/api/switch-roles/${state.roomCode}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            // Update local role based on server response
            const myRole = data.roles[state.playerId];
            set(() => ({ playerRole: myRole }));
            console.log('Roles switched successfully');
          }
        } catch (error) {
          console.error('Failed to switch roles:', error);
        }
      }
    },

    setCreatorRole: async (role: PlayerRole) => {
      const state = get();
      if (state.roomCode && state.playerId && role && state.isCreator) {
        try {
          const response = await fetch(`/api/role/${state.roomCode}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role, playerId: state.playerId }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const myRole = data.roles[state.playerId];
            set(() => ({ playerRole: myRole }));
            console.log(`Creator assigned roles: ${myRole} (partner gets ${myRole === 'navigator' ? 'guide' : 'navigator'})`);
          }
        } catch (error) {
          console.error('Failed to set creator role:', error);
          set(() => ({ playerRole: role }));
        }
      }
    },
    
    setRole: async (role: PlayerRole) => {
      const state = get();
      if (state.roomCode && state.playerId && role) {
        try {
          // Send role to server for automatic assignment
          const response = await fetch(`/api/role/${state.roomCode}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role, playerId: state.playerId }),
          });
          
          if (response.ok) {
            const data = await response.json();
            // Get the role assigned to this player
            const myRole = data.roles[state.playerId];
            set(() => ({ playerRole: myRole }));
            console.log(`Role assigned: ${myRole} (other player got ${myRole === 'navigator' ? 'guide' : 'navigator'})`);
          }
        } catch (error) {
          console.error('Failed to set role:', error);
          // Fallback to local assignment
          set(() => ({ playerRole: role }));
        }
      } else {
        set(() => ({ playerRole: role }));
      }
    },
    
    selectRole: () => {
      set(() => ({ phase: "role-select" }));
    },

    setGameMode: (mode: GameMode) => {
      set(() => ({ gameMode: mode }));
    },

    createGame: () => {
      const roomCode = generateRoomCode();
      const playerId = 'player1'; // First player to create is player1
      // Add room code to URL
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomCode);
      window.history.replaceState({}, '', url.toString());
      
      set(() => ({ 
        phase: "room-setup", 
        gameMode: "create", 
        roomCode,
        playerId,
        isCreator: true
      }));
    },

    joinGame: (code: string) => {
      const playerId = 'player2'; // Second player joining is player2
      // Add room code to URL
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      window.history.replaceState({}, '', url.toString());
      
      set(() => ({ 
        phase: "room-setup", 
        gameMode: "join", 
        roomCode: code,
        playerId,
        isCreator: false
      }));
    },

    updatePlayerPosition: (x: number, y: number) => {
      const state = get();
      if (state.roomCode) {
        // Save to shared storage
        saveSharedPosition(state.roomCode, x, y);
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
