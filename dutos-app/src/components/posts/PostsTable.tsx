import { useState, useMemo } from 'react';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { useAuthStore } from '@stores/authStore';
import { StatusBadge } from './StatusBadge';
import { StatusSelect } from './StatusSelect';
import { PillarSelect } from './PillarSelect';
import { EditableCell } from './EditableCell';
import { TextModal } from './TextModal';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../common/Toast';
import { Trash2, AlertCircle, Waves, Anchor, Edit2, GripVertical, AlertTriangle, FilePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post, PostStatus, PostType } from '../../types/index';
import { validTransitions } from '@stores/postStore';

// Drag & Drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isStaleContent } from '../../utils/slotCalculator';
import { normalizeDateOnlyToLocalNoon } from '../../utils/dateOnly';

interface PostsTableProps {
  clientId?: string;
  defaultStatusFilter?: PostStatus | '';
}

// Componente de fila sortable
interface SortableRowProps {
  post: Post;
  clientId: string;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canDrag: boolean;
  visualDate?: Date;
  isOverloaded?: boolean;
  isStale?: boolean;
  onStatusChange: (post: Post, status: PostStatus) => void;
  onDelete: (postId: string) => void;
  onOpenModal: (post: Post, field: 'script' | 'caption') => void;
  getClientPillars: (clientId: string) => string[];
  getClientName: (clientId: string) => string;
  updatePost: (id: string, updates: Partial<Post>) => void;
  allowedStatuses?: PostStatus[];
}

function SortableRow({
  post,
  clientId,
  canEdit,
  canDelete,
  canApprove,
  canDrag,
  visualDate,
  isOverloaded,
  isStale,
  onStatusChange,
  onDelete,
  onOpenModal,
  getClientPillars,
  getClientName,
  updatePost,
  allowedStatuses,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Colores de borde según estado
  const statusColors: Record<PostStatus, string> = {
    draft: '#9ca3af',
    pending_approval: '#fbbf24',
    rejected: '#ef4444',
    approved: '#22c55e',
    finished: '#3b82f6',
    published: '#8b5cf6',
  };

  return (
    <tr
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: `4px solid ${statusColors[post.status]}`,
      }}
      className={`hover:bg-gray-50 ${isDragging ? 'bg-gray-100' : ''}`}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          {canDrag && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Arrastrar para reordenar prioridad"
              title="Arrastrar para reordenar"
              type="button"
            >
              <GripVertical className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <span className="text-sm text-gray-900 font-medium">
            {post.priority_index}
          </span>
          {isStale && (
            <span
              className="text-orange-500"
              title="Contenido estancado: lleva más de 4 semanas en cola"
              role="img"
              aria-label="Contenido estancado"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {canApprove ? (
          <StatusSelect
            status={post.status}
            onChange={(status) => onStatusChange(post, status)}
            allowedStatuses={allowedStatuses}
            aria-label={`Cambiar estado de ${post.content?.script?.substring(0, 30) || 'post'}`}
          />
        ) : (
          <StatusBadge status={post.status} size="sm" />
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        <span className="flex items-center">
          {post.type === 'flow' ? (
            <>
              <Waves className="h-4 w-4 mr-1 text-blue-500" aria-hidden="true" />
              <span>Flow</span>
            </>
          ) : (
            <>
              <Anchor className="h-4 w-4 mr-1 text-orange-500" aria-hidden="true" />
              <span>Pinned</span>
            </>
          )}
        </span>
      </td>
      {!clientId && (
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
          {getClientName(post.client_id)}
        </td>
      )}
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        {visualDate ? (
          <span className={isOverloaded ? 'text-orange-600 font-medium' : 'text-gray-500'}>
            {visualDate.toLocaleDateString('es-ES')}
            {isOverloaded && (
              <span role="img" aria-label="Sobrecarga de capacidad"> ⚠️</span>
            )}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <PillarSelect
          pillars={getClientPillars(post.client_id)}
          selected={post.pillar}
          onChange={(pillar) =>
            canEdit && updatePost(post.id, { pillar })
          }
          disabled={!canEdit}
          aria-label="Seleccionar pilar estratégico"
        />
      </td>
      <td className="px-4 py-3">
        <EditableCell
          value={post.content?.script || ''}
          onChange={(value) =>
            canEdit &&
            updatePost(post.id, {
              content: { ...post.content, script: value },
            })
          }
          placeholder="Sin guion"
          disabled={!canEdit}
          onOpenModal={() => onOpenModal(post, 'script')}
        />
      </td>
      <td className="px-4 py-3">
        <EditableCell
          value={post.content?.caption || ''}
          onChange={(value) =>
            canEdit &&
            updatePost(post.id, {
              content: { ...post.content, caption: value },
            })
          }
          placeholder="Sin caption"
          disabled={!canEdit}
          onOpenModal={() => onOpenModal(post, 'caption')}
        />
      </td>
      <td className="px-4 py-3">
        <EditableCell
          value={post.content?.asset_link || ''}
          onChange={(value) =>
            canEdit &&
            updatePost(post.id, {
              content: { ...post.content, asset_link: value },
            })
          }
          type="url"
          placeholder="Sin link"
          disabled={!canEdit}
        />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-1">
          {canEdit && (
            <Link
              to={`/posts/${post.id}/edit`}
              className="p-2 text-gray-600 hover:text-primary-600 rounded-md hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label={`Editar post: ${post.content?.script?.substring(0, 30) || 'post'}`}
              title="Editar post"
            >
              <Edit2 className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          {post.feedback_history.length > 0 && (
            <button
              className="p-2 text-yellow-600 hover:text-yellow-800 rounded-md hover:bg-yellow-50 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label={`Ver ${post.feedback_history.length} comentarios de feedback`}
              title={`${post.feedback_history.length} comentarios`}
              type="button"
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-2 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label={`Eliminar post: ${post.content?.script?.substring(0, 30) || 'post'}`}
              title="Eliminar post"
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function PostsTable({ clientId, defaultStatusFilter }: PostsTableProps) {
  const { posts, updatePost, deletePost, changePostStatus, reorderPosts, getCalculatedSlots } = usePostStore();
  const { getClientById } = useClientStore();
  const { user } = useAuthStore();
  const toast = useToast();

  const selectedClient = clientId || '';
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>(defaultStatusFilter || '');
  const [typeFilter, setTypeFilter] = useState<PostType | ''>('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; postId: string; postTitle: string }>({
    isOpen: false,
    postId: '',
    postTitle: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    postId: string;
    field: 'script' | 'caption';
    value: string;
    readOnly: boolean;
  }>({ isOpen: false, postId: '', field: 'script', value: '', readOnly: true });

  // Calcular slots visuales para el cliente seleccionado
  const client = selectedClient ? getClientById(selectedClient) : null;
  const calculatedSlots = client
    ? getCalculatedSlots(client.id, client)
    : [];

  // Crear map de fechas visuales
  const visualDatesMap = new Map(
    calculatedSlots.map(s => [s.post.id, { date: s.visualDate, isOverloaded: s.isOverloaded }])
  );

  // Filtrar posts
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

  // Verificar permisos
  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'creative';
  const canDelete = user?.role === 'admin';
  const canApprove = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'production';
  const canViewStale = user?.role === 'admin' || user?.role === 'manager';

  const openTextModal = (post: Post, field: 'script' | 'caption') => {
    setModalConfig({
      isOpen: true,
      postId: post.id,
      field,
      value: (post.content?.[field] as string) || '',
      readOnly: !canEdit,
    });
  };

  // Sensors para DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleStatusChange = async (post: Post, newStatus: PostStatus) => {
    if (newStatus === post.status) return;

    // Extra guard: should already be filtered in UI
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
      toast.success(`Estado cambiado a "${statusLabels[newStatus]}"`);
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || 'Error al cambiar estado');
    }
  };

  const handleDelete = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setDeleteConfirm({
        isOpen: true,
        postId,
        postTitle: post.content?.script?.substring(0, 50) || 'Post sin título'
      });
    }
  };

  const confirmDelete = () => {
    setIsLoading(true);
    setTimeout(() => {
      deletePost(deleteConfirm.postId);
      setDeleteConfirm({ isOpen: false, postId: '', postTitle: '' });
      setIsLoading(false);
      toast.success('Post eliminado correctamente');
    }, 300);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredPosts.findIndex((p) => p.id === active.id);
      const newIndex = filteredPosts.findIndex((p) => p.id === over.id);

      // Solo permitir reordenar si hay un cliente seleccionado
      if (selectedClient) {
        reorderPosts(selectedClient, oldIndex, newIndex);
        toast.success('Prioridad actualizada');
      }
    }
  };

  const getClientPillars = (clientId: string) => {
    const client = getClientById(clientId);
    return client?.strategy_pillars || [];
  };

  const getClientName = (clientId: string) => {
    const client = getClientById(clientId);
    return client?.name || 'Desconocido';
  };

  // Posts que se pueden reordenar (solo Flow, no Terminados/Publicados)
  const reorderablePosts = filteredPosts.filter(
    p => p.type === 'flow' && p.status !== 'finished' && p.status !== 'published'
  );

  const hasActiveFilters = statusFilter || typeFilter;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col">
          <label htmlFor="status-filter" className="text-xs text-gray-500 mb-1">Estado</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PostStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="pending_approval">Pendiente</option>
            <option value="rejected">Rechazado</option>
            <option value="approved">Aprobado</option>
            <option value="finished">Terminado</option>
            <option value="published">Publicado</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="type-filter" className="text-xs text-gray-500 mb-1">Tipo</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PostType | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los tipos</option>
            <option value="flow">Flow (🌊)</option>
            <option value="pinned">Pinned (⚓)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-col justify-end">
            <button
              onClick={() => {
                setStatusFilter(defaultStatusFilter || '');
                setTypeFilter('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Ayuda de D&D */}
      {canEdit && selectedClient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center">
          <GripVertical className="h-4 w-4 mr-2" aria-hidden="true" />
          <span>Tip: Arrastra los posts Flow (🌊) para reordenar su prioridad</span>
        </div>
      )}

      {/* Tabla con DnD */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className={`overflow-x-auto ${filteredPosts.length <= 2 ? 'pb-10' : ''}`}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full divide-y divide-gray-200" role="grid" aria-label="Lista de posts">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Prioridad
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Tipo
                  </th>
                  {!clientId && (
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Fecha Visual
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Pilar
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    Guion
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    Caption
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                    Asset
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Acciones
                  </th>
                </tr>
              </thead>
              <SortableContext
                items={reorderablePosts.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPosts.map((post) => {
                    const visualData = visualDatesMap.get(post.id);
                    const visualDate =
                      post.type === 'pinned'
                        ? (post.pinned_date ? normalizeDateOnlyToLocalNoon(new Date(post.pinned_date)) : undefined)
                        : visualData?.date;
                    const isOverloaded = post.type === 'flow' ? visualData?.isOverloaded : false;
                    const isStale = canViewStale && post.type === 'flow' && visualDate && isStaleContent(post, visualDate);
                    const canDrag = post.type === 'flow' &&
                      post.status !== 'finished' &&
                      post.status !== 'published' &&
                      canEdit;

                    return (
                      <SortableRow
                        key={post.id}
                        post={post}
                        clientId={clientId || ''}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canApprove={canApprove}
                        canDrag={canDrag}
                        visualDate={visualDate}
                        isOverloaded={isOverloaded}
                        isStale={isStale}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onOpenModal={(post, field) => openTextModal(post, field)}
                        getClientPillars={getClientPillars}
                        getClientName={getClientName}
                        updatePost={updatePost}
                        allowedStatuses={(() => {
                          const next = validTransitions[post.status] || [];
                          if (user?.role === 'production') {
                            const productionAllowed: PostStatus[] = ['finished', 'published'];
                            return [post.status, ...next.filter(s => productionAllowed.includes(s))];
                          }
                          return [post.status, ...next];
                        })()}
                      />
                    );
                  })}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>

        {filteredPosts.length === 0 && (
          <EmptyState
            icon="posts"
            title={hasActiveFilters ? "No se encontraron posts con estos filtros" : "No hay posts aún"}
            description={hasActiveFilters
              ? "Intenta ajustar los filtros o limpia la búsqueda para ver todos los posts"
              : "Comienza creando tu primer post de contenido para el cliente"
            }
            action={canEdit && !hasActiveFilters ? (
              <Link
                to="/posts/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FilePlus className="h-4 w-4 mr-2" aria-hidden="true" />
                Crear primer post
              </Link>
            ) : hasActiveFilters ? (
              <button
                onClick={() => {
                  setStatusFilter(defaultStatusFilter || '');
                  setTypeFilter('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Limpiar filtros
              </button>
            ) : undefined}
          />
        )}
      </div>

      {/* Modal de edición de texto */}
      <TextModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={
          modalConfig.readOnly
            ? (modalConfig.field === 'script' ? 'Ver Guion' : 'Ver Caption')
            : (modalConfig.field === 'script' ? 'Editar Guion' : 'Editar Caption')
        }
        value={modalConfig.value}
        readOnly={modalConfig.readOnly}
        onSave={
          modalConfig.readOnly
            ? undefined
            : async (value) => {
              const post = posts.find((p) => p.id === modalConfig.postId);
              if (post && canEdit) {
                await updatePost(post.id, {
                  content: {
                    ...post.content,
                    [modalConfig.field]: value,
                  },
                });
              }
            }
        }
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Post"
        message={`¿Estás seguro de que deseas eliminar el post "${deleteConfirm.postTitle}"? Esta acción no se puede deshacer.`}
        confirmLabel={isLoading ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, postId: '', postTitle: '' })}
      />
    </div>
  );
}
