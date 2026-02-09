
export interface Track {
  id: string;
  title: string;
  duration: string;
  url: string;
  isFavorite?: boolean;
  playCount?: number;
  likeCount?: number;
  videoUrl?: string;
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
  playCount?: number;
  likeCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'user' | 'admin';
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  coverUrl?: string;
  isPublic?: boolean;
  ownerId?: string;
  ownerName?: string;
  createdAt?: number;
}

export type ViewType = 'EXPLORE' | 'MY_ALBUMS' | 'FAVORITES' | 'PLAYLISTS' | 'SETTINGS' | 'ADMIN_CREATE' | 'LOGIN' | 'REGISTER' | 'EDIT_ALBUM' | 'COMMUNITY_PLAYLISTS';

export interface PlayerState {
  currentAlbum: Album | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  progress: number;
  isShuffle: boolean;
}
