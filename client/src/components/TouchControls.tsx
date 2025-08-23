import { useState } from "react";
import { useAudio } from "../lib/stores/useAudio";

export default function TouchControls() {
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const { playHit } = useAudio();

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    // Call the global move function exposed by MazeCanvas
    if ((window as any).movePlayer) {
      (window as any).movePlayer(direction);
      playHit(); // Play sound feedback
    }
    setActiveDirection(direction);
    setTimeout(() => setActiveDirection(null), 150);
  };

  const buttonClass = (direction: string) => `
    w-16 h-16 rounded-full font-bold text-xl transition-all duration-150 select-none
    ${activeDirection === direction 
      ? 'bg-blue-600 scale-110 shadow-lg' 
      : 'bg-gray-700 hover:bg-gray-600 active:scale-95'
    }
    text-white border-2 border-gray-500 active:border-blue-400
  `;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
      <div className="relative">
        {/* Up button */}
        <button
          className={buttonClass('up')}
          style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)' }}
          onTouchStart={(e) => {
            e.preventDefault();
            handleMove('up');
          }}
          onMouseDown={() => handleMove('up')}
        >
          ↑
        </button>

        {/* Center row with left, center (empty), right */}
        <div className="flex items-center space-x-4">
          <button
            className={buttonClass('left')}
            onTouchStart={(e) => {
              e.preventDefault();
              handleMove('left');
            }}
            onMouseDown={() => handleMove('left')}
          >
            ←
          </button>

          <div className="w-16 h-16"></div> {/* Spacer */}

          <button
            className={buttonClass('right')}
            onTouchStart={(e) => {
              e.preventDefault();
              handleMove('right');
            }}
            onMouseDown={() => handleMove('right')}
          >
            →
          </button>
        </div>

        {/* Down button */}
        <button
          className={buttonClass('down')}
          style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)' }}
          onTouchStart={(e) => {
            e.preventDefault();
            handleMove('down');
          }}
          onMouseDown={() => handleMove('down')}
        >
          ↓
        </button>
      </div>
    </div>
  );
}
