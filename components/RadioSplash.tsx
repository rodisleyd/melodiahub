
import React from 'react';
import { Icons } from '../constants';

interface RadioSplashProps {
    onStart: () => void;
}

const RadioSplash: React.FC<RadioSplashProps> = ({ onStart }) => {
    return (
        <div
            className="fixed inset-0 z-[110] bg-[#1A1A2E] flex flex-col items-center justify-between py-16 px-6 cursor-pointer"
            onClick={onStart}
        >
            {/* Top Content */}
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                    Descubra novos sons
                </h1>
                <p className="text-[#E0E0E0]/70 text-base max-w-[280px] mx-auto leading-tight">
                    Um espaço para descobrir, ouvir, compartilhar e publicar música independente.
                </p>
            </div>

            {/* Middle Content (Radio Box) */}
            <div className="w-full max-w-sm space-y-8 animate-in zoom-in-95 duration-700 delay-300">
                <div className="bg-[#1A1A2E] p-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B35]/10 to-transparent opacity-50" />

                    <div className="relative z-10 space-y-8 text-center">
                        <div className="flex flex-col items-center">
                            <img
                                src="/logo.png"
                                alt="MelodiaHub"
                                className="h-20 w-auto mb-2"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">Radio</span>
                                <span className="text-2xl font-bold text-[#FF6B35]">MELODYHUB</span>
                            </div>
                        </div>

                        <p className="text-[#E0E0E0]/80 font-medium">
                            Sintonize o melhor da música independente agora.
                        </p>

                        <button
                            className="w-full py-5 bg-[#FF6B35] text-white rounded-3xl font-bold text-xl shadow-[0_10px_20px_rgba(255,107,53,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <Icons.Play className="w-6 h-6 fill-current" />
                            Sintonizar Agora
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Content */}
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
                <p className="text-[#E0E0E0]/30 text-xs uppercase tracking-[0.2em] font-bold">
                    Toque em qualquer lugar para começar
                </p>
            </div>
        </div>
    );
};

export default RadioSplash;
