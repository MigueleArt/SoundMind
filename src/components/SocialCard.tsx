import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Sparkles, Headphones } from 'lucide-react';
import { MusicalProfile } from '../types';

interface SocialCardProps {
  profile: MusicalProfile;
  username?: string;
}

export default function SocialCard({ profile, username }: SocialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `soundmind-profile-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al generar la tarjeta:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Contenedor Capturable (Formato 9:16 Instagram Story) */}
      <div
        ref={cardRef}
        className="w-[300px] h-[533px] bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl select-none"
      >
        {/* Luces de fondo */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-cyan-400 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-black rounded-[7px] flex items-center justify-center">
                <Headphones size={13} className="text-cyan-400" />
              </div>
            </div>
            <span className="text-xs font-bold tracking-wider text-white">SoundMind</span>
          </div>
          {username && (
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-800/30">
              @{username}
            </span>
          )}
        </div>

        {/* Cuerpo del perfil */}
        <div className="space-y-4 z-10 my-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300">
            <Sparkles size={10} /> Firma Musical Decodificada
          </div>
          <p className="text-xs font-display font-medium text-white italic leading-relaxed">
            "{profile.description}"
          </p>

          {/* Atributos Mapeados */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {Object.entries(profile.attributes).map(([key, val]) => (
              <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-2">
                <span className="text-[8px] uppercase tracking-wider text-gray-400 block font-mono">{key}</span>
                <span className="text-xs font-bold text-cyan-300 font-mono">{val}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie de foto */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 z-10">
          <div className="flex gap-1">
            {profile.dominantGenres.slice(0, 2).map((g) => (
              <span key={g} className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-gray-300">
                #{g}
              </span>
            ))}
          </div>
          <span className="text-[9px] font-mono text-gray-500">soundmind.ai</span>
        </div>
      </div>

      {/* Botón de Descarga */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
      >
        <Download size={14} />
        <span>Descargar Imagen</span>
      </button>
    </div>
  );
}