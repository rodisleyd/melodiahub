
import React, { useState, useEffect, useRef } from 'react';
import { PlayerState, Album, Track } from '../types';
import { Icons, COLORS } from '../constants';

interface PlayerProps {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (vol: number) => void;
  onShare: (track: Track, album: Album) => void;
  onToggleShuffle: () => void;
  onTrackPlay?: (track: Track, album: Album) => void;
  onLike: (albumId: string, trackId?: string) => void;
  isRadioMode: boolean;
  onToggleRadio: () => void;
}

const Player: React.FC<PlayerProps> = ({
  playerState,
  onTogglePlay,
  onNext,
  onPrev,
  onVolumeChange,
  onShare,
  onToggleShuffle,
  onTrackPlay,
  onLike,
  isRadioMode,
  onToggleRadio
}) => {
  const { currentAlbum, currentTrackIndex, isPlaying, volume, isShuffle } = playerState;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playCountedRef = useRef<string | null>(null); // Track ID of last counted play
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentTrack = currentAlbum?.tracks[currentTrackIndex];

  // Calculate next track for display
  const getNextTrackTitle = () => {
    if (!currentAlbum || !currentAlbum.tracks || !currentAlbum.tracks.length) return '';
    if (isShuffle) {
      return "Modo Aleatório";
    }
    if (isRadioMode) {
      return "Radio MelodyHUB";
    }
    const tracks = currentAlbum.tracks || [];
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    return tracks[nextIndex]?.title || '';
  };

  // Play Counting Logic
  useEffect(() => {
    if (isPlaying && currentTrack && currentAlbum && onTrackPlay) {
      // Only count if we haven't counted this track in this session yet
      if (playCountedRef.current !== currentTrack.id) {
        onTrackPlay(currentTrack, currentAlbum);
        playCountedRef.current = currentTrack.id;
      }
    }
  }, [isPlaying, currentTrack, currentAlbum, onTrackPlay]);

  // Controle do áudio via estado isPlaying
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Falha na reprodução:", e);
          // Se falhar (ex: bloqueio de autoplay), reverte o estado para "Pausado"
          // para o usuário clicar manualmente.
          if (e.name === 'NotAllowedError') {
            onTogglePlay();
          }
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Sincronização de volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Atalho de teclado (Espaço)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        onTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * audioRef.current.duration;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentAlbum || !currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[#1A1A2E]/95 backdrop-blur-2xl border-t border-[#333333] px-6 py-4 z-50 animate-in slide-in-from-bottom duration-500">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        onLoadedMetadata={handleTimeUpdate}
      />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-8">
        {/* Informações do Álbum */}
        <div className="flex items-center gap-3 w-1/3 md:w-1/4 min-w-0">
          <img
            src={currentAlbum.coverUrl}
            alt={currentAlbum.title}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg object-cover shadow-2xl border border-[#333333] flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <h4 className="text-[13px] md:text-sm font-bold text-white truncate leading-tight">{currentTrack.title}</h4>
              {isRadioMode && (
                <span className="flex-shrink-0 px-1 py-0.5 bg-[#FF6B35] text-white text-[8px] font-bold rounded uppercase tracking-wider">
                  Radio
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-[#E0E0E0] truncate opacity-70">{currentAlbum.artist}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLike(currentAlbum.id, currentTrack.id)}
              className="text-[#E0E0E0] hover:text-[#FF6B35] transition-colors p-1 flex items-center gap-1 group/like"
              title="Curtir"
            >
              <Icons.Heart className={`w-4 h-4 md:w-5 md:h-5 ${currentTrack.isFavorite ? 'text-[#FF6B35] fill-[#FF6B35]' : ''}`} />
              {currentTrack.likeCount && currentTrack.likeCount > 0 && (
                <span className="text-[10px] font-bold text-[#E0E0E0]">{currentTrack.likeCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Controles Principais */}
        <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-3 md:gap-8">
            <button
              onClick={onToggleShuffle}
              className={`transition-colors ${isShuffle ? 'text-[#FF6B35]' : 'text-[#E0E0E0]'}`}
              title="Aleatório"
            >
              <Icons.Shuffle className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button onClick={onPrev} className="text-[#E0E0E0] hover:text-[#FF6B35] transition-colors">
              <Icons.SkipBack className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#FF6B35] flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? (
                <Icons.Pause className="w-5 h-5 md:w-7 md:h-7" />
              ) : (
                <Icons.Play className="w-5 h-5 md:w-7 md:h-7 ml-0.5 md:ml-1" />
              )}
            </button>

            <button onClick={onNext} className="text-[#E0E0E0] hover:text-[#FF6B35] transition-colors">
              <Icons.SkipForward className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={onToggleRadio}
              className={`transition-colors ${isRadioMode ? 'text-[#FF6B35]' : 'text-[#E0E0E0]'}`}
              title="Radio MelodyHUB"
            >
              <Icons.Radio className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Próxima Música - Preview */}
          <div className="text-xs text-[#E0E0E0]/60 -mt-1 h-4">
            {isRadioMode ? (
              <span className="flex items-center gap-1 text-[#FF6B35] font-semibold"><Icons.Radio className="w-3 h-3" /> Radio MelodyHUB Ativa</span>
            ) : isShuffle ? (
              <span className="flex items-center gap-1"><Icons.Shuffle className="w-3 h-3" /> Próxima: Aleatória</span>
            ) : (
              <span>Próxima: {getNextTrackTitle()}</span>
            )}
          </div>

          {/* Barra de Progresso Interativa */}
          <div className="w-full flex items-center gap-3 text-xs text-[#E0E0E0] font-medium">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className="flex-1 h-1.5 bg-[#333333] rounded-full relative cursor-pointer group"
            >
              <div
                className="absolute top-0 left-0 h-full bg-[#FF6B35] rounded-full transition-all duration-100 group-hover:bg-[#FF8B5E]"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
              </div>
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controle de Volume */}
        <div className="flex items-center gap-3 w-1/4 justify-end hidden sm:flex">
          <Icons.Volume className="w-5 h-5 text-[#E0E0E0]" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="w-24 h-1 bg-[#333333] accent-[#FF6B35] rounded-full appearance-none cursor-pointer hover:accent-[#FF8B5E]"
          />
        </div>
      </div>
    </div>
  );
};

export default Player;
