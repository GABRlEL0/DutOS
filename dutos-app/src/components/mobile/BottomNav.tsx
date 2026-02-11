import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar
} from 'lucide-react';
import type { UserRole } from '../../types/index';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: number;
}

export function BottomNav() {
  const { user } = useAuthStore();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      label: 'Inicio',
      path: '/',
      icon: <LayoutDashboard className="w-6 h-6" />,
      roles: ['admin', 'manager', 'creative', 'production']
    },
    {
      label: 'Clientes',
      path: '/clients',
      icon: <Users className="w-6 h-6" />,
      roles: ['admin', 'manager', 'creative']
    },
    {
      label: 'Contenido',
      path: '/posts',
      icon: <FileText className="w-6 h-6" />,
      roles: ['admin', 'manager', 'creative', 'production']
    },
    {
      label: 'Cola',
      path: '/queue',
      icon: <Calendar className="w-6 h-6" />,
      roles: ['admin', 'manager'],
    },
    {
      label: 'Tareas',
      path: '/tareas',
      icon: <FileText className="w-6 h-6" />,
      roles: ['admin', 'manager', 'creative', 'production'],
    },
  ];

  const filteredNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}