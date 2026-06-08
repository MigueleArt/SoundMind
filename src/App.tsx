/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Headphones, Compass, User, History, Sparkles, LogOut, LogIn, Menu, 
  Activity, ArrowRight, Music2, Share2, Shield, Disc, CheckCircle, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionnaireAnswers, RecommendationHistoryItem } from './types';

// Importing custom sub-components
import AuthModal from './components/AuthModal';
import DynamicQuestionnaire from './components/DynamicQuestionnaire';
import MusicResults from './components/MusicResults';
import ProfileDashboard from './components/ProfileDashboard';

const LOADING_STEPS = [
  'Iniciando alineación del algoritmo híbrido...',
  'Filtrando base de datos y mapeando exclusiones...',
  'Vectorizando preferencias de tempo y ritmos...',
  'Procesando textura de audio (peso en bajos/acústica)...',
  'Interrogando al psicólogo musical Gemini...',
  'Generando firma de perfil e interpretando espectrogamas...',
  'Personalizando tus 8 recomendaciones perfectas...'
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [history, setHistory] = useState<RecommendationHistoryItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<RecommendationHistoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'questionnaire' | 'results' | 'profile'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [likedState, setLikedState] = useState<Record<string, boolean>>({});

  // 1. Synchronize Auth Session on Mount
  useEffect(() => {
    const savedToken = localStorage.getItem('soundmind_token');
    const savedUser = localStorage.getItem('soundmind_user');
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setAuthToken(savedToken);
      setCurrentUser(parsedUser);
      fetchHistory(savedToken);
    }
  }, []);

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

  // Fetch past sessions history for authenticated users
  async function fetchHistory(token: string) {
    try {
      const res = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching musical history:', err);
    }
  }

  // Handle successful login or registration
  function handleAuthSuccess(token: string, user: { id: string; username: string }) {
    localStorage.setItem('soundmind_token', token);
    localStorage.setItem('soundmind_user', JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
    fetchHistory(token);
  }

  // Handle logout
  function handleLogout() {
    localStorage.removeItem('soundmind_token');
    localStorage.removeItem('soundmind_user');
    setAuthToken(null);
    setCurrentUser(null);
    setHistory([]);
    setSelectedSession(null);
    setCurrentPage('home');
  }

  // Send questionnaire answers to backend to query Gemini
  async function handleGenerateRecommendations(answers: QuestionnaireAnswers) {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Algo salió mal al obtener recomendaciones.');
      }

      // Add to session lists
      setSelectedSession(data);
      setLikedState({});
      if (currentUser) {
        setHistory(prev => [...prev, data]);
      }
      
      setCurrentPage('results');
    } catch (error) {
      console.error(error);
      alert('Hubo un problema al contactar el motor de recomendación. Por favor, intenta de nuevo.');
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      await fetch('/api/recommendations/like', {
        method: 'POST',
        headers,
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

  function handleSelectHistoricalSession(session: RecommendationHistoryItem) {
    setSelectedSession(session);
    setLikedState(session.likes || {});
    setCurrentPage('results');
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
            onClick={() => setCurrentPage('home')}
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
          <nav className="flex items-center gap-1 md:gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg tracking-wider cursor-pointer transition-colors ${
                currentPage === 'home' ? 'text-white border-b-2 border-cyan-500 rounded-none pb-0.5' : 'text-gray-400 hover:text-white'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => {
                setSelectedSession(null);
                setCurrentPage('questionnaire');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg tracking-wider cursor-pointer transition-colors ${
                currentPage === 'questionnaire' ? 'text-white border-b-2 border-cyan-500 rounded-none pb-0.5' : 'text-gray-400 hover:text-white'
              }`}
            >
              Test
            </button>
            {currentUser && (
              <button
                onClick={() => setCurrentPage('profile')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg tracking-wider cursor-pointer transition-colors ${
                  currentPage === 'profile' ? 'text-white border-b-2 border-cyan-500 rounded-none pb-0.5' : 'text-gray-400 hover:text-white'
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 h-full">
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
            {currentPage === 'home' && (
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
                        onClick={() => {
                          setSelectedSession(null);
                          setCurrentPage('questionnaire');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95 transition-all animate-shimmer"
                      >
                        <span>Comenzar Diagnóstico</span>
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (currentUser) {
                            setCurrentPage('profile');
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
                        src="/src/assets/images/soundmind_hero_1780890480673.png" 
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
                      La red Gemini 3.5 traduce tu estado de ánimo sutil y la hora del día en una reseña psicológica auditiva, decodificando el timbre emocional que necesitas leer.
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
            {currentPage === 'questionnaire' && (
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

            {/* SCREEN 3: RESULTS */}
            {currentPage === 'results' && selectedSession && (
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
                  onReset={() => {
                    setSelectedSession(null);
                    setCurrentPage('questionnaire');
                  }}
                />
              </motion.div>
            )}

            {/* SCREEN 4: PROFILE DASHBOARD */}
            {currentPage === 'profile' && (
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

      {/* Global Auth Modal portal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
