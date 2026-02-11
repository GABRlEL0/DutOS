import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';
import { useClientStore } from '@stores/clientStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ListTodo,
  MessageSquarePlus
} from 'lucide-react';
import { BottomNav } from '../mobile/BottomNav';
import { NotificationBell } from '../common/NotificationBell';
import type { UserRole } from '../../types/index';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Inicio', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'manager', 'creative', 'production'] },
  { label: 'Clientes', path: '/clients', icon: <Users className="w-5 h-5" />, roles: ['admin', 'manager', 'creative', 'production'] },
  { label: 'Contenido', path: '/posts', icon: <FileText className="w-5 h-5" />, roles: ['admin', 'manager', 'creative', 'production'] },
  { label: 'Cola', path: '/queue', icon: <ListTodo className="w-5 h-5" />, roles: ['admin', 'manager'] },
  { label: 'Solicitudes', path: '/requests', icon: <MessageSquarePlus className="w-5 h-5" />, roles: ['admin', 'manager'] },
  { label: 'Usuarios', path: '/users', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Configuración', path: '/settings', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Dashboard SLA', path: '/analytics/sla', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'manager'] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { fetchClients } = useClientStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Inicializar listeners de Firestore
  useEffect(() => {
    if (user) {
      const unsubscribe = fetchClients();
      return () => unsubscribe();
    }
  }, [user, fetchClients]);

  const filteredNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="DUTOS Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="block text-xl font-bold tracking-tight text-gray-900 leading-none font-display">DUTOS</span>
                <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Operating System</span>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                    }`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                  )}

                  <span className={`transition-colors ${isActive ? 'text-primary-600' : 'group-hover:text-gray-700'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-primary-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center shadow-sm shadow-primary-500/20">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-primary-600 font-bold text-lg">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate font-display">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-lg transition-all shadow-sm hover:shadow"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Mobile header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 sticky top-0 z-30 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-gray-900 font-display text-lg">DUTOS</span>
          </div>
          <NotificationBell />
        </header>

        {/* Page content wrapper with max-width constraint */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8 w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
}