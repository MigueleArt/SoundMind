import { supabaseAdmin } from '../config/supabase';
import type { CreateSessionInput } from '../schemas/session.schema';

export async function findOrCreateSong(song: CreateSessionInput['recommendations'][number]) {
  if (song.spotifyId) {
    const { data } = await supabaseAdmin
      .from('songs')
      .select('id')
      .eq('spotify_id', song.spotifyId)
      .maybeSingle();

    if (data) return data.id;
  }

  const { data: existing } = await supabaseAdmin
    .from('songs')
    .select('id')
    .eq('title', song.title)
    .eq('artist', song.artist)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin
    .from('songs')
    .insert({
      spotify_id: song.spotifyId ?? null,
      title: song.title,
      artist: song.artist,
      album: song.album || null,
      cover_url: song.coverUrl || null,
      spotify_url: song.spotifyUrl || null,
      preview_url: song.previewUrl ?? null,
      duration_ms: song.durationMs ?? null,
      genres: song.genres
    })
    .select('id')
    .single();

  if (error) throw error;

  return data.id;
}

export async function createMusicSession(
  userId: string,
  input: CreateSessionInput
) {
  const { answers, profile, recommendations } = input;

  const { data: session, error: sessionError } =
    await supabaseAdmin
      .from('music_sessions')
      .insert({
        user_id: userId,
        mood: answers.mood,
        activity: answers.activity,
        time_of_day: answers.timeOfDay,
        genres: answers.genres,
        vocal_preference: answers.vocalPreference ?? null,
        languages: answers.languages,
        rhythm_speed: answers.rhythmSpeed,
        vocals_type: answers.vocalsType ?? null,
        instruments: answers.instruments,
        bass_weight: answers.bassWeight ?? null,
        style_preference: answers.stylePreference ?? null,
        recent_favorites: answers.recentFavorites,
        exclusions: answers.exclusions,
        profile_description: profile.description,
        dominant_genres: profile.dominantGenres,
        vibes: profile.vibes,
        valence: profile.attributes.valence,
        energy: profile.attributes.energy,
        tempo: profile.attributes.tempo,
        acousticness: profile.attributes.acousticness,
        instrumentalness: profile.attributes.instrumentalness,
        danceability: profile.attributes.danceability
      })
      .select('id')
      .single();

  if (sessionError) throw sessionError;

  try {
    for (let index = 0; index < recommendations.length; index++) {
      const recommendation = recommendations[index];
      const songId = await findOrCreateSong(recommendation);

      const { error } = await supabaseAdmin
        .from('recommendations')
        .insert({
          session_id: session.id,
          song_id: songId,
          score: recommendation.score,
          why_recommend: recommendation.whyRecommend,
          position: index + 1,
          valence: recommendation.attributes.valence,
          energy: recommendation.attributes.energy,
          tempo: recommendation.attributes.tempo,
          acousticness: recommendation.attributes.acousticness,
          instrumentalness:
            recommendation.attributes.instrumentalness,
          danceability:
            recommendation.attributes.danceability
        });

      if (error) throw error;
    }

    return session.id;
  } catch (error) {
    // La eliminación se propaga a recomendaciones por ON DELETE CASCADE.
    await supabaseAdmin
      .from('music_sessions')
      .delete()
      .eq('id', session.id);

    throw error;
  }
}