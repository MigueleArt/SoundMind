/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface AudioRadarChartProps {
  attributes: {
    valence: number;
    energy: number;
    tempo: number; // scaled or BPM
    acousticness: number;
    instrumentalness: number;
    danceability: number;
  };
  labels?: string[];
}

export default function AudioRadarChart({ attributes }: AudioRadarChartProps) {
  // Center coordinates of our 300x300 SVG canvas
  const size = 320;
  const center = size / 2;
  const radius = 95;

  // The 6 attributes to map
  const dataset = [
    { name: 'Emoción (Valence)', value: attributes.valence, color: '#f43f5e' }, // Rose
    { name: 'Energía (Energy)', value: attributes.energy, color: '#eab308' }, // Yellow
    { name: 'Bailable (Danceability)', value: attributes.danceability, color: '#06b6d4' }, // Cyan
    { name: 'Instrumental (Instrumental)', value: attributes.instrumentalness, color: '#a855f7' }, // Purple
    { name: 'Acústico (Acousticness)', value: attributes.acousticness, color: '#10b981' }, // Emerald
    { name: 'Ritmo (Tempo/Ritmo)', value: Math.min(100, Math.floor((attributes.tempo / 180) * 100)), color: '#3b82f6' } // Blue
  ];

  const totalPoints = dataset.length;

  // Concentric polygon grids to draw background guides (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  // Helper code to get coordinates
  const getCoordinates = (index: number, val: number) => {
    // Offset by -90 degrees so first variable is straight up
    const angle = (index * 2 * Math.PI) / totalPoints - Math.PI / 2;
    const distance = (val / 100) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle)
    };
  };

  // Generate background polygonal grids
  const gridPolygons = gridLevels.map(level => {
    return dataset.map((_, i) => {
      const coord = getCoordinates(i, level * 100);
      return `${coord.x},${coord.y}`;
    }).join(' ');
  });

  // Calculate points of the actual user's data
  const dataPoints = dataset.map((item, i) => getCoordinates(i, item.value));
  const userPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800/80 backdrop-blur-sm shadow-xl">
      <h3 className="text-sm font-display font-semibold text-zinc-300 mb-4 tracking-wider uppercase">
        Firma de Psicología Musical (Cualidades de Audio)
      </h3>

      <div className="relative">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-72 h-72">
          {/* Definitions for gorgeous gradients and shadows */}
          <defs>
            <radialGradient id="radialGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </radialGradient>
            <linearGradient id="userShapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.75" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <stop offset="0%" stopColor="red" />
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw Circular ambient background glow inside radar */}
          <circle cx={center} cy={center} r={radius} fill="url(#radialGrad)" />

          {/* Concentric grid lines (Polygonal) */}
          {gridPolygons.map((points, levelIndex) => (
            <polygon
              key={levelIndex}
              points={points}
              fill="none"
              stroke="#27272a"
              strokeWidth="1"
              strokeDasharray={levelIndex === 3 ? 'none' : '3 3'}
            />
          ))}

          {/* Axes line radiating from center */}
          {dataset.map((_, i) => {
            const edge = getCoordinates(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={edge.x}
                y2={edge.y}
                stroke="#1f1f23"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Concentric grid numeric text */}
          <text x={center} y={center - radius * 0.25} className="text-[8px] font-mono fill-zinc-600 text-center" textAnchor="middle">25%</text>
          <text x={center} y={center - radius * 0.5} className="text-[8px] font-mono fill-zinc-600 text-center" textAnchor="middle">50%</text>
          <text x={center} y={center - radius * 0.75} className="text-[8px] font-mono fill-zinc-600 text-center" textAnchor="middle">75%</text>
          <text x={center} y={center - radius} className="text-[8px] font-mono fill-purple-400 text-center" textAnchor="middle">100%</text>

          {/* User Data Filled Shape */}
          <polygon
            points={userPolygonPoints}
            fill="url(#userShapeGrad)"
            stroke="#a855f7"
            strokeWidth="2.5"
            className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
          />

          {/* Labels & Data Dots */}
          {dataset.map((item, i) => {
            const point = dataPoints[i];
            const outerTextOffset = getCoordinates(i, 108); // Outwards from the edge
            
            // Adjust alignment depending on position
            let textAnchor = 'middle';
            if (outerTextOffset.x < center - 15) textAnchor = 'end';
            else if (outerTextOffset.x > center + 15) textAnchor = 'start';

            const nameSplit = item.name.split(' ');
            const labelTitle = nameSplit[0];
            const originalTerm = nameSplit[1] || '';

            return (
              <g key={i}>
                {/* Visual grid connecting points */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4.5"
                  className="transition-transform duration-300 transform hover:scale-125"
                  fill="#ffffff"
                  stroke={item.color}
                  strokeWidth="2.5"
                />

                {/* Text Labels */}
                <text
                  x={outerTextOffset.x}
                  y={outerTextOffset.y}
                  className="text-[9.5px] font-display font-medium fill-zinc-300"
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                >
                  {labelTitle}
                  <tspan className="text-[8px] font-mono fill-zinc-500 block" x={outerTextOffset.x} dy="8">
                    ({item.value}%)
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Attributes legend and descriptions */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs text-zinc-400 w-full px-2 pt-3 border-t border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span>Felicidad armónica (Valence)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
          <span>Energía del ritmo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
          <span>Sincopa / Bailable</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
          <span>Peso instrumental</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Naturaleza acústica</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <span>Intensidad (Tempo)</span>
        </div>
      </div>
    </div>
  );
}
