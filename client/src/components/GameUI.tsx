import { useGame } from "../lib/stores/useGame";
import { useMaze } from "../lib/stores/useMaze";
import { useAudio } from "../lib/stores/useAudio";

export default function GameUI() {
  const { phase, restart } = useGame();
  const { currentLevel } = useMaze();
  const { isMuted, toggleMute } = useAudio();

  if (phase !== "playing") return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-20 flex justify-between items-start">
      {/* Game info */}
      <div className="bg-black bg-opacity-70 rounded-lg px-4 py-2 text-white">
        <div className="text-sm font-semibold">Level {currentLevel}</div>
        <div className="text-xs text-gray-300">Find the exit!</div>
      </div>

      {/* Controls */}
      <div className="flex space-x-2">
        <button
          onClick={toggleMute}
          className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        <button
          onClick={restart}
          className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
