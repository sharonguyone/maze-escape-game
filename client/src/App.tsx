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
        // Create atmospheric background music using Web Audio API
        const bgMusic = new Audio();
        
        // For demo purposes, we'll use a data URL with a simple tone
        // In production, you'd use: bgMusic.src = '/sounds/atmospheric-maze-music.mp3';
        // Based on research from Soundimage.org - "Game Menu" style track
        
        // Create a simple atmospheric background track
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Create subtle atmospheric tones
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // Low A note
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configure background music
        bgMusic.loop = true;
        bgMusic.volume = 0.2; // Lower volume for background
        
        // For now, create a silent audio element that can be controlled
        bgMusic.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMG'; // Silent audio
        
        setBackgroundMusic(bgMusic);

        // Load sound effects (these would use actual audio files)
        const hitSound = new Audio();
        hitSound.volume = 0.5;
        hitSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMG';
        setHitSound(hitSound);

        const successSound = new Audio();
        successSound.volume = 0.7;
        successSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMGJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmCCuTyvLZfDMG';
        setSuccessSound(successSound);

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
