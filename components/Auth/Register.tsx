import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ViewType } from '../../types';
import { Icons } from '../../constants';

interface RegisterProps {
    onViewChange: (view: ViewType) => void;
}

const Register: React.FC<RegisterProps> = ({ onViewChange }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register, loginWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(name, email, password);
            onViewChange('EXPLORE');
        } catch (err: any) {
            setError(err.message || 'Falha ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await loginWithGoogle();
            onViewChange('EXPLORE');
        } catch (err: any) {
            setError(err.message || 'Falha ao entrar com Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-md bg-[#333333]/20 p-8 rounded-3xl border border-[#333333] shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center">Crie sua conta</h2>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Nome</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A2E] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#FF6B35] transition-colors"
                            placeholder="Seu nome"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A2E] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#FF6B35] transition-colors"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A2E] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#FF6B35] transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF6B35] text-white font-bold py-3 rounded-xl hover:bg-[#FF8C61] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? 'Criando conta...' : 'Cadastrar'}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#333333]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#1A1A2E] text-[#E0E0E0]/60">Ou continue com</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Icons.Google className="w-5 h-5" />
                        Cadastrar com Google
                    </button>
                </form>

                <p className="mt-6 text-center text-[#E0E0E0]/60 text-sm">
                    Já tem uma conta?{' '}
                    <button
                        onClick={() => onViewChange('LOGIN')}
                        className="text-[#FF6B35] font-bold hover:underline"
                    >
                        Entrar
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;
