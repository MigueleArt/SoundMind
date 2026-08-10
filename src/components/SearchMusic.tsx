import React, { useState } from 'react';
import { Search, Music, Play, Pause, Disc, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from '../store/usePlayerStore';

interface SearchMusicProps {
  onSearch: (query: string) => void;
  loading: boolean;
  onStandaloneLike?: (song: any) => void;
  likedSongIds?: string[];
}

export default function SearchMusic({ onSearch, loading, onStandaloneLike, likedSongIds }: SearchMusicProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&media=music&entity=song&limit=12`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Error al buscar en iTunes:", err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getMappedSong = (itunesTrack: any) => {
    return {
      id: itunesTrack.trackId.toString(),
      title: itunesTrack.trackName,
      artist: itunesTrack.artistName,
      album: itunesTrack.collectionName || 'Desconocido',
      coverUrl: itunesTrack.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
      genres: [itunesTrack.primaryGenreName?.toLowerCase() || 'pop'],
      spotifyUrl: '',
      previewUrl: itunesTrack.previewUrl,
      score: 100,
      whyRecommend: 'Resultado de tu búsqueda',
      attributes: {
        valence: 50, energy: 50, tempo: 120, acousticness: 50, instrumentalness: 0, danceability: 50
      }
    };
  };

  const handlePlayPreview = (itunesTrack: any) => {
    if (currentSong?.id === itunesTrack.trackId.toString()) {
      togglePlay();
      return;
    }
    playSong(getMappedSong(itunesTrack));
  };

  const handleGenerateAI = (itunesTrack: any) => {
    const aiQuery = `${itunesTrack.trackName} ${itunesTrack.artistName}`;
    onSearch(aiQuery);
  };

  return (
    <div className="flex flex-col items-center min-h-[60vh] max-w-5xl mx-auto space-y-8 px-4 select-none pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 w-full text-center max-w-2xl mt-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs text-purple-400 font-medium">
          <Search size={12} className="text-purple-400" />
          Buscador de Canciones
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white tracking-tight">
          Explora la Música
        </h2>
        <p className="text-sm md:text-base text-gray-400 leading-relaxed font-light">
          Busca cualquier canción, escúchala al instante y pídele a SoundMind que genere recomendaciones basadas en esa vibra exacta.
        </p>
      </motion.div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSearchSubmit}
        className="w-full relative max-w-2xl"
      >
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
          </div>
          <input
            type="text"
            disabled={loading}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-32 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all backdrop-blur-xl text-lg shadow-2xl"
            placeholder="Ej. San Lucas Kevin Kaarl..."
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              type="submit"
              disabled={loading || isSearching || !query.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-sm rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 transition-all"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </motion.form>
      
      {/* Resultados de búsqueda */}
      <AnimatePresence mode="wait">
        {hasSearched && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full pt-8"
          >
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((track) => {
                  const isThisPlaying = currentSong?.id === track.trackId.toString() && isPlaying;
                  const coverImage = track.artworkUrl100?.replace('100x100bb', '600x600bb') || '';
                  const isLiked = likedSongIds?.includes(track.trackId.toString());

                  return (
                    <div 
                      key={track.trackId}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="flex gap-4 items-center">
                        {/* Artwork */}
                        <div 
                          className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer flex-shrink-0"
                          onClick={() => handlePlayPreview(track)}
                        >
                          {coverImage ? (
                            <img src={coverImage} alt={track.trackName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                              <Disc size={24} className="text-zinc-600" />
                            </div>
                          )}
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isThisPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <div className="min-w-0 truncate">
                            <h3 className="text-sm font-bold text-white truncate" title={track.trackName}>
                              {track.trackName}
                            </h3>
                            <p className="text-xs text-zinc-400 truncate" title={track.artistName}>
                              {track.artistName}
                            </p>
                          </div>
                          {onStandaloneLike && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStandaloneLike(getMappedSong(track));
                              }}
                              className={`p-2 rounded-full transition-all flex-shrink-0 ${isLiked ? 'text-pink-500 hover:text-pink-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <Heart size={18} className={isLiked ? 'fill-pink-500' : ''} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Botón Magia */}
                      <button
                        type="button"
                        onClick={() => handleGenerateAI(track)}
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles size={14} />
                        Generar Música Relacionada
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-zinc-500 py-12">
                <Music size={48} className="mx-auto mb-4 opacity-20" />
                <p>No encontramos resultados para "{query}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
