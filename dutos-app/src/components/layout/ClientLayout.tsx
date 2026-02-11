import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { useClientStore } from '@stores/clientStore';
import { useEffect } from 'react';
import { useIsMobile } from '@hooks/useDevice';
import {
    LayoutDashboard,
    FileText,
    MessageSquarePlus,
    Calendar,
    LogOut,
    Menu,
    X,
    Palette
} from 'lucide-react';
import { useState } from 'react';

export function ClientLayout() {
    const { user, logout, isLoading } = useAuthStore();
    const { clients, getClientById, fetchClients } = useClientStore();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Get assigned client
    const assignedClient = user?.assigned_client_id
        ? getClientById(user.assigned_client_id)
        : null;

    useEffect(() => {
        if (clients.length === 0) {
            fetchClients();
        }
    }, [clients.length, fetchClients]);

    useEffect(() => {
        // Redirect non-clients away
        if (!isLoading && user && user.role !== 'client') {
            navigate('/');
        }
    }, [user, isLoading, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Show friendly message if no assigned client (instead of redirect loop)
    if (!isLoading && user?.role === 'client' && !user.assigned_client_id) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md text-center p-8 bg-white rounded-xl shadow-lg space-y-4">
                    <div className="h-16 w-16 mx-auto bg-yellow-50 rounded-full flex items-center justify-center">
                        <LayoutDashboard className="h-8 w-8 text-yellow-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Cuenta sin asignar</h2>
                    <p className="text-gray-500 text-sm">
                        Tu cuenta aún no ha sido vinculada a un cliente. Contactá al administrador para que te asigne un cliente.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>
            </div>
        );
    }

    const navItems = [
        { label: 'Inicio', path: '/client', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Contenido', path: '/client/posts', icon: <FileText className="w-5 h-5" /> },
        { label: 'Solicitudes', path: '/client/requests', icon: <MessageSquarePlus className="w-5 h-5" /> },
        { label: 'Calendario', path: '/client/calendar', icon: <Calendar className="w-5 h-5" /> },
        { label: 'Brand Kit', path: '/client/brand', icon: <Palette className="w-5 h-5" /> },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo + Client Name */}
                    <div className="flex items-center gap-3">
                        {assignedClient?.logo ? (
                            <img
                                src={assignedClient.logo}
                                alt={assignedClient.name}
                                className="h-8 w-8 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                                {assignedClient?.name?.charAt(0) || 'C'}
                            </div>
                        )}
                        <span className="font-semibold text-gray-900">
                            {assignedClient?.name || 'Portal Cliente'}
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    {!isMobile && (
                        <nav className="flex items-center gap-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/client'}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    {item.icon}
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    )}

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 hidden md:block">{user?.name}</span>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>

                        {isMobile && (
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobile && mobileMenuOpen && (
                    <nav className="border-t border-gray-100 bg-white px-4 py-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/client'}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary-50 text-primary-600'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                {item.icon}
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            {isMobile && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-40">
                    <div className="flex items-center justify-around">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/client'}
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'text-primary-600'
                                        : 'text-gray-400'
                                    }`
                                }
                            >
                                {item.icon}
                                <span className="text-xs font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>
            )}
        </div>
    );
}
