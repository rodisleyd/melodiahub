
import React, { useState, useEffect, useRef } from 'react';
import { Album, Track } from '../types';
import { Icons } from '../constants';
import { dbService } from '../services/dbService';

interface AdminDashboardProps {
  onAddAlbum: (album: Album) => void;
  albumToEdit?: Album | null;
  onUpdateAlbum?: (album: Album) => void;
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
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tracks, setTracks] = useState<Partial<Track>[]>([]);
  const [loading, setLoading] = useState(false);

  // Temporary storage for files to upload
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [trackFiles, setTrackFiles] = useState<Map<string, File>>(new Map());

  useEffect(() => {
    if (albumToEdit) {
      setTitle(albumToEdit.title);
      setArtist(albumToEdit.artist);
      setGenre(albumToEdit.genre);
      setCoverUrl(albumToEdit.coverUrl);
      setTracks(albumToEdit.tracks);
      setCoverFile(null);
      setTrackFiles(new Map());
    }
  }, [albumToEdit]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      let finalCoverUrl = coverUrl;

      // Upload Cover
      if (coverFile) {
        finalCoverUrl = await dbService.uploadFile(coverFile, 'covers');
      }

      // Upload Tracks
      const finalTracks = await Promise.all(tracks.map(async (track) => {
        const file = track.id ? trackFiles.get(track.id) : undefined;
        if (file) {
          const url = await dbService.uploadFile(file, 'tracks');
          return {
            ...track,
            url,
            // If we wanted to get real duration, we'd need to load metadata here or earlier.
            // For now, keep mock/default if not set.
          } as Track;
        }
        return track as Track;
      }));

      const albumData: Album = {
        id: albumToEdit ? albumToEdit.id : Date.now().toString(), // Firestore will overwrite ID if adding? No, dbService.addAlbum ignores ID.
        title,
        artist,
        genre,
        year: albumToEdit ? albumToEdit.year : new Date().getFullYear(),
        coverUrl: finalCoverUrl || 'https://picsum.photos/seed/new/600/600',
        tracks: finalTracks,
        isFavorite: albumToEdit ? albumToEdit.isFavorite : false
      };

      if (albumToEdit && onUpdateAlbum) {
        onUpdateAlbum(albumData);
        alert('Álbum atualizado com sucesso!');
      } else {
        onAddAlbum(albumData);
        alert('Álbum criado com sucesso!');
        // Reset
        setTitle('');
        setArtist('');
        setGenre('');
        setCoverUrl('');
        setTracks([]);
        setCoverFile(null);
        setTrackFiles(new Map());
      }
    } catch (error) {
      console.error("Error saving album:", error);
      alert("Erro ao salvar álbum. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleImageAreaClick = () => { fileInputRef.current?.click(); };

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">{albumToEdit ? 'Editar Álbum' : 'Criar Novo Álbum'}</h2>
        <p className="text-[#E0E0E0]">{albumToEdit ? 'Atualize as informações da sua obra.' : 'Organize suas obras e compartilhe com o mundo.'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-[#333333]/30 p-8 rounded-3xl border border-[#333333] backdrop-blur-md">
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
                      className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#FF6B35] px-2 py-1 rounded"
                    />
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

        <button
          type="submit"
          disabled={loading || tracks.length === 0 || !title || !artist}
          className="w-full bg-[#FF6B35] disabled:bg-[#333333] disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-[#FF6B35]/20 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Salvando...' : (albumToEdit ? 'Salvar Alterações' : 'Finalizar e Publicar Álbum')}
        </button>
      </form>
    </div>
  );
};
export default AdminDashboard;
