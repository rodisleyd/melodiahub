
import React, { useState, useEffect, useRef } from 'react';
import { Album, Track } from '../types';
import { Icons } from '../constants';
import { dbService } from '../services/dbService';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onAddAlbum: (album: Album) => Promise<void>;
  albumToEdit?: Album | null;
  onUpdateAlbum?: (album: Album) => Promise<void>;
}

const GENRES = [
  "Pop", "Rock", "Hip-Hop", "Rap", "R&B", "Soul", "Country", "Jazz", "Blues",
  "Classical", "Metal", "Punk", "Indie", "Alternative", "Folk", "Reggae",
  "Electronic", "House", "Techno", "Trance", "Dubstep", "Drum & Bass",
  "Ambient", "Synthwave", "Lo-Fi", "Disco", "Funk", "Latin", "K-Pop", "J-Pop",
  "Soundtrack", "Podcast", "Sertanejo", "Samba", "Pagode", "Brega",
  "Balada Pop", "Surf Music", "Instrumental", "Bossa Nova", "Gospel", "Cordel"
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAddAlbum, albumToEdit, onUpdateAlbum }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ALBUMS' | 'USERS'>('ALBUMS');

  // Set default tab based on permission
  useEffect(() => {
    if (!isAdmin) {
      setActiveTab('ALBUMS');
    } else if (albumToEdit) {
      setActiveTab('ALBUMS');
    } else if (activeTab === 'ALBUMS' && !albumToEdit) {
      // Keep default if already set, but if we just mounted as admin, maybe OVERVIEW?
      // Let's rely on state init but this effect runs on mount/updates
    }
  }, [isAdmin, albumToEdit]);

  // Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tracks, setTracks] = useState<Partial<Track>[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data State
  const [stats, setStats] = useState({ totalUsers: 0, totalPlays: 0, totalAlbums: 0 });
  const [users, setUsers] = useState<any[]>([]);

  // Temporary storage for files to upload
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [trackFiles, setTrackFiles] = useState<Map<string, File>>(new Map());

  // Load Data on Mount
  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadUsers();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    const data = await dbService.getStats();
    setStats(data);
  };

  const loadUsers = async () => {
    const data = await dbService.getAllUsers();
    setUsers(data);
  };

  useEffect(() => {
    if (albumToEdit) {
      setActiveTab('ALBUMS');
      setTitle(albumToEdit.title);
      setArtist(albumToEdit.artist);
      setGenre(albumToEdit.genre);
      setCoverUrl(albumToEdit.coverUrl);
      setTracks(albumToEdit.tracks);
      setCoverFile(null);
      setTrackFiles(new Map());
      setTermsAccepted(true); // Assume editing implies previous acceptance
    }
  }, [albumToEdit]);

  const handlePromoteUser = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await dbService.updateUserRole(userId, newRole);
    loadUsers(); // Refresh
  };

  // ... file handlers ...

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newTracks: Partial<Track>[] = [];
      const newFiles = new Map(trackFiles);

      Array.from(files).forEach((file, idx) => {
        const tempId = `temp-${Date.now()}-${idx}`;
        newTracks.push({
          id: tempId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          duration: '0:00', // We can't easily get duration without reading the audio
          url: URL.createObjectURL(file) // Preview URL
        });
        newFiles.set(tempId, file);
      });

      setTracks([...tracks, ...newTracks]);
      setTrackFiles(newFiles);
    }
  };

  const handleCoverSelect = (file: File) => {
    setCoverFile(file);
    setCoverUrl(URL.createObjectURL(file));
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleCoverSelect(file);
      } else {
        alert('Por favor, envie apenas arquivos de imagem.');
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleCoverSelect(files[0]);
    }
  };

  // ... submit handler ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!termsAccepted) {
      alert("Você precisa confirmar a posse dos direitos autorais.");
      return;
    }

    setLoading(true);

    let finalCoverUrl = coverUrl;
    let finalTracks: Track[] = [];

    try {
      // Upload Cover
      if (coverFile) {
        finalCoverUrl = await dbService.uploadFile(coverFile, 'covers');
      }

      // Upload Tracks
      finalTracks = await Promise.all(tracks.map(async (track) => {
        const file = track.id ? trackFiles.get(track.id) : undefined;
        if (file) {
          const url = await dbService.uploadFile(file, 'tracks');
          return {
            ...track,
            url,
            playCount: 0
          } as Track;
        }
        return track as Track;
      }));

      const albumData: Album = {
        id: albumToEdit ? albumToEdit.id : Date.now().toString(),
        title,
        artist,
        genre,
        year: albumToEdit ? albumToEdit.year : new Date().getFullYear(),
        coverUrl: finalCoverUrl || 'https://picsum.photos/seed/new/600/600',
        tracks: finalTracks,
        isFavorite: albumToEdit ? albumToEdit.isFavorite : false,
        playCount: albumToEdit ? albumToEdit.playCount : 0
      };

      if (albumToEdit && onUpdateAlbum) {
        await onUpdateAlbum(albumData);
        alert('Álbum atualizado com sucesso!');
      } else {
        await onAddAlbum(albumData);
        alert('Álbum criado com sucesso!');
        // Reset
        setTitle('');
        setArtist('');
        setGenre('');
        setCoverUrl('');
        setTracks([]);
        setCoverFile(null);
        setTrackFiles(new Map());
        setTermsAccepted(false);
      }
    } catch (error: any) {
      console.error("Erro ao salvar álbum:", error);
      alert("Erro ao salvar álbum. Verifique sua conexão ou permissões.");
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleImageAreaClick = () => { fileInputRef.current?.click(); };

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold mb-2">{isAdmin ? 'Painel Administrativo' : 'Estúdio de Criação'}</h2>
          <p className="text-[#E0E0E0]">{isAdmin ? 'Gerencie todo o ecossistema MelodiaHub.' : 'Publique suas obras e compartilhe com o mundo.'}</p>
        </div>
        {isAdmin && (
          <div className="flex bg-[#333333]/30 p-1 rounded-xl">
            <button onClick={() => setActiveTab('OVERVIEW')} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'OVERVIEW' ? 'bg-[#FF6B35] text-white' : 'text-[#E0E0E0] hover:text-white'}`}>Visão Geral</button>
            <button onClick={() => setActiveTab('ALBUMS')} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'ALBUMS' ? 'bg-[#FF6B35] text-white' : 'text-[#E0E0E0] hover:text-white'}`}>Álbuns</button>
            <button onClick={() => setActiveTab('USERS')} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'USERS' ? 'bg-[#FF6B35] text-white' : 'text-[#E0E0E0] hover:text-white'}`}>Usuários</button>
          </div>
        )}
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#333333]/20 p-8 rounded-3xl border border-[#333333]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-[#FF6B35]/20 text-[#FF6B35] rounded-2xl">
                <Icons.User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-[#E0E0E0]">Usuários</h3>
            </div>
            <p className="text-5xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          <div className="bg-[#333333]/20 p-8 rounded-3xl border border-[#333333]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-green-500/20 text-green-500 rounded-2xl">
                <Icons.Play className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-[#E0E0E0]">Reproduções</h3>
            </div>
            <p className="text-5xl font-bold text-white">{stats.totalPlays}</p>
          </div>
          <div className="bg-[#333333]/20 p-8 rounded-3xl border border-[#333333]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-blue-500/20 text-blue-500 rounded-2xl">
                <Icons.Music className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-[#E0E0E0]">Álbuns</h3>
            </div>
            <p className="text-5xl font-bold text-white">{stats.totalAlbums}</p>
          </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-[#333333]/20 rounded-3xl border border-[#333333] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#333333]/50 text-[#E0E0E0] uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-[#333333]/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                  <td className="px-6 py-4 text-[#E0E0E0]">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-[#FF6B35]/20 text-[#FF6B35]' : 'bg-[#333333] text-[#E0E0E0]'}`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handlePromoteUser(user.id, user.role || 'user')}
                      className="text-sm underline hover:text-[#FF6B35] transition-colors"
                    >
                      {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ALBUMS' && (
        <form onSubmit={handleSubmit} className="space-y-8 bg-[#333333]/30 p-8 rounded-3xl border border-[#333333] backdrop-blur-md animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#E0E0E0]">Título do Álbum</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1A1A2E] border border-[#333333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  placeholder="Ex: Midnight Echoes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#E0E0E0]">Artista</label>
                <input
                  required
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-[#1A1A2E] border border-[#333333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  placeholder="Ex: Luna Ray"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#E0E0E0]">Gênero</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#1A1A2E] border border-[#333333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6B35] transition-colors"
                >
                  <option value="">Selecione um gênero</option>
                  {GENRES.sort().map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#E0E0E0]">URL da Capa (ou upload ao lado)</label>
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full bg-[#1A1A2E] border border-[#333333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  placeholder="https://imagem.com/capa.jpg"
                />
              </div>
            </div>

            <div
              onClick={handleImageAreaClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center border-2 border-dashed border-[#333333] rounded-3xl p-6 bg-[#1A1A2E]/50 group hover:border-[#FF6B35] transition-colors cursor-pointer relative overflow-hidden h-full min-h-[300px]"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Preview"
                  className="w-full h-full object-cover absolute inset-0 opacity-40 group-hover:opacity-20 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=Sem+Imagem';
                  }}
                />
              ) : (
                <Icons.Upload className="w-12 h-12 text-[#E0E0E0] mb-4 group-hover:text-[#FF6B35]" />
              )}
              <div className="relative z-10 text-center pointer-events-none">
                <p className="font-bold">{coverUrl ? 'Clique ou arraste para alterar' : 'Arraste a Arte do Álbum'}</p>
                <p className="text-xs text-[#E0E0E0]">ou clique para selecionar</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#333333]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Gerenciar Faixas</h3>
              <label className="bg-[#FF6B35] hover:bg-[#FF8B5E] text-white px-6 py-2 rounded-full cursor-pointer font-semibold transition-all shadow-lg active:scale-95">
                <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileUpload} />
                Adicionar Músicas
              </label>
            </div>

            {tracks.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A2E] rounded-3xl border border-[#333333]">
                <Icons.Music className="w-12 h-12 text-[#333333] mx-auto mb-4" />
                <p className="text-[#E0E0E0]">Nenhuma faixa adicionada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tracks.map((track, idx) => (
                  <div key={track.id} className="flex items-center justify-between bg-[#1A1A2E] p-4 rounded-xl border border-[#333333]">
                    <div className="flex items-center gap-4">
                      <span className="text-[#333333] font-bold w-6">{idx + 1}</span>
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => {
                          const newTracks = [...tracks];
                          newTracks[idx].title = e.target.value;
                          setTracks(newTracks);
                        }}
                        className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#FF6B35] px-2 py-1 rounded font-semibold text-white w-48"
                        placeholder="Nome da faixa"
                      />
                      <div className="flex items-center gap-2 bg-[#1A1A2E] border border-[#333333] rounded-lg px-2 py-1 ml-4 group-focus-within:border-[#FF6B35]/50">
                        <Icons.Video className="w-4 h-4 text-[#E0E0E0]/50" />
                        <input
                          type="text"
                          value={track.videoUrl || ''}
                          onChange={(e) => {
                            const newTracks = [...tracks];
                            newTracks[idx].videoUrl = e.target.value;
                            setTracks(newTracks);
                          }}
                          className="bg-transparent border-none focus:outline-none text-xs text-[#E0E0E0] w-40"
                          placeholder="URL do Vídeo (YouTube/MP4)"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTracks(tracks.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-500 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-[#333333]">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 rounded border-[#333333] bg-[#1A1A2E] text-[#FF6B35] focus:ring-[#FF6B35]"
              />
              <span className="text-[#E0E0E0] group-hover:text-white transition-colors select-none text-sm">
                Declaro que sou o detentor dos <strong>direitos autorais</strong> de todo o conteúdo (áudio e imagens) enviado neste formulário, e isento a plataforma de responsabilidades legais.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || tracks.length === 0 || !title || !artist}
            className="w-full bg-[#FF6B35] disabled:bg-[#333333] disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-[#FF6B35]/20 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Salvando...' : (albumToEdit ? 'Salvar Alterações' : 'Finalizar e Publicar Álbum')}
          </button>
        </form>
      )}
    </div>
  );
};
export default AdminDashboard;
