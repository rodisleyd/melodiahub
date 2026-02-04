
import { Album } from '../types';

export const MOCK_ALBUMS: Album[] = [
  {
    id: '1',
    title: 'Midnight Echoes',
    artist: 'Luna Ray',
    coverUrl: 'https://picsum.photos/seed/echoes/600/600',
    genre: 'Synthwave',
    year: 2024,
    tracks: [
      { id: '1-1', title: 'Neon Pulse', duration: '3:45', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { id: '1-2', title: 'Starlight Drive', duration: '4:20', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { id: '1-3', title: 'Binary Dreams', duration: '2:55', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    ]
  },
  {
    id: '2',
    title: 'Forest Whispers',
    artist: 'Silvan Soul',
    coverUrl: 'https://picsum.photos/seed/forest/600/600',
    genre: 'Ambient',
    year: 2023,
    tracks: [
      { id: '2-1', title: 'Mist Rising', duration: '5:10', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { id: '2-2', title: 'Ancient Oaks', duration: '6:30', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    ]
  },
  {
    id: '3',
    title: 'Urban Rhythm',
    artist: 'Metro Beats',
    coverUrl: 'https://picsum.photos/seed/urban/600/600',
    genre: 'Lo-Fi',
    year: 2024,
    tracks: [
      { id: '3-1', title: 'Concrete Jungle', duration: '2:30', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
      { id: '3-2', title: 'Skyline Coffee', duration: '3:15', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    ]
  },
  {
    id: '4',
    title: 'Ocean Deep',
    artist: 'Aquatic Harmonies',
    coverUrl: 'https://picsum.photos/seed/ocean/600/600',
    genre: 'Electronic',
    year: 2024,
    tracks: [
      { id: '4-1', title: 'Tidal Flow', duration: '4:12', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    ]
  }
];
