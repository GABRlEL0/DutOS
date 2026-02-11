import { useEffect, useState } from 'react';
import { useContentRequestStore } from '@stores/contentRequestStore';
import { useClientStore } from '@stores/clientStore';
import { usePostStore } from '@stores/postStore';
import { useAuthStore } from '@stores/authStore';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { EmptyState } from '@components/common/EmptyState';
import { PageHeader } from '@components/common/PageHeader';
import { RequestStatsCard } from '@components/common/RequestStatsCard';
import { useToast } from '@components/common/Toast';
import {
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    MessageSquare,
    Calendar,
    Building2,
    Send,
    FileText,
    X,
    Pencil,
    Trash2
} from 'lucide-react';
import type { ContentRequest, ContentRequestStatus, ContentRequestPriority, PostType } from '../types/index';
import { dateOnlyFromInput } from '../utils/dateOnly';

export function ContentRequestsAdminPage() {
    const { user } = useAuthStore();
    const {
        requests,
        fetchAllRequests,
        respondToRequest,
        convertToPost,
        updateRequest,
        deleteRequest,
        isLoading,
        getStats
    } = useContentRequestStore();
    const { clients, getClientById } = useClientStore();
    const { addPost } = usePostStore();
    const toast = useToast();

    const [filterClient, setFilterClient] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<ContentRequestStatus | ''>('');
    const [selectedRequest, setSelectedRequest] = useState<ContentRequest | null>(null);
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<ContentRequest | null>(null);
    const [requestToDelete, setRequestToDelete] = useState<ContentRequest | null>(null);

    // Respond form
    const [responseText, setResponseText] = useState('');
    const [responseStatus, setResponseStatus] = useState<ContentRequestStatus>('approved');

    // Convert form
    const [postType, setPostType] = useState<PostType>('flow');
    const [postPillar, setPostPillar] = useState('');
    const [postScript, setPostScript] = useState('');
    const [postCaption, setPostCaption] = useState('');
    const [pinnedDate, setPinnedDate] = useState('');

    // Edit request form
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPriority, setEditPriority] = useState<ContentRequestPriority>('normal');
    const [editPreferredDate, setEditPreferredDate] = useState('');
    const [editAttachments, setEditAttachments] = useState<string[]>([]);
    const [editNewAttachment, setEditNewAttachment] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const unsub = fetchAllRequests();
        return () => unsub();
    }, [fetchAllRequests]);

    // Filtered requests
    const filteredRequests = requests.filter(r => {
        if (filterClient && r.client_id !== filterClient) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        return true;
    });

    // Sort: pending first, then by date
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const getStatusIcon = (status: ContentRequestStatus) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'in_progress': return <ArrowRight className="w-4 h-4 text-blue-500" />;
            case 'converted': return <FileText className="w-4 h-4 text-primary-500" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
        }
    };

    const getStatusLabel = (status: ContentRequestStatus) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'approved': return 'Aprobada';
            case 'in_progress': return 'En progreso';
            case 'converted': return 'Convertida';
            case 'rejected': return 'Rechazada';
        }
    };

    const getPriorityBadge = (p: ContentRequestPriority) => {
        switch (p) {
            case 'urgent': return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">🔴 Urgente</span>;
            case 'normal': return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">Normal</span>;
            case 'low': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Baja</span>;
        }
    };

    const openRespond = (request: ContentRequest) => {
        setSelectedRequest(request);
        setResponseText('');
        setResponseStatus('approved');
        setShowRespondModal(true);
    };

    const openConvert = (request: ContentRequest) => {
        setSelectedRequest(request);
        setPostType('flow');
        setPostPillar('');
        setPostScript(request.description);
        setPostCaption('');
        setPinnedDate(request.preferred_date ? new Date(request.preferred_date).toISOString().split('T')[0] : '');
        setShowConvertModal(true);
    };

    const openEdit = (request: ContentRequest) => {
        setEditingRequest(request);
        setEditTitle(request.title);
        setEditDescription(request.description);
        setEditPriority(request.priority);
        setEditPreferredDate(request.preferred_date ? new Date(request.preferred_date).toISOString().split('T')[0] : '');
        setEditAttachments(request.attachments || []);
        setEditNewAttachment('');
        setShowEditModal(true);
    };

    const closeEdit = () => {
        setShowEditModal(false);
        setEditingRequest(null);
        setEditTitle('');
        setEditDescription('');
        setEditPriority('normal');
        setEditPreferredDate('');
        setEditAttachments([]);
        setEditNewAttachment('');
    };

    const handleRespond = async () => {
        if (!selectedRequest || !user) return;

        setIsSubmitting(true);
        try {
            await respondToRequest(selectedRequest.id, responseText, user.id, responseStatus);
            toast.success('Respuesta enviada');
            setShowRespondModal(false);
            setSelectedRequest(null);
        } catch {
            toast.error('Error al responder');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConvert = async () => {
        if (!selectedRequest || !user) return;

        const client = getClientById(selectedRequest.client_id);
        if (!client) return;

        if (!postPillar) {
            toast.error('Selecciona un pilar');
            return;
        }

        setIsSubmitting(true);
        try {
            await addPost({
                client_id: selectedRequest.client_id,
                type: postType,
                pillar: postPillar,
                pinned_date: postType === 'pinned' && pinnedDate ? dateOnlyFromInput(pinnedDate) : null,
                status: 'draft',
                content: {
                    script: postScript,
                    caption: postCaption,
                    asset_link: selectedRequest.attachments[0] || '',
                },
                feedback_history: [{
                    user: 'Sistema',
                    comment: `Creado desde solicitud: "${selectedRequest.title}"`,
                    timestamp: new Date(),
                }],
                createdBy: user.id,
            });

            await convertToPost(selectedRequest.id, 'converted');
            toast.success('Post creado desde solicitud');
            setShowConvertModal(false);
            setSelectedRequest(null);
        } catch {
            toast.error('Error al convertir');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addEditAttachment = () => {
        const value = editNewAttachment.trim();
        if (value && !editAttachments.includes(value)) {
            setEditAttachments([...editAttachments, value]);
            setEditNewAttachment('');
        }
    };

    const removeEditAttachment = (link: string) => {
        setEditAttachments(editAttachments.filter(a => a !== link));
    };

    const handleSaveEdit = async () => {
        if (!editingRequest) return;

        if (!editTitle.trim()) {
            toast.error('El titulo es obligatorio');
            return;
        }
        if (!editDescription.trim()) {
            toast.error('La descripcion es obligatoria');
            return;
        }

        setIsSubmitting(true);
        try {
            await updateRequest(editingRequest.id, {
                title: editTitle.trim(),
                description: editDescription.trim(),
                priority: editPriority,
                preferred_date: editPreferredDate ? new Date(editPreferredDate) : null,
                attachments: editAttachments,
            });
            toast.success('Solicitud actualizada');
            closeEdit();
        } catch {
            toast.error('Error al actualizar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!requestToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteRequest(requestToDelete.id);
            toast.success('Solicitud eliminada');
            setRequestToDelete(null);
        } catch {
            toast.error('Error al eliminar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Solicitudes de Contenido"
                description={`${pendingCount} solicitudes pendientes de revisión`}
            >
                <div className="flex items-center gap-3">
                    <select
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    >
                        <option value="">Todos los clientes</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as ContentRequestStatus | '')}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    >
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="approved">Aprobada</option>
                        <option value="in_progress">En progreso</option>
                        <option value="converted">Convertida</option>
                        <option value="rejected">Rechazada</option>
                    </select>
                </div>
            </PageHeader>

            {/* Stats Overview */}
            <RequestStatsCard
                stats={getStats(filterClient || undefined)}
                title={filterClient ? `Estadísticas de ${getClientById(filterClient)?.name}` : 'Estadísticas Globales'}
            />

            {/* Respond Modal */}
            {showRespondModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowRespondModal(false)} />
                    <Card className="relative w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Responder solicitud</h2>
                            <button onClick={() => setShowRespondModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            <span className="font-medium">{selectedRequest.title}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo estado</label>
                                <select
                                    value={responseStatus}
                                    onChange={(e) => setResponseStatus(e.target.value as ContentRequestStatus)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="approved">Aprobada</option>
                                    <option value="in_progress">En progreso</option>
                                    <option value="rejected">Rechazada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (opcional)</label>
                                <textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Escribe una respuesta para el cliente..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setShowRespondModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button onClick={handleRespond} isLoading={isSubmitting} className="flex-1">
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Convert Modal */}
            {showConvertModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowConvertModal(false)} />
                    <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Convertir a Post</h2>
                            <button onClick={() => setShowConvertModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm font-medium text-gray-700">{selectedRequest.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{getClientById(selectedRequest.client_id)?.name}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={postType}
                                        onChange={(e) => setPostType(e.target.value as PostType)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="flow">Flow</option>
                                        <option value="pinned">Fijo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilar *</label>
                                    <select
                                        value={postPillar}
                                        onChange={(e) => setPostPillar(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {getClientById(selectedRequest.client_id)?.strategy_pillars.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {postType === 'pinned' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fija</label>
                                    <input
                                        type="date"
                                        value={pinnedDate}
                                        onChange={(e) => setPinnedDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                                <textarea
                                    value={postScript}
                                    onChange={(e) => setPostScript(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                                <textarea
                                    value={postCaption}
                                    onChange={(e) => setPostCaption(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => setShowConvertModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button onClick={handleConvert} isLoading={isSubmitting} className="flex-1">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Crear Post
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={closeEdit} />
                    <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Editar solicitud</h2>
                            <button onClick={closeEdit} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion *</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                                    <select
                                        value={editPriority}
                                        onChange={(e) => setEditPriority(e.target.value as ContentRequestPriority)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="low">Baja</option>
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha preferida</label>
                                    <input
                                        type="date"
                                        value={editPreferredDate}
                                        onChange={(e) => setEditPreferredDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntos (Drive)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={editNewAttachment}
                                        onChange={(e) => setEditNewAttachment(e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                                    />
                                    <Button type="button" variant="outline" onClick={addEditAttachment}>
                                        Agregar
                                    </Button>
                                </div>
                                {editAttachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {editAttachments.map((link, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                <span className="truncate flex-1">{link}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeEditAttachment(link)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={closeEdit} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button onClick={handleSaveEdit} isLoading={isSubmitting} className="flex-1">
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!requestToDelete}
                title="Eliminar solicitud"
                message="Esta accion eliminara la solicitud."
                type="danger"
                confirmLabel="Eliminar"
                onCancel={() => setRequestToDelete(null)}
                onConfirm={handleDelete}
            />

            {/* Requests List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : sortedRequests.length === 0 ? (
                <EmptyState
                    icon={<MessageSquare className="w-12 h-12 text-gray-400" />}
                    title="Sin solicitudes"
                    description="No hay solicitudes de contenido"
                />
            ) : (
                <div className="space-y-3">
                    {sortedRequests.map((request) => {
                        const client = getClientById(request.client_id);
                        return (
                            <Card key={request.id} className={`p-4 ${request.status === 'pending' ? 'border-l-4 border-l-amber-400' : ''}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getPriorityBadge(request.priority)}
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {client?.name}
                                                {request.requested_by_name && (
                                                    <span className="text-gray-500 font-medium ml-1">
                                                        · {request.requested_by_name}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <h3 className="font-medium text-gray-900">{request.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{request.description}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(request.status)}
                                                <span className="text-xs text-gray-500">{getStatusLabel(request.status)}</span>
                                            </div>
                                            {request.preferred_date && (
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(request.preferred_date).toLocaleDateString('es-ES')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {request.status === 'pending' && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => openRespond(request)}>
                                                    Responder
                                                </Button>
                                                <Button size="sm" onClick={() => openConvert(request)}>
                                                    → Post
                                                </Button>
                                            </>
                                        )}
                                        {request.status === 'approved' && (
                                            <Button size="sm" onClick={() => openConvert(request)}>
                                                → Post
                                            </Button>
                                        )}

                                        <Button size="sm" variant="outline" onClick={() => openEdit(request)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => setRequestToDelete(request)}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
