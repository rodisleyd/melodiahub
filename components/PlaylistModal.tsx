import React, { useState } from 'react';
import Modal from './Modal';
import { Track, Playlist, Album } from '../types';
import { Icons } from '../constants';

interface PlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlists: Playlist[];
    onCreatePlaylist: (name: string, isPublic: boolean) => void;
    onToBeAddedToPlaylist: (playlistId: string) => void;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({ isOpen, onClose, playlists, onCreatePlaylist, onToBeAddedToPlaylist }) => {
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isPublic, setIsPublic] = useState(false);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPlaylistName.trim()) {
            onCreatePlaylist(newPlaylistName.trim(), isPublic);
            setNewPlaylistName('');
            setIsPublic(false);
            setIsCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar à Playlist">
            <div className="space-y-4">
                {/* Create New Playlist Toggle */}
                {!isCreating ? (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] hover:bg-[#FF6B35]/20 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center text-white">
                            <Icons.Plus className="w-5 h-5" />
                        </div>
                        <span className="font-semibold">Nova Playlist</span>
                    </button>
                ) : (
                    <form onSubmit={handleCreate} className="bg-[#333333]/20 p-4 rounded-2xl border border-[#333333] animate-in slide-in-from-top-2">
                        <input
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            placeholder="Nome da playlist"
                            className="w-full bg-[#1A1A2E] border border-[#333333] rounded-xl px-4 py-3 text-white mb-3 focus:outline-none focus:border-[#FF6B35]"
                            autoFocus
                        />
                        <div className="flex items-center gap-3 mb-4 px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#333333] bg-[#1A1A2E] text-[#FF6B35] focus:ring-[#FF6B35]"
                                />
                                <span className="text-sm text-[#E0E0E0] group-hover:text-white transition-colors">Tornar esta playlist pública</span>
                            </label>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-sm text-[#E0E0E0] hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!newPlaylistName.trim()}
                                className="px-4 py-2 text-sm bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF8C61] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Criar
                            </button>
                        </div>
                    </form>
                )}

                <div className="border-t border-[#333333] my-4" />

                {/* Existing Playlists */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {playlists.map(playlist => (
                        <button
                            key={playlist.id}
                            onClick={() => {
                                onToBeAddedToPlaylist(playlist.id);
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#333333] transition-colors group text-left"
                        >
                            <div className="w-12 h-12 rounded-lg bg-[#333333]/50 overflow-hidden flex-shrink-0">
                                <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white truncate">{playlist.name}</h4>
                                <p className="text-xs text-[#E0E0E0]">{playlist.tracks.length} músicas</p>
                            </div>
                            <Icons.Plus className="w-5 h-5 text-[#E0E0E0] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default PlaylistModal;
