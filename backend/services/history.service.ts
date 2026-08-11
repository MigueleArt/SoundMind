function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function mapHistoryItem(session: any, userId: string) {
  const recommendations = (session.recommendations ?? [])
    .sort(
      (a: any, b: any) =>
        (a.position ?? 999) - (b.position ?? 999)
    )
    .map((recommendation: any) => {
      const song = firstRelation<any>(recommendation.song);

      const ownFeedback = (
        recommendation.feedback ?? []
      ).find(
        (item: any) => item.user_id === userId
      );

      return {
        id: recommendation.id,
        spotifyId: song?.spotify_id ?? null,
        title: song?.title ?? '',
        artist: song?.artist ?? '',
        album: song?.album ?? '',
        coverUrl: song?.cover_url ?? '',
        spotifyUrl: song?.spotify_url ?? '',
        previewUrl: song?.preview_url ?? null,
        durationMs: song?.duration_ms ?? null,
        genres: song?.genres ?? [],
        score: recommendation.score,
        whyRecommend:
          recommendation.why_recommend ?? '',
        attributes: {
          valence: recommendation.valence ?? 0,
          energy: recommendation.energy ?? 0,
          tempo: recommendation.tempo ?? 0,
          acousticness:
            recommendation.acousticness ?? 0,
          instrumentalness:
            recommendation.instrumentalness ?? 0,
          danceability:
            recommendation.danceability ?? 0
        },
        feedback:
          ownFeedback?.is_liked ?? null
      };
    });

  const likes: Record<string, boolean> = {};

  for (const recommendation of recommendations) {
    if (recommendation.feedback !== null) {
      likes[recommendation.id] =
        recommendation.feedback;
    }
  }

  return {
    id: session.id,
    createdAt: session.created_at,

    answers: {
      mood: session.mood,
      activity: session.activity,
      timeOfDay: session.time_of_day,
      genres: session.genres ?? [],
      vocalPreference:
        session.vocal_preference ?? 'ambas',
      languages: session.languages ?? [],
      rhythmSpeed: session.rhythm_speed ?? 3,
      vocalsType:
        session.vocals_type ?? 'sin-preferencia',
      instruments: session.instruments ?? [],
      bassWeight: session.bass_weight ?? 'medio',
      stylePreference:
        session.style_preference ?? 'ambas',
      recentFavorites:
        session.recent_favorites ?? [],
      exclusions: session.exclusions ?? ''
    },

    profile: {
      description:
        session.profile_description ?? '',
      dominantGenres:
        session.dominant_genres ?? [],
      vibes: session.vibes ?? [],
      attributes: {
        valence: session.valence ?? 0,
        energy: session.energy ?? 0,
        tempo: session.tempo ?? 0,
        acousticness:
          session.acousticness ?? 0,
        instrumentalness:
          session.instrumentalness ?? 0,
        danceability:
          session.danceability ?? 0
      },
      createdAt: session.created_at
    },

    recommendations,
    likes
  };
}