/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RecommendationHistoryItem } from '../types';

interface MusicalEvolutionChartProps {
  history: RecommendationHistoryItem[];
}

export default function MusicalEvolutionChart({ history }: MusicalEvolutionChartProps) {
  // Sort history by date oldest to newest
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const totalPoints = sortedHistory.length;

  if (totalPoints < 1) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl border border-white/10 text-gray-400 text-sm">
        No hay suficientes datos. Completa un test para iniciar tu registro.
      </div>
    );
  }

  // Sizing of our Line Graph
  const width = 500;
  const height = 180;
  const paddingX = 45;
  const paddingY = 25;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Grid levels (0, 25, 50, 75, 100)
  const yGrids = [0, 25, 50, 75, 100];

  // Map user data into plotting values (X, Y)
  const getCoordinatesForValue = (index: number, val: number) => {
    // X is spaced evenly across sessions
    const x = paddingX + (totalPoints > 1 ? (index / (totalPoints - 1)) * chartWidth : chartWidth / 2);
    // Y is inverted (0 is top, 100 is bottom of graph)
    const y = paddingY + chartHeight - (val / 100) * chartHeight;
    return { x, y };
  };

  // Build coordinate arrays for each attribute
  const valenceCoords = sortedHistory.map((h, i) => getCoordinatesForValue(i, h.profile.attributes.valence));
  const energyCoords = sortedHistory.map((h, i) => getCoordinatesForValue(i, h.profile.attributes.energy));
  const danceabilityCoords = sortedHistory.map((h, i) => getCoordinatesForValue(i, h.profile.attributes.danceability));

  // Convert coordinate array into SVG Polyline format
  const getPathString = (coords: { x: number; y: number }[]) => {
    return coords.map(c => `${c.x},${c.y}`).join(' ');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-xl w-full">
      <h4 className="text-sm font-display font-semibold text-gray-300 mb-3 tracking-wider uppercase">
        Evolución Musical de tus Sesiones
      </h4>
      <p className="text-xs text-gray-500 mb-5">
        Mapeo temporal de tu estado de ánimo general, temperamento e impulso rítmico.
      </p>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[380px] h-48">
          <defs>
            {/* Ambient gradients for paths */}
            <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="nrgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="dncGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {yGrids.map((g, i) => {
            const hLineY = paddingY + chartHeight - (g / 100) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={hLineY}
                  x2={width - paddingX}
                  y2={hLineY}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={hLineY + 3}
                  className="text-[9px] font-mono fill-gray-600"
                  textAnchor="end"
                >
                  {g}%
                </text>
              </g>
            );
          })}

          {/* Vertical grid lines (sessions) and dates */}
          {sortedHistory.map((h, i) => {
            const xCoords = paddingX + (totalPoints > 1 ? (i / (totalPoints - 1)) * chartWidth : chartWidth / 2);
            return (
              <g key={i}>
                <line
                  x1={xCoords}
                  y1={paddingY}
                  x2={xCoords}
                  y2={height - paddingY}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={xCoords}
                  y={height - paddingY + 14}
                  className="text-[9px] font-medium fill-gray-500"
                  textAnchor="middle"
                >
                  {formatDate(h.createdAt)}
                </text>
                <text
                  x={xCoords}
                  y={height - paddingY + 24}
                  className="text-[7px] font-mono fill-gray-600"
                  textAnchor="middle"
                >
                  S{i + 1}
                </text>
              </g>
            );
          })}

          {totalPoints > 1 && (
            <>
              {/* Areas list fill */}
              <polygon
                points={`${valenceCoords[0].x},${height - paddingY} ${getPathString(valenceCoords)} ${valenceCoords[valenceCoords.length - 1].x},${height - paddingY}`}
                fill="url(#valGrad)"
              />
              <polygon
                points={`${energyCoords[0].x},${height - paddingY} ${getPathString(energyCoords)} ${energyCoords[energyCoords.length - 1].x},${height - paddingY}`}
                fill="url(#nrgGrad)"
              />
              <polygon
                points={`${danceabilityCoords[0].x},${height - paddingY} ${getPathString(danceabilityCoords)} ${danceabilityCoords[danceabilityCoords.length - 1].x},${height - paddingY}`}
                fill="url(#dncGrad)"
              />

              {/* Render connector lines */}
              <polyline
                points={getPathString(valenceCoords)}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <polyline
                points={getPathString(energyCoords)}
                fill="none"
                stroke="#eab308"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <polyline
                points={getPathString(danceabilityCoords)}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Render individual dots on nodes */}
          {sortedHistory.map((_, i) => {
            const valPt = valenceCoords[i];
            const nrgPt = energyCoords[i];
            const dncPt = danceabilityCoords[i];
            return (
              <g key={i}>
                <circle cx={valPt.x} cy={valPt.y} r="3.5" fill="#f43f5e" stroke="#000" strokeWidth="1" />
                <circle cx={nrgPt.x} cy={nrgPt.y} r="3.5" fill="#eab308" stroke="#000" strokeWidth="1" />
                <circle cx={dncPt.x} cy={dncPt.y} r="3.5" fill="#06b6d4" stroke="#000" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Map Legend */}
      <div className="flex items-center gap-5 justify-center mt-3 pt-3 border-t border-white/10 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Emoción (Valence)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Energía</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>Indice Bailable</span>
        </div>
      </div>
    </div>
  );
}
