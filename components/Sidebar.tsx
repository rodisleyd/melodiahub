
import React from 'react';
import { ViewType } from '../types';
import { Icons, COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;    // New prop
  onClose: () => void; // New prop
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const menuItems = [
    { id: 'EXPLORE', label: 'Explorar', icon: Icons.Home },
    { id: 'MY_ALBUMS', label: 'Meus Álbuns', icon: Icons.Music },
    { id: 'FAVORITES', label: 'Favoritos', icon: Icons.Star },
    { id: 'COMMUNITY_PLAYLISTS', label: 'Comunidade', icon: Icons.TrendingUp },
    { id: 'PLAYLISTS', label: 'Minhas Playlists', icon: Icons.List },
    ...(user ? [{
      id: 'ADMIN_CREATE',
      label: user.role === 'admin' ? 'Painel Admin' : 'Publicar Obra',
      icon: user.role === 'admin' ? Icons.Settings : Icons.Upload
    }] : []),
    { id: 'SETTINGS', label: 'Configurações', icon: Icons.Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-[#1A1A2E] border-r border-[#333333] 
        flex flex-col p-6 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MelodiaHub" className="h-10 md:h-20 w-auto" />
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-[#E0E0E0] hover:text-white">
            <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id as ViewType);
                onClose(); // Close on selection (mobile)
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === item.id
                ? 'bg-[#FF6B35] text-white shadow-lg'
                : 'text-[#E0E0E0] hover:bg-[#333333]'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-[#333333]">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 px-4">
              <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="text-xs text-[#E0E0E0] hover:text-[#FF6B35]"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                onViewChange('LOGIN');
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#333333] hover:bg-[#444444] text-white transition-colors"
            >
              <span className="font-medium">Entrar</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
