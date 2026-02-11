import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@stores/authStore';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { Card } from '@components/common/Card';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useState } from 'react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { es } from 'date-fns/locale';

export function ClientCalendarPage() {
    const { user } = useAuthStore();
    const { posts, fetchPostsByClient, getCalculatedSlots } = usePostStore();
    const { getClientById } = useClientStore();

    const [currentMonth, setCurrentMonth] = useState(new Date());

    const clientId = user?.assigned_client_id;
    const client = clientId ? getClientById(clientId) : null;

    useEffect(() => {
        if (clientId) {
            const unsub = fetchPostsByClient(clientId);
            return () => unsub();
        }
    }, [clientId, fetchPostsByClient]);

    // Calculate visual dates
    const calculatedSlots = useMemo(() =>
        client ? getCalculatedSlots(clientId!, client) : [],
        [client, clientId, getCalculatedSlots]);

    // Create a map of date -> posts
    const postsByDate = useMemo(() => {
        const map = new Map<string, typeof calculatedSlots>();
        calculatedSlots.forEach(slot => {
            const dateKey = format(slot.visualDate, 'yyyy-MM-dd');
            const existing = map.get(dateKey) || [];
            map.set(dateKey, [...existing, slot]);
        });
        return map;
    }, [calculatedSlots]);

    // Calendar grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-500';
            case 'approved': return 'bg-blue-500';
            case 'pending_approval': return 'bg-amber-500';
            case 'rejected': return 'bg-red-500';
            case 'finished': return 'bg-purple-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendario de Contenido</h1>
                <p className="text-gray-600 mt-1">Visualiza las publicaciones programadas</p>
            </div>

            <Card className="p-4 md:p-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPrevMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Calendar className="w-4 h-4" />
                        Hoy
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayPosts = postsByDate.get(dateKey) || [];
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isDayToday = isToday(day);

                        return (
                            <div
                                key={dateKey}
                                className={`min-h-[80px] md:min-h-[100px] p-1 border border-gray-100 rounded-lg ${!isCurrentMonth ? 'bg-gray-50' : ''
                                    } ${isDayToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
                            >
                                <div className={`text-xs font-medium mb-1 ${isDayToday ? 'text-primary-600' :
                                    !isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    {format(day, 'd')}
                                </div>

                                <div className="space-y-1">
                                    {dayPosts.slice(0, 3).map((slot, i) => (
                                        <div
                                            key={i}
                                            className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(slot.post.status)} text-white`}
                                            title={`${slot.post.pillar} - ${slot.post.status}`}
                                        >
                                            {slot.post.pillar}
                                        </div>
                                    ))}
                                    {dayPosts.length > 3 && (
                                        <div className="text-xs text-gray-400 text-center">
                                            +{dayPosts.length - 3} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Leyenda:</p>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-amber-500" />
                            <span className="text-xs text-gray-600">Pendiente</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-blue-500" />
                            <span className="text-xs text-gray-600">Aprobado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-purple-500" />
                            <span className="text-xs text-gray-600">Terminado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-green-500" />
                            <span className="text-xs text-gray-600">Publicado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-red-500" />
                            <span className="text-xs text-gray-600">Rechazado</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
                    <p className="text-xs text-gray-500">Total posts</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{posts.filter(p => p.status === 'pending_approval').length}</p>
                    <p className="text-xs text-gray-500">Pendientes</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{posts.filter(p => p.status === 'approved').length}</p>
                    <p className="text-xs text-gray-500">Aprobados</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{posts.filter(p => p.status === 'published').length}</p>
                    <p className="text-xs text-gray-500">Publicados</p>
                </Card>
            </div>
        </div>
    );
}
