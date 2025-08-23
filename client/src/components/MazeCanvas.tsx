import { useEffect, useRef, useState } from "react";
import { useMaze } from "../lib/stores/useMaze";
import { useGame } from "../lib/stores/useGame";
import { useAudio } from "../lib/stores/useAudio";
import { GameEngine } from "../lib/GameEngine";

export default function MazeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const { maze, startPos, endPos } = useMaze();
  const { end, playerRole } = useGame();
  const { playSuccess } = useAudio();

  // Calculate canvas size based on screen
  useEffect(() => {
    const updateCanvasSize = () => {
      const size = Math.min(window.innerWidth, window.innerHeight - 120);
      setCanvasSize({ width: size, height: size });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Initialize game engine
  useEffect(() => {
    if (!canvasRef.current || !maze.length || canvasSize.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Create game engine with player role
    gameEngineRef.current = new GameEngine(
      ctx,
      maze,
      startPos,
      endPos,
      canvasSize.width,
      canvasSize.height,
      playerRole
    );

    // Handle win condition
    gameEngineRef.current.onWin = () => {
      playSuccess();
      setTimeout(() => {
        end();
      }, 1000);
    };

    // Start game loop
    gameEngineRef.current.start();

    return () => {
      gameEngineRef.current?.stop();
    };
  }, [maze, startPos, endPos, canvasSize, playerRole, end, playSuccess]);

  // Handle touch/mouse controls
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    gameEngineRef.current?.movePlayer(direction);
  };

  // Expose move function to parent component
  useEffect(() => {
    (window as any).movePlayer = handleMove;
    return () => {
      delete (window as any).movePlayer;
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-600 rounded-lg bg-gray-800 shadow-2xl"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          touchAction: 'none'
        }}
      />
    </div>
  );
}
