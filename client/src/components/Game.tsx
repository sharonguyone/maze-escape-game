import { useEffect } from "react";
import { useGame } from "../lib/stores/useGame";
import { useMaze } from "../lib/stores/useMaze";
import { useAudio } from "../lib/stores/useAudio";
import MazeCanvas from "./MazeCanvas";
import TouchControls from "./TouchControls";
import GameUI from "./GameUI";

export default function Game() {
  const { phase, playerRole, start, restart, setRole, selectRole } = useGame();
  const { generateMaze, currentLevel } = useMaze();
  const { backgroundMusic, isMuted } = useAudio();

  // Initialize the first maze when role is selected
  useEffect(() => {
    if (phase === "role-select") {
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
    selectRole();
  };

  const handleRestartGame = () => {
    restart();
    generateMaze(15, 15);
  };

  const handleNextLevel = () => {
    const { nextLevel } = useMaze.getState();
    nextLevel(); // Increment the level first
    const newLevel = useMaze.getState().currentLevel;
    const newSize = Math.min(25, 15 + newLevel * 2); // Increase maze size each level
    generateMaze(newSize, newSize);
    start();
  };

  if (phase === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-blue-400">Cooperative Maze Navigator</h1>
          <p className="text-base text-gray-300 mb-1">
            2-Player Cooperative Game
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Each player opens this on their own phone
          </p>
        </div>

        <div className="space-y-6 mb-6">
          <button
            onClick={handleStartGame}
            className="w-80 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-6 px-8 rounded-xl text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🎮 START GAME - Choose Your Role
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              👆 Click this button to begin playing
            </p>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3 text-left max-w-sm">
          <h3 className="text-sm font-bold text-yellow-400 mb-2">📱 How it works:</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <p>1. Both players open this game on separate phones</p>
            <p>2. One chooses "Navigator", other chooses "Guide"</p>
            <p>3. Navigator controls movement with limited view</p>
            <p>4. Guide sees full maze and gives directions</p>
            <p>5. Talk to each other to reach the exit!</p>
          </div>
        </div>

        {currentLevel > 1 && (
          <div className="text-center text-xs text-gray-500 mt-4">
            Current Level: {currentLevel}
          </div>
        )}
      </div>
    );
  }

  if (phase === "role-select") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-blue-400">Choose Your Role</h2>
          <p className="text-lg text-gray-300 mb-2">
            Which role will you play in this cooperative maze challenge?
          </p>
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-6 max-w-md">
            <p className="text-sm text-yellow-200">
              💡 <strong>Reminder:</strong> Make sure your teammate opens this same game on their phone and chooses the other role!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {/* Navigator Role */}
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-600 hover:border-blue-500 transition-colors">
            <h3 className="text-xl font-bold text-blue-400 mb-3">🕹️ Navigator</h3>
            <p className="text-gray-300 mb-4">
              You control the player's movement through the maze using touch controls.
            </p>
            <ul className="text-sm text-gray-400 mb-6 space-y-1">
              <li>• Can move the blue dot through the maze</li>
              <li>• Has limited or no visibility of the maze walls</li>
              <li>• Must rely on the Guide's directions</li>
              <li>• Perfect for the person who likes hands-on control</li>
            </ul>
            <button
              onClick={() => {
                setRole('navigator');
                start();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              I'll Navigate!
            </button>
          </div>

          {/* Guide Role */}
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-600 hover:border-green-500 transition-colors">
            <h3 className="text-xl font-bold text-green-400 mb-3">🗺️ Guide</h3>
            <p className="text-gray-300 mb-4">
              You can see the full maze and help guide the Navigator to the exit.
            </p>
            <ul className="text-sm text-gray-400 mb-6 space-y-1">
              <li>• Can see the complete maze layout</li>
              <li>• Watches the Navigator's position in real-time</li>
              <li>• Cannot directly control the player</li>
              <li>• Perfect for the person who likes strategy and communication</li>
            </ul>
            <button
              onClick={() => {
                setRole('guide');
                start();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              I'll Guide!
            </button>
          </div>
        </div>

        <button
          onClick={() => restart()}
          className="mt-6 text-gray-400 hover:text-white transition-colors underline"
        >
          ← Back to Main Menu
        </button>
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
