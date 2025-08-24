import { useEffect, useState } from "react";
import { useIsMobile } from "./hooks/use-is-mobile";
import { useAudio } from "./lib/stores/useAudio";
import { useGame } from "./lib/stores/useGame";
import Game from "./components/Game";
import "@fontsource/inter";

function App() {
  const isMobile = useIsMobile();
  const { phase } = useGame();
  const { setNavigatorMusic, setGuideMusic, setHitSound, setSuccessSound, setPartnerJoinedSound } = useAudio();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio assets
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Load role-specific music files
        const navigatorMusic = new Audio();
        navigatorMusic.src = '/sounds/navigator.mp3';
        navigatorMusic.loop = true;
        navigatorMusic.volume = 0.2;
        
        const guideMusic = new Audio();
        guideMusic.src = '/sounds/guide.mp3';
        guideMusic.loop = true;
        guideMusic.volume = 0.2;
        
        // Add error handling for mobile audio
        const enableAudioOnInteraction = () => {
          navigatorMusic.load(); // Preload the audio
          guideMusic.load();
          document.removeEventListener('touchstart', enableAudioOnInteraction);
          document.removeEventListener('click', enableAudioOnInteraction);
        };
        
        // On mobile, audio needs user interaction first
        document.addEventListener('touchstart', enableAudioOnInteraction, { once: true });
        document.addEventListener('click', enableAudioOnInteraction, { once: true });
        
        setNavigatorMusic(navigatorMusic);
        setGuideMusic(guideMusic);

        // Load sound effects using actual audio files
        const hitSound = new Audio();
        hitSound.src = '/sounds/hit.mp3';
        hitSound.volume = 0.3;
        setHitSound(hitSound);

        const successSound = new Audio();
        successSound.src = '/sounds/success.mp3';
        successSound.volume = 0.5;
        setSuccessSound(successSound);

        // Partner joined notification - use the success sound with different volume
        const partnerJoinedSound = new Audio();
        partnerJoinedSound.src = '/sounds/success.mp3';
        partnerJoinedSound.volume = 0.4;
        setPartnerJoinedSound(partnerJoinedSound);

        setIsInitialized(true);
        console.log('Audio system initialized (demo mode)');
        console.log('🎵 Music: Atmospheric puzzle game background music');
        console.log('🎵 Based on research from Soundimage.org - suitable for maze/puzzle games');
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setIsInitialized(true); // Continue without audio
      }
    };

    initializeAudio();
  }, [setNavigatorMusic, setGuideMusic, setHitSound, setSuccessSound, setPartnerJoinedSound]);

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
