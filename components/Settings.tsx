import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/dbService';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../constants';

interface SettingsProps {
    onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
    const { user, updateProfile } = useAuth();
    const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || '');
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [audioQuality, setAudioQuality] = useState('High');
    const [crossfade, setCrossfade] = useState(true);
    const [autoplay, setAutoplay] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local state if user changes/loads
    useEffect(() => {
        if (user) {
            setAvatarUrl(user.avatar || '');
            setName(user.name);
            if (name !== user.name) { /* no-op: user typing overrides */ }
        }
    }, [user?.id]); // Only reset on user ID change to avoid wiping typing

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Optimistic UI
                const tempUrl = URL.createObjectURL(file);
                setAvatarUrl(tempUrl);

                // Upload real file
                const url = await dbService.uploadFile(file, 'avatars');
                await updateProfile({ avatar: url });
                alert('Avatar atualizado!');
            } catch (error) {
                console.error("Error updating avatar:", error);
                alert("Erro ao atualizar avatar.");
                setAvatarUrl(user?.avatar || ''); // Revert
            }
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        setHasChanges(e.target.value !== user?.name);
    };

    const saveProfile = async () => {
        if (!hasChanges) return;
        setIsSaving(true);
        try {
            await updateProfile({ name });
            setHasChanges(false);
            alert('Perfil atualizado com sucesso!');
        } catch (e) {
            console.error(e);
            alert('Erro ao atualizar perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 pb-20">
            <header className="mb-8">
                <h2 className="text-4xl font-bold tracking-tight mb-2">Configurações</h2>
                <p className="text-[#E0E0E0]">Gerencie suas preferências e conta.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">

                {/* Coluna Esquerda - Perfil */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-[#333333]/20 p-6 rounded-3xl border border-[#333333] backdrop-blur-sm">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Icons.User className="w-5 h-5 text-[#FF6B35]" /> Perfil
                        </h3>

                        <div className="flex flex-col items-center">
                            <div
                                className="relative group cursor-pointer"
                                onClick={handleAvatarClick}
                            >
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#333333] group-hover:border-[#FF6B35] transition-colors shadow-xl">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#1A1A2E] flex items-center justify-center text-[#FF6B35] text-4xl font-bold">
                                            {name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-semibold uppercase tracking-wider">
                                    Alterar
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <div className="mt-4 text-center w-full">
                                <label className="block text-xs font-medium text-[#E0E0E0] mb-1 text-left px-2">Nome de Exibição</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={handleNameChange}
                                        className="w-full bg-[#1A1A2E] border border-[#333333] rounded-xl px-4 py-2 focus:outline-none focus:border-[#FF6B35]"
                                    />
                                </div>
                                {hasChanges && (
                                    <button
                                        onClick={saveProfile}
                                        disabled={isSaving}
                                        className="mt-2 text-xs bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-[#ff8559] transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 text-center w-full opacity-60">
                                <label className="block text-xs font-medium text-[#E0E0E0] mb-1 text-left px-2">E-mail</label>
                                <input
                                    type="text"
                                    value={email}
                                    readOnly
                                    title="E-mail não pode ser alterado"
                                    className="w-full bg-[#1A1A2E] border border-[#333333] rounded-xl px-4 py-2 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Coluna Direita - Configurações Gerais */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Áudio e Reprodução */}
                    <section className="bg-[#333333]/20 p-6 rounded-3xl border border-[#333333] backdrop-blur-sm">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Icons.Music className="w-5 h-5 text-[#FF6B35]" /> Reprodução & Áudio
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Qualidade de Streaming</p>
                                    <p className="text-sm text-[#E0E0E0]/60">Ajuste o consumo de dados.</p>
                                </div>
                                <select
                                    value={audioQuality}
                                    onChange={(e) => setAudioQuality(e.target.value)}
                                    className="bg-[#1A1A2E] border border-[#333333] rounded-lg px-3 py-1.5 focus:border-[#FF6B35] outline-none"
                                >
                                    <option value="Low">Baixa (Econômica)</option>
                                    <option value="Normal">Normal</option>
                                    <option value="High">Alta (Melhor Som)</option>
                                </select>
                            </div>

                            <div className="border-t border-[#333333]/50 my-4" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Crossfade</p>
                                    <p className="text-sm text-[#E0E0E0]/60">Transição suave entre músicas.</p>
                                </div>
                                <button
                                    onClick={() => setCrossfade(!crossfade)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${crossfade ? 'bg-[#FF6B35]' : 'bg-[#333333]'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${crossfade ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Autoplay</p>
                                    <p className="text-sm text-[#E0E0E0]/60">Reproduzir similares ao fim do álbum.</p>
                                </div>
                                <button
                                    onClick={() => setAutoplay(!autoplay)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${autoplay ? 'bg-[#FF6B35]' : 'bg-[#333333]'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${autoplay ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Conta e Segurança */}
                    <section className="bg-[#333333]/20 p-6 rounded-3xl border border-[#333333] backdrop-blur-sm">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Icons.Settings className="w-5 h-5 text-[#FF6B35]" /> Conta
                        </h3>

                        <div className="space-y-4">
                            <button className="w-full text-left px-4 py-3 bg-[#1A1A2E] hover:bg-[#333333] rounded-xl transition-colors border border-[#333333] flex justify-between items-center group">
                                <span>Alterar Senha</span>
                                <Icons.SkipForward className="w-4 h-4 rotate-90 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <div className="w-full text-left px-4 py-3 bg-[#1A1A2E]/50 rounded-xl border border-[#333333] flex justify-between items-center opacity-80 cursor-default">
                                <div>
                                    <span className="block text-sm font-medium">Plano Atual</span>
                                    <span className="text-xs text-[#E0E0E0]/60">Gratuito (Vitalício)</span>
                                </div>
                                <span className="text-xs bg-[#333333] text-[#E0E0E0] px-2 py-1 rounded">Gerenciar</span>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        if (confirm("Tem certeza que deseja sair?")) {
                                            if (onLogout) onLogout();
                                        }
                                    }}
                                    className="text-[#FF4444] hover:text-[#FF6666] font-medium text-sm transition-colors border border-[#FF4444]/30 hover:border-[#FF4444] px-6 py-2 rounded-lg"
                                >
                                    Sair da Conta
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className="text-center text-[#E0E0E0]/30 text-xs py-4">
                        MelodiaHub v1.0.2 Beta • Build 2024
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Settings;
