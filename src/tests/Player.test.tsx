// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerStore } from '../store/usePlayerStore';
import { SongRecommendation } from '../types';

const mockSong: SongRecommendation = {
  id: '1',
  title: 'Canción de Prueba',
  artist: 'Artista Test',
  album: 'Álbum Test',
  coverUrl: '',
  genres: ['ambient'],
  spotifyUrl: 'https://spotify.com',
  score: 95,
  attributes: {
    valence: 50,
    energy: 60,
    tempo: 120,
    acousticness: 80,
    instrumentalness: 90,
    danceability: 40,
  },
  whyRecommend: 'Recomendación de prueba',
};

describe('usePlayerStore', () => {
  it('debe iniciar sin ninguna canción cargada y en pausa', () => {
    const { result } = renderHook(() => usePlayerStore());
    expect(result.current.currentSong).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });

  it('debe actualizar la canción actual y activar la reproducción con playSong', () => {
    const { result } = renderHook(() => usePlayerStore());
    
    act(() => {
      result.current.playSong(mockSong);
    });

    expect(result.current.currentSong?.title).toBe('Canción de Prueba');
    expect(result.current.isPlaying).toBe(true);
  });
});