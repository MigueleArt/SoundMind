import { supabaseAdmin } from '../config/supabase.js';

const historySelection = `
  id,
  user_id,
  mood,
  activity,
  time_of_day,
  genres,
  vocal_preference,
  languages,
  rhythm_speed,
  vocals_type,
  instruments,
  bass_weight,
  style_preference,
  recent_favorites,
  exclusions,
  profile_description,
  dominant_genres,
  vibes,
  valence,
  energy,
  tempo,
  acousticness,
  instrumentalness,
  danceability,
  created_at,
  recommendations (
    id,
    score,
    why_recommend,
    position,
    valence,
    energy,
    tempo,
    acousticness,
    instrumentalness,
    danceability,
    created_at,
    song:songs (
      id,
      spotify_id,
      title,
      artist,
      album,
      cover_url,
      spotify_url,
      preview_url,
      duration_ms,
      genres
    ),
    feedback (
      is_liked,
      user_id
    )
  )
`;

export async function findHistoryByUser(userId: string) {
  return supabaseAdmin
    .from('music_sessions')
    .select(historySelection)
    .eq('user_id', userId)
    .order('created_at', {
      ascending: false
    });
}

export async function findHistoryItem(
  userId: string,
  sessionId: string
) {
  return supabaseAdmin
    .from('music_sessions')
    .select(historySelection)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
}

export async function deleteHistoryItem(
  userId: string,
  sessionId: string
) {
  return supabaseAdmin
    .from('music_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
}