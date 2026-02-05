import React from 'react';
import { Album, Track } from '../types';
import { Icons } from '../constants';

interface AlbumCardProps {
    album: Album;
    expandedAlbumId: string | null;
    onToggleExpand: (albumId: string) => void;
    onSelectAlbum: (album: Album, startTrackIndex?: number) => void;
    onToggleFavorite: (albumId: string, e: React.MouseEvent) => void;
    onLike: (albumId: string, trackId?: string) => void;
    onTrackAction?: (action: 'play' | 'favorite' | 'addToPlaylist' | 'share' | 'like', track: Track, album: Album) => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
    album,
    expandedAlbumId,
    onToggleExpand,
    onSelectAlbum,
    onToggleFavorite,
    onLike,
    onTrackAction
}) => {
    const isExpanded = expandedAlbumId === album.id;

    return (
        <div
            className={`group bg-[#333333]/20 p-5 rounded-[2rem] border border-[#333333]/50 hover:bg-[#333333]/40 hover:border-[#FF6B35]/30 transition-all duration-500 shadow-xl relative ${isExpanded ? 'row-span-2' : 'hover:-translate-y-2'}`}
            onClick={() => onSelectAlbum(album)}
        >
            <div className="relative aspect-square mb-6 overflow-hidden rounded-2xl shadow-2xl cursor-pointer">
                <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=Sem+Imagem';
                    }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-[#FF6B35] flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-500 delay-100 shadow-2xl">
                        <Icons.Play className="w-8 h-8 ml-1" />
                    </div>
                </div>

                {/* Favorite Toggle Button */}
                <button
                    onClick={(e) => onToggleFavorite(album.id, e)}
                    className={`absolute top-4 left-4 p-2 rounded-full backdrop-blur-md transition-all duration-300 z-10 ${album.isFavorite ? 'bg-[#FF6B35] text-white' : 'bg-black/50 text-white/70 hover:text-white'
                        }`}
                >
                    <Icons.Star className="w-5 h-5" />
                </button>

                {/* Like Button & Counter */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike(album.id);
                        }}
                        className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-[#FF6B35] transition-all duration-300 group/like shadow-lg border border-white/10 hover:border-[#FF6B35]/50"
                    >
                        <Icons.Heart className="w-5 h-5 group-hover/like:scale-125 transition-transform" />
                    </button>
                    {album.likeCount && album.likeCount > 0 ? (
                        <span className="text-white text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {album.likeCount}
                        </span>
                    ) : null}
                </div>

                <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-semibold uppercase tracking-widest">
                    {album.genre}
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-1 group-hover:text-[#FF6B35] transition-colors">{album.title}</h3>
                <p className="text-[#E0E0E0] text-sm font-medium">{album.artist}</p>
                <p className="text-[#333333] text-xs font-semibold mt-2">{album.tracks.length} Músicas • {album.year}</p>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(album.id);
                    }}
                    className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#E0E0E0] hover:text-[#FF6B35] transition-colors w-full justify-center py-2 border border-[#333333] rounded-xl hover:bg-[#333333]"
                >
                    <Icons.List className="w-4 h-4" /> {isExpanded ? 'Ocultar Faixas' : 'Ver Faixas'}
                </button>

                {/* Lista de Faixas Expandida */}
                {isExpanded && (
                    <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-[#333333]/50 space-y-2 animate-in slide-in-from-top-2 cursor-default">
                        {album.tracks.length === 0 ? (
                            <p className="text-sm text-[#E0E0E0]/50 italic text-center">Sem faixas.</p>
                        ) : (
                            album.tracks.map((track, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#333333]/60 transition-colors group/track">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-[10px] font-mono text-[#E0E0E0]/50 w-4 flex-shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                                        <span className="text-xs font-medium text-white truncate">{track.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/track:opacity-100 transition-opacity flex-shrink-0">
                                        <button
                                            title="Tocar"
                                            className="p-1.5 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectAlbum(album, idx);
                                            }}
                                        >
                                            <Icons.Play className="w-3 h-3" />
                                        </button>
                                        <button
                                            title="Adicionar à Playlist"
                                            className="p-1.5 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTrackAction?.('addToPlaylist', track, album);
                                            }}
                                        >
                                            <Icons.Plus className="w-3 h-3" />
                                        </button>
                                        <button
                                            title="Favoritar"
                                            className={`p-1.5 hover:bg-[#333333] rounded-full transition-colors ${track.isFavorite ? 'text-[#FF6B35]' : 'text-[#E0E0E0] hover:text-[#FF6B35]'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTrackAction?.('favorite', track, album);
                                            }}
                                        >
                                            <Icons.Star className="w-3 h-3" />
                                        </button>
                                        <button
                                            title="Curtir Música"
                                            className="p-1.5 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors flex items-center gap-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLike(album.id, track.id);
                                            }}
                                        >
                                            <Icons.Heart className="w-3 h-3" />
                                            {track.likeCount && track.likeCount > 0 && (
                                                <span className="text-[10px] font-bold">{track.likeCount}</span>
                                            )}
                                        </button>
                                        <button
                                            title="Compartilhar"
                                            className="p-1.5 text-[#E0E0E0] hover:text-[#FF6B35] hover:bg-[#333333] rounded-full transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTrackAction?.('share', track, album);
                                            }}
                                        >
                                            <Icons.Share className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlbumCard;
