import React, { useState, useRef } from 'react';

// Definición de las propiedades que recibe el componente
interface AudioPlayerProps {
  previewUrl: string | null;
  trackName: string;
}

// El componente principal, correctamente tipado
export default function AudioPlayer({ previewUrl, trackName }: AudioPlayerProps) {
  // Estado para saber si está reproduciendo
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Referencia al elemento de audio HTML
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Función para alternar entre reproducir y pausar
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Si no hay URL de previsualización, mostramos un mensaje simple
  if (!previewUrl) {
    return (
      <small style={{ opacity: 0.6, fontStyle: 'italic' }}>
        🔇 Preview no disponible para esta canción
      </small>
    );
  }

  // Renderizado del reproductor con JSX
  return (
    <div className="audio-player-container" style={{ marginTop: '10px' }}>
      <audio 
        ref={audioRef} 
        src={previewUrl} 
        onEnded={() => setIsPlaying(false)} 
        preload="none"
      />
      <button 
        type="button" 
        onClick={togglePlay} 
        className="btn-preview"
        style={{
          padding: '5px 10px',
          cursor: 'pointer',
          borderRadius: '4px',
          border: '1px solid #ccc',
          backgroundColor: isPlaying ? '#f0f0f0' : '#fff'
        }}
      >
        {isPlaying ? `⏸️ Pausar preview` : `▶️ Escuchar Preview de "${trackName}"`}
      </button>
    </div>
  );
};