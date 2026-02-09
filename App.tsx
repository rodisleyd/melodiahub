
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Album, ViewType, PlayerState, Playlist } from './types';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Icons } from './constants';
import AlbumCard from './components/AlbumCard';
import ShareModal from './components/ShareModal';
import PlaylistModal from './components/PlaylistModal';
import Settings from './components/Settings';
import { Track } from './types';
import { dbService } from './services/dbService';
import RadioSplash from './components/RadioSplash';

const AppContent: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: '1', name: 'Minhas Curtidas', tracks: [], coverUrl: 'https://placehold.co/600x600?text=Playlist' }
  ]);
  const [currentView, setCurrentView] = useState<ViewType>('EXPLORE');
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRadioMode, setIsRadioMode] = useState(false);
  const [showRadioSplash, setShowRadioSplash] = useState(true);

  // Modal State
  const [modalState, setModalState] = useState<{
    type: 'SHARE' | 'PLAYLIST' | null;
    track: Track | null;
    album: Album | null;
  }>({ type: null, track: null, album: null });

  const [playerState, setPlayerState] = useState<PlayerState>({
    currentAlbum: null,
    currentTrackIndex: 0,
    isPlaying: false,
    volume: 80,
    progress: 0,
    isShuffle: false,
  });

  const [splashData, setSplashData] = useState<{ album: Album, trackIndex: number } | null>(null);
  const [radioPlaysCount, setRadioPlaysCount] = useState(0);
  const [showCommercial, setShowCommercial] = useState(false);

  const COMMERCIAL_URL = "https://firebasestorage.googleapis.com/v0/b/melodiahub-80963.appspot.com/o/ads%2Fcommercial.mp4?alt=media"; // Placeholder or real URL
  const PLAYS_BEFORE_AD = 5;

  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  // Load Albums and Playlists from Firestore
  useEffect(() => {
    // Initialize Guest ID for anonymous likes
    if (!localStorage.getItem('melodiahub_guest_id')) {
      localStorage.setItem('melodiahub_guest_id', 'guest_' + Math.random().toString(36).substr(2, 9));
    }

    const unsubscribeAlbums = dbService.subscribeToAlbums((fetchedAlbums) => {
      setAlbums(fetchedAlbums);
      setIsDataLoading(false);
    });

    const unsubscribePlaylists = dbService.subscribeToPlaylists((fetchedPlaylists) => {
      setPlaylists(fetchedPlaylists);
    });

    return () => {
      unsubscribeAlbums();
      unsubscribePlaylists();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const handleTogglePlay = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const handleSelectAlbum = (album: Album, startTrackIndex: number = 0) => {
    setIsRadioMode(false);
    setPlayerState((prev) => ({
      ...prev,
      currentAlbum: album,
      currentTrackIndex: startTrackIndex,
      isPlaying: true,
    }));
  };

  const playRandomTrack = useCallback(() => {
    if (albums.length === 0) return;

    // Pick a random album
    const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
    if (!randomAlbum.tracks || randomAlbum.tracks.length === 0) return;

    // Pick a random track from that album
    const randomTrackIndex = Math.floor(Math.random() * randomAlbum.tracks.length);

    setPlayerState((prev) => ({
      ...prev,
      currentAlbum: randomAlbum,
      currentTrackIndex: randomTrackIndex,
      isPlaying: true,
    }));
  }, [albums]);

  const handleStartRadio = () => {
    setIsRadioMode(true);
    setShowRadioSplash(false);
    playRandomTrack();
  };

  // Deep Linking Handler
  useEffect(() => {
    if (isDataLoading || albums.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const albumId = params.get('albumId');
    const trackId = params.get('trackId');

    if (albumId && trackId) {
      const album = albums.find((a) => a.id === albumId);
      if (album) {
        const tracks = album.tracks || [];
        const trackIndex = tracks.findIndex((t) => t.id === trackId);
        if (trackIndex !== -1) {
          // Instead of auto-playing (which blocks), show splash screen
          setSplashData({ album, trackIndex });
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [isDataLoading, albums]);

  const handleToggleFavorite = async (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    const albumToUpdate = albums.find(a => a.id === albumId);
    if (albumToUpdate) {
      const updatedAlbum = { ...albumToUpdate, isFavorite: !albumToUpdate.isFavorite };
      await dbService.updateAlbum(updatedAlbum);
    }
  };

  const handleLike = async (albumId: string, trackId?: string) => {
    try {
      const guestId = localStorage.getItem('melodiahub_guest_id');
      const effectiveUserId = user?.id || guestId || 'anonymous';

      await dbService.toggleLike(effectiveUserId, albumId, trackId);
    } catch (e) {
      console.error("Erro ao curtir:", e);
    }
  };

  const handleNext = useCallback(() => {
    if (isRadioMode) {
      if (radioPlaysCount + 1 >= PLAYS_BEFORE_AD) {
        setRadioPlaysCount(0);
        setShowCommercial(true);
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
        return;
      }
      setRadioPlaysCount(prev => prev + 1);
      playRandomTrack();
      return;
    }

    setPlayerState((prev) => {
      if (!prev.currentAlbum) return prev;

      let nextIndex;
      if (prev.isShuffle) {
        nextIndex = Math.floor(Math.random() * prev.currentAlbum.tracks.length);
        if (prev.currentAlbum.tracks.length > 1 && nextIndex === prev.currentTrackIndex) {
          nextIndex = (nextIndex + 1) % prev.currentAlbum.tracks.length;
        }
      } else {
        nextIndex = (prev.currentTrackIndex + 1) % prev.currentAlbum.tracks.length;
      }

      return { ...prev, currentTrackIndex: nextIndex, isPlaying: true };
    });
  }, [isRadioMode, playRandomTrack, radioPlaysCount, PLAYS_BEFORE_AD]);

  const handlePrev = useCallback(() => {
    setPlayerState((prev) => {
      if (!prev.currentAlbum) return prev;
      const prevIndex = prev.currentTrackIndex === 0
        ? prev.currentAlbum.tracks.length - 1
        : prev.currentTrackIndex - 1;
      return { ...prev, currentTrackIndex: prevIndex, isPlaying: true };
    });
  }, []);

  const handleVolumeChange = (vol: number) => {
    setPlayerState((prev) => ({ ...prev, volume: vol }));
  };

  const handleAddAlbum = async (newAlbum: Album) => {
    // We strip ID because dbService.addAlbum handles it (and AdminDashboard generated a temp one)
    const { id, ...albumData } = newAlbum;
    await dbService.addAlbum(albumData);
    setCurrentView('EXPLORE');
  };

  const handleUpdateAlbum = async (updatedAlbum: Album) => {
    await dbService.updateAlbum(updatedAlbum);
    setEditingAlbum(null);
    setCurrentView('MY_ALBUMS');
  };

  const handleEditClick = (album: Album) => {
    setEditingAlbum(album);
    setCurrentView('EDIT_ALBUM');
  };

  const handleDeleteClick = async (albumId: string) => {
    if (confirm('Tem certeza que deseja excluir este álbum?')) {
      await dbService.deleteAlbum(albumId);
    }
  };

  const handleViewChange = (view: ViewType) => {
    if ((view === 'ADMIN_CREATE' || view === 'SETTINGS') && !isAuthenticated) {
      setCurrentView('LOGIN');
      return;
    }
    setCurrentView(view);
  };

  const filteredAlbums = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      // Sort by popularity by default
      return [...albums].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    }
    return albums.filter(album =>
      album.title.toLowerCase().includes(query) ||
      album.artist.toLowerCase().includes(query) ||
      album.genre.toLowerCase().includes(query) ||
      (album.tracks && album.tracks.some(track => track.title.toLowerCase().includes(query)))
    );
  }, [albums, searchQuery]);

  const favoriteAlbums = useMemo(() => {
    return albums.filter(album => album.isFavorite);
  }, [albums]);

  const myPlaylists = useMemo(() => {
    const userId = user?.id || localStorage.getItem('melodiahub_guest_id');
    return playlists.filter(p => p.ownerId === userId);
  }, [playlists, user]);

  const communityPlaylists = useMemo(() => {
    const userId = user?.id || localStorage.getItem('melodiahub_guest_id');
    return playlists.filter(p => p.isPublic && p.ownerId !== userId);
  }, [playlists, user]);

  const handleTrackAction = async (action: 'play' | 'favorite' | 'addToPlaylist' | 'share', track: Track, album: Album) => {
    switch (action) {
      case 'favorite':
        // Update favorite status of a specific track inside an album
        // This requires updating the whole album doc
        const updatedTracks = album.tracks.map(t =>
          t.id === track.id ? { ...t, isFavorite: !t.isFavorite } : t
        );
        const updatedAlbum = { ...album, tracks: updatedTracks };
        await dbService.updateAlbum(updatedAlbum);
        break;
      case 'addToPlaylist':
        setModalState({ type: 'PLAYLIST', track, album });
        break;
      case 'share':
        setModalState({ type: 'SHARE', track, album });
        break;
    }
  };

  const handleCreatePlaylist = async (name: string, isPublic: boolean = false) => {
    const newPlaylist: Omit<Playlist, 'id'> = {
      name,
      tracks: [],
      coverUrl: 'https://placehold.co/600x600?text=Playlist',
      isPublic,
      ownerId: user?.id || localStorage.getItem('melodiahub_guest_id') || 'anonymous',
      ownerName: user?.name || 'Visitante'
    };

    const newId = await dbService.addPlaylist(newPlaylist);

    if (modalState.track) {
      // Since addPlaylist returns ID, we can do:
      const playlistWithId = { ...newPlaylist, id: newId };
      handleAddToPlaylist(newId, modalState.track, playlistWithId);
    }

    setCurrentView('PLAYLISTS');
  };

  const handleAddToPlaylist = async (playlistId: string, track: Track | null = modalState.track, playlistObj?: Playlist) => {
    if (!track) return;

    const playlist = playlistObj || playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (playlist.tracks.some(t => t.id === track.id)) {
      alert(`"${track.title}" já está na playlist "${playlist.name}"`);
      return;
    }

    const updatedPlaylist = { ...playlist, tracks: [...playlist.tracks, track] };
    await dbService.updatePlaylist(updatedPlaylist);
  };

  const handlePlayPlaylist = (playlist: Playlist, startIndex: number = 0) => {
    setIsRadioMode(false);
    const virtualAlbum: Album = {
      id: playlist.id,
      title: playlist.name,
      artist: 'Playlist',
      coverUrl: playlist.coverUrl || 'https://placehold.co/600x600?text=Playlist',
      genre: 'Mixed',
      year: new Date().getFullYear(),
      tracks: playlist.tracks,
      isFavorite: false
    };

    setPlayerState(prev => ({
      ...prev,
      currentAlbum: virtualAlbum,
      currentTrackIndex: startIndex,
      isPlaying: true,
    }));
  };

  const renderPlaylistCard = (playlist: Playlist, showOwner: boolean = false) => (
    <div key={playlist.id} className="bg-[#333333]/20 p-6 rounded-3xl border border-[#333333] hover:bg-[#333333]/40 transition-colors group">
      <div className="flex items-center gap-6 mb-6">
        <div
          className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl cursor-pointer hover:scale-105 transition-transform group/cover relative"
          onClick={() => handlePlayPlaylist(playlist, 0)}
        >
          <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-all duration-300">
            <Icons.Play className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold">{playlist.name}</h3>
          <p className="text-[#E0E0E0] text-sm">{playlist.tracks.length} músicas</p>
          {showOwner && playlist.ownerName && (
            <p className="text-xs text-[#FF6B35] mt-1 font-medium">Por: {playlist.ownerName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {playlist.tracks.length === 0 ? (
          <p className="text-[#E0E0E0]/50 text-sm italic">Playlist vazia.</p>
        ) : (
          playlist.tracks.slice(0, 5).map((track, idx) => (
            <div key={`${playlist.id}-${track.id}-${idx}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#333333]/60 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xs font-mono text-[#E0E0E0]/50 w-4">{(idx + 1).toString().padStart(2, '0')}</span>
                <span className="text-sm font-medium text-white truncate">{track.title}</span>
              </div>
              <button
                onClick={() => handlePlayPlaylist(playlist, idx)}
                className="p-1.5 hover:text-[#FF6B35] transition-colors"
              >
                <Icons.Play className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
        {playlist.tracks.length > 5 && (
          <p className="text-xs text-[#E0E0E0]/30 text-center pt-2 italic">e mais {playlist.tracks.length - 5} músicas...</p>
        )}
      </div>
    </div>
  );

  const renderAlbumCard = (album: Album) => (
    <AlbumCard
      key={album.id}
      album={album}
      expandedAlbumId={expandedAlbumId}
      onToggleExpand={(id) => setExpandedAlbumId(expandedAlbumId === id ? null : id)}
      onSelectAlbum={handleSelectAlbum}
      onToggleFavorite={handleToggleFavorite}
      onLike={handleLike}
      onTrackAction={handleTrackAction}
    />
  );

  const renderView = () => {
    if (isAuthLoading || isDataLoading) {
      return <div className="flex items-center justify-center h-full">Carregando MelodiaHub...</div>;
    }

    switch (currentView) {
      case 'LOGIN':
        return <Login onViewChange={setCurrentView} />;
      case 'REGISTER':
        return <Register onViewChange={setCurrentView} />;
      case 'EXPLORE':
        return (
          <div className="">
            <header className="mb-10">
              <h1 className="text-5xl font-semibold tracking-tight mb-4">Descubra novos sons</h1>
              <p className="text-[#E0E0E0] text-lg max-w-2xl">
                O seu santuário digital para curadoria de áudio. Explore álbuns selecionados por artistas independentes.
              </p>
            </header>

            <div className="mb-12 max-w-xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#E0E0E0] group-focus-within:text-[#FF6B35] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar álbuns, artistas ou gêneros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3.5 bg-[#333333]/20 border border-[#333333] rounded-2xl text-white placeholder-[#E0E0E0]/50 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-all shadow-lg text-sm sm:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#E0E0E0] hover:text-[#FF6B35] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            {!searchQuery && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Icons.TrendingUp className="w-8 h-8 text-[#FF6B35]" />
                  Em Alta
                </h2>

                <div className="bg-[#333333]/20 rounded-3xl p-4 sm:p-6 border border-[#333333]">
                  {/* Top Tracks Logic */}
                  {(() => {
                    const allTracks = albums.flatMap(a => (a.tracks || []).map(t => ({ ...t, album: a })));
                    const topTracks = allTracks.sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5);

                    if (topTracks.length === 0 || !topTracks[0].playCount) {
                      return <p className="text-[#E0E0E0]/50 italic text-sm">As estatísticas aparecerão conforme as músicas forem tocadas.</p>;
                    }

                    return (
                      <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide -mx-2 px-2 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:overflow-visible">
                        {topTracks.map((track, idx) => (
                          <div
                            key={`${track.album.id}-${track.id}`}
                            className="flex-shrink-0 w-64 md:w-auto bg-[#1A1A2E] p-2.5 rounded-xl hover:bg-[#333333] transition-all group flex items-center gap-3 border border-[#333333]/50 hover:border-[#FF6B35]/50 cursor-pointer"
                            onClick={() => {
                              const trackIndex = (track.album.tracks || []).findIndex(t => t.id === track.id);
                              handleSelectAlbum(track.album, trackIndex !== -1 ? trackIndex : 0);
                            }}
                          >
                            <div className="relative w-14 h-14 flex-shrink-0">
                              <img src={track.album.coverUrl} className="w-full h-full object-cover rounded-md" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md text-white">
                                <Icons.Play className="w-5 h-5" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-bold text-[#FF6B35]">#{idx + 1}</span>
                                <h3 className="font-bold text-white text-sm truncate" title={track.title}>{track.title}</h3>
                              </div>
                              <p className="text-xs text-[#E0E0E0] truncate">{track.album.artist}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold border-b-2 border-[#FF6B35] pb-2">
                  {searchQuery ? `Resultados para "${searchQuery}"` : 'Álbuns em Destaque'}
                </h2>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-[#E0E0E0] hover:text-[#FF6B35] underline transition-colors"
                  >
                    Limpar pesquisa
                  </button>
                )}
              </div>

              {filteredAlbums.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredAlbums.map(renderAlbumCard)}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#333333]/10 rounded-[3rem] border border-dashed border-[#333333]">
                  <Icons.Music className="w-16 h-16 text-[#333333] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#E0E0E0]">
                    {searchQuery ? 'Nenhum álbum encontrado' : 'Nenhum álbum disponível'}
                  </h3>
                  {!searchQuery && (
                    <p className="mt-2 text-[#E0E0E0]/60">Seja o primeiro a publicar um álbum!</p>
                  )}
                </div>
              )}
            </section>
          </div>
        );
      case 'FAVORITES':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-700">
            <header className="mb-12">
              <h1 className="text-5xl font-semibold tracking-tight mb-4">Meus Favoritos</h1>
              <p className="text-[#E0E0E0] text-lg max-w-2xl">
                Sua coleção pessoal de obras que tocam a alma.
              </p>
            </header>

            <section>
              {favoriteAlbums.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {favoriteAlbums.map(renderAlbumCard)}
                </div>
              ) : (
                <div className="text-center py-32 bg-[#333333]/10 rounded-[3rem] border border-dashed border-[#333333]">
                  <Icons.Star className="w-16 h-16 text-[#333333] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#E0E0E0]">Você ainda não tem favoritos</h3>
                  <p className="text-[#E0E0E0]/60 mt-2">Clique na estrela nos álbuns para adicioná-los aqui.</p>
                  <button
                    onClick={() => setCurrentView('EXPLORE')}
                    className="mt-6 text-[#FF6B35] font-semibold hover:underline"
                  >
                    Explorar músicas
                  </button>
                </div>
              )}

              {/* Favorite Tracks Section */}
              <div className="mt-16">
                <h2 className="text-2xl font-semibold mb-6 border-b-2 border-[#FF6B35] pb-2 inline-block">Músicas Curtidas</h2>
                <div className="bg-[#333333]/20 rounded-3xl p-6 border border-[#333333]">
                  {albums.flatMap(a => (a.tracks || []).map(t => ({ ...t, album: a }))).filter(t => t.isFavorite).length > 0 ? (
                    <div className="space-y-2">
                      {albums.flatMap(a => (a.tracks || []).map(t => ({ ...t, album: a })))
                        .filter(t => t.isFavorite)
                        .map((track, idx) => (
                          <div key={`${track.album.id}-${track.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#333333]/40 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#333333]">
                                <img src={track.album.coverUrl} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{track.title}</p>
                                <p className="text-xs text-[#E0E0E0]">{track.album.artist}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleTrackAction('favorite', track, track.album)}
                                className="p-2 text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors"
                              >
                                <Icons.Star className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  // Find track in original album to play with context
                                  const tracks = track.album.tracks || [];
                                  const trackIndex = tracks.findIndex(t => t.id === track.id);
                                  handleSelectAlbum(track.album, trackIndex !== -1 ? trackIndex : 0);
                                }}
                                className="p-2 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors"
                              >
                                <Icons.Play className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <p className="text-[#E0E0E0]/50 italic text-center py-8">Nenhuma música favoritada ainda.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        );
      case 'PLAYLISTS':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-700">
            <header className="mb-12">
              <h1 className="text-5xl font-semibold tracking-tight mb-4">Minhas Playlists</h1>
              <p className="text-[#E0E0E0]">Suas seleções pessoais de faixas.</p>
            </header>
            {myPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myPlaylists.map(playlist => renderPlaylistCard(playlist))}
              </div>
            ) : (
              <div className="text-center py-20 bg-[#333333]/10 rounded-[3rem] border border-dashed border-[#333333]">
                <Icons.List className="w-16 h-16 text-[#333333] mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Nenhuma playlist criada</h3>
                <p className="mt-2 text-[#E0E0E0]/60">Crie sua primeira playlist para começar!</p>
              </div>
            )}
          </div>
        );
      case 'COMMUNITY_PLAYLISTS':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12">
              <h1 className="text-5xl font-semibold tracking-tight mb-4">Comunidade</h1>
              <p className="text-[#E0E0E0]">Explore playlists compartilhadas por outros ouvintes.</p>
            </header>
            {communityPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {communityPlaylists.map(playlist => renderPlaylistCard(playlist, true))}
              </div>
            ) : (
              <div className="text-center py-20 bg-[#333333]/10 rounded-[3rem] border border-dashed border-[#333333]">
                <Icons.TrendingUp className="w-16 h-16 text-[#333333] mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Nada por aqui ainda</h3>
                <p className="mt-2 text-[#E0E0E0]/60">Seja o primeiro a compartilhar uma playlist pública!</p>
              </div>
            )}
          </div>
        );
      case 'MY_ALBUMS':
        return (
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <h2 className="text-4xl font-semibold mb-8">Minha Biblioteca</h2>
            <div className="grid grid-cols-1 gap-6">
              {albums.map(album => (
                <div key={album.id} className="bg-[#333333]/20 p-6 rounded-3xl border border-[#333333] group hover:bg-[#333333]/40 transition-colors">
                  <div className="flex gap-6 items-center">
                    <div className="relative w-24 h-24 flex-shrink-0 cursor-pointer" onClick={() => handleSelectAlbum(album)}>
                      <img
                        src={album.coverUrl}
                        className="w-full h-full rounded-xl object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=Sem+Imagem';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-xl">
                        <Icons.Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{album.title}</h3>
                      <p className="text-[#E0E0E0]">{album.tracks.length} faixas</p>
                      <div className="flex gap-4 mt-4 items-center flex-wrap">
                        <button
                          onClick={() => handleSelectAlbum(album)}
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-white hover:text-[#FF6B35] transition-colors"
                        >
                          <Icons.Play className="w-3 h-3" /> Tocar
                        </button>
                        <button
                          onClick={() => setExpandedAlbumId(expandedAlbumId === album.id ? null : album.id)}
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-[#E0E0E0] hover:text-[#FF6B35] transition-colors"
                        >
                          <Icons.List className="w-4 h-4" /> {expandedAlbumId === album.id ? 'Ocultar Faixas' : 'Ver Faixas'}
                        </button>
                        <button
                          onClick={() => handleEditClick(album)}
                          className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35] hover:text-[#FF8C61]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(album.id)}
                          className="text-xs font-semibold uppercase tracking-widest text-[#E0E0E0] hover:text-red-400"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Faixas Expandida */}
                  {expandedAlbumId === album.id && (
                    <div className="mt-6 pt-6 border-t border-[#333333]/50 space-y-2 animate-in slide-in-from-top-2">
                      {album.tracks.length === 0 ? (
                        <p className="text-sm text-[#E0E0E0]/50 italic">Sem faixas neste álbum.</p>
                      ) : (
                        album.tracks.map((track, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#333333]/40 transition-colors group/track">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-mono text-[#E0E0E0]/50 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                              <span className="text-sm font-medium text-white">{track.title}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover/track:opacity-100 transition-opacity">
                              <button
                                title="Tocar"
                                className="p-2 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectAlbum(album, idx);
                                }}
                              >
                                <Icons.Play className="w-4 h-4" />
                              </button>
                              <button
                                title="Adicionar à Playlist"
                                className="p-2 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors"
                                onClick={() => handleTrackAction('addToPlaylist', track, album)}
                              >
                                <Icons.Plus className="w-4 h-4" />
                              </button>
                              <button
                                title="Favoritar"
                                className={`p-2 hover:bg-[#333333] rounded-full transition-colors ${track.isFavorite ? 'text-[#FF6B35]' : 'text-[#E0E0E0] hover:text-[#FF6B35]'}`}
                                onClick={() => handleTrackAction('favorite', track, album)}
                              >
                                <Icons.Star className="w-4 h-4" />
                              </button>
                              <button
                                title="Compartilhar"
                                className="p-2 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors"
                                onClick={() => handleTrackAction('share', track, album)}
                              >
                                <Icons.Share className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'ADMIN_CREATE':
        if (!isAuthenticated) return <Login onViewChange={setCurrentView} />;
        return <AdminDashboard onAddAlbum={handleAddAlbum} />;
      case 'EDIT_ALBUM':
        if (!isAuthenticated) return <Login onViewChange={setCurrentView} />;
        return <AdminDashboard onAddAlbum={handleAddAlbum} albumToEdit={editingAlbum} onUpdateAlbum={handleUpdateAlbum} />;
      case 'SETTINGS':
        if (!isAuthenticated) return <Login onViewChange={setCurrentView} />;
        return (
          <Settings onLogout={logout} />
        );
      default:
        return null;
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen relative">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#1A1A2E]/90 backdrop-blur-md border-b border-[#333333] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-white hover:bg-[#333333] rounded-lg">
            <Icons.Menu className="w-6 h-6" />
          </button>
          <img src="/logo.png" alt="MelodiaHub" className="h-8 w-auto" />
        </div>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-24 md:pt-8 lg:p-12 overflow-x-hidden">
        {renderView()}
        <div className="h-40 md:h-32 w-full flex-shrink-0" aria-hidden="true" />
      </main>

      <Player
        playerState={playerState}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onVolumeChange={handleVolumeChange}
        onShare={(track, album) => handleTrackAction('share', track, album)}
        onToggleShuffle={handleToggleShuffle}
        onTrackPlay={(track, album) => {
          dbService.incrementPlayCount(album.id, track.id);
        }}
        onLike={handleLike}
        isRadioMode={isRadioMode}
        onToggleRadio={() => {
          if (!isRadioMode) {
            handleStartRadio();
          } else {
            setIsRadioMode(false);
          }
        }}
      />

      <ShareModal
        isOpen={modalState.type === 'SHARE'}
        onClose={() => setModalState({ ...modalState, type: null })}
        track={modalState.track}
        album={modalState.album}
      />

      <PlaylistModal
        isOpen={modalState.type === 'PLAYLIST'}
        onClose={() => setModalState({ ...modalState, type: null })}
        playlists={myPlaylists}
        onCreatePlaylist={handleCreatePlaylist}
        onToBeAddedToPlaylist={handleAddToPlaylist}
      />

      {showCommercial && (
        <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center p-4">
          <div className="max-w-4xl w-full aspect-video bg-[#1A1A2E] rounded-3xl overflow-hidden shadow-2xl relative border border-[#333333]">
            <video
              src={COMMERCIAL_URL}
              autoPlay
              onEnded={() => {
                setShowCommercial(false);
                playRandomTrack();
              }}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-6 right-6 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
              <span className="text-white text-xs font-bold tracking-widest uppercase">Anúncio • MelodiaHub</span>
            </div>
          </div>
          <button
            onClick={() => {
              setShowCommercial(false);
              playRandomTrack();
            }}
            className="mt-8 text-white/30 hover:text-white text-sm underline transition-colors"
          >
            Pular (Desenvolvimento)
          </button>
        </div>
      )}

      {/* SPLASH SCREEN FOR RADIO MELODYHUB */}
      {showRadioSplash && !splashData && (
        <RadioSplash onStart={handleStartRadio} />
      )}

      {/* SPLASH SCREEN FOR DEEP LINKING */}
      {splashData && (
        <div
          className="fixed inset-0 z-[100] bg-[#1A1A2E] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 cursor-pointer"
          onClick={() => {
            setIsRadioMode(false);
            setShowRadioSplash(false);
            handleSelectAlbum(splashData.album, splashData.trackIndex);
            setSplashData(null);
          }}
        >
          <div className="text-center space-y-8 max-w-md w-full animate-in zoom-in-90 duration-500 delay-150">
            <div className="relative group mx-auto w-64 h-64 md:w-80 md:h-80">
              <img
                src={splashData.album.coverUrl}
                alt={splashData.album.title}
                className="w-full h-full object-cover rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors rounded-3xl">
                <div className="w-20 h-20 bg-[#FF6B35] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,107,53,0.6)] animate-pulse">
                  <Icons.Play className="w-10 h-10 text-white ml-2" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {splashData.album.tracks?.[splashData.trackIndex]?.title || 'Música Desconhecida'}
              </h2>
              <p className="text-xl text-[#FF6B35] font-medium">
                {splashData.album.artist}
              </p>
              <p className="text-[#E0E0E0]/60 text-sm uppercase tracking-widest pt-4">
                Toque em qualquer lugar para ouvir
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
