import React, { useState } from 'react';
import { RecommendationHistoryItem, SongRecommendation } from '../types';
import { loginWithSpotify, exportPlaylistToSpotify } from '../services/spotify';
import { getPlatformLinks } from '../utils/platformLinks';
import AudioPlayer from './AudioPlayer';

interface MusicResultsProps {
  session: RecommendationHistoryItem;
  onLikeChange: (songId: string, liked: boolean) => void;
  onReset: () => void;
  likedState: Record<string, boolean>;
  spotifyToken: string | null;
}

export default function MusicResults({ session, onLikeChange, onReset, likedState, spotifyToken }: MusicResultsProps) {
  const { profile, recommendations } = session;
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  async function handleExportToSpotify() {
    setIsExporting(true);
    try {
      let token = spotifyToken;
      if (!token) {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        token = params.get('access_token');
      }

      if (!token) {
        loginWithSpotify();
        return;
      }

      const trackSearches = recommendations.map((song: SongRecommendation) => ({
        title: song.title,
        artist: song.artist,
        spotifyUrl: song.spotifyUrl,
        spotifyUri: song.spotifyUri
      }));

      const playlistUrl = await exportPlaylistToSpotify(token, trackSearches, 'SoundMind Recommendations 🧠✨');
      setExportSuccess(playlistUrl);
    } catch (err) {
      console.error('Error al exportar playlist:', err);
      loginWithSpotify();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-white">
      {/* Encabezado */}
      <div className="flex justify-between items-center bg-gray-800 p-6 rounded-2xl border border-gray-700">
        <div>
          <h1 className="text-2xl font-bold">Tu SoundMind Musical</h1>
          <p className="text-sm text-gray-400">{profile?.description || "Análisis psico-acústico listo"}</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-semibold transition-all"
          >
            Rehacer Test
          </button>
          
          {exportSuccess ? (
            <a
              href={exportSuccess}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 text-black font-bold rounded-xl text-sm transition-all"
            >
              ¡Abrir en Spotify! ↗
            </a>
          ) : (
            <button
              onClick={handleExportToSpotify}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm transition-all"
            >
              {isExporting ? 'Exportando...' : 'Exportar a Spotify 🚀'}
            </button>
          )}
        </div>
      </div>

      {/* Lista de canciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations?.map((song: SongRecommendation) => {
          const isLiked = likedState[song.id] === true;
          const isDisliked = likedState[song.id] === false;
          const previewUrl = song.previewUrl || (song as any).preview_url || null;
          
          // Generar todos los links de las plataformas (Spotify, YT Music, Apple Music, Deezer)
          const platformLinks = getPlatformLinks(song);

          return (
            <div key={song.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl flex flex-col gap-4">
              <div className="flex gap-4 items-center">
                <img 
                  src={song.coverUrl || song.albumArt || 'https://via.placeholder.com/150'} 
                  alt={song.title} 
                  className="w-16 h-16 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate">{song.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                </div>

                {/* Botones de Like / Dislike */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => onLikeChange(song.id, true)} 
                    className={`p-2 rounded-xl transition-all ${isLiked ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    👍
                  </button>
                  <button 
                    onClick={() => onLikeChange(song.id, false)} 
                    className={`p-2 rounded-xl transition-all ${isDisliked ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    👎
                  </button>
                </div>
              </div>

              {previewUrl ? (
                <AudioPlayer previewUrl={previewUrl} trackName={song.title} />
              ) : (
                <p className="text-[11px] text-gray-400">No hay preview disponible para esta canción.</p>
              )}

              {/* 🌐 BOTONES MULTIPLATAFORMA */}
              <div className="pt-2 border-t border-gray-800 flex flex-wrap gap-2 items-center">
                <a
                  href={platformLinks.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-lg text-xs font-semibold transition-all"
                >
                  Spotify
                </a>

                <a
                  href={platformLinks.youtubeMusic}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  YouTube Music
                </a>

                <a
                  href={platformLinks.appleMusic}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Apple Music
                </a>

                <a
                  href={platformLinks.deezer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Deezer
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}