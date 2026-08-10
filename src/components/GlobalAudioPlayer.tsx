import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Pause, Volume2, Music, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalAudioPlayer() {
  const { currentSong, isPlaying, volume, togglePlay, setVolume } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          // Ignorar auto-play bloqueado por el navegador
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  if (!currentSong) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl bg-black/80 border border-white/10 backdrop-blur-xl rounded-2xl p-3 flex items-center justify-between shadow-2xl z-50 select-none"
      >
        <audio
          ref={audioRef}
          src={currentSong.spotifyUrl} 
          onEnded={togglePlay}
        />

        {/* Info de la Canción */}
        <div className="flex items-center gap-3">
          {currentSong.coverUrl ? (
            <img 
              src={currentSong.coverUrl} 
              alt={currentSong.title} 
              className="w-11 h-11 rounded-xl object-cover border border-white/10" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Music size={18} />
            </div>
          )}
          <div className="max-w-[130px] md:max-w-[180px] truncate">
            <h4 className="text-xs font-bold text-white truncate">{currentSong.title}</h4>
            <p className="text-[10px] text-gray-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* Controles de Reproducción */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          
          <a
            href={currentSong.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
            title="Abrir en Spotify"
          >
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Control de Volumen */}
        <div className="hidden sm:flex items-center gap-2">
          <Volume2 size={15} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 accent-cyan-400 h-1 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}