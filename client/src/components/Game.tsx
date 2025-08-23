import { useEffect } from "react";
import { useGame } from "../lib/stores/useGame";
import { useMaze } from "../lib/stores/useMaze";
import { useAudio } from "../lib/stores/useAudio";
import MazeCanvas from "./MazeCanvas";
import TouchControls from "./TouchControls";
import GameUI from "./GameUI";

export default function Game() {
  const { phase, start, restart } = useGame();
  const { generateMaze, currentLevel } = useMaze();
  const { backgroundMusic, isMuted } = useAudio();

  // Initialize the first maze when game starts
  useEffect(() => {
    if (phase === "ready") {
      generateMaze(15, 15); // Start with a 15x15 maze
    }
  }, [phase, generateMaze]);

  // Handle background music
  useEffect(() => {
    if (backgroundMusic && !isMuted) {
      if (phase === "playing") {
        backgroundMusic.play().catch(console.log);
      } else {
        backgroundMusic.pause();
      }
    }
  }, [backgroundMusic, isMuted, phase]);

  const handleStartGame = () => {
    start();
  };

  const handleRestartGame = () => {
    restart();
    generateMaze(15, 15);
  };

  const handleNextLevel = () => {
    const newSize = Math.min(25, 15 + currentLevel * 2); // Increase maze size each level
    generateMaze(newSize, newSize);
    start();
  };

  if (phase === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-blue-400">Maze Navigator</h1>
          <p className="text-lg text-gray-300 mb-2">
            Navigate through the maze to reach the exit
          </p>
          <p className="text-sm text-gray-400">
            Use touch controls to move your character
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleStartGame}
            className="w-64 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Start Game
          </button>
          
          {currentLevel > 1 && (
            <div className="text-center text-sm text-gray-400">
              Current Level: {currentLevel}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "ended") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-green-400">
            🎉 Level {currentLevel} Complete!
          </h2>
          <p className="text-lg text-gray-300 mb-4">
            Congratulations! You've escaped the maze!
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleNextLevel}
            className="w-64 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Next Level
          </button>
          
          <button
            onClick={handleRestartGame}
            className="w-64 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Restart Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <MazeCanvas />
      <TouchControls />
      <GameUI />
    </div>
  );
}
