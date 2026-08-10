// Usamos (import.meta as any) para evitar el error de tipos de TypeScript
const CLIENT_ID = (import.meta as any).env?.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = (import.meta as any).env?.VITE_SPOTIFY_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private'
].join(' ');

// In modern Spotify flows for SPAs we use Authorization Code + PKCE.
function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
}

function generateCodeVerifier(length = 64) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < length; i++) verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  return verifier;
}

export const loginWithSpotify = async (): Promise<void> => {
  if (!CLIENT_ID) {
    console.error('⚠️ VITE_SPOTIFY_CLIENT_ID no está definido en el archivo .env');
    alert('Por favor, configura VITE_SPOTIFY_CLIENT_ID en tu archivo .env');
    return;
  }

  const codeVerifier = generateCodeVerifier(128);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  try {
    localStorage.setItem('soundmind_spotify_code_verifier', codeVerifier);
  } catch (e) {
    console.warn('No se pudo almacenar code_verifier en localStorage', e);
  }

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&code_challenge_method=S256&code_challenge=${encodeURIComponent(codeChallenge)}&show_dialog=true`;
  window.location.href = authUrl;
};

export const getCodeFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    // remove code param from url
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  }
  return code;
};

export interface SpotifyTrackSearch {
  title: string;
  artist: string;
  spotifyUrl?: string;
  spotifyUri?: string;
}

export const exportPlaylistToSpotify = async (
  accessToken: string,
  trackSearches: SpotifyTrackSearch[],
  playlistName: string = 'SoundMind Playlist 🧠✨'
): Promise<string> => {
  if (!accessToken) {
    throw new Error('No hay token de acceso a Spotify.');
  }

  const userRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!userRes.ok) {
    throw new Error('Error al obtener el perfil de usuario en Spotify.');
  }

  const userData = await userRes.json();
  const createRes = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: playlistName,
      description: 'Playlist creada automáticamente por SoundMind 🧠✨',
      public: false
    })
  });

  if (!createRes.ok) {
    throw new Error('Error al crear la playlist en Spotify.');
  }

  const playlistData = await createRes.json();
  const cleanTrackUris: string[] = [];

  for (const track of trackSearches) {
    if (track.spotifyUri && track.spotifyUri.startsWith('spotify:track:')) {
      cleanTrackUris.push(track.spotifyUri);
      continue;
    }

    if (track.spotifyUrl) {
      const match = track.spotifyUrl.match(/track[\/:]([a-zA-Z0-9]+)/);
      if (match) {
        cleanTrackUris.push(`spotify:track:${match[1]}`);
        continue;
      }
    }

    const query = encodeURIComponent(`${track.title} ${track.artist}`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!searchRes.ok) {
      console.warn(`No se pudo buscar pista: ${track.title} - ${track.artist}`);
      continue;
    }

    const searchData = await searchRes.json();
    const found = searchData.tracks?.items?.[0];
    if (found?.uri) {
      cleanTrackUris.push(found.uri);
    }
  }

  if (cleanTrackUris.length > 0) {
    const addTracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: cleanTrackUris })
    });

    if (!addTracksRes.ok) {
      console.warn('Se creó la playlist pero hubo un detalle al insertar las canciones.');
    }
  }

  return playlistData.external_urls?.spotify || 'https://open.spotify.com';
};
