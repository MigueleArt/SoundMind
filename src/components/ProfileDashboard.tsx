/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock, Tag, Disc, Sparkles, UserCheck, ShieldAlert, ChevronRight, Play } from 'lucide-react';
import { RecommendationHistoryItem } from '../types';
import MusicalEvolutionChart from './MusicalEvolutionChart';

interface ProfileDashboardProps {
  currentUser: { id: string; username: string } | null;
  history: RecommendationHistoryItem[];
  onSelectSession: (session: RecommendationHistoryItem) => void;
  onOpenAuth: () => void;
}

export default function ProfileDashboard({ 
  currentUser, 
  history, 
  onSelectSession, 
  onOpenAuth 
}: ProfileDashboardProps) {
  
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-6 backdrop-blur-xl">
        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400 border border-purple-500/20 w-fit">
          <Clock size={28} className="text-purple-400 mx-auto" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold text-white">Tu Evolución Musical te Espera</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Para registrar tu historial de tests, ver espectrogramas temporales, rastrear tus métricas de humor acumuladas y acceder a tu evolución musical, necesitas iniciar sesión.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all border border-white/10"
          >
            Iniciar Sesión / Registrarse
          </button>
        </div>
      </div>
    );
  }

  // --- Calc Aggregated User Statistics ---
  const totalSessions = history.length;

  // Dominant styles
  const allDominantGenres = history.flatMap(h => h.profile.dominantGenres);
  const genreCounts = allDominantGenres.reduce<Record<string, number>>((acc, g) => {
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const favoriteGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(entry => entry[0]);

  // Aggregate vibe styles
  const allVibes = history.flatMap(h => h.profile.vibes);
  const vibeCounts = allVibes.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  const favoriteVibes = Object.entries(vibeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  // Calculate overall averages
  const averages = history.reduce(
    (acc, item) => {
      acc.valence += item.profile.attributes.valence;
      acc.energy += item.profile.attributes.energy;
      acc.danceability += item.profile.attributes.danceability;
      acc.acousticness += item.profile.attributes.acousticness;
      acc.instrumentalness += item.profile.attributes.instrumentalness;
      return acc;
    },
    { valence: 0, energy: 0, danceability: 0, acousticness: 0, instrumentalness: 0 }
  );

  if (totalSessions > 0) {
    averages.valence = Math.floor(averages.valence / totalSessions);
    averages.energy = Math.floor(averages.energy / totalSessions);
    averages.danceability = Math.floor(averages.danceability / totalSessions);
    averages.acousticness = Math.floor(averages.acousticness / totalSessions);
    averages.instrumentalness = Math.floor(averages.instrumentalness / totalSessions);
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Overview stats header banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* User Account Card */}
        <div className="md:col-span-4 bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex gap-2.5 items-center">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm font-mono">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display font-medium text-white text-sm" title={currentUser.username}>
                  @{currentUser.username}
                </h3>
                <span className="text-[10px] font-mono text-gray-500">Oyente Registrado</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10 text-center">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xl font-bold text-white block">{totalSessions}</span>
                <span className="text-[9px] text-gray-500 font-mono block uppercase">Tests</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xl font-bold text-white block">
                  {favoriteGenres.length > 0 ? favoriteGenres.length : '-'}
                </span>
                <span className="text-[9px] text-gray-500 font-mono block uppercase">Géneros</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 text-[10px] text-gray-500 flex gap-1.5 items-center">
            <UserCheck size={12} className="text-cyan-400 shrink-0" />
            <span>Respaldado por el algoritmo SoundMind.</span>
          </div>
        </div>

        {/* Aggregated Affinity details */}
        <div className="md:col-span-8 bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 backdrop-blur-xl">
          <h3 className="text-xs font-display font-semibold text-gray-300 uppercase tracking-wider">
            Resumen General de Preferencias
          </h3>

          {totalSessions === 0 ? (
            <p className="text-xs text-gray-400 leading-relaxed pt-2">
              Aún no has completado tu primer diagnóstico musical. El motor calibrará tus promedios apenas completes un test interactivo en la pestaña de Cuestionario.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 tracking-wider font-mono block">GÉNEROS FAVORITOS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteGenres.map((g, i) => (
                      <span key={i} className="text-[10px] font-medium font-mono px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                   <span className="text-[10px] text-gray-500 tracking-wider font-mono block">VIBRAS RECURRENTES</span>
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteVibes.map((v, i) => (
                       <span key={i} className="text-[10px] font-medium font-mono px-2.5 py-1 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Average Properties lines */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 tracking-wider font-mono block mb-2">Métricas de Audio Promedio</span>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[10px] text-gray-400">
                    <span>Emoción</span>
                    <span>{averages.valence}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${averages.valence}%` }} />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[10px] text-gray-400">
                    <span>Energía</span>
                    <span>{averages.energy}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${averages.energy}%` }} />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[10px] text-gray-400">
                    <span>Sincopa bailable</span>
                    <span>{averages.danceability}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${averages.danceability}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Line plot temporal evolution graph */}
      {totalSessions > 0 && (
        <div className="w-full">
          <MusicalEvolutionChart history={history} />
        </div>
      )}

      {/* History item checklist */}
      <div className="space-y-4">
        <h3 className="text-xs font-display font-semibold text-gray-300 uppercase tracking-wider">
          Diagnósticos y Historial de Diagnósticos
        </h3>

        {totalSessions === 0 ? (
          <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-500 text-xs">
            Sin sesiones registradas aún. ¡Inicia un cuestionario para catalogar tu primera sesión!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[...history].reverse().map((h, i) => {
              const d = new Date(h.createdAt);
              const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} a las ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
              
              return (
                <div 
                  key={h.id}
                  className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-purple-400">
                      Sesión ID: {h.id.substring(8)}
                    </span>
                    <p className="text-[11px] text-gray-400 block font-medium">
                      {dateStr}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-500">Firma:</span>
                      <span className="text-[9px] font-mono text-gray-300 capitalize px-1.5 py-0.5 bg-white/10 rounded border border-white/10">
                        {h.answers.mood} — {h.answers.activity}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectSession(h)}
                    className="flex items-center gap-1 p-2 border border-white/10 rounded-lg group-hover:border-purple-500/50 group-hover:text-purple-400 hover:bg-purple-500/5 transition-all text-xs font-semibold cursor-pointer"
                  >
                    <span>Cargar</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
