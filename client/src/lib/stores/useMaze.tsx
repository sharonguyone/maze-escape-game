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

// Helper function to get/set maze seed from URL
const getMazeSeedFromURL = (): number | null => {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('mazeSeed');
  return seed ? parseInt(seed, 10) : null;
};

const setMazeSeedInURL = (seed: number) => {
  const url = new URL(window.location.href);
  url.searchParams.set('mazeSeed', seed.toString());
  window.history.replaceState({}, '', url.toString());
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
      // Check if there's already a seed in the URL (second player joining)
      let mazeSeed = getMazeSeedFromURL();
      
      if (!mazeSeed) {
        // First player - generate new seed and add to URL
        mazeSeed = Math.floor(Math.random() * 1000000);
        setMazeSeedInURL(mazeSeed);
      }

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
      
      console.log(`Generated SHARED ${width}x${height} maze with seed ${mazeSeed}`, new Date().toISOString());
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
