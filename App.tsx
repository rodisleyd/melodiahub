
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Album, ViewType, PlayerState, Playlist, Track } from './types';
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
import { dbService } from './services/dbService';
import RadioSplash from './components/RadioSplash';
import EditPlaylistModal from './components/EditPlaylistModal';

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
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

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

  const COMMERCIAL_URL = "https://firebasestorage.googleapis.com/v0/b/melodiahub-80963.appspot.com/o/ads%2Fcommercial.mp4?alt=media";
  const PLAYS_BEFORE_AD = 5;

  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  // Load Albums and Playlists from Firestore
  useEffect(() => {
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
  }, []);

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
    const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
    if (!randomAlbum.tracks || randomAlbum.tracks.length === 0) return;
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
          setSplashData({ album, trackIndex });
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [isDataLoading, albums]);

  const handleToggleFavorite = async (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    setIsSidebarOpen(false);
  };

  const filteredTracks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];
    return albums.flatMap(album =>
      (album.tracks || [])
        .filter(track => track.title.toLowerCase().includes(query))
        .map(track => ({ ...track, album }))
    );
  }, [albums, searchQuery]);

  const filteredAlbums = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
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
    return playlists
      .filter(p => p.isPublic && p.ownerId !== userId)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [playlists, user]);

  const handleTrackAction = async (action: 'play' | 'favorite' | 'addToPlaylist' | 'share' | 'like', track: Track, album: Album) => {
    switch (action) {
      case 'favorite':
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
      case 'like':
        handleLike(album.id, track.id);
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
      ownerName: user?.name || 'Visitante',
      createdAt: Date.now()
    };
    const newId = await dbService.addPlaylist(newPlaylist);
    if (modalState.track) {
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

  const handleUpdatePlaylist = async (updatedPlaylist: Playlist) => {
    await dbService.updatePlaylist(updatedPlaylist);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    await dbService.deletePlaylist(playlistId);
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

  const renderMiniPlaylistCard = (playlist: Playlist) => (
    <div
      key={playlist.id}
      className="bg-[#333333]/20 p-3 rounded-2xl border border-[#333333] hover:bg-[#333333]/40 transition-all group flex items-center gap-3 w-full sm:w-64 flex-shrink-0"
    >
      <div
        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative cursor-pointer"
        onClick={() => handlePlayPlaylist(playlist, 0)}
      >
        <img src={playlist.coverUrl} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Icons.Play className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-white truncate">{playlist.name}</h4>
        <p className="text-[10px] text-[#FF6B35] truncate font-medium">{playlist.ownerName || 'Visitante'}</p>
      </div>
      <button
        onClick={() => handlePlayPlaylist(playlist, 0)}
        className="p-2 bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white rounded-full transition-all"
      >
        <Icons.Play className="w-3.5 h-3.5 ml-0.5" />
      </button>
    </div>
  );

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
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold truncate">{playlist.name}</h3>
          <p className="text-[#E0E0E0] text-sm">{playlist.tracks.length} músicas</p>
          {showOwner && playlist.ownerName && (
            <p className="text-xs text-[#FF6B35] mt-1 font-medium truncate">Por: {playlist.ownerName}</p>
          )}
        </div>
        {!showOwner && playlist.id !== '1' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingPlaylist(playlist);
              }}
              className="w-10 h-10 flex items-center justify-center bg-[#333333]/40 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-xl transition-all border border-white/5"
            >
              <Icons.Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Excluir playlist?')) handleDeletePlaylist(playlist.id);
              }}
              className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/10"
            >
              <Icons.Trash className="w-5 h-5" />
            </button>
          </div>
        )}
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
              <button onClick={() => handlePlayPlaylist(playlist, idx)} className="p-1.5 hover:text-[#FF6B35] transition-colors">
                <Icons.Play className="w-4 h-4" />
              </button>
            </div>
          ))
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen relative bg-[#1A1A2E] text-white">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1A1A2E] border-b border-[#333333] px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MelodiaHub" className="h-6 w-auto" />
          <span className="text-sm font-bold tracking-widest text-[#E0E0E0] uppercase">melody<span className="text-[#FF6B35]">HUB</span></span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white">
          <Icons.Menu className="w-6 h-6" />
        </button>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-24 md:pt-8 lg:p-12 overflow-x-hidden">
        {isAuthLoading || isDataLoading ? (
          <div className="flex items-center justify-center h-full">Carregando MelodiaHub...</div>
        ) : (
          <>
            {currentView === 'LOGIN' && <Login onViewChange={setCurrentView} />}
            {currentView === 'REGISTER' && <Register onViewChange={setCurrentView} />}
            {currentView === 'EXPLORE' && (
              <div className="animate-in fade-in duration-500">
                {/* EXPLORE VIEW SECTIONS */}
                <header className="hidden md:flex mb-12 flex-col xl:flex-row xl:items-end justify-between gap-8">
                  <div className="flex-1">
                    <h1 className="text-5xl font-semibold tracking-tight mb-4 text-white">Descubra novos sons</h1>
                    <p className="text-[#E0E0E0] text-lg max-w-2xl">O seu santuário digital para curadoria de áudio.</p>
                  </div>
                </header>

                {/* Search */}
                <div className="mb-12 max-w-xl">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Icons.Search className="w-5 h-5 text-[#E0E0E0]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3 bg-[#333333]/20 border border-[#333333] rounded-2xl text-white outline-none focus:border-[#FF6B35] transition-all"
                    />
                  </div>
                </div>

                {!searchQuery && (
                  <>
                    {/* 1. Álbuns em Destaque */}
                    <section className="mb-12">
                      <h2 className="text-xl md:text-2xl font-semibold border-b-2 border-[#FF6B35] pb-2 mb-8 inline-block">Álbuns em Destaque</h2>
                      <div className="flex md:grid overflow-x-auto md:overflow-visible pb-8 gap-6 scrollbar-hide md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredAlbums.map(album => (
                          <div key={album.id} className="w-72 flex-shrink-0 md:w-auto">{renderAlbumCard(album)}</div>
                        ))}
                      </div>
                    </section>

                    {/* 2. Em Alta */}
                    <section className="mb-12">
                      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <Icons.TrendingUp className="w-8 h-8 text-[#FF6B35]" /> Em Alta
                      </h2>
                      <div className="bg-[#333333]/20 rounded-3xl p-6 border border-[#333333]">
                        <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                          {albums.flatMap(a => (a.tracks || []).map(t => ({ ...t, album: a })))
                            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
                            .slice(0, 5)
                            .map((track, idx) => (
                              <div key={idx} onClick={() => handleSelectAlbum(track.album)} className="flex-shrink-0 w-64 md:w-auto bg-[#1A1A2E] p-3 rounded-xl flex items-center gap-3 border border-[#333333] cursor-pointer hover:border-[#FF6B35]">
                                <img src={track.album.coverUrl} className="w-12 h-12 rounded object-cover" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-white truncate">{track.title}</p>
                                  <p className="text-xs text-[#E0E0E0] truncate">{track.album.artist}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </section>

                    {/* 3. Playlists de Ouvintes */}
                    <section className="mb-12">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#FF6B35]">Playlists de Ouvintes</h2>
                        <button onClick={() => setCurrentView('COMMUNITY_PLAYLISTS')} className="text-xs font-bold uppercase tracking-widest text-[#E0E0E0] hover:text-[#FF6B35]">Veja +</button>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {communityPlaylists.slice(0, 4).map(playlist => (
                          <div key={playlist.id} onClick={() => handlePlayPlaylist(playlist)} className="bg-[#333333]/20 p-3 rounded-xl border border-[#333333] flex items-center gap-3 cursor-pointer">
                            <img src={playlist.coverUrl} className="w-10 h-10 rounded object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{playlist.name}</p>
                              <p className="text-[10px] text-[#FF6B35] truncate">{playlist.ownerName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {searchQuery && (
                  <section className="animate-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-semibold mb-8">Resultados para "{searchQuery}"</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredAlbums.map(album => renderAlbumCard(album))}
                    </div>
                  </section>
                )}

                <footer className="py-10 border-t border-[#333333]/50 text-center">
                  <p className="text-[#E0E0E0]/30 text-[10px] font-medium tracking-widest uppercase">Desenvolvido por: 2026 - Rodisley Comunicação Visual</p>
                </footer>
              </div>
            )}
            {currentView === 'FAVORITES' && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-4xl font-bold mb-8">Meus Favoritos</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {favoriteAlbums.map(renderAlbumCard)}
                </div>
              </div>
            )}
            {currentView === 'PLAYLISTS' && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-4xl font-bold mb-8">Minhas Playlists</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myPlaylists.map(playlist => renderPlaylistCard(playlist))}
                </div>
              </div>
            )}
            {currentView === 'COMMUNITY_PLAYLISTS' && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-4xl font-bold mb-8">Comunidade</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {communityPlaylists.map(playlist => renderPlaylistCard(playlist, true))}
                </div>
              </div>
            )}
            {currentView === 'MY_ALBUMS' && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-4xl font-bold mb-8">Minha Biblioteca</h1>
                <div className="grid grid-cols-1 gap-6">
                  {albums.map(album => (
                    <div key={album.id} className="bg-[#333333]/20 p-6 rounded-3xl border border-[#333333] flex items-center gap-6">
                      <img src={album.coverUrl} className="w-24 h-24 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{album.title}</h3>
                        <p className="text-[#E0E0E0]">{album.artist}</p>
                        <div className="flex gap-4 mt-4">
                          <button onClick={() => handleEditClick(album)} className="text-xs font-bold text-[#FF6B35]">EDITAR</button>
                          <button onClick={() => handleDeleteClick(album.id)} className="text-xs font-bold text-red-500">EXCLUIR</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {currentView === 'ADMIN_CREATE' && <AdminDashboard onAddAlbum={handleAddAlbum} />}
            {currentView === 'EDIT_ALBUM' && <AdminDashboard onAddAlbum={handleAddAlbum} albumToEdit={editingAlbum} onUpdateAlbum={handleUpdateAlbum} />}
            {currentView === 'SETTINGS' && <Settings onLogout={logout} />}
          </>
        )}
      </main>

      <Player
        playerState={playerState}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onVolumeChange={handleVolumeChange}
        onShare={(track, album) => handleTrackAction('share', track, album)}
        onToggleShuffle={handleToggleShuffle}
        onTrackPlay={(track, album) => dbService.incrementPlayCount(album.id, track.id)}
        onLike={handleLike}
        isRadioMode={isRadioMode}
        onToggleRadio={() => isRadioMode ? setIsRadioMode(false) : handleStartRadio()}
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
      <EditPlaylistModal
        isOpen={!!editingPlaylist}
        onClose={() => setEditingPlaylist(null)}
        playlist={editingPlaylist}
        onUpdate={handleUpdatePlaylist}
        onDelete={handleDeletePlaylist}
      />

      {showCommercial && (
        <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center p-4">
          <video
            src={COMMERCIAL_URL}
            autoPlay
            onEnded={() => { setShowCommercial(false); playRandomTrack(); }}
            className="max-w-4xl w-full aspect-video rounded-3xl"
          />
          <button onClick={() => { setShowCommercial(false); playRandomTrack(); }} className="mt-8 text-white/30 hover:text-white text-sm">Pular</button>
        </div>
      )}

      {showRadioSplash && !splashData && <RadioSplash onStart={handleStartRadio} />}

      {splashData && (
        <div onClick={() => { setIsRadioMode(false); setShowRadioSplash(false); handleSelectAlbum(splashData.album, splashData.trackIndex); setSplashData(null); }} className="fixed inset-0 z-[100] bg-[#1A1A2E] flex flex-col items-center justify-center p-6 cursor-pointer">
          <img src={splashData.album.coverUrl} className="w-64 h-64 md:w-80 md:h-80 rounded-3xl shadow-2xl mb-8" />
          <h2 className="text-3xl font-bold text-white mb-2">{splashData.album.tracks?.[splashData.trackIndex]?.title}</h2>
          <p className="text-xl text-[#FF6B35] font-medium">{splashData.album.artist}</p>
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
