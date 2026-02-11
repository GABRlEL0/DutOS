import { useState } from 'react';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { useAuthStore } from '@stores/authStore';
import { StatusBadge } from './StatusBadge';
import { Waves, Anchor, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { groupByWeek, formatWeekRange, isStaleContent } from '../../utils/slotCalculator';

interface QueueViewProps {
  clientId?: string;
}

export function QueueView({ clientId }: QueueViewProps) {
  const { getCalculatedSlots } = usePostStore();
  const { getClientById } = useClientStore();
  const { user } = useAuthStore();
  const [selectedClient] = useState<string>(clientId || '');
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const client = selectedClient ? getClientById(selectedClient) : null;

  // Calcular slots visuales
  const calculatedSlots = client
    ? getCalculatedSlots(client.id, client)
    : [];

  // Agrupar por semana
  const weekGroups = groupByWeek(calculatedSlots);

  // Filtrar por posts activos si está activado
  const filteredWeekGroups = showOnlyActive
    ? weekGroups.map(week => ({
      ...week,
      posts: week.posts.filter(
        p => p.post.status !== 'published' && p.post.status !== 'finished'
      ),
    })).filter(week => week.posts.length > 0)
    : weekGroups;

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const canViewStale = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {client && (
              <div className="text-sm text-gray-600">
                Capacidad: <span className="font-semibold">{client.weekly_capacity}</span> posts/semana
              </div>
            )}
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Solo tareas activas</span>
          </label>
        </div>
      </div>

      {/* Vista de Semanas */}
      {client ? (
        <div className="space-y-4">
          {filteredWeekGroups.map((week) => (
            <div
              key={week.weekNumber}
              className={`bg-white rounded-lg shadow overflow-hidden ${week.isOverloaded ? 'ring-2 ring-orange-400' : ''
                }`}
            >
              {/* Header de Semana */}
              <button
                onClick={() => toggleWeek(week.weekNumber)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-gray-900">
                    Semana {week.weekNumber}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatWeekRange(week.weekStart, week.weekEnd)}
                  </span>
                  <span className="text-sm text-gray-600">
                    [{week.totalSlots} posts]
                  </span>
                  {week.isOverloaded && (
                    <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Sobrecarga
                    </span>
                  )}
                </div>
                {expandedWeeks.has(week.weekNumber) ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Lista de Posts */}
              {expandedWeeks.has(week.weekNumber) && (
                <div className="divide-y divide-gray-200">
                  {week.posts.map(({ post, visualDate, isOverloaded }) => {
                    const isStale = canViewStale && isStaleContent(post, visualDate);

                    return (
                      <div
                        key={post.id}
                        className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 ${isStale ? 'bg-orange-50' : ''
                          }`}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Prioridad */}
                          <span className="text-sm font-medium text-gray-500 w-8">
                            #{post.priority_index}
                          </span>

                          {/* Tipo */}
                          <span className="flex items-center" title={post.type === 'flow' ? 'Flow' : 'Pinned'}>
                            {post.type === 'flow' ? (
                              <Waves className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Anchor className="h-4 w-4 text-orange-500" />
                            )}
                          </span>

                          {/* Fecha */}
                          <span className="text-sm text-gray-600 w-24">
                            {format(visualDate, 'dd MMM', { locale: es })}
                          </span>

                          {/* Pilar */}
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {post.pillar}
                          </span>

                          {/* Título/Preview */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-md">
                              {post.content.script.substring(0, 60)}
                              {post.content.script.length > 60 && '...'}
                            </p>
                          </div>

                          {/* Indicadores */}
                          <div className="flex items-center space-x-2">
                            {isStale && (
                              <span
                                className="inline-flex items-center text-orange-600"
                                title="Contenido estancado (+4 semanas)"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </span>
                            )}
                            {isOverloaded && (
                              <span className="text-xs text-orange-600 font-medium">
                                +slot
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Estado */}
                        <div className="flex items-center space-x-4">
                          <StatusBadge status={post.status} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {filteredWeekGroups.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No hay posts para mostrar</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Selecciona un cliente para ver su cola</p>
        </div>
      )}
    </div>
  );
}