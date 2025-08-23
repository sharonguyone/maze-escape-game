import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { MazeGenerator, Cell } from "../MazeGenerator";

interface MazeState {
  maze: Cell[][];
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  currentLevel: number;
  
  // Actions
  generateMaze: (width: number, height: number) => void;
  nextLevel: () => void;
  resetLevel: () => void;
}

export const useMaze = create<MazeState>()(
  subscribeWithSelector((set) => ({
    maze: [],
    startPos: { x: 0, y: 0 },
    endPos: { x: 0, y: 0 },
    currentLevel: 1,
    
    generateMaze: (width: number, height: number) => {
      const generator = new MazeGenerator(width, height);
      const newMaze = generator.generate();
      const startPos = generator.getStartPosition();
      const endPos = generator.getEndPosition();
      
      set({
        maze: newMaze,
        startPos,
        endPos,
      });
      
      console.log(`Generated ${width}x${height} maze for level`, new Date().toISOString());
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
