import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@stores/notificationStore';
import { useAuthStore } from '@stores/authStore';
import { Bell, Check, X, MessageSquare, FileText, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        requestPermission,
        permissionStatus,
        initializeForegroundListener
    } = useNotificationStore();

    const [isOpen, setIsOpen] = useState(false);
    const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications when user is available
    useEffect(() => {
        if (user?.id) {
            const unsub = fetchNotifications(user.id);
            initializeForegroundListener();
            return () => unsub();
        }
    }, [user?.id, fetchNotifications, initializeForegroundListener]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = async () => {
        // Request permission if not granted and not asked before
        if (permissionStatus === 'default' && !hasRequestedPermission) {
            setHasRequestedPermission(true);
            await requestPermission();
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async (notification: typeof notifications[0]) => {
        await markAsRead(notification.id);
        setIsOpen(false);

        // Navigate based on notification type
        if (notification.data?.url) {
            navigate(notification.data.url);
        } else if (notification.data?.postId) {
            navigate(`/posts/${notification.data.postId}/edit`);
        } else if (notification.data?.requestId) {
            navigate('/requests');
        }
    };

    const getNotificationIcon = (type: typeof notifications[0]['type']) => {
        switch (type) {
            case 'post_pending_approval':
                return <Clock className="w-4 h-4 text-amber-500" />;
            case 'post_approved':
                return <Check className="w-4 h-4 text-green-500" />;
            case 'post_rejected':
                return <X className="w-4 h-4 text-red-500" />;
            case 'request_new':
            case 'request_responded':
                return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'post_reminder':
                return <AlertCircle className="w-4 h-4 text-orange-500" />;
            default:
                return <FileText className="w-4 h-4 text-gray-500" />;
        }
    };

    const recentNotifications = notifications.slice(0, 10);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleBellClick}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Notificaciones"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => user && markAllAsRead(user.id)}
                                className="text-xs text-primary-600 hover:underline"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    {/* Permission Banner */}
                    {permissionStatus === 'default' && (
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                            <p className="text-sm text-blue-700">
                                Activa las notificaciones para recibir alertas importantes.
                            </p>
                            <button
                                onClick={requestPermission}
                                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                            >
                                Activar notificaciones
                            </button>
                        </div>
                    )}

                    {permissionStatus === 'denied' && (
                        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
                            <p className="text-sm text-yellow-700">
                                Las notificaciones están bloqueadas. Actívalas desde la configuración de tu navegador.
                            </p>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No tienes notificaciones</p>
                            </div>
                        ) : (
                            recentNotifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${!notification.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-gray-900`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {notification.body}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDistanceToNow(notification.createdAt, {
                                                addSuffix: true,
                                                locale: es
                                            })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
