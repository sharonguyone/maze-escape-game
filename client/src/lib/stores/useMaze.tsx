import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { MazeGenerator, Cell } from "../MazeGenerator";

interface MazeState {
  maze: Cell[][];
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  currentLevel: number;
  currentSeed: number | null;
  
  // Actions
  generateMaze: (width: number, height: number, seed?: number) => void;
  nextLevel: () => void;
  resetLevel: () => void;
  generateSharedMaze: (width: number, height: number) => void;
}

// Helper function to get room code from URL and convert to seed
const getRoomCodeFromURL = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
};

const roomCodeToSeed = (roomCode: string): number => {
  // Convert room code to consistent seed number
  let hash = 0;
  for (let i = 0; i < roomCode.length; i++) {
    const char = roomCode.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const useMaze = create<MazeState>()(
  subscribeWithSelector((set) => ({
    maze: [],
    startPos: { x: 0, y: 0 },
    endPos: { x: 0, y: 0 },
    currentLevel: 1,
    currentSeed: null,
    
    generateMaze: (width: number, height: number, seed?: number) => {
      const mazeSeed = seed || Math.floor(Math.random() * 1000000);
      const generator = new MazeGenerator(width, height, mazeSeed);
      const newMaze = generator.generate();
      const startPos = generator.getStartPosition();
      const endPos = generator.getEndPosition();
      
      set({
        maze: newMaze,
        startPos,
        endPos,
        currentSeed: mazeSeed,
      });
      
      console.log(`Generated ${width}x${height} maze with seed ${mazeSeed}`, new Date().toISOString());
    },

    generateSharedMaze: (width: number, height: number) => {
      // Get room code from URL and convert to seed
      const roomCode = getRoomCodeFromURL();
      
      if (!roomCode) {
        console.error('No room code found for shared maze generation');
        return;
      }

      const mazeSeed = roomCodeToSeed(roomCode);
      const generator = new MazeGenerator(width, height, mazeSeed);
      const newMaze = generator.generate();
      const startPos = generator.getStartPosition();
      const endPos = generator.getEndPosition();
      
      set({
        maze: newMaze,
        startPos,
        endPos,
        currentSeed: mazeSeed,
      });
      
      console.log(`Generated SHARED ${width}x${height} maze for room ${roomCode} with seed ${mazeSeed}`, new Date().toISOString());
    },
    
    nextLevel: () => {
      set((state) => ({
        currentLevel: state.currentLevel + 1,
      }));
    },
    
    resetLevel: () => {
      set({
        currentLevel: 1,
      });
    },
  }))
);
