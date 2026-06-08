/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize server variables
const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'soundmind_super_secret_key_2026';

// Initialize database with default structure if it doesn't exist
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], history: [] }, null, 2));
  }
}
initDb();

// Database read/write helpers
function readDb() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB, resetting database:', error);
    return { users: [], history: [] };
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

// Password hashing helper using Node's native scrypt
function hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

// Lightweight JWT-like session token implementation
function generateToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const computedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== computedSignature) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decoded.exp < Date.now()) return null; // Expired
    return decoded;
  } catch (err) {
    return null;
  }
}

// Middleware to authenticate user
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  req.user = payload ? { id: payload.id, username: payload.username } : null;
  next();
}

// Parse request body
app.use(express.json());

// Set up Gemini instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Aesthetically selected Unsplash images matching various music genres and atmospheres
const COVER_IMAGES: Record<string, string[]> = {
  electronic: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1482440308425-276ad0f28b19?q=80&w=600&auto=format&fit=crop'
  ],
  rock: [
    'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524567241246-c245c43e2097?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=600&auto=format&fit=crop'
  ],
  jazz: [
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600&auto=format&fit=crop'
  ],
  pop: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=600&auto=format&fit=crop'
  ],
  classical: [
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=600&auto=format&fit=crop'
  ],
  ambient: [
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop'
  ],
  generic: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop'
  ]
};

function getRandomCover(genres: string[]): string {
  const matchedGenre = genres.map(g => g.toLowerCase()).find(g => COVER_IMAGES[g]);
  const collection = matchedGenre ? COVER_IMAGES[matchedGenre] : COVER_IMAGES.generic;
  const index = Math.floor(Math.random() * collection.length);
  return collection[index];
}

// --- API Endpoints ---

// 1. Authentication Check
app.get('/api/auth/me', authenticate, (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  res.json({ user: req.user });
});

// 2. User Registration
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'El nombre de usuario y contraseña son obligatorios' });
  }

  const db = readDb();
  const existingUser = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: crypto.randomBytes(8).toString('hex'),
    username,
    hash,
    salt,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);

  const token = generateToken({ id: newUser.id, username: newUser.username });
  res.status(210).json({ token, user: { id: newUser.id, username: newUser.username } });
});

// 3. User Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'El nombre de usuario y contraseña son obligatorios' });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.hash) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = generateToken({ id: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username } });
});

// 4. Get User Profile and History
app.get('/api/history', authenticate, (req: any, res) => {
  const db = readDb();
  // Filter history of recommendations for this user
  // If guest (not logged in), return empty history or can store guest sessions in localStorage via frontend
  const userId = req.user ? req.user.id : 'guest';
  const userHistory = db.history.filter((h: any) => h.userId === userId || (!req.user && h.userId === 'guest'));
  res.json({ history: userHistory });
});

// 5. Generate Recommendation (Using Gemini API for Data Science & Music Psychology profiling!)
app.post('/api/recommendations/generate', authenticate, async (req: any, res) => {
  const { answers } = req.body;
  if (!answers) {
    return res.status(400).json({ error: 'Respuestas del cuestionario faltantes' });
  }

  try {
    const systemPrompt = `Eres un motor avanzado de recomendación musical y psicólogo del sonido llamado "SoundMind".
Analizarás las respuestas de un cuestionario musical de un usuario y generarás:
1. Un perfil psicológico musical personalizado (un análisis descriptivo rico de su estado de ánimo y gustos).
2. Un mapeo preciso de las preferencias del usuario a métricas de ciencia de datos musicales de 0 a 100 (valence, energy, tempo, acousticness, instrumentalness, danceability).
3. Una lista de exactamente 8 canciones reales recomendadas con sus respectivos detalles incluyendo por qué encajan.

Debes responder estrictamente en formato JSON utilizando el esquema especificado. NO incluyas markdown, solo responde con el objeto de datos. Las canciones deben ser reales, artistas conocidos y acordes con sus filtros y exclusiones de forma estricta.`;

    const userInstructions = `Respuestas del cuestionario del usuario:
- Emoción actual: ${answers.mood} ${answers.mood === 'alegre' ? '(Alegre/Vibrante)' : answers.mood === 'melancolico' ? '(Melancólico/Pensativo)' : answers.mood === 'energetico' ? '(Energético/Motivado)' : answers.mood === 'relajado' ? '(Relajado/Calmo)' : '(Nostálgico)'}
- Actividad: ${answers.activity}
- Momento del día: ${answers.timeOfDay}
- Géneros favoritos: ${answers.genres.join(', ')}
- Preferencia de canto: ${answers.vocalPreference}
- Idiomas aceptados: ${answers.languages.join(', ')}
- Intensidad de tempo (1 muy lento - 5 muy rápido): ${answers.rhythmSpeed}
- Estilo vocal preferido: ${answers.vocalsType}
- Instrumentos de interés: ${answers.instruments.join(', ')}
- Peso de graves (bass): ${answers.bassWeight}
- Acústica/Flujo de sonido: ${answers.stylePreference}
- Canciones/artistas de referencia: ${answers.recentFavorites.filter(Boolean).join(', ')}
- Exclusiones definitivas: ${answers.exclusions || 'Ninguna'}

Genera canciones reales y un perfil altamente profesional y poético pero preciso.`;

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
            description: {
              type: Type.STRING,
              description: 'Descripción de perfil musical detallada y personalizada en español, de 2 a 3 oraciones.'
            },
            dominantGenres: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Los 3 o 4 géneros musicales dominantes para este estado de ánimo y preferencia.'
            },
            vibes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Etiquetas de vibras u ondas musicales (ej. Introspectivo, Chill, Dinámico, Underground).'
            },
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

    const recommendationData = JSON.parse(response.text || '{}');

    // Enhance song recomendations with custom cover arts and URLs
    const enhancedSongs = recommendationData.songs.map((song: any, index: number) => {
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

    const historyItem = {
      id: `session-${crypto.randomBytes(6).toString('hex')}`,
      userId: req.user ? req.user.id : 'guest',
      createdAt: new Date().toISOString(),
      answers,
      profile: finalProfile,
      recommendations: enhancedSongs,
      likes: {}
    };

    const db = readDb();
    db.history.push(historyItem);
    writeDb(db);

    res.json(historyItem);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Hubo un error al procesar tu perfil musical. Por favor, intenta de nuevo.' });
  }
});

// 6. Like/Dislike Recommendation Feedback
app.post('/api/recommendations/like', authenticate, (req: any, res) => {
  const { sessionId, songId, isLiked } = req.body;
  if (!sessionId || !songId || isLiked === undefined) {
    return res.status(400).json({ error: 'Argumentos faltantes' });
  }

  const db = readDb();
  const index = db.history.findIndex((h: any) => h.id === sessionId);
  if (index === -1) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }

  // Ensure authorized OR guest
  const userId = req.user ? req.user.id : 'guest';
  if (db.history[index].userId !== userId) {
    return res.status(403).json({ error: 'Acceso no permitido' });
  }

  if (!db.history[index].likes) {
    db.history[index].likes = {};
  }

  db.history[index].likes[songId] = isLiked;
  writeDb(db);

  res.json({ success: true, likes: db.history[index].likes });
});


// Set up Vite and Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SoundMind App running on port ${PORT}`);
  });
}

startServer();
