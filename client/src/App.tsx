import { useEffect, useState } from "react";
import { useIsMobile } from "./hooks/use-is-mobile";
import { useAudio } from "./lib/stores/useAudio";
import { useGame } from "./lib/stores/useGame";
import Game from "./components/Game";
import "@fontsource/inter";

function App() {
  const isMobile = useIsMobile();
  const { phase } = useGame();
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio assets
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Load background music
        const bgMusic = new Audio('/sounds/background.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
        setBackgroundMusic(bgMusic);

        // Load sound effects
        const hitSound = new Audio('/sounds/hit.mp3');
        hitSound.volume = 0.5;
        setHitSound(hitSound);

        const successSound = new Audio('/sounds/success.mp3');
        successSound.volume = 0.7;
        setSuccessSound(successSound);

        setIsInitialized(true);
        console.log('Audio initialized successfully');
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setIsInitialized(true); // Continue without audio
      }
    };

    initializeAudio();
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading Maze Game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {!isMobile && (
        <div className="absolute top-4 left-4 z-50 bg-yellow-600 text-black px-3 py-2 rounded-lg text-sm font-semibold">
          ⚠️ This game is optimized for mobile devices
        </div>
      )}
      <Game />
    </div>
  );
}

export default App;
