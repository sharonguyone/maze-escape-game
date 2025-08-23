import { useEffect, useState } from "react";
import { useGame } from "../lib/stores/useGame";
import { useMaze } from "../lib/stores/useMaze";
import { useAudio } from "../lib/stores/useAudio";
import MazeCanvas from "./MazeCanvas";
import TouchControls from "./TouchControls";
import GameUI from "./GameUI";

export default function Game() {
  const { phase, playerRole, gameMode, roomCode, start, restart, setRole, selectRole, createGame, joinGame } = useGame();
  const { generateSharedMaze, currentLevel } = useMaze();
  const { backgroundMusic, isMuted } = useAudio();
  const [joinCode, setJoinCode] = useState("");

  // Check for existing room code in URL when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const existingRoomCode = urlParams.get('room');
    
    if (existingRoomCode && phase === "ready") {
      // Auto-join the room if there's a room code in URL
      joinGame(existingRoomCode);
    }
  }, [phase, joinGame]);

  // Initialize the first maze when room is set up
  useEffect(() => {
    if (phase === "room-setup" && roomCode) {
      generateSharedMaze(15, 15); // Start with a 15x15 SHARED maze
    }
  }, [phase, roomCode, generateSharedMaze]);

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
    generateSharedMaze(15, 15);
  };

  const handleNextLevel = () => {
    const { nextLevel } = useMaze.getState();
    nextLevel(); // Increment the level first
    const newLevel = useMaze.getState().currentLevel;
    const newSize = Math.min(25, 15 + newLevel * 2); // Increase maze size each level
    generateSharedMaze(newSize, newSize);
    start();
  };

  if (phase === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">Maze Navigator</h1>
          <p className="text-gray-300 mb-8 text-lg">
            Cooperative maze game for two players
          </p>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <button 
              onClick={createGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              CREATE GAME
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 4-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.slice(0, 4))}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-center text-xl"
                maxLength={4}
              />
              <button 
                onClick={() => joinCode.length === 4 && joinGame(joinCode)}
                disabled={joinCode.length !== 4}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-xl transition-colors"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "room-setup") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">Game Room</h1>
          {gameMode === "create" ? (
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <p className="text-gray-300 mb-4">Share this code with your partner:</p>
              <div className="text-6xl font-bold text-blue-400 mb-4 tracking-widest">
                {roomCode}
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mb-4"
              >
                Copy Link
              </button>
              <p className="text-gray-400 text-sm">
                Once your partner joins, you can select roles
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <p className="text-gray-300 mb-2">Joined game room:</p>
              <div className="text-4xl font-bold text-green-400 mb-4 tracking-widest">
                {roomCode}
              </div>
              <p className="text-gray-400 text-sm">
                Ready to select roles!
              </p>
            </div>
          )}
          <button 
            onClick={selectRole}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            SELECT ROLES
          </button>
        </div>
      </div>
    );
  }

  if (phase === "role-select") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Choose Your Role</h2>
          <p className="text-sm text-gray-300 mb-3">
            Which role will you play?
          </p>
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-2 mb-4 max-w-xs">
            <p className="text-xs text-yellow-200">
              💡 Make sure your teammate chooses the other role!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md w-full mb-4">
          {/* Navigator Role */}
          <div className="bg-gray-800 rounded-lg p-3 border-2 border-gray-600 hover:border-blue-500 transition-colors">
            <h3 className="text-base font-bold text-blue-400 mb-2">🕹️ Navigator</h3>
            <p className="text-xs text-gray-300 mb-2">
              Control movement
            </p>
            <ul className="text-xs text-gray-400 mb-3 space-y-1">
              <li>• Move blue dot</li>
              <li>• Limited vision</li>
              <li>• Follow directions</li>
            </ul>
            <button
              onClick={() => {
                setRole('navigator');
                start();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-lg transition-colors text-sm"
            >
              I'll Navigate!
            </button>
          </div>

          {/* Guide Role */}
          <div className="bg-gray-800 rounded-lg p-3 border-2 border-gray-600 hover:border-green-500 transition-colors">
            <h3 className="text-base font-bold text-green-400 mb-2">🗺️ Guide</h3>
            <p className="text-xs text-gray-300 mb-2">
              Give directions
            </p>
            <ul className="text-xs text-gray-400 mb-3 space-y-1">
              <li>• See full maze</li>
              <li>• Watch Navigator</li>
              <li>• Give directions</li>
            </ul>
            <button
              onClick={() => {
                setRole('guide');
                start();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 rounded-lg transition-colors text-sm"
            >
              I'll Guide!
            </button>
          </div>
        </div>

        <button
          onClick={() => restart()}
          className="text-gray-400 hover:text-white transition-colors underline text-sm"
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
