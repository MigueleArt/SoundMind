export function getPlatformLinks(song: { 
  title: string; 
  artist: string; 
  spotifyUrl?: string; 
  youtubeMusicUrl?: string; 
  appleMusicUrl?: string; 
  deezerUrl?: string; 
}) {
  const query = encodeURIComponent(`${song.title} ${song.artist}`);
  
  return {
    spotify: song.spotifyUrl || `https://open.spotify.com/search/${query}`,
    youtubeMusic: song.youtubeMusicUrl || `https://music.youtube.com/search?q=${query}`,
    appleMusic: song.appleMusicUrl || `https://music.apple.com/us/search?term=${query}`,
    deezer: song.deezerUrl || `https://www.deezer.com/search/${query}`,
  };
}