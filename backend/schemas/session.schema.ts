import { z } from 'zod';

const attributesSchema = z.object({
  valence: z.number().min(0).max(100),
  energy: z.number().min(0).max(100),
  tempo: z.number().min(0).max(300),
  acousticness: z.number().min(0).max(100),
  instrumentalness: z.number().min(0).max(100),
  danceability: z.number().min(0).max(100)
});

const answersSchema = z.object({
  mood: z.string().min(1).max(30),
  activity: z.string().min(1).max(50),
  timeOfDay: z.string().min(1).max(30),
  genres: z.array(z.string()).min(1).max(20),
  vocalPreference: z.string().max(30).optional(),
  languages: z.array(z.string()).max(20).default([]),
  rhythmSpeed: z.number().int().min(1).max(5),
  vocalsType: z.string().max(30).optional(),
  instruments: z.array(z.string()).max(20).default([]),
  bassWeight: z.string().max(20).optional(),
  stylePreference: z.string().max(30).optional(),
  recentFavorites: z.array(z.string()).max(3).default([]),
  exclusions: z.string().max(500).default('')
});

const profileSchema = z.object({
  description: z.string().max(2000),
  dominantGenres: z.array(z.string()).max(10),
  vibes: z.array(z.string()).max(10),
  attributes: attributesSchema
});

const recommendationSchema = z.object({
  spotifyId: z.string().max(100).nullable().optional(),
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  album: z.string().max(200).default(''),
  coverUrl: z.string().url().or(z.literal('')).default(''),
  spotifyUrl: z.string().url().or(z.literal('')).default(''),
  previewUrl: z.string().url().nullable().optional(),
  durationMs: z.number().int().nonnegative().nullable().optional(),
  genres: z.array(z.string()).default([]),
  score: z.number().int().min(0).max(100),
  whyRecommend: z.string().max(1000).default(''),
  attributes: attributesSchema
});

export const createSessionSchema = z.object({
  answers: answersSchema,
  profile: profileSchema,
  recommendations: z
    .array(recommendationSchema)
    .min(1)
    .max(50)
});

export type CreateSessionInput =
  z.infer<typeof createSessionSchema>;