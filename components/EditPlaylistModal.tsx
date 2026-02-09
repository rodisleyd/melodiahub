import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Playlist } from '../types';
import { Icons } from '../constants';

interface EditPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: Playlist | null;
    onUpdate: (playlist: Playlist) => Promise<void>;
    onDelete: (playlistId: string) => Promise<void>;
}

const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({ isOpen, onClose, playlist, onUpdate, onDelete }) => {
    const [name, setName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (playlist) {
            setName(playlist.name);
            setIsPublic(playlist.isPublic || false);
        }
    }, [playlist, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (playlist && name.trim()) {
            await onUpdate({
                ...playlist,
                name: name.trim(),
                isPublic
            });
            onClose();
        }
    };

    const handleDelete = async () => {
        if (playlist) {
            await onDelete(playlist.id);
            onClose();
        }
    };

    if (!playlist) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Playlist">
            {!isDeleting ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0] mb-2 px-1">Nome da Playlist</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome da playlist"
                            className="w-full bg-[#1A1A2E] border border-[#333333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B35] transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center gap-3 px-1">
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

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#FF8C61] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            Salvar Alterações
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsDeleting(true)}
                            className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <Icons.Trash className="w-4 h-4" />
                            Excluir Playlist
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
                        <Icons.Trash className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Tem certeza?</h3>
                        <p className="text-[#E0E0E0]/60 text-sm">
                            Você está prestes a excluir a playlist <span className="text-white font-bold">"{playlist.name}"</span>.
                            Esta ação não pode ser desfeita.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsDeleting(false)}
                            className="flex-1 py-3 bg-[#333333] text-white rounded-xl font-bold hover:bg-[#444444] transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg"
                        >
                            Confirmar Exclusão
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default EditPlaylistModal;
