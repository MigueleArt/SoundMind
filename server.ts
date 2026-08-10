/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./backend/config/env";
import { supabaseAdmin } from "./backend/config/supabase";
import { authRouter } from "./backend/routes/auth.routes";
import { historyRouter } from "./backend/routes/history.routes";
import { sessionRouter } from "./backend/routes/session.routes";
import { recommendationRouter } from "./backend/routes/recommendation.routes";
import { optionalAuth } from "./backend/middleware/auth";
import { createMusicSession, findOrCreateSong } from "./backend/services/session.service";
import { findHistoryItem } from "./backend/repositories/history.repository";
import { mapHistoryItem } from "./backend/services/history.service";

// Initialize server variables
const app = express();
const PORT = env.PORT;



// Parse request body
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: env.APP_URL,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "100kb",
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos. Intenta nuevamente en 15 minutos.",
  },
});

app.use("/api/auth", authLimiter);

// Set up Gemini instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Aesthetically selected Unsplash images matching various music genres and atmospheres
const COVER_IMAGES: Record<string, string[]> = {
  electronic: [
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?q=80&w=600&auto=format&fit=crop",
  ],
  rock: [
    "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524567241246-c245c43e2097?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=600&auto=format&fit=crop",
  ],
  jazz: [
    "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600&auto=format&fit=crop",
  ],
  pop: [
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=600&auto=format&fit=crop",
  ],
  classical: [
    "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=600&auto=format&fit=crop",
  ],
  ambient: [
    "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
  ],
  generic: [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
  ],
};

function getRandomCover(genres: string[]): string {
  const matchedGenre = genres
    .map((g) => g.toLowerCase())
    .find((g) => COVER_IMAGES[g]);
  const collection = matchedGenre
    ? COVER_IMAGES[matchedGenre]
    : COVER_IMAGES.generic;
  const index = Math.floor(Math.random() * collection.length);
  return collection[index];
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SoundMind API",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/database", async (_req, res) => {
  try {
    const { error } = await supabaseAdmin.from("profiles").select("id", {
      count: "exact",
      head: true,
    });

    if (error) {
      console.error("Supabase health check failed:", error);

      return res.status(503).json({
        status: "error",
        database: "disconnected",
      });
    }

    return res.json({
      status: "ok",
      database: "connected",
      provider: "Supabase PostgreSQL",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check error:", error);

    return res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/history", historyRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/recommendations", recommendationRouter);


// 5. Generate Recommendation (Using Gemini API for Data Science & Music Psychology profiling!)
app.post(
  "/api/recommendations/generate",
  optionalAuth,
  async (req: any, res) => {
    const { answers } = req.body;
    if (!answers) {
      return res
        .status(400)
        .json({ error: "Respuestas del cuestionario faltantes" });
    }

    try {
      const systemPrompt = `Eres un motor avanzado de recomendación musical y psicólogo del sonido llamado "SoundMind".
Analizarás las respuestas de un cuestionario musical de un usuario y generarás:
1. Un perfil psicológico musical personalizado (un análisis descriptivo rico de su estado de ánimo y gustos).
2. Un mapeo preciso de las preferencias del usuario a métricas de ciencia de datos musicales de 0 a 100 (valence, energy, tempo, acousticness, instrumentalness, danceability).
3. Una lista de exactamente 8 canciones reales recomendadas con sus respectivos detalles incluyendo por qué encajan.

Debes responder estrictamente en formato JSON utilizando el esquema especificado. NO incluyas markdown, solo responde con el objeto de datos. Las canciones deben ser reales, artistas conocidos y acordes con sus filtros y exclusiones de forma estricta.`;

      const userInstructions = `Respuestas del cuestionario del usuario:
- Emoción actual: ${answers.mood} ${answers.mood === "alegre" ? "(Alegre/Vibrante)" : answers.mood === "melancolico" ? "(Melancólico/Pensativo)" : answers.mood === "energetico" ? "(Energético/Motivado)" : answers.mood === "relajado" ? "(Relajado/Calmo)" : "(Nostálgico)"}
- Actividad: ${answers.activity}
- Momento del día: ${answers.timeOfDay}
- Géneros favoritos: ${answers.genres.join(", ")}
- Preferencia de canto: ${answers.vocalPreference}
- Idiomas aceptados: ${answers.languages.join(", ")}
- Intensidad de tempo (1 muy lento - 5 muy rápido): ${answers.rhythmSpeed}
- Estilo vocal preferido: ${answers.vocalsType}
- Instrumentos de interés: ${answers.instruments.join(", ")}
- Peso de graves (bass): ${answers.bassWeight}
- Acústica/Flujo de sonido: ${answers.stylePreference}
- Canciones/artistas de referencia: ${answers.recentFavorites.filter(Boolean).join(", ")}
- Exclusiones definitivas: ${answers.exclusions || "Ninguna"}

Genera canciones reales y un perfil altamente profesional y poético pero preciso.`;

      let recommendationData: any = null;

      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [{ text: userInstructions }],
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                required: [
                  "description",
                  "dominantGenres",
                  "vibes",
                  "attributes",
                  "songs",
                ],
                properties: {
                  description: {
                    type: Type.STRING,
                    description:
                      "Descripción de perfil musical detallada y personalizada en español, de 2 a 3 oraciones.",
                  },
                  dominantGenres: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                      "Los 3 o 4 géneros musicales dominantes para este estado de ánimo y preferencia.",
                  },
                  vibes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                      "Etiquetas de vibras u ondas musicales (ej. Introspectivo, Chill, Dinámico, Underground).",
                  },
                  attributes: {
                    type: Type.OBJECT,
                    required: [
                      "valence",
                      "energy",
                      "tempo",
                      "acousticness",
                      "instrumentalness",
                      "danceability",
                    ],
                    properties: {
                      valence: {
                        type: Type.INTEGER,
                        description:
                          "Grado de felicidad/positividad musical de 0 a 100.",
                      },
                      energy: {
                        type: Type.INTEGER,
                        description:
                          "Intensidad o energía del sonido de 0 a 100.",
                      },
                      tempo: {
                        type: Type.INTEGER,
                        description:
                          "BPM estimado de las canciones ideales (ej. 60-180).",
                      },
                      acousticness: {
                        type: Type.INTEGER,
                        description:
                          "Porcentaje de preferencia acústica de 0 a 100.",
                      },
                      instrumentalness: {
                        type: Type.INTEGER,
                        description:
                          "Porcentaje de enfoque instrumental de 0 a 100.",
                      },
                      danceability: {
                        type: Type.INTEGER,
                        description:
                          "Ritmicidad o capacidad bailable de 0 a 100.",
                      },
                    },
                  },
                  songs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: [
                        "title",
                        "artist",
                        "album",
                        "genres",
                        "score",
                        "whyRecommend",
                      ],
                      properties: {
                        title: {
                          type: Type.STRING,
                          description:
                            'Nombre de la canción real (ej. "Intro").',
                        },
                        artist: {
                          type: Type.STRING,
                          description:
                            'Nombre del artista/banda real (ej. "The xx").',
                        },
                        album: {
                          type: Type.STRING,
                          description: "Nombre del álbum real de esa canción.",
                        },
                        genres: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Géneros de esta canción.",
                        },
                        score: {
                          type: Type.INTEGER,
                          description:
                            "Afinidad aproximada con el perfil de 0 a 100.",
                        },
                        whyRecommend: {
                          type: Type.STRING,
                          description:
                            "Explicación de una oración en español sobre por qué encaja perfectamente en este contexto.",
                        },
                      },
                    },
                  },
                },
              },
            },
          });
          recommendationData = JSON.parse(response.text || "{}");
        } catch (err) {
          console.error(
            "Gemini API call failed, falling back to local engine:",
            err,
          );
        }
      }

      if (!recommendationData || !recommendationData.songs) {
        console.log("Using Local Fallback Recommendation Engine...");
        const fallbackGenres =
          answers.genres.length > 0 ? answers.genres : ["Pop", "Indie"];
        const baseValence =
          answers.mood === "alegre"
            ? 85
            : answers.mood === "melancolico"
              ? 30
              : answers.mood === "energetico"
                ? 80
                : 60;
        const baseEnergy =
          answers.mood === "energetico"
            ? 90
            : answers.mood === "relajado"
              ? 30
              : 65;

        const catalog = [
          { t: "Blinding Lights", a: "The Weeknd", g: ["pop", "electronic"] },
          { t: "Bohemian Rhapsody", a: "Queen", g: ["rock", "classic"] },
          { t: "Take Five", a: "Dave Brubeck", g: ["jazz"] },
          { t: "Clair de Lune", a: "Claude Debussy", g: ["classical"] },
          { t: "Strobe", a: "deadmau5", g: ["electronic"] },
          { t: "Midnight City", a: "M83", g: ["electronic", "indie"] },
          { t: "Smells Like Teen Spirit", a: "Nirvana", g: ["rock"] },
          { t: "Levitating", a: "Dua Lipa", g: ["pop"] },
          { t: "So What", a: "Miles Davis", g: ["jazz"] },
          { t: "Weightless", a: "Marconi Union", g: ["ambient"] },
          { t: "Shape of You", a: "Ed Sheeran", g: ["pop"] },
          { t: "Hotel California", a: "Eagles", g: ["rock"] },
          { t: "Tusa", a: "Karol G", g: ["reggaeton", "latin"] },
          { t: "Dákiti", a: "Bad Bunny", g: ["reggaeton"] },
          { t: "Despacito", a: "Luis Fonsi", g: ["latin", "pop"] },
          { t: "Numb", a: "Linkin Park", g: ["rock", "metal"] },
          { t: "Master of Puppets", a: "Metallica", g: ["metal"] },
          { t: "Lose Yourself", a: "Eminem", g: ["hip-hop"] },
          { t: "SICKO MODE", a: "Travis Scott", g: ["hip-hop"] },
          { t: "Dynamite", a: "BTS", g: ["k-pop", "pop"] },
          { t: "As It Was", a: "Harry Styles", g: ["pop", "indie"] },
          { t: "Cruel Summer", a: "Taylor Swift", g: ["pop"] },
          { t: "Billie Jean", a: "Michael Jackson", g: ["pop"] },
          { t: "Vampire", a: "Olivia Rodrigo", g: ["pop", "rock"] },
        ];

        const shuffled = [...catalog].sort(() => 0.5 - Math.random());
        const mockSongs = shuffled.slice(0, 8).map((s) => ({
          title: s.t,
          artist: s.a,
          album: "Grandes Éxitos",
          genres: [...new Set([...s.g, ...fallbackGenres])],
          score: Math.floor(Math.random() * 20) + 80,
          whyRecommend: `Seleccionada por nuestro algoritmo para potenciar tu estado ${answers.mood} y complementar la textura de los bajos y agudos.`,
        }));

        recommendationData = {
          description: `Hemos analizado tu preferencia por sonidos con estado ${answers.mood} y construido este perfil acústico. Debido a la ausencia de la API Key, este es un mapeo de respaldo local que de todas formas te proveerá excelentes recomendaciones.`,
          dominantGenres: fallbackGenres,
          vibes: [answers.mood, "Curado", "Local"],
          attributes: {
            valence: baseValence,
            energy: baseEnergy,
            tempo: answers.rhythmSpeed * 30 + 40,
            acousticness: answers.stylePreference === "acustico" ? 80 : 30,
            instrumentalness:
              answers.vocalPreference === "instrumental" ? 90 : 20,
            danceability: answers.mood === "energetico" ? 85 : 40,
          },
          songs: mockSongs,
        };
      }

      // Enhance song recomendations with custom cover arts and URLs
      const enhancedSongs = recommendationData.songs.map(
        (song: any, index: number) => {
          const songId = `song-${crypto.randomBytes(4).toString("hex")}`;
          const searchTerms = `${song.title} ${song.artist}`;
          return {
            ...song,
            id: songId,
            coverUrl: getRandomCover(
              song.genres || recommendationData.dominantGenres,
            ),
            spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(searchTerms)}`,
            attributes: {
              valence: Math.max(
                0,
                Math.min(
                  100,
                  Math.floor(
                    recommendationData.attributes.valence +
                      (Math.random() * 20 - 10),
                  ),
                ),
              ),
              energy: Math.max(
                0,
                Math.min(
                  100,
                  Math.floor(
                    recommendationData.attributes.energy +
                      (Math.random() * 20 - 10),
                  ),
                ),
              ),
              tempo: Math.max(
                50,
                Math.min(
                  180,
                  Math.floor(
                    recommendationData.attributes.tempo +
                      (Math.random() * 30 - 15),
                  ),
                ),
              ),
              acousticness: Math.max(
                0,
                Math.min(
                  100,
                  Math.floor(
                    recommendationData.attributes.acousticness +
                      (Math.random() * 20 - 10),
                  ),
                ),
              ),
              instrumentalness: Math.max(
                0,
                Math.min(
                  100,
                  Math.floor(
                    recommendationData.attributes.instrumentalness +
                      (Math.random() * 20 - 10),
                  ),
                ),
              ),
              danceability: Math.max(
                0,
                Math.min(
                  100,
                  Math.floor(
                    recommendationData.attributes.danceability +
                      (Math.random() * 20 - 10),
                  ),
                ),
              ),
            },
          };
        },
      );

      const finalProfile = {
        description: recommendationData.description,
        dominantGenres: recommendationData.dominantGenres,
        vibes: recommendationData.vibes,
        attributes: recommendationData.attributes,
        createdAt: new Date().toISOString(),
      };

      // Los visitantes pueden generar una recomendación,
      // pero solamente los usuarios autenticados guardan historial.
      if (!req.authUser) {
        return res.json({
          id: `temporary-${crypto.randomBytes(6).toString("hex")}`,
          createdAt: new Date().toISOString(),
          answers,
          profile: finalProfile,
          recommendations: enhancedSongs,
          likes: {},
        });
      }

      const sessionId = await createMusicSession(req.authUser.id, {
        answers,
        profile: finalProfile,
        recommendations: enhancedSongs,
      });

      const { data: savedSession, error: savedSessionError } =
        await findHistoryItem(req.authUser.id, sessionId);

      if (savedSessionError || !savedSession) {
        console.error("Saved session retrieval error:", savedSessionError);

        return res.status(201).json({
          id: sessionId,
          createdAt: new Date().toISOString(),
          answers,
          profile: finalProfile,
          recommendations: enhancedSongs,
          likes: {},
        });
      }

      return res.json(mapHistoryItem(savedSession, req.authUser.id));
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res
        .status(500)
        .json({
          error:
            "Hubo un error al procesar tu perfil musical. Por favor, intenta de nuevo.",
        });
    }
  },
);

// 5.1 Generate Recommendation by Search
app.post('/api/recommendations/search', optionalAuth, async (req: any, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Consulta de búsqueda faltante' });
  }

  try {
    const systemPrompt = `Eres un motor avanzado de recomendación musical y psicólogo del sonido llamado "SoundMind".
Analizarás la canción o artista buscado por el usuario y generarás:
1. Un perfil psicológico musical personalizado.
2. Un mapeo de las preferencias del usuario a métricas de ciencia de datos musicales de 0 a 100 (valence, energy, tempo, acousticness, instrumentalness, danceability).
3. Una lista de exactamente 8 canciones reales similares con sus respectivos detalles incluyendo por qué encajan.

Debes responder estrictamente en formato JSON utilizando el esquema especificado. NO incluyas markdown, solo responde con el objeto de datos. Las canciones deben ser reales.`;

    const userInstructions = `El usuario ha buscado la canción, artista o género: "${query}".
Genera canciones reales similares y un perfil altamente profesional y poético pero preciso que describa la vibra de esta búsqueda.`;

    let recommendationData: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            { text: userInstructions }
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              required: ['description', 'dominantGenres', 'vibes', 'attributes', 'songs'],
              properties: {
                description: { type: Type.STRING, description: 'Descripción de perfil musical detallada y personalizada en español, de 2 a 3 oraciones.' },
                dominantGenres: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Los 3 o 4 géneros musicales dominantes para este estado de ánimo y preferencia.' },
                vibes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Etiquetas de vibras u ondas musicales (ej. Introspectivo, Chill, Dinámico, Underground).' },
                attributes: {
                  type: Type.OBJECT,
                  required: ['valence', 'energy', 'tempo', 'acousticness', 'instrumentalness', 'danceability'],
                  properties: {
                    valence: { type: Type.INTEGER, description: 'Grado de felicidad/positividad musical de 0 a 100.' },
                    energy: { type: Type.INTEGER, description: 'Intensidad o energía del sonido de 0 a 100.' },
                    tempo: { type: Type.INTEGER, description: 'BPM estimado de las canciones ideales (ej. 60-180).' },
                    acousticness: { type: Type.INTEGER, description: 'Porcentaje de preferencia acústica de 0 a 100.' },
                    instrumentalness: { type: Type.INTEGER, description: 'Porcentaje de enfoque instrumental de 0 a 100.' },
                    danceability: { type: Type.INTEGER, description: 'Ritmicidad o capacidad bailable de 0 a 100.' }
                  }
                },
                songs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['title', 'artist', 'album', 'genres', 'score', 'whyRecommend'],
                    properties: {
                      title: { type: Type.STRING, description: 'Nombre de la canción real (ej. "Intro").' },
                      artist: { type: Type.STRING, description: 'Nombre del artista/banda real (ej. "The xx").' },
                      album: { type: Type.STRING, description: 'Nombre del álbum real de esa canción.' },
                      genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Géneros de esta canción.' },
                      score: { type: Type.INTEGER, description: 'Afinidad aproximada con el perfil de 0 a 100.' },
                      whyRecommend: { type: Type.STRING, description: 'Explicación de una oración en español sobre por qué encaja perfectamente en este contexto.' }
                    }
                  }
                }
              }
            }
          }
        });
        recommendationData = JSON.parse(response.text || '{}');
      } catch (err) {
        console.error('Gemini API call failed for search, falling back to local engine:', err);
      }
    }

    if (!recommendationData || !recommendationData.songs) {
      recommendationData = {
        description: `Basado en tu búsqueda de "${query}", hemos construido este perfil acústico. Debido a la ausencia de la API Key, este es un mapeo de respaldo local.`,
        dominantGenres: ['Pop', 'Indie', 'Rock'],
        vibes: ['Similar', 'Curado', 'Local'],
        attributes: {
          valence: 60,
          energy: 60,
          tempo: 120,
          acousticness: 40,
          instrumentalness: 20,
          danceability: 60
        },
        songs: [
          { title: 'Blinding Lights', artist: 'The Weeknd', album: 'Grandes Éxitos', genres: ['pop'], score: 90, whyRecommend: `Similar a ${query}` },
          { title: 'Midnight City', artist: 'M83', album: 'Grandes Éxitos', genres: ['electronic'], score: 85, whyRecommend: `Similar a ${query}` },
          { title: 'As It Was', artist: 'Harry Styles', album: 'Grandes Éxitos', genres: ['pop'], score: 88, whyRecommend: `Similar a ${query}` },
          { title: 'Tusa', artist: 'Karol G', album: 'Grandes Éxitos', genres: ['reggaeton'], score: 82, whyRecommend: `Similar a ${query}` },
        ]
      };
    }

    const enhancedSongs = recommendationData.songs.map((song: any) => {
      const songId = `song-${crypto.randomBytes(4).toString('hex')}`;
      const searchTerms = `${song.title} ${song.artist}`;
      return {
        ...song,
        id: songId,
        coverUrl: getRandomCover(song.genres || recommendationData.dominantGenres),
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(searchTerms)}`,
        attributes: {
          valence: Math.max(0, Math.min(100, Math.floor(recommendationData.attributes.valence + (Math.random() * 20 - 10)))),
          energy: Math.max(0, Math.min(100, Math.floor(recommendationData.attributes.energy + (Math.random() * 20 - 10)))),
          tempo: Math.max(50, Math.min(180, Math.floor(recommendationData.attributes.tempo + (Math.random() * 30 - 15)))),
          acousticness: Math.max(0, Math.min(100, Math.floor(recommendationData.attributes.acousticness + (Math.random() * 20 - 10)))),
          instrumentalness: Math.max(0, Math.min(100, Math.floor(recommendationData.attributes.instrumentalness + (Math.random() * 20 - 10)))),
          danceability: Math.max(0, Math.min(100, Math.floor(recommendationData.attributes.danceability + (Math.random() * 20 - 10)))),
        }
      };
    });

    const finalProfile = {
      description: recommendationData.description,
      dominantGenres: recommendationData.dominantGenres,
      vibes: recommendationData.vibes,
      attributes: recommendationData.attributes,
      createdAt: new Date().toISOString()
    };

    const answers = {
        mood: 'alegre',
        activity: 'search',
        timeOfDay: 'any',
        genres: recommendationData.dominantGenres,
        vocalPreference: 'ambas',
        languages: ['espanol', 'ingles'],
        rhythmSpeed: 3,
        vocalsType: 'sin-preferencia',
        instruments: [],
        bassWeight: 'medio',
        stylePreference: 'ambas',
        recentFavorites: [],
        exclusions: '',
        searchQuery: query
    };

    if (!req.authUser) {
      return res.json({
        id: `temporary-${crypto.randomBytes(6).toString("hex")}`,
        createdAt: new Date().toISOString(),
        answers,
        profile: finalProfile,
        recommendations: enhancedSongs,
        likes: {},
      });
    }

    const sessionId = await createMusicSession(req.authUser.id, {
      answers,
      profile: finalProfile,
      recommendations: enhancedSongs,
    });

    const { data: savedSession, error: savedSessionError } =
      await findHistoryItem(req.authUser.id, sessionId);

    if (savedSessionError || !savedSession) {
      console.error("Saved session retrieval error:", savedSessionError);
      return res.status(201).json({
        id: sessionId,
        createdAt: new Date().toISOString(),
        answers,
        profile: finalProfile,
        recommendations: enhancedSongs,
        likes: {},
      });
    }

    return res.json(mapHistoryItem(savedSession, req.authUser.id));
  } catch (error) {
    console.error('Error generating search recommendations:', error);
    res.status(500).json({ error: 'Hubo un error al procesar tu búsqueda. Por favor, intenta de nuevo.' });
  }
});

// 7. Standalone Like (From Search Results)
app.post('/api/recommendations/standalone-like', optionalAuth, async (req: any, res) => {
  const { song } = req.body;
  if (!song || !song.id) {
    return res.status(400).json({ error: 'Song missing' });
  }

  if (!req.authUser) {
    return res.status(401).json({ error: 'Debes iniciar sesión para dar me gusta' });
  }

  // Ensure song has attributes to prevent TypeError in createMusicSession
  if (!song.attributes) {
    song.attributes = {
      valence: 50,
      energy: 50,
      tempo: 120,
      acousticness: 50,
      instrumentalness: 50,
      danceability: 50
    };
  }

  try {
    const dbSongId = await findOrCreateSong(song);

    const { data: sessions, error } = await supabaseAdmin
      .from('music_sessions')
      .select('*')
      .eq('user_id', req.authUser.id)
      .eq('activity', 'standalone_likes')
      .limit(1);

    let sessionId: string;
    
    if (error || !sessions || sessions.length === 0) {
      const newSession = {
        answers: { activity: 'standalone_likes', mood: 'any', timeOfDay: 'any', genres: [], vocalPreference: 'ambas', languages: [], rhythmSpeed: 3, vocalsType: 'sin-preferencia', instruments: [], bassWeight: 'medio', stylePreference: 'ambas', recentFavorites: [], exclusions: '' },
        profile: { description: 'Búsquedas sueltas guardadas como favoritas.', dominantGenres: [], vibes: [], attributes: { valence: 50, energy: 50, tempo: 120, acousticness: 50, instrumentalness: 50, danceability: 50 }, createdAt: new Date().toISOString() },
        recommendations: [song],
      };
      
      sessionId = await createMusicSession(req.authUser.id, newSession);
    } else {
      sessionId = sessions[0].id;
      
      const { data: existingRec } = await supabaseAdmin
        .from('recommendations')
        .select('*')
        .eq('session_id', sessionId)
        .eq('song_id', dbSongId)
        .maybeSingle();
        
      if (!existingRec) {
        const { data: maxPosData } = await supabaseAdmin
          .from('recommendations')
          .select('position')
          .eq('session_id', sessionId)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        const nextPosition = (maxPosData?.position || 0) + 1;
        
        await supabaseAdmin
          .from('recommendations')
          .insert({
            session_id: sessionId,
            song_id: dbSongId,
            score: song.score || 100,
            why_recommend: song.whyRecommend || 'Liked from search',
            position: nextPosition,
            valence: song.attributes?.valence || 50,
            energy: song.attributes?.energy || 50,
            tempo: song.attributes?.tempo || 120,
            acousticness: song.attributes?.acousticness || 50,
            instrumentalness: song.attributes?.instrumentalness || 50,
            danceability: song.attributes?.danceability || 50
          });
      }
    }
    
    const { data: feedbackData } = await supabaseAdmin
      .from('feedbacks')
      .select('*')
      .eq('session_id', sessionId)
      .eq('song_id', dbSongId)
      .maybeSingle();
        
    if (feedbackData) {
      await supabaseAdmin
        .from('feedbacks')
        .update({ is_liked: !feedbackData.is_liked })
        .eq('id', feedbackData.id);
    } else {
      await supabaseAdmin
        .from('feedbacks')
        .insert({
          session_id: sessionId,
          song_id: dbSongId,
          is_liked: true
        });
    }
      
    const { data: savedSession } = await findHistoryItem(req.authUser.id, sessionId);
    return res.json({ success: true, session: mapHistoryItem(savedSession, req.authUser.id) });
  } catch (err) {
    console.error('Error handling standalone like:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

if (!process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: {
          middlewareMode: true
        },
        appType: 'spa'
      });

      app.use(vite.middlewares);
    } else {
      const distPath = path.join(
        process.cwd(),
        'dist'
      );

      app.use(express.static(distPath));

      app.get('*', (_req, res) => {
        res.sendFile(
          path.join(distPath, 'index.html')
        );
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `SoundMind App running on port ${PORT}`
      );
    });
  }

  startServer().catch((error) => {
    console.error(
      'No se pudo iniciar SoundMind:',
      error
    );

    process.exit(1);
  });
}

export default app;