import React from 'react';
import Modal from './Modal';
import { Track, Album } from '../types';
import { Icons } from '../constants';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    track: Track | null;
    album: Album | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, track, album }) => {
    if (!track || !album) return null;

    const shareText = `Confira "${track.title}" de ${album.artist} no MelodiaHub!`;
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/?albumId=${album.id}&trackId=${track.id}`;

    const shareOptions = [
        {
            name: 'WhatsApp',
            icon: (className: string) => (
                <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            ),
            url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
            color: 'hover:bg-[#25D366] hover:text-white',
        },
        {
            name: 'X / Twitter',
            icon: (className: string) => (
                <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            ),
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            color: 'hover:bg-black hover:text-white border border-[#333333]',
        },
        {
            name: 'Facebook',
            icon: (className: string) => (
                <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 2.848-5.978 5.817-5.978.966 0 1.954.066 1.954.066v3.253h-1.035c-2.003 0-2.538 1.259-2.538 2.522v1.718h3.924l-.628 3.667h-3.296v7.98z" /></svg>
            ),
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            color: 'hover:bg-[#1877F2] hover:text-white',
        },
    ];

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('Link copiado para a área de transferência!');
        onClose();
    };

    const handleInstagramShare = () => {
        // Since we can't deep-link nicely with an image from web-to-app without native code,
        // we copy the direct link and prompt the user.
        const storyText = `🎵 Estou ouvindo ${track.title} de ${album.artist} no MelodiaHub! 🎧`;
        navigator.clipboard.writeText(`${storyText} ${shareUrl}`);
        alert('Link copiado! Abra o Instagram Stories, tire uma foto ou vídeo e cole o link no adesivo "Link"!');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compartilhar">
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[#333333]/30 rounded-2xl">
                    <img src={album.coverUrl} alt={album.title} className="w-16 h-16 rounded-xl object-cover" />
                    <div>
                        <h4 className="font-semibold text-white">{track.title}</h4>
                        <p className="text-sm text-[#E0E0E0]">{album.artist}</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    {shareOptions.map((option) => (
                        <a
                            key={option.name}
                            href={option.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-[#333333]/20 transition-all duration-300 ${option.color} group`}
                            onClick={onClose}
                        >
                            {option.icon("w-6 h-6 mb-2 text-[#E0E0E0] group-hover:text-white transition-colors")}
                            <span className="text-[10px] sm:text-xs font-medium text-[#E0E0E0] group-hover:text-white transition-colors text-center leading-tight">{option.name}</span>
                        </a>
                    ))}

                    {/* Instagram Button */}
                    <button
                        onClick={handleInstagramShare}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#333333]/20 transition-all duration-300 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white group"
                    >
                        <Icons.Instagram className="w-6 h-6 mb-2 text-[#E0E0E0] group-hover:text-white transition-colors" />
                        <span className="text-[10px] sm:text-xs font-medium text-[#E0E0E0] group-hover:text-white transition-colors">Stories</span>
                    </button>
                </div>

                <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#333333] hover:bg-[#444444] text-white transition-colors"
                >
                    <Icons.Share className="w-5 h-5" />
                    <span className="font-medium">Copiar Link</span>
                </button>
            </div>
        </Modal>
    );
};

export default ShareModal;
