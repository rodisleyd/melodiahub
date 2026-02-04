
export interface Track {
  id: string;
  title: string;
  duration: string;
  url: string;
  isFavorite?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  genre: string;
  tracks: Track[];
  year: number;
  isFavorite?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  coverUrl?: string;
}

export type ViewType = 'EXPLORE' | 'MY_ALBUMS' | 'FAVORITES' | 'PLAYLISTS' | 'SETTINGS' | 'ADMIN_CREATE' | 'LOGIN' | 'REGISTER' | 'EDIT_ALBUM';

export interface PlayerState {
  currentAlbum: Album | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  progress: number;
  isShuffle: boolean;
}
