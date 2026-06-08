/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export type MoodType = 'alegre' | 'melancolico' | 'energetico' | 'relajado' | 'nostalgico';

export interface QuestionnaireAnswers {
  mood: MoodType;
  activity: string;
  timeOfDay: string;
  genres: string[];
  vocalPreference: 'con-letra' | 'instrumental' | 'ambas';
  languages: string[];
  rhythmSpeed: number; // 1 to 5 (muy lento to muy rápido)
  vocalsType: 'masculino' | 'femenino' | 'coral' | 'sin-preferencia';
  instruments: string[];
  bassWeight: 'bajo' | 'medio' | 'alto';
  stylePreference: 'acustico' | 'electronico' | 'ambas';
  recentFavorites: string[]; // Up to 3 songs or artists
  exclusions: string;
}

export interface SongRecommendation {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  genres: string[];
  spotifyUrl: string;
  score: number; // Confidence score (0 to 100)
  attributes: {
    valence: number; // 0-100
    energy: number; // 0-100
    tempo: number; // BPM or 0-100
    acousticness: number; // 0-100
    instrumentalness: number; // 0-100
    danceability: number; // 0-100
  };
  whyRecommend: string; // Explanatory copy
}

export interface MusicalProfile {
  description: string;
  dominantGenres: string[];
  vibes: string[];
  attributes: {
    valence: number;
    energy: number;
    tempo: number;
    acousticness: number;
    instrumentalness: number;
    danceability: number;
  };
  createdAt: string;
}

export interface RecommendationHistoryItem {
  id: string;
  createdAt: string;
  answers: QuestionnaireAnswers;
  profile: MusicalProfile;
  recommendations: SongRecommendation[];
  likes: Record<string, boolean>; // songId -> true (like) / false (dislike)
}
