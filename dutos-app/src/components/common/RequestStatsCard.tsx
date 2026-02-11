import { Card } from '@components/common/Card';
import {
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    FileText,
    TrendingUp,
    Timer
} from 'lucide-react';
import type { ContentRequestStats } from '../../types/index';

interface RequestStatsCardProps {
    stats: ContentRequestStats;
    title?: string;
    compact?: boolean;
}

export function RequestStatsCard({ stats, title = 'Estadísticas de Solicitudes', compact = false }: RequestStatsCardProps) {
    const formatTime = (hours: number | null) => {
        if (hours === null) return 'N/A';
        if (hours < 1) return `${Math.round(hours * 60)}min`;
        if (hours < 24) return `${hours}h`;
        return `${Math.round(hours / 24)}d`;
    };

    if (compact) {
        return (
            <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                        <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
                        <p className="text-xs text-gray-500">Pendientes</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-green-600">{stats.converted}</p>
                        <p className="text-xs text-gray-500">Convertidas</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-primary-600">{stats.fulfillmentRate}%</p>
                        <p className="text-xs text-gray-500">Cumplimiento</p>
                    </div>
                </div>
                {stats.avgResponseTimeHours !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Timer className="w-4 h-4" />
                        Tiempo promedio de respuesta: <span className="font-medium text-gray-700">{formatTime(stats.avgResponseTimeHours)}</span>
                    </div>
                )}
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                    </div>
                    <p className="text-xs text-gray-500">Pendientes</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                    </div>
                    <p className="text-xs text-gray-500">Aprobadas</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                        <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                    </div>
                    <p className="text-xs text-gray-500">En progreso</p>
                </div>
                <div className="text-center p-3 bg-primary-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <p className="text-2xl font-bold text-primary-600">{stats.converted}</p>
                    </div>
                    <p className="text-xs text-gray-500">Convertidas</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    </div>
                    <p className="text-xs text-gray-500">Rechazadas</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-transparent rounded-lg">
                    <div className="p-2 bg-primary-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Tasa de cumplimiento</p>
                        <p className="text-xl font-bold text-primary-600">{stats.fulfillmentRate}%</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Timer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Tiempo promedio respuesta</p>
                        <p className="text-xl font-bold text-blue-600">{formatTime(stats.avgResponseTimeHours)}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
