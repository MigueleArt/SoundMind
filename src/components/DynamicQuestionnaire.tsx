/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, Frown, Zap, Coffee, History, Play, Compass, ArrowRight, ArrowLeft, 
  Disc, Mic, Music2, Globe, Heart, FileInput, Sliders, Volume2, ShieldAlert
} from 'lucide-react';
import { QuestionnaireAnswers, MoodType } from '../types';

interface DynamicQuestionnaireProps {
  onGenerate: (answers: QuestionnaireAnswers) => void;
  loading: boolean;
}

const MOODS: { type: MoodType; emoji: string; name: string; description: string; color: string; bg: string }[] = [
  { type: 'alegre', emoji: '☀️', name: 'Alegre / Vibrante', description: 'Feliz, eufórico o risueño', color: 'from-amber-400 to-orange-500', bg: 'shadow-amber-500/20 hover:border-amber-500/50' },
  { type: 'melancolico', emoji: '💧', name: 'Melancólico', description: 'Pensativo, reflexivo, suave o taciturno', color: 'from-blue-400 to-indigo-600', bg: 'shadow-blue-500/20 hover:border-blue-500/50' },
  { type: 'energetico', emoji: '⚡', name: 'Energético / Motivado', description: 'Listo para moverte, entrenar o acelerar', color: 'from-rose-500 to-red-600', bg: 'shadow-rose-500/20 hover:border-rose-500/50' },
  { type: 'relajado', emoji: '🍃', name: 'Relajado / Calmo', description: 'Zen, tranquilo, ideal para concentrarse o descompresionar', color: 'from-emerald-400 to-teal-600', bg: 'shadow-emerald-500/20 hover:border-emerald-500/50' },
  { type: 'nostalgico', emoji: '⌛', name: 'Nostálgico', description: 'Recuerdos del pasado, introspección cálida', color: 'from-purple-400 to-fuchsia-600', bg: 'shadow-purple-500/20 hover:border-purple-500/50' }
];

const ACTIVITIES = [
  { id: 'estudio', label: 'Estudiar / Leer', icon: '📚' },
  { id: 'ejercicio', label: 'Ejercicio / Deporte', icon: '🏃' },
  { id: 'descanso', label: 'Descansar / Dormir', icon: '💤' },
  { id: 'trabajo', label: 'Trabajar / Brainstorming', icon: '💻' },
  { id: 'socializar', label: 'Socializar / Reunión', icon: '🍷' },
  { id: 'conducir', label: 'Viajar / Conducir', icon: '🚗' },
  { id: 'ocio', label: 'Ocio / Relajación libre', icon: '🎨' }
];

const TIMES_OF_DAY = [
  { id: 'manana', label: 'Mañana fresca (6 AM - 12 PM)', icon: '🌄' },
  { id: 'tarde', label: 'Tarde radiante (12 PM - 6 PM)', icon: '☀️' },
  { id: 'noche', label: 'Noche misteriosa (6 PM - 12 AM)', icon: '🌙' },
  { id: 'madrugada', label: 'Madrugada introspectiva (12 AM - 6 AM)', icon: '🌌' }
];

const GENRES = [
  { id: 'rock', label: 'Rock', icon: '🎸' },
  { id: 'pop', label: 'Pop', icon: '🎤' },
  { id: 'jazz', label: 'Jazz / Soul', icon: '🎷' },
  { id: 'classical', label: 'Música Clásica', icon: '🎻' },
  { id: 'electronic', label: 'Electrónica / Synth', icon: '🌌' },
  { id: 'indie', label: 'Indie / Folk', icon: '🌾' },
  { id: 'hip-hop', label: 'Hip Hop / R&B', icon: '🎧' },
  { id: 'metal', label: 'Heavy Metal', icon: '⚡' },
  { id: 'latin', label: 'Música Latina / Salsa', icon: '🎺' },
  { id: 'reggaeton', label: 'Reggaeton / Urbano', icon: '🔥' },
  { id: 'ambient', label: 'Ambient / Lo-Fi', icon: '☕' },
  { id: 'k-pop', label: 'K-Pop', icon: '🌸' }
];

const LANGUAGES = [
  { id: 'espanol', label: 'Español' },
  { id: 'ingles', label: 'Inglés' },
  { id: 'frances', label: 'Francés' },
  { id: 'japones', label: 'Japonés / Coreano' },
  { id: 'otros', label: 'Otros idiomas' },
  { id: 'sin-letra', label: 'Sin letra (Instrumental)' }
];

const INSTRUMENTS = [
  { id: 'guitarra', label: 'Guitarra Acústica/Eléctrica' },
  { id: 'piano', label: 'Piano / Teclado' },
  { id: 'sintetizadores', label: 'Sintetizadores / Pads' },
  { id: 'bateria', label: 'Batería rítmica / Percusión' },
  { id: 'cuerdas', label: 'Violines / Cuerdas clásicas' },
  { id: 'viento', label: 'Saxos / Instrumentos de viento' },
  { id: 'bajo', label: 'Bajos vibrantes' }
];

export default function DynamicQuestionnaire({ onGenerate, loading }: DynamicQuestionnaireProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Initialize Questionnaire state variables
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    mood: 'alegre',
    activity: 'ocio',
    timeOfDay: 'tarde',
    genres: [],
    vocalPreference: 'ambas',
    languages: ['espanol', 'ingles'],
    rhythmSpeed: 3,
    vocalsType: 'sin-preferencia',
    instruments: ['guitarra', 'piano'],
    bassWeight: 'medio',
    stylePreference: 'ambas',
    recentFavorites: ['', '', ''],
    exclusions: ''
  });

  // State handles to keep track of checkboxes
  const handleToggleGenre = (genreId: string) => {
    setAnswers(prev => {
      const isSelected = prev.genres.includes(genreId);
      const newGenres = isSelected 
        ? prev.genres.filter(g => g !== genreId) 
        : [...prev.genres, genreId];
      return { ...prev, genres: newGenres };
    });
  };

  const handleToggleLanguage = (langId: string) => {
    setAnswers(prev => {
      const isSelected = prev.languages.includes(langId);
      const newLangs = isSelected 
        ? prev.languages.filter(l => l !== langId) 
        : [...prev.languages, langId];
      return { ...prev, languages: newLangs };
    });
  };

  const handleToggleInstrument = (instId: string) => {
    setAnswers(prev => {
      const isSelected = prev.instruments.includes(instId);
      const newInst = isSelected 
        ? prev.instruments.filter(i => i !== instId) 
        : [...prev.instruments, instId];
      return { ...prev, instruments: newInst };
    });
  };

  const handleReferenceChange = (index: number, val: string) => {
    setAnswers(prev => {
      const refs = [...prev.recentFavorites];
      refs[index] = val;
      return { ...prev, recentFavorites: refs };
    });
  };

  const isStepValid = () => {
    if (step === 1) return answers.mood !== undefined && answers.activity !== '';
    if (step === 2) return answers.genres.length > 0;
    if (step === 3) return answers.languages.length > 0;
    return true;
  };

  const nextStep = () => {
    if (isStepValid() && step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStepValid()) {
      onGenerate(answers);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative backdrop-blur-xl">
      {/* Dynamic top progress indicator */}
      <div className="h-1.5 bg-white/5 w-full relative">
        <motion.div 
          className="absolute h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="p-6 md:p-10">
        {/* Header Indicator */}
        <div className="flex justify-between items-center mb-8">
          <span className="text-xs font-mono tracking-widest text-gray-500 uppercase">
            Módulo {step} de {totalSteps}
          </span>
          <span className="text-[10px] font-semibold text-gray-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            {step === 1 && 'Mentalidad y Entorno'}
            {step === 2 && 'Vanguardia de Géneros'}
            {step === 3 && 'Lírica y Cadencia'}
            {step === 4 && 'Frecuencias y Acordes'}
            {step === 5 && 'Historial Estilo'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.3 }}
              className="min-h-[350px]"
            >
              {/* STEP 1: MOOD & CONTEXT */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-medium text-white mb-2">
                       ¿Cuál es tu sintonía emocional ahora mismo?
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Mapeamos tu estado de ánimo en ondas de sonido coherentes.
                    </p>
                  </div>

                  {/* Mood Selector List */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {MOODS.map(m => {
                      const isSelected = answers.mood === m.type;
                      return (
                        <button
                          key={m.type}
                          type="button"
                          onClick={() => setAnswers(prev => ({ ...prev, mood: m.type }))}
                          className={`group relative text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected 
                              ? `bg-white/10 border-cyan-500 shadow-lg shadow-cyan-500/10`
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{m.emoji}</div>
                          <div className="text-xs font-bold text-white mb-1">{m.name}</div>
                          <div className="text-[10px] leading-tight text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">
                            {m.description}
                          </div>
                          {isSelected && (
                            <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Activity Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-display font-semibold text-gray-400 block uppercase tracking-wider">
                        ¿Qué actividad te acompaña?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ACTIVITIES.map(act => {
                          const isSelected = answers.activity === act.id;
                          return (
                            <button
                              key={act.id}
                              type="button"
                              onClick={() => setAnswers(prev => ({ ...prev, activity: act.id }))}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-purple-500/10 border-purple-500/50 text-purple-200'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              <span>{act.icon}</span>
                              <span className="truncate">{act.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time of Day */}
                    <div className="space-y-2">
                      <label className="text-xs font-display font-semibold text-gray-400 block uppercase tracking-wider">
                        ¿Momento de escucha?
                      </label>
                      <div className="space-y-2">
                        {TIMES_OF_DAY.map(time => {
                          const isSelected = answers.timeOfDay === time.id;
                          return (
                            <button
                              key={time.id}
                              type="button"
                              onClick={() => setAnswers(prev => ({ ...prev, timeOfDay: time.id }))}
                              className={`flex items-center justify-between w-full p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{time.icon}</span>
                                <span>{time.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: MUSIC GENRES */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-medium text-white mb-2">
                      Selecciona tus puertos de géneros favoritos
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Escoge al menos 1 o más de los géneros que habitualmente disfrutas explorar.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {GENRES.map(genre => {
                      const isSelected = answers.genres.includes(genre.id);
                      return (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => handleToggleGenre(genre.id)}
                          className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white/10 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                            {genre.icon}
                          </span>
                          <span className="text-xs font-semibold text-center text-gray-300">
                            {genre.label}
                          </span>
                          {isSelected && (
                            <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Seleccionados: {answers.genres.length} género(s)
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: VOCALS & SPEEDS */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-medium text-white mb-1">
                      Lírica, Vocales y la Velocidad del Ritmo
                    </h2>
                    <p className="text-xs text-gray-400">
                      ¿Cómo encaja la voz humana y la cadencia con tu mente musical hoy?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vocal Presence */}
                    <div className="space-y-3">
                      <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                        Presencia de Voz
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'con-letra', label: 'Con Letra', helper: 'Vocal dominante' },
                          { id: 'instrumental', label: 'Coral o Solo', helper: 'Sin voz principal' },
                          { id: 'ambas', label: 'Sin filtros', helper: 'Flujo libre' }
                        ].map(vox => (
                          <button
                            key={vox.id}
                            type="button"
                            onClick={() => setAnswers(prev => ({ ...prev, vocalPreference: vox.id as any }))}
                            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                              answers.vocalPreference === vox.id
                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-200'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-xs font-semibold block">{vox.label}</span>
                            <span className="text-[8px] opacity-60 block mt-0.5">{vox.helper}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preferred Vocals Style */}
                    <div className="space-y-3">
                      <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                        Timbre de Voz sugerida
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'masculino', label: 'Voces Masculinas' },
                          { id: 'femenino', label: 'Voces Femeninas' },
                          { id: 'coral', label: 'Estilo Coral / Duetos' },
                          { id: 'sin-preferencia', label: 'Indiferente / Ambos' }
                        ].map(vtype => (
                          <button
                            key={vtype.id}
                            type="button"
                            onClick={() => setAnswers(prev => ({ ...prev, vocalsType: vtype.id as any }))}
                            className={`p-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                              answers.vocalsType === vtype.id
                                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {vtype.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Languages Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                      Idiomas para las letras
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map(lang => {
                        const isSelected = answers.languages.includes(lang.id);
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => handleToggleLanguage(lang.id)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-200 shadow-sm'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {lang.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tempo Slider */}
                  <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                        Intensidad de Tempo (Cadencia)
                      </label>
                      <span className="text-mono font-bold text-xs text-purple-400 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                        {answers.rhythmSpeed === 1 && 'Muy Lento (Largo / Adagio)'}
                        {answers.rhythmSpeed === 2 && 'Relajado (Andante)'}
                        {answers.rhythmSpeed === 3 && 'Moderado (Moderato)'}
                        {answers.rhythmSpeed === 4 && 'Acelerado (Allegro)'}
                        {answers.rhythmSpeed === 5 && 'Muy Rápido (Presto)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-gray-500 font-bold">LENTO</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={answers.rhythmSpeed}
                        onChange={(e) => setAnswers(prev => ({ ...prev, rhythmSpeed: parseInt(e.target.value) }))}
                        className="w-full accent-purple-500 hover:accent-cyan-400 transition-colors cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-500 font-bold">RÁPIDO</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: SOUND TEXTURES */}
              {step === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-medium text-white mb-2">
                       Frecuencias, Acordes e Instrumentos
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Define los timbres instrumentales y la mezcla técnica de graves o agudos de tu preferencia.
                    </p>
                  </div>

                  {/* Fav Instruments Grid */}
                  <div className="space-y-3">
                    <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                      Instrumentos que estimulan tu mente
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {INSTRUMENTS.map(inst => {
                        const isSelected = answers.instruments.includes(inst.id);
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => handleToggleInstrument(inst.id)}
                            className={`px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-200'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {inst.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bass Control & Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bass Weight Selection */}
                    <div className="space-y-3">
                      <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                        Sensibilidad de Graves (Bass Weight)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'bajo', label: 'Ligero', helper: 'Agudos claros' },
                          { id: 'medio', label: 'Equilibrado', helper: 'Mezcla plana' },
                          { id: 'alto', label: 'Bajos Pesados', helper: 'Presión física' }
                        ].map(bass => (
                          <button
                            key={bass.id}
                            type="button"
                            onClick={() => setAnswers(prev => ({ ...prev, bassWeight: bass.id as any }))}
                            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                              answers.bassWeight === bass.id
                                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200 font-bold'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-xs font-bold block">{bass.label}</span>
                            <span className="text-[8px] opacity-60 block mt-0.5">{bass.helper}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Acoustic vs Synthetic Style */}
                    <div className="space-y-3">
                      <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                        Tipología de Mezcla
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'acustico', label: 'Acústico', helper: 'Instrumentos reales' },
                          { id: 'electronico', label: 'Electrónico', helper: 'Sintetizadores' },
                          { id: 'ambas', label: 'Mezcla', helper: 'Híbrido moderno' }
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setAnswers(prev => ({ ...prev, stylePreference: st.id as any }))}
                            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                              answers.stylePreference === st.id
                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-200'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-xs font-bold block">{st.label}</span>
                            <span className="text-[8px] opacity-60 block mt-0.5">{st.helper}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: REFERENCE CONTEXT & RESTRICTIONS */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-medium text-white mb-2">
                       Sintonía Final y Referencias Recientes
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Añade temas de referencia y marca límites claros sobre qué excluir de la calibración.
                    </p>
                  </div>

                  {/* Favorites Reference */}
                  <div className="space-y-3">
                    <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                      Nombra hasta 3 canciones o artistas que hayas disfrutado recientemente
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[0, 1, 2].map(idx => (
                        <div key={idx} className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={answers.recentFavorites[idx]}
                            onChange={(e) => handleReferenceChange(idx, e.target.value)}
                            placeholder="ej. Tame Impala"
                            className="w-full bg-white/5 border border-white/10 focus:border-cyan-500 rounded-xl py-2.5 pl-8 pr-4 text-xs text-white placeholder-gray-600 outline-none transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decided exclusions */}
                  <div className="space-y-2">
                    <div className="flex gap-1.5 items-center">
                      <ShieldAlert size={14} className="text-rose-400 shrink-0" />
                      <label className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest">
                        Exclusiones definitivas (Opcional)
                      </label>
                    </div>
                    <textarea
                      value={answers.exclusions}
                      onChange={(e) => setAnswers(prev => ({ ...prev, exclusions: e.target.value }))}
                      placeholder="ej. Definitivamente NO quiero trap urbano, ruidos estridentes o guitarras distorsionadas pesadas..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/30 rounded-xl p-3.5 text-xs text-white placeholder-gray-600 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="bg-gradient-to-r from-purple-900/20 via-cyan-900/20 to-transparent border border-white/10 backdrop-blur-xl rounded-xl p-4 text-xs text-cyan-300">
                    <p>
                      <strong>Calibrando algoritmo híbrido:</strong> Nuestro motor inteligente procesará tu estado emocional (<strong>{MOODS.find(m => m.type === answers.mood)?.name}</strong>), géneros escogidos (<strong>{answers.genres.map(g => GENRES.find(gen => gen.id === g)?.label).join(', ')}</strong>), referencias e instrumentos, para decodificar tu recomendación en menos de 3 segundos.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between border-t border-white/10 pt-6 mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || loading}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Atrás</span>
            </button>

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold rounded-xl bg-white/10 text-white hover:bg-white/15 disabled:opacity-40 border border-white/10 cursor-pointer transition-all"
              >
                <span>Continuar</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isStepValid() || loading}
                className="flex items-center gap-2 px-8 py-3 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 text-white disabled:opacity-40 border border-white/10 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
              >
                {loading ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Confeccionando perfil musical...</span>
                  </>
                ) : (
                  <>
                    <span>Generar mi SoundMind</span>
                    <Compass size={16} className="animate-pulse" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
