import { create } from "zustand";

interface AudioState {
  navigatorMusic: HTMLAudioElement | null;
  guideMusic: HTMLAudioElement | null;
  currentMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  partnerJoinedSound: HTMLAudioElement | null;
  isMuted: boolean;
  isMusicPlaying: boolean;
  
  // Setter functions
  setNavigatorMusic: (music: HTMLAudioElement) => void;
  setGuideMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setPartnerJoinedSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playRoleMusic: (role: 'navigator' | 'guide' | null) => void;
  pauseBackgroundMusic: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playPartnerJoined: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  navigatorMusic: null,
  guideMusic: null,
  currentMusic: null,
  hitSound: null,
  successSound: null,
  partnerJoinedSound: null,
  isMuted: true, // Start muted by default
  isMusicPlaying: false,
  
  setNavigatorMusic: (music) => set({ navigatorMusic: music }),
  setGuideMusic: (music) => set({ guideMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setPartnerJoinedSound: (sound) => set({ partnerJoinedSound: sound }),
  
  toggleMute: () => {
    const { isMuted, currentMusic } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Control background music based on mute state
    if (currentMusic) {
      if (newMutedState) {
        currentMusic.pause();
        set({ isMusicPlaying: false });
      } else {
        // Only play if we're in a playing phase
        const { phase } = (window as any).gamePhase || { phase: 'ready' };
        if (phase === 'playing') {
          currentMusic.play().catch(console.log);
          set({ isMusicPlaying: true });
        }
      }
    }
    
    // Log the change
    console.log(`Audio ${newMutedState ? 'muted' : 'unmuted'}`);
  },

  playRoleMusic: (role) => {
    const { navigatorMusic, guideMusic, isMuted, currentMusic } = get();
    
    // Stop current music if playing
    if (currentMusic) {
      currentMusic.pause();
      currentMusic.currentTime = 0;
    }
    
    if (!role || isMuted) {
      set({ currentMusic: null, isMusicPlaying: false });
      return;
    }
    
    // Select the appropriate music based on role
    const newMusic = role === 'navigator' ? navigatorMusic : guideMusic;
    
    if (newMusic) {
      set({ currentMusic: newMusic });
      newMusic.currentTime = 0;
      newMusic.play().catch(console.log);
      set({ isMusicPlaying: true });
      console.log(`${role} music started`);
    }
  },

  pauseBackgroundMusic: () => {
    const { currentMusic } = get();
    if (currentMusic) {
      currentMusic.pause();
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
