import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { useAuthStore } from '@stores/authStore';
import { CommentSection } from '@components/posts/CommentSection';
import { TemplateSelector } from '@components/posts/TemplateSelector';
import { ArrowLeft, Waves, Anchor } from 'lucide-react';
import type { PostType, PostStatus } from '../../types/index';
import { dateOnlyFromInput, normalizeDateOnlyToLocalNoon } from '../../utils/dateOnly';

const DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/.+/;



export function PostFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { posts, addPost, updatePost } = usePostStore();
  const { clients } = useClientStore();
  const { user } = useAuthStore();

  const isEditing = !!id && id !== 'new';
  const existingPost = isEditing ? posts.find((p) => p.id === id) : null;

  // Form state
  const [clientId, setClientId] = useState(existingPost?.client_id || '');
  const [type, setType] = useState<PostType>(existingPost?.type || 'flow');
  const [pillar, setPillar] = useState(existingPost?.pillar || '');
  const [script, setScript] = useState(existingPost?.content.script || '');
  const [caption, setCaption] = useState(existingPost?.content.caption || '');
  const [assetLink, setAssetLink] = useState(existingPost?.content.asset_link || '');
  const [pinnedDate, setPinnedDate] = useState(
    existingPost?.pinned_date
      ? normalizeDateOnlyToLocalNoon(new Date(existingPost.pinned_date)).toISOString().split('T')[0]
      : ''
  );
  const [status, setStatus] = useState<PostStatus>(existingPost?.status || 'draft');
  const [feedback, setFeedback] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedClient = clients.find((c) => c.id === clientId);
  const availablePillars = selectedClient?.strategy_pillars || [];

  // Auto-seleccionar cliente si solo hay uno disponible
  useEffect(() => {
    if (!isEditing && !clientId && clients.length === 1) {
      setClientId(clients[0].id);
    }
  }, [clients, clientId, isEditing]);


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clientId) {
      newErrors.client = 'Debes seleccionar un cliente';
    }

    if (!pillar) {
      newErrors.pillar = 'Debes seleccionar un pilar estratégico';
    }

    if (!script.trim() && !caption.trim()) {
      newErrors.content = 'Debes agregar al menos un guion o caption';
    }

    if (type === 'pinned' && !pinnedDate) {
      newErrors.pinnedDate = 'Las tareas ancladas requieren una fecha';
    }

    if (assetLink && !DRIVE_REGEX.test(assetLink)) {
      newErrors.assetLink = 'Debe ser un link válido de Google Drive';
    }

    if (status === 'rejected' && !feedback.trim()) {
      newErrors.feedback = 'El rechazo requiere un comentario (mínimo 10 caracteres)';
    } else if (status === 'rejected' && feedback.trim().length < 10) {
      newErrors.feedback = 'El comentario debe tener al menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!user) return;

    const postData = {
      client_id: clientId,
      type,
      pinned_date: type === 'pinned' && pinnedDate ? dateOnlyFromInput(pinnedDate) : null,
      ...(existingPost?.priority_index && { priority_index: existingPost.priority_index }),
      status,
      pillar,
      content: {
        script: script.trim(),
        caption: caption.trim(),
        asset_link: assetLink.trim(),
      },
      feedback_history: existingPost?.feedback_history || [],
      createdBy: existingPost?.createdBy || user.id,
    };

    if (isEditing && id) {
      // Si hay feedback nuevo, agregarlo al historial
      if (feedback.trim()) {
        const updatedFeedbackHistory = [
          ...postData.feedback_history,
          {
            user: user.name,
            comment: feedback.trim(),
            timestamp: new Date(),
          },
        ];
        updatePost(id, { ...postData, feedback_history: updatedFeedbackHistory });
      } else {
        updatePost(id, postData);
      }
    } else {
      addPost(postData);
    }

    navigate('/posts');
  };

  const getAvailableStatuses = (currentStatus: PostStatus): PostStatus[] => {
    if (user?.role === 'admin') {
      return ['draft', 'pending_approval', 'rejected', 'approved', 'finished', 'published'];
    }
    if (user?.role === 'manager') {
      return ['draft', 'pending_approval', 'rejected', 'approved', 'finished', 'published'];
    }
    if (user?.role === 'creative') {
      if (currentStatus === 'draft' || currentStatus === 'rejected') {
        return ['draft', 'pending_approval'];
      }
      return [currentStatus];
    }
    if (user?.role === 'production') {
      if (currentStatus === 'approved') {
        return ['approved', 'finished'];
      }
      return [currentStatus];
    }
    return [currentStatus];
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/posts')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a contenido
        </button>
      </div>

      <div className={`${isEditing ? 'flex gap-6' : ''}`}>
        {/* Main Form */}
        <div className={`${isEditing ? 'flex-1' : ''} max-w-3xl`}>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {isEditing ? 'Editar Post' : 'Nuevo Post'}
          </h1>

          {/* Template Selector */}
          {!isEditing && (
            <TemplateSelector
              clientId={clientId}
              onSelect={(template) => {
                setScript(template.script_template);
                setCaption(template.caption_template);
                if (template.pillar_suggestion && !pillar) {
                  setPillar(template.pillar_suggestion);
                }
              }}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Básica
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      setPillar(''); // Reset pillar when client changes
                    }}
                    disabled={isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.client ? 'border-red-500' : 'border-gray-300'
                      } ${isEditing ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {errors.client && (
                    <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="flow"
                        checked={type === 'flow'}
                        onChange={(e) => setType(e.target.value as PostType)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <Waves className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Flow (Automático)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="pinned"
                        checked={type === 'pinned'}
                        onChange={(e) => setType(e.target.value as PostType)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <Anchor className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Pinned (Fijo)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilar Estratégico *
                  </label>
                  <select
                    value={pillar}
                    onChange={(e) => setPillar(e.target.value)}
                    disabled={!clientId}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.pillar ? 'border-red-500' : 'border-gray-300'
                      } ${!clientId ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">
                      {clientId ? 'Seleccionar pilar...' : 'Primero selecciona un cliente'}
                    </option>
                    {availablePillars.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.pillar && (
                    <p className="mt-1 text-sm text-red-600">{errors.pillar}</p>
                  )}
                </div>

                {type === 'pinned' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Publicación *
                    </label>
                    <input
                      type="date"
                      value={pinnedDate}
                      onChange={(e) => setPinnedDate(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.pinnedDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.pinnedDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.pinnedDate}</p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PostStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {getAvailableStatuses(existingPost?.status || 'draft').map((s) => (
                        <option key={s} value={s}>
                          {s === 'draft' && 'Borrador'}
                          {s === 'pending_approval' && 'Pendiente de Aprobación'}
                          {s === 'rejected' && 'Rechazado'}
                          {s === 'approved' && 'Aprobado'}
                          {s === 'finished' && 'Terminado'}
                          {s === 'published' && 'Publicado'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guion
                  </label>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Escribe el guion del video aquí..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caption
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Escribe el caption para redes sociales..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link del Asset (Google Drive)
                  </label>
                  <input
                    type="url"
                    value={assetLink}
                    onChange={(e) => setAssetLink(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.assetLink ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="https://drive.google.com/..."
                  />
                  {errors.assetLink && (
                    <p className="mt-1 text-sm text-red-600">{errors.assetLink}</p>
                  )}
                </div>

                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content}</p>
                )}
              </div>
            </div>

            {/* Feedback (solo si es rechazo) */}
            {isEditing && status === 'rejected' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Feedback de Rechazo *
                </h2>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${errors.feedback ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Explica por qué se rechaza este post (mínimo 10 caracteres)..."
                />
                {errors.feedback && (
                  <p className="mt-1 text-sm text-red-600">{errors.feedback}</p>
                )}
              </div>
            )}

            {/* Historial de Feedback */}
            {isEditing && existingPost && existingPost.feedback_history.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Historial de Feedback
                </h2>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {existingPost.feedback_history.map((entry, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.user}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/posts')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Comments Panel - only when editing */}
        {isEditing && id && (
          <div className="hidden lg:block w-96 flex-shrink-0">
            <div className="sticky top-4 bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-8rem)]">
              <CommentSection postId={id} clientId={clientId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
