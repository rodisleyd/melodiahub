
import React from 'react';
import { Icons } from '../constants';

interface RadioSplashProps {
    onStart: () => void;
}

const RadioSplash: React.FC<RadioSplashProps> = ({ onStart }) => {
    return (
        <div
            className="fixed inset-0 z-[110] bg-[#1A1A2E]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={onStart}
        >
            <div className="text-center space-y-10 max-w-md w-full animate-in zoom-in-95 duration-700">
                <div className="relative mx-auto">
                    <div className="absolute -inset-4 bg-[#FF6B35]/20 rounded-full blur-3xl animate-pulse" />
                    <img
                        src="/logo.png"
                        alt="MelodiaHub"
                        className="h-24 md:h-32 w-auto relative z-10 mx-auto"
                    />
                </div>

                <div className="space-y-4 relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Radio <span className="text-[#FF6B35]">MelodyHUB</span>
                    </h1>
                    <p className="text-[#E0E0E0]/80 text-lg">
                        Sintonize o melhor da música independente agora.
                    </p>
                </div>

                <button
                    className="group relative px-8 py-4 bg-[#FF6B35] text-white rounded-2xl font-bold text-xl shadow-[0_0_30px_rgba(255,107,53,0.4)] hover:shadow-[0_0_50px_rgba(255,107,53,0.6)] hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center gap-3">
                        <Icons.Play className="w-6 h-6 fill-current" />
                        Sintonizar Agora
                    </span>
                </button>

                <p className="text-[#E0E0E0]/40 text-sm uppercase tracking-[0.2em] font-medium pt-4">
                    Toque em qualquer lugar para começar
                </p>
            </div>
        </div>
    );
};

export default RadioSplash;
