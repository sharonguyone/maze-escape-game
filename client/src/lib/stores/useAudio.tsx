import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  partnerJoinedSound: HTMLAudioElement | null;
  isMuted: boolean;
  isMusicPlaying: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setPartnerJoinedSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playBackgroundMusic: () => void;
  pauseBackgroundMusic: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playPartnerJoined: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  partnerJoinedSound: null,
  isMuted: true, // Start muted by default
  isMusicPlaying: false,
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setPartnerJoinedSound: (sound) => set({ partnerJoinedSound: sound }),
  
  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Control background music based on mute state
    if (backgroundMusic) {
      if (newMutedState) {
        backgroundMusic.pause();
        set({ isMusicPlaying: false });
      } else {
        // Only play if we're in a playing phase
        const { phase } = (window as any).gamePhase || { phase: 'ready' };
        if (phase === 'playing') {
          backgroundMusic.play().catch(console.log);
          set({ isMusicPlaying: true });
        }
      }
    }
    
    // Log the change
    console.log(`Audio ${newMutedState ? 'muted' : 'unmuted'}`);
  },

  playBackgroundMusic: () => {
    const { backgroundMusic, isMuted } = get();
    if (backgroundMusic && !isMuted) {
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch(console.log);
      set({ isMusicPlaying: true });
      console.log('Background music started');
    }
  },

  pauseBackgroundMusic: () => {
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.pause();
      set({ isMusicPlaying: false });
      console.log('Background music paused');
    }
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playPartnerJoined: () => {
    const { partnerJoinedSound, isMuted } = get();
    if (partnerJoinedSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Partner joined sound skipped (muted)");
        return;
      }
      
      partnerJoinedSound.currentTime = 0;
      partnerJoinedSound.play().catch(error => {
        console.log("Partner joined sound play prevented:", error);
      });
    }
  }
}));
