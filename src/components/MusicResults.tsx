/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, ThumbsUp, ThumbsDown, RotateCcw, Share2, Sparkles, Music, Disc, Headphones, X 
} from 'lucide-react';
import { RecommendationHistoryItem, SongRecommendation } from '../types';
import { loginWithSpotify, exportPlaylistToSpotify } from '../services/spotify';
import { getPlatformLinks } from '../utils/platformLinks';
import AudioRadarChart from './AudioRadarChart';
import SocialCard from './SocialCard';
import { usePlayerStore } from '../store/usePlayerStore';

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const { playSong } = usePlayerStore();

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

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto text-white">
      {/* 1. Header Profile Box */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-10 shadow-2xl"
      >
        {/* Subtle decorative background light */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between border-b border-white/10 pb-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-bold uppercase">
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              Sintonía Calculada Exitosamente
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
               Tu SoundMind Musical Decodificado
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón para exportar a Spotify */}
            {exportSuccess ? (
              <a
                href={exportSuccess}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-green-500/20 border border-green-500/50 hover:bg-green-500/30 rounded-xl text-green-400 transition-all shadow-lg shadow-green-500/10"
              >
                <Music size={14} />
                <span>¡Abrir en Spotify! ↗</span>
              </a>
            ) : (
              <button
                onClick={handleExportToSpotify}
                disabled={isExporting}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 rounded-xl text-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
              >
                <Disc size={14} />
                <span>{isExporting ? 'Exportando...' : 'Exportar a Spotify'}</span>
              </button>
            )}

            {/* Botón para abrir la tarjeta de Instagram */}
            <button
              onClick={() => setShowSocialModal(true)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 rounded-xl text-purple-300 cursor-pointer transition-all active:scale-95 shadow-lg shadow-purple-500/10"
            >
              <Sparkles size={14} />
              <span>Crear Historia</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white cursor-pointer transition-colors"
            >
              <Share2 size={14} />
              <span>{copiedLink ? 'Compartido' : 'Compartir'}</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 border border-white/10 rounded-xl text-white shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw size={14} />
              <span>Nuevo Test</span>
            </button>
          </div>
        </div>

        {/* Profile Description */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-5">
            <div className="space-y-1">
              <h3 className="text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                Análisis Psico-Acústico (AI Insight)
              </h3>
              <p className="text-sm md:text-base text-gray-200 leading-relaxed font-sans font-light">
                "{profile.description}"
              </p>
            </div>

            {/* Vibes badget list */}
            <div className="space-y-2">
              <h4 className="text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                Etiquetas de Sintonía
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.vibes.map((v, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] font-mono font-semibold px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20"
                  >
                    ✦ {v}
                  </span>
                ))}
                {profile.dominantGenres.map((g, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] font-mono font-semibold px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/20"
                  >
                    💿 {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Embedded Radar chart visualization */}
          <div className="md:col-span-5 flex justify-center">
            <AudioRadarChart attributes={profile.attributes} />
          </div>
        </div>
      </motion.div>

      {/* 3. Song Recommendations List section */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tu SoundMind Musical</h1>
          <p className="text-sm text-gray-400">{profile?.description || "Análisis psico-acústico listo"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((song: SongRecommendation, idx) => {
            const isLiked = likedState[song.id] === true;
            const isDisliked = likedState[song.id] === false;
            const platformLinks = getPlatformLinks(song);

            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 hover:border-cyan-500/40 transition-all shadow-md hover:shadow-cyan-500/5 duration-300 backdrop-blur-xl flex-col"
              >
                <div className="flex gap-4">
                  {/* Cover Art Wrapper */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10">
                    <img 
                      src={song.coverUrl || song.albumArt || 'https://via.placeholder.com/150'} 
                      alt={song.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {/* Hover play button */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => playSong(song)}
                        className="p-2 bg-cyan-500 rounded-full text-white cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all"
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display font-bold text-sm text-white truncate pr-2" title={song.title}>
                          {song.title}
                        </h3>
                        {/* Affinity match score */}
                        <span className="text-[9px] font-mono font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded-full shrink-0">
                          {song.score}% Match
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 truncate font-medium">
                        {song.artist} — <span className="text-gray-500">{song.album}</span>
                      </p>

                      <p className="text-[10px] text-gray-400 line-clamp-2 md:line-clamp-3 leading-relaxed mt-1 font-light italic">
                        "{song.whyRecommend}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Interactions and Platform Links */}
                <div className="mt-2 pt-3 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {song.genres.slice(0, 2).map((g, i) => (
                        <span key={i} className="text-[8px] font-medium font-mono border border-white/10 bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
                          {g}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Thumbs Up Button */}
                      <button
                        onClick={() => onLikeChange(song.id, true)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isLiked 
                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
                        }`}
                        title="Me gusta"
                      >
                        <ThumbsUp size={12} fill={isLiked ? 'currentColor' : 'none'} />
                      </button>

                      {/* Thumbs Down Button */}
                      <button
                        onClick={() => onLikeChange(song.id, false)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isDisliked 
                            ? 'bg-red-500/10 border-red-500/50 text-red-400'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
                        }`}
                        title="No me gusta"
                      >
                        <ThumbsDown size={12} fill={isDisliked ? 'currentColor' : 'none'} />
                      </button>

                      {/* Spotify / Reproductor Button */}
                      <button
                        onClick={() => playSong(song)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-white/10 text-cyan-300 bg-white/5 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                        title="Reproducir pista"
                      >
                        <Headphones size={10} />
                        <span>Escuchar</span>
                      </button>
                    </div>
                  </div>

                  {/* 🌐 BOTONES MULTIPLATAFORMA */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <a
                      href={platformLinks.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-md text-[10px] font-semibold transition-all"
                    >
                      Spotify
                    </a>

                    <a
                      href={platformLinks.youtubeMusic}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-md text-[10px] font-semibold transition-all"
                    >
                      YT Music
                    </a>

                    <a
                      href={platformLinks.appleMusic}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white rounded-md text-[10px] font-semibold transition-all"
                    >
                      Apple Music
                    </a>

                    <a
                      href={platformLinks.deezer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-md text-[10px] font-semibold transition-all"
                    >
                      Deezer
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modal para descargar la tarjeta de Instagram Story */}
      <AnimatePresence>
        {showSocialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSocialModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center"
            >
              <button
                onClick={() => setShowSocialModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>

              <SocialCard profile={profile} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}