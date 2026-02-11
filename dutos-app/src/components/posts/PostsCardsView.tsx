import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { useAuthStore } from '@stores/authStore';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../common/Toast';
import {
  Trash2,
  Edit2,
  Waves,
  Anchor,
  AlertTriangle,
  FilePlus,
  Calendar,
  Tag
} from 'lucide-react';
import type { Post, PostStatus, PostType } from '../../types/index';
import { validTransitions } from '@stores/postStore';
import { isStaleContent } from '../../utils/slotCalculator';
import { normalizeDateOnlyToLocalNoon } from '../../utils/dateOnly';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PostsCardsViewProps {
  clientId?: string;
  defaultStatusFilter?: PostStatus | '';
}

export function PostsCardsView({ clientId, defaultStatusFilter }: PostsCardsViewProps) {
  const { posts, deletePost, changePostStatus, getCalculatedSlots } = usePostStore();
  const { getClientById } = useClientStore();
  const { user } = useAuthStore();
  const toast = useToast();

  const selectedClient = clientId || '';
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>(defaultStatusFilter || '');
  const [typeFilter, setTypeFilter] = useState<PostType | ''>('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    postId: string;
    postTitle: string
  }>({
    isOpen: false,
    postId: '',
    postTitle: ''
  });

  const client = selectedClient ? getClientById(selectedClient) : null;
  const calculatedSlots = client
    ? getCalculatedSlots(client.id, client)
    : [];

  const visualDatesMap = new Map(
    calculatedSlots.map(s => [s.post.id, {
      date: s.visualDate,
      isOverloaded: s.isOverloaded
    }])
  );

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (selectedClient && post.client_id !== selectedClient) return false;
        if (statusFilter && post.status !== statusFilter) return false;
        if (typeFilter && post.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => a.priority_index - b.priority_index);
  }, [posts, selectedClient, statusFilter, typeFilter]);

  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'creative';
  const canDelete = user?.role === 'admin';
  const canApprove = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'production';
  const canViewStale = user?.role === 'admin' || user?.role === 'manager';

  const handleStatusChange = async (post: Post, newStatus: PostStatus) => {
    if (newStatus === post.status) return;

    if (!validTransitions[post.status]?.includes(newStatus)) {
      toast.error('Transición de estado no permitida');
      return;
    }

    try {
      if (newStatus === 'rejected') {
        const feedback = prompt('Motivo del rechazo (obligatorio):');
        if (!feedback || feedback.length < 10) {
          alert('El comentario debe tener al menos 10 caracteres');
          return;
        }
        await changePostStatus(post.id, newStatus, feedback, user?.name || 'Usuario');
        toast.success('Post rechazado con feedback');
        return;
      }

      await changePostStatus(post.id, newStatus, undefined, user?.name);
      const statusLabels: Record<PostStatus, string> = {
        draft: 'Borrador',
        pending_approval: 'Pendiente',
        rejected: 'Rechazado',
        approved: 'Aprobado',
        finished: 'Terminado',
        published: 'Publicado'
      };
      toast.success(`Estado actualizado a "${statusLabels[newStatus]}"`);
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || 'Error al cambiar estado');
    }
  };

  const handleDelete = (post: Post) => {
    setDeleteConfirm({
      isOpen: true,
      postId: post.id,
      postTitle: (post.content.script || '').substring(0, 50) || 'Post sin título'
    });
  };

  const confirmDelete = () => {
    deletePost(deleteConfirm.postId);
    setDeleteConfirm({ isOpen: false, postId: '', postTitle: '' });
    toast.success('Post eliminado correctamente');
  };

  const getClientName = (clientId: string) => {
    const client = getClientById(clientId);
    return client?.name || 'Desconocido';
  };

  const hasActiveFilters = statusFilter || typeFilter;

  return (
    <div className="space-y-4">
      {/* Filtros compactos para mobile */}
      <div className="bg-white p-4 rounded-lg shadow space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="mobile-status-filter" className="text-xs text-gray-500 mb-1 block">
              Estado
            </label>
            <select
              id="mobile-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PostStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="pending_approval">Pendiente</option>
              <option value="rejected">Rechazado</option>
              <option value="approved">Aprobado</option>
              <option value="finished">Terminado</option>
              <option value="published">Publicado</option>
            </select>
          </div>

          <div>
            <label htmlFor="mobile-type-filter" className="text-xs text-gray-500 mb-1 block">
              Tipo
            </label>
            <select
              id="mobile-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PostType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              <option value="flow">Flow</option>
              <option value="pinned">Pinned</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setStatusFilter(defaultStatusFilter || '');
              setTypeFilter('');
            }}
            className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            type="button"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Cards de posts */}
      <div className="space-y-3">
        {filteredPosts.map((post) => {
          const visualData = visualDatesMap.get(post.id);
          const visualDate = post.type === 'pinned'
            ? (post.pinned_date ? normalizeDateOnlyToLocalNoon(new Date(post.pinned_date)) : undefined)
            : visualData?.date;
          const isOverloaded = post.type === 'flow' ? visualData?.isOverloaded : false;
          const isStale = canViewStale && post.type === 'flow' && visualDate && isStaleContent(post, visualDate);

          return (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow p-4 border-l-4"
              style={{
                borderLeftColor: post.status === 'draft' ? '#9ca3af' :
                  post.status === 'pending_approval' ? '#fbbf24' :
                    post.status === 'rejected' ? '#ef4444' :
                      post.status === 'approved' ? '#22c55e' :
                        post.status === 'finished' ? '#3b82f6' : '#8b5cf6'
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                    #{post.priority_index}
                  </span>
                  {post.type === 'flow' ? (
                    <span className="flex items-center text-blue-600 text-sm" title="Flow - Fecha automática">
                      <Waves className="h-4 w-4 mr-1" aria-hidden="true" />
                      Flow
                    </span>
                  ) : (
                    <span className="flex items-center text-orange-600 text-sm" title="Pinned - Fecha fija">
                      <Anchor className="h-4 w-4 mr-1" aria-hidden="true" />
                      Pinned
                    </span>
                  )}
                  {isStale && (
                    <span
                      className="text-orange-500"
                      title="Contenido estancado (+4 semanas)"
                      role="img"
                      aria-label="Contenido estancado"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <StatusBadge status={post.status} size="sm" />
              </div>

              {/* Contenido */}
              <div className="space-y-2 mb-4">
                <h3 className="font-medium text-gray-900 line-clamp-2">
                  {post.content.script || 'Sin guion'}
                </h3>
                {post.content.caption && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {post.content.caption}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
                {!clientId && (
                  <span className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" aria-hidden="true" />
                    {getClientName(post.client_id)}
                  </span>
                )}
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
                  {visualDate
                    ? format(visualDate, 'dd MMM', { locale: es })
                    : 'Sin fecha'
                  }
                  {isOverloaded && <span className="text-orange-500 ml-1">(⚠️)</span>}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 rounded">
                  {post.pillar}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-1">
                  {canEdit && (
                    <Link
                      to={`/posts/${post.id}/edit`}
                      className="p-3 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
                      aria-label={`Editar: ${(post.content.script || '').substring(0, 30)}`}
                    >
                      <Edit2 className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(post)}
                      className="p-3 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors"
                      aria-label={`Eliminar: ${(post.content.script || '').substring(0, 30)}`}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {canApprove && (
                  <select
                    value={post.status}
                    onChange={(e) => handleStatusChange(post, e.target.value as PostStatus)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label={`Cambiar estado de ${(post.content.script || '').substring(0, 30)}`}
                  >
                    {(user?.role === 'production'
                      ? [post.status, ...(validTransitions[post.status] || []).filter(s => s === 'finished' || s === 'published')]
                      : [post.status, ...(validTransitions[post.status] || [])]
                    ).map((value) => (
                      <option key={value} value={value}>
                        {value === 'draft' ? 'Borrador'
                          : value === 'pending_approval' ? 'Pendiente'
                            : value === 'rejected' ? 'Rechazado'
                              : value === 'approved' ? 'Aprobado'
                                : value === 'finished' ? 'Terminado'
                                  : 'Publicado'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <EmptyState
          icon="posts"
          title={hasActiveFilters ? "No se encontraron posts" : "No hay posts aún"}
          description={hasActiveFilters
            ? "Intenta ajustar los filtros para ver todos los posts"
            : "Comienza creando tu primer post de contenido"
          }
          action={canEdit && !hasActiveFilters ? (
            <Link
              to="/posts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <FilePlus className="h-4 w-4 mr-2" aria-hidden="true" />
              Crear post
            </Link>
          ) : hasActiveFilters ? (
            <button
              onClick={() => {
                setStatusFilter(defaultStatusFilter || '');
                setTypeFilter('');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          ) : undefined}
        />
      )}

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Post"
        message={`¿Estás seguro de que deseas eliminar el post "${deleteConfirm.postTitle}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, postId: '', postTitle: '' })}
      />
    </div>
  );
}
