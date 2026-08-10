import { create } from 'zustand';
import { SongRecommendation } from '../types';

interface PlayerState {
  currentSong: SongRecommendation | null;
  isPlaying: boolean;
  volume: number;
  playSong: (song: SongRecommendation) => void;
  pauseSong: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  isPlaying: false,
  volume: 0.8,
  playSong: (song) => set({ currentSong: song, isPlaying: true }),
  pauseSong: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ volume }),
}));