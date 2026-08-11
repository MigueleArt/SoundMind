/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Headphones, Compass, User, History, Sparkles, LogOut, LogIn, Menu, 
  Activity, ArrowRight, Music2, Share2, Shield, Disc, CheckCircle, Flame, Search, Heart, Play, Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { QuestionnaireAnswers, RecommendationHistoryItem, User as UserType, AuthTokens } from './types';
import { apiFetch, authStorage } from './services/api';

import { QuestionnaireAnswers, RecommendationHistoryItem } from './types';
import { getCodeFromUrl } from './services/spotify';


// Importing custom sub-components
import AuthModal from './components/AuthModal';
import DynamicQuestionnaire from './components/DynamicQuestionnaire';
import SearchMusic from './components/SearchMusic';
import MusicResults from './components/MusicResults';
import ProfileDashboard from './components/ProfileDashboard';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import { usePlayerStore } from './store/usePlayerStore';
import { SongRecommendation } from './types';
import { useRouter } from './hooks/useRouter';
import heroImage from './assets/images/soundmind_hero_1780890480673.png';

const LOADING_STEPS = [
  'Iniciando alineación del algoritmo híbrido...',
  'Filtrando base de datos y mapeando exclusiones...',
  'Vectorizando preferencias de tempo y ritmos...',
  'Sincronizando frecuencias de estado de ánimo...',
  'Analizando tu perfil con nuestro motor de IA...',
  'Construyendo tu ecosistema acústico...',
  'Personalizando tus 8 recomendaciones perfectas...'
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [history, setHistory] = useState<RecommendationHistoryItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<RecommendationHistoryItem | null>(null);
  const { currentPath, navigate } = useRouter('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [likedState, setLikedState] = useState<Record<string, boolean>>({});

  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();

  const likedSongs = useMemo(() => {
    const songsMap = new Map<string, SongRecommendation>();
    history.forEach(session => {
      Object.keys(session.likes || {}).forEach(songId => {
        if (session.likes[songId]) {
          const song = session.recommendations.find(r => r.id === songId);
          if (song) {
            songsMap.set(songId, song);
          }
        }
      });
    });
    return Array.from(songsMap.values()).reverse(); // most recent first
  }, [history]);

  // 1. Synchronize Auth Session on Mount
  useEffect(() => {

    const savedToken = authStorage.getToken();
    const savedUser = authStorage.getUser();

    const savedToken = localStorage.getItem('soundmind_token');
    const savedUser = localStorage.getItem('soundmind_user');
    const savedSpotifyToken = localStorage.getItem('soundmind_spotify_token');
    const savedSession = localStorage.getItem('soundmind_selected_session');

    const code = getCodeFromUrl();
    if (code) {
      (async () => {
        const codeVerifier = localStorage.getItem('soundmind_spotify_code_verifier');
        try {
          const res = await fetch('/api/spotify/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, codeVerifier })
          });
          const data = await res.json();
          if (res.ok && data.access_token) {
            setSpotifyToken(data.access_token);
            localStorage.setItem('soundmind_spotify_token', data.access_token);
            if (data.refresh_token) localStorage.setItem('soundmind_spotify_refresh_token', data.refresh_token);
          } else {
            console.error('Spotify token exchange failed', data);
          }
        } catch (err) {
          console.error('Error exchanging spotify code', err);
        } finally {
          try { localStorage.removeItem('soundmind_spotify_code_verifier'); } catch(e){}
        }
      })();
    } else if (savedSpotifyToken) {
      setSpotifyToken(savedSpotifyToken);
    }


    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      setCurrentUser(savedUser);
      fetchHistory();
    }

    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession) as RecommendationHistoryItem;
        setSelectedSession(parsedSession);
        navigate('results');
      } catch (err) {
        localStorage.removeItem('soundmind_selected_session');
      }
    }
  }, []);

  useEffect(() => {
    if (selectedSession) {
      localStorage.setItem('soundmind_selected_session', JSON.stringify(selectedSession));
    } else {
      localStorage.removeItem('soundmind_selected_session');
    }
  }, [selectedSession]);

  // 2. Poll loading steps during recommendation generation to improve user experience
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx(p => (p + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch past sessions history (SOLO para usuarios autenticados, se omite si es invitado)
  async function fetchHistory() {
    const token = authStorage.getToken();
    if (!token) return; // No consultar historial si el usuario es invitado

    try {
      const data = await apiFetch('/api/history');
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching musical history:', err);
    }
  }

  // Handle successful login or registration
  function handleAuthSuccess(tokens: AuthTokens, user: UserType) {
    authStorage.saveSession(tokens, user);
    setAuthToken(tokens.token);
    setCurrentUser(user);
    fetchHistory();
  }

  // Handle logout

  async function handleLogout() {
    try {
      if (authToken) {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (err) {
      console.error('Error notificando logout al backend:', err);
    } finally {
      authStorage.clearSession();
      setAuthToken(null);
      setCurrentUser(null);
      setHistory([]);
      setSelectedSession(null);
      setCurrentPage('home');
    }

  function handleLogout() {
    localStorage.removeItem('soundmind_token');
    localStorage.removeItem('soundmind_user');
    localStorage.removeItem('soundmind_spotify_token');
    localStorage.removeItem('soundmind_selected_session');
    setAuthToken(null);
    setSpotifyToken(null);
    setCurrentUser(null);
    setHistory([]);
    setSelectedSession(null);
    navigate('home');

  }

  // Send questionnaire answers to backend to query Gemini
  async function handleGenerateRecommendations(answers: QuestionnaireAnswers) {
    setLoading(true);
    try {
      const data = await apiFetch<RecommendationHistoryItem>('/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({ answers })
      });


      // Add to session lists
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Algo salió mal al obtener recomendaciones.');
      }

      // Guardamos la sesión generada y cambiamos la pantalla de forma segura

      setSelectedSession(data);
      setLikedState({});
      if (currentUser) {
        setHistory(prev => [...prev, data]);
      }
      
      // Forzamos el cambio a la vista de resultados antes de apagar el loading
      navigate('results');
    } catch (error: any) {
      console.error('Error al generar recomendaciones:', error);
      alert(error?.message || 'Hubo un problema al generar las recomendaciones. Por favor, intenta de nuevo.');
      // Evitamos que vuelva a 'home', se queda en 'questionnaire'
      navigate('questionnaire');
    } finally {
      setLoading(false);
    }
  }

  // Handle direct song search
  async function handleSearchQuery(query: string) {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/recommendations/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Algo salió mal al buscar recomendaciones.');
      }

      setSelectedSession(data);
      setLikedState({});
      if (currentUser) {
        setHistory(prev => [...prev, data]);
      }
      
      navigate('results');
    } catch (error: any) {
      console.error('Error al generar recomendaciones por búsqueda:', error);
      alert(error?.message || 'Hubo un problema al buscar. Por favor, intenta de nuevo.');
      navigate('search');
    } finally {
      setLoading(false);
    }
  }

  // Trigger feedback interactions (likes/dislikes)
  async function handleLikeChange(songId: string, isLiked: boolean) {
    if (!selectedSession) return;
    
    // Toggle state instantly (Optimistic UI)
    const newLikedState = { ...likedState, [songId]: isLiked };
    setLikedState(newLikedState);

    try {
      await apiFetch('/api/recommendations/like', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: selectedSession.id,
          songId,
          isLiked
        })
      });

      // Update in local history cache as well
      setHistory(prev => prev.map(h => {
        if (h.id === selectedSession.id) {
          return {
            ...h,
            likes: {
              ...(h.likes || {}),
              [songId]: isLiked
            }
          };
        }
        return h;
      }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }

  async function handleStandaloneLike(song: SongRecommendation) {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/recommendations/standalone-like', {
        method: 'POST',
        headers,
        body: JSON.stringify({ song })
      });

      if (res.ok) {
        // Update history cache to instantly show liked state
        const data = await res.json();
        setHistory(prev => {
          const index = prev.findIndex(h => h.id === data.session.id);
          if (index === -1) return [...prev, data.session];
          const newHistory = [...prev];
          newHistory[index] = data.session;
          return newHistory;
        });
      }
    } catch (err) {
      console.error('Error submitting standalone like:', err);
    }
  }

  function handleSelectHistoricalSession(session: RecommendationHistoryItem) {
    setSelectedSession(session);
    setLikedState(session.likes || {});
    navigate('results');
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col relative select-none">
      {/* Dynamic ambient backdrop glowing spots of Frosted Glass theme */}
      <div className="fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-900/15 blur-[120px] animate-glow-slow -z-20 pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-900/15 blur-[150px] animate-glow-slower -z-20 pointer-events-none" />

      {/* Primary Navigation Bar - Pure Glass */}
      <header className="sticky top-0 z-40 bg-black/20 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-purple-500/20 transition-all">
              <div className="w-full h-full bg-[#050505] rounded-[7px] flex items-center justify-center">
                <Headphones size={15} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-sans">
              SoundMind
            </span>
          </button>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 md:gap-3">
            <button
              type="button"
              onClick={() => navigate('home')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg tracking-wider cursor-pointer transition-colors ${
                currentPath === 'home' ? 'text-white border-b-2 border-cyan-500 rounded-none pb-0.5' : 'text-gray-400 hover:text-white'
              }`}
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSession(null);
                navigate('questionnaire');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg tracking-wider cursor-pointer transition-colors ${
                currentPath === 'questionnaire' ? 'text-white border-b-2 border-cyan-500 rounded-none pb-0.5' : 'text-gray-400 hover:text-white'
              }`}
            >
              Test
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSession(null);
                navigate('search');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg tracking-wider cursor-pointer transition-colors flex items-center gap-1 ${
                currentPath === 'search' ? 'text-white border-b-2 border-cyan-500 rounded-none pb-0.5' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Search size={12} /> Buscar
            </button>
            {currentUser && (
              <button
                type="button"
                onClick={() => navigate('profile')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg tracking-wider cursor-pointer transition-colors ${
                  currentPath === 'profile' ? 'text-white border-b-2 border-cyan-500 rounded-none pb-0.5' : 'text-gray-400 hover:text-white'
                }`}
              >
                Perfil
              </button>
            )}

            <div className="h-4 w-[1px] bg-white/10 mx-2" />

            {/* User credentials action button */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-medium text-gray-400 hidden md:block px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
                  @{currentUser.username}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut size={13} />
                  <span className="hidden md:inline">Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl text-white text-xs font-semibold cursor-pointer shadow-lg active:scale-95 transition-all shadow-cyan-500/10"
              >
                <LogIn size={13} />
                <span>Ingresar</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container screen content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 pb-24 md:pb-8 h-full">
        {/* Loading Screen Overlay */}
        {loading ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-8 select-none">
            {/* Pulsating Visual Indicator */}
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-purple-500/20 bg-purple-500/5 flex items-center justify-center text-purple-400 relative">
                <Headphones size={36} className="animate-bounce" />
                {/* Outward rings */}
                <div className="absolute inset-0 rounded-full border border-purple-500/40 animate-ping" />
              </div>
            </div>

            <div className="text-center space-y-3 max-w-sm">
              <h2 className="text-xl font-display font-bold text-white tracking-wide animate-pulse">
                Procesando Espectro Musical
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                {LOADING_STEPS[loadingStepIdx]}
              </p>
              {/* Progress dots */}
              <div className="flex gap-2 justify-center pt-2">
                {[0, 1, 2, 3, 4].map(idx => (
                  <span 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx === loadingStepIdx % 5 ? 'bg-purple-400 scale-125' : 'bg-zinc-800'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* SCREEN 1: LANDING/HOME */}
            {currentPath === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-16 py-6"
              >
                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-cyan-400 font-medium">
                      <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                      Musicología de Datos impulsada por IA
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.1]">
                      Sintoniza tu Mente con la Música Perfecta
                    </h1>
                    <p className="text-sm md:text-base text-gray-400 leading-relaxed font-light">
                      SoundMind utiliza modelos avanzados de inteligencia artificial para mapear tu estado de ánimo, tus frecuencias de volumen, texturas de sonido e intereses instrumentales en una firma musical. Descubre recomendaciones musicales reales con descripciones psicológicas profundas.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSession(null);
                          navigate('questionnaire');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95 transition-all animate-shimmer"
                      >
                        <span>Comenzar Diagnóstico</span>
                        <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser) {
                            navigate('profile');
                          } else {
                            setIsAuthOpen(true);
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                      >
                        <span>{currentUser ? 'Revisar Mi Perfil' : 'Crear mi Cuenta'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Equalizer Visual Art Container - Pure Glass */}
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="relative w-80 h-80 rounded-3xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-xl flex items-center justify-center shadow-2xl p-6">
                      {/* Generated Hero Art Image in Background */}
                      <img 
                        src={heroImage} 
                        alt="SoundMind Spectrograph Background" 
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-lighten pointer-events-none"
                      />

                      <div className="absolute top-2 left-6 text-[8px] font-mono text-gray-400 uppercase tracking-widest z-10">
                        SoundMind Spectrograph v1.2
                      </div>
                      <div className="absolute bottom-2 right-6 text-[8px] font-mono text-gray-400 uppercase tracking-widest z-10">
                        ● Live equalizer
                      </div>

                      {/* Equalizer Sound bars drawn in pure custom CSS delay animations */}
                      <div className="flex items-end gap-1.5 h-32 relative z-10">
                        {[
                          { delay: '0.1s', h: 'h-12' }, { delay: '0.3s', h: 'h-24' },
                          { delay: '0.6s', h: 'h-32' }, { delay: '0.2s', h: 'h-16' },
                          { delay: '0.5s', h: 'h-28' }, { delay: '0.8s', h: 'h-36' },
                          { delay: '0.4s', h: 'h-20' }, { delay: '0.7s', h: 'h-30' },
                          { delay: '0.3s', h: 'h-14' }, { delay: '0.9s', h: 'h-40' },
                          { delay: '0.5s', h: 'h-22' }, { delay: '0.2s', h: 'h-12' }
                        ].map((bar, i) => (
                          <div 
                            key={i} 
                            style={{ animationDelay: bar.delay }}
                            className={`w-2.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full animate-pulse`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tus Favoritos Feed - Only if user is logged in and has liked songs */}
                {currentUser && likedSongs.length > 0 && (
                  <div className="pt-10 border-t border-white/10">
                    <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                      <Heart className="text-pink-500 fill-pink-500" /> Tus Favoritos Recientes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {likedSongs.slice(0, 8).map((song) => {
                        const isThisPlaying = currentSong?.id === song.id && isPlaying;
                        return (
                          <div 
                            key={song.id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center backdrop-blur-xl hover:bg-white/10 transition-all group"
                          >
                            <div 
                              className="relative w-14 h-14 rounded-xl overflow-hidden cursor-pointer flex-shrink-0"
                              onClick={() => {
                                if (currentSong?.id === song.id) togglePlay();
                                else playSong(song);
                              }}
                            >
                              <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {isThisPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-0.5" />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white truncate" title={song.title}>{song.title}</h4>
                              <p className="text-xs text-zinc-400 truncate" title={song.artist}>{song.artist}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Technical Information features block - Frosted Glass panel design */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/10">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Activity size={18} />
                    </div>
                    <h3 className="font-display font-medium text-white text-sm">Filtrado Basado en Contenido</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-light">
                      Mapeamos tus elecciones instrumentales, peso de graves e intensidad técnica directamente en descriptores acústicos de Spotify (acousticness, danceability, energy).
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <h3 className="font-display font-medium text-white text-sm">Psicología Musical con IA</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-light">
                      La inteligencia artificial de SoundMind traduce tu estado de ánimo sutil y la hora del día en una reseña psicológica auditiva, decodificando el timbre emocional que necesitas escuchar.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                      <Shield size={18} />
                    </div>
                    <h3 className="font-display font-medium text-white text-sm">Feedback que Calibra</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-light">
                      Vuelve a calibrar el motor con un simple me gusta o no me gusta. Tus preferencias acumuladas se guardan de forma segura para rastrear tu evolución musical.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: QUESTIONNAIRE */}
            {currentPath === 'questionnaire' && (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4"
              >
                <DynamicQuestionnaire 
                  onGenerate={handleGenerateRecommendations}
                  loading={loading}
                />
              </motion.div>
            )}

            {/* SCREEN 2.5: SEARCH */}
            {currentPath === 'search' && (
              <motion.div 
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4"
              >
                <SearchMusic 
                  onSearch={handleSearchQuery}
                  loading={loading}
                  onStandaloneLike={handleStandaloneLike}
                  likedSongs={likedSongs}
                />
              </motion.div>
            )}

            {/* SCREEN 3: RESULTS */}
            {currentPath === 'results' && selectedSession && (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MusicResults 
                  session={selectedSession}
                  onLikeChange={handleLikeChange}
                  likedState={likedState}
                  spotifyToken={spotifyToken}
                  onReset={() => {
                    setSelectedSession(null);
                    navigate('questionnaire');
                  }}
                />
              </motion.div>
            )}

            {/* SCREEN 4: PROFILE DASHBOARD */}
            {currentPath === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ProfileDashboard 
                  currentUser={currentUser}
                  history={history}
                  onSelectSession={handleSelectHistoricalSession}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer legal notes */}
      <footer className="bg-zinc-950/25 border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        <p>© 2026 SoundMind. Diseñado con cariño por investigadores de datos y psicólogos del sonido.</p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 z-40 px-6 py-3 flex justify-between items-center pb-4">
        <button onClick={() => navigate('home')} className={`flex flex-col items-center gap-1 ${currentPath === 'home' ? 'text-cyan-400' : 'text-zinc-500'}`}>
          <Headphones size={20} />
          <span className="text-[10px] font-semibold">Inicio</span>
        </button>
        <button onClick={() => { setSelectedSession(null); navigate('search'); }} className={`flex flex-col items-center gap-1 ${currentPath === 'search' ? 'text-cyan-400' : 'text-zinc-500'}`}>
          <Search size={20} />
          <span className="text-[10px] font-semibold">Buscar</span>
        </button>
        <button onClick={() => { setSelectedSession(null); navigate('questionnaire'); }} className={`flex flex-col items-center gap-1 ${currentPath === 'questionnaire' ? 'text-cyan-400' : 'text-zinc-500'}`}>
          <Sparkles size={20} />
          <span className="text-[10px] font-semibold">Test</span>
        </button>
        <button onClick={() => { if(currentUser) navigate('profile'); else setIsAuthOpen(true); }} className={`flex flex-col items-center gap-1 ${currentPath === 'profile' ? 'text-cyan-400' : 'text-zinc-500'}`}>
          <User size={20} />
          <span className="text-[10px] font-semibold">Perfil</span>
        </button>
      </nav>

      {/* Persistent Global Audio Player */}
      <GlobalAudioPlayer />

      {/* Global Auth Modal portal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}