import { useEffect, useState } from 'react';
import { useAuthStore } from '@stores/authStore';
import { useClientStore } from '@stores/clientStore';
import { useContentRequestStore } from '@stores/contentRequestStore';
import { useActivityLogStore } from '@stores/activityLogStore';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { EmptyState } from '@components/common/EmptyState';
import { useToast } from '@components/common/Toast';
import {
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    MessageSquare,
    Calendar,
    X,
    Pencil,
    Trash2,
    UploadCloud
} from 'lucide-react';
import type { ContentRequest, ContentRequestPriority } from '../../types/index';

export function ContentRequestsPage() {
    const { user } = useAuthStore();
    const { getClientById } = useClientStore();
    const {
        requests,
        fetchRequestsByClient,
        addRequest,
        updateRequest,
        deleteRequest,
        isLoading
    } = useContentRequestStore();
    const { logActivity } = useActivityLogStore();
    const toast = useToast();

    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ContentRequest | null>(null);
    const [editingRequest, setEditingRequest] = useState<ContentRequest | null>(null);
    const [requestToDelete, setRequestToDelete] = useState<ContentRequest | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<ContentRequestPriority>('normal');
    const [preferredDate, setPreferredDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const clientId = user?.assigned_client_id;
    const materialDriveLink = clientId ? (getClientById(clientId)?.drive_links?.material_05 || '') : '';
    const hasMaterialFolder = materialDriveLink.trim().length > 0;

    useEffect(() => {
        if (clientId) {
            const unsub = fetchRequestsByClient(clientId);
            return () => unsub();
        }
    }, [clientId, fetchRequestsByClient]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('normal');
        setPreferredDate('');
        setEditingRequest(null);
        setShowForm(false);
    };

    const openNewRequest = () => {
        setEditingRequest(null);
        setTitle('');
        setDescription('');
        setPriority('normal');
        setPreferredDate('');
        setShowForm(true);
    };

    const openEditRequest = (request: ContentRequest) => {
        setEditingRequest(request);
        setTitle(request.title);
        setDescription(request.description);
        setPriority(request.priority);
        setPreferredDate(
            request.preferred_date ? new Date(request.preferred_date).toISOString().split('T')[0] : ''
        );
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !user) return;

        if (!editingRequest && !hasMaterialFolder) {
            toast.info('Solicita acceso a la carpeta de Drive (05 - Material del cliente) para poder subir el material.');
            return;
        }

        if (!title.trim()) {
            toast.error('El título es obligatorio');
            return;
        }
        if (!description.trim()) {
            toast.error('La descripción es obligatoria');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingRequest) {
                await updateRequest(editingRequest.id, {
                    title: title.trim(),
                    description: description.trim(),
                    priority,
                    preferred_date: preferredDate ? new Date(preferredDate) : null,
                });
                toast.success('Solicitud actualizada');
            } else {
                await addRequest({
                    client_id: clientId,
                    requested_by: user.id,
                    requested_by_name: user.name,
                    title: title.trim(),
                    description: description.trim(),
                    priority,
                    preferred_date: preferredDate ? new Date(preferredDate) : null,
                    attachments: materialDriveLink ? [materialDriveLink] : [],
                    status: 'pending',
                });

                // Log activity for traceability
                await logActivity(
                    clientId,
                    user.id,
                    user.name,
                    'content_request_created',
                    `Creó solicitud: "${title.trim()}"`,
                    { priority }
                );
                toast.success('Solicitud enviada correctamente');
            }
            resetForm();
        } catch {
            toast.error(editingRequest ? 'Error al actualizar la solicitud' : 'Error al enviar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canClientModify = (request: ContentRequest) => {
        return (
            user?.role === 'client' &&
            request.client_id === clientId &&
            request.requested_by === user.id
        );
    };

    const handleDelete = async () => {
        if (!requestToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteRequest(requestToDelete.id);
            toast.success('Solicitud eliminada');

            if (selectedRequest?.id === requestToDelete.id) {
                setSelectedRequest(null);
            }
            setRequestToDelete(null);
        } catch {
            toast.error('Error al eliminar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = (status: ContentRequest['status']) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'in_progress': return <ArrowRight className="w-4 h-4 text-blue-500" />;
            case 'converted': return <CheckCircle className="w-4 h-4 text-primary-500" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
        }
    };

    const getStatusLabel = (status: ContentRequest['status']) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'approved': return 'Aprobada';
            case 'in_progress': return 'En progreso';
            case 'converted': return 'Convertida a post';
            case 'rejected': return 'Rechazada';
        }
    };

    const getPriorityBadge = (p: ContentRequestPriority) => {
        switch (p) {
            case 'urgent': return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Urgente</span>;
            case 'normal': return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">Normal</span>;
            case 'low': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Baja</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Contenido</h1>
                    <p className="text-gray-600 mt-1">Solicita contenido fuera de la agenda regular</p>
                </div>
                <Button onClick={openNewRequest}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Solicitud
                </Button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
                    <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingRequest ? 'Editar Solicitud' : 'Nueva Solicitud'}
                            </h2>
                            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej: Promo Día de la Madre"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe qué tipo de contenido necesitas..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prioridad
                                </label>
                                <div className="flex gap-3">
                                    {(['low', 'normal', 'urgent'] as const).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${priority === p
                                                ? p === 'urgent' ? 'bg-red-50 border-red-300 text-red-700' :
                                                    p === 'normal' ? 'bg-gray-100 border-gray-300 text-gray-700' :
                                                        'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {p === 'low' ? 'Baja' : p === 'normal' ? 'Normal' : 'Urgente'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha preferida (opcional)
                                </label>
                                <input
                                    type="date"
                                    value={preferredDate}
                                    onChange={(e) => setPreferredDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subir archivos (Drive)
                                </label>
                                {hasMaterialFolder ? (
                                    <a
                                        href={materialDriveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                                    >
                                        <UploadCloud className="w-4 h-4 text-primary-600" />
                                        Abrir carpeta para subir archivos
                                    </a>
                                ) : (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                        <p className="text-sm font-medium text-amber-900">
                                            Necesitas acceso a la carpeta para subir el material.
                                        </p>
                                        <p className="text-sm text-amber-800 mt-1">
                                            Solicita acceso a la carpeta de Drive "05 - Material del cliente" o pide al equipo que la configure en la ficha del cliente.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    className="flex-1"
                                    disabled={!editingRequest && !hasMaterialFolder}
                                >
                                    {editingRequest ? 'Guardar cambios' : 'Enviar Solicitud'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Request Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedRequest(null)} />
                    <Card className="relative w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(selectedRequest.status)}
                                <span className="text-sm text-gray-500">{getStatusLabel(selectedRequest.status)}</span>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <h2 className="text-lg font-bold text-gray-900 mb-2">{selectedRequest.title}</h2>
                        <p className="text-gray-600 whitespace-pre-wrap">{selectedRequest.description}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {getPriorityBadge(selectedRequest.priority)}
                            {selectedRequest.preferred_date && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(selectedRequest.preferred_date).toLocaleDateString('es-ES')}
                                </span>
                            )}
                        </div>

                        {selectedRequest.response && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-700 mb-1">Respuesta del equipo:</p>
                                <p className="text-sm text-blue-600">{selectedRequest.response}</p>
                            </div>
                        )}

                        {selectedRequest.attachments.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-1">Adjuntos:</p>
                                <div className="space-y-2">
                                    {selectedRequest.attachments.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                                        >
                                            <span className="inline-flex items-center gap-2 min-w-0">
                                                <UploadCloud className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                                <span className="truncate">
                                                    {hasMaterialFolder && link.trim() === materialDriveLink.trim()
                                                        ? 'Abrir carpeta para subir archivos'
                                                        : 'Abrir adjunto'}
                                                </span>
                                            </span>
                                            <span className="text-xs text-gray-500 flex-shrink-0">Drive</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {canClientModify(selectedRequest) && (
                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const req = selectedRequest;
                                        setSelectedRequest(null);
                                        openEditRequest(req);
                                    }}
                                >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => setRequestToDelete(selectedRequest)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                </Button>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                            Creada el {new Date(selectedRequest.createdAt).toLocaleDateString('es-ES')}
                        </div>
                    </Card>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!requestToDelete}
                title="Eliminar solicitud"
                message="Esta accion eliminara la solicitud creada por tu usuario."
                type="danger"
                confirmLabel="Eliminar"
                onCancel={() => setRequestToDelete(null)}
                onConfirm={handleDelete}
            />

            {/* Requests List */}
            {requests.length === 0 ? (
                <EmptyState
                    icon={<MessageSquare className="w-12 h-12 text-gray-400" />}
                    title="Sin solicitudes"
                    description="Cuando necesites contenido fuera de agenda, créalo aquí"
                />
            ) : (
                <div className="space-y-3">
                    {requests.map((request) => (
                        <Card
                            key={request.id}
                            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedRequest(request)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getStatusIcon(request.status)}
                                        <h3 className="font-medium text-gray-900 truncate">{request.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{request.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {getPriorityBadge(request.priority)}
                                        <span className="text-xs text-gray-400">
                                            {new Date(request.createdAt).toLocaleDateString('es-ES')}
                                        </span>
                                    </div>
                                </div>
                                {request.response && (
                                    <div className="flex-shrink-0">
                                        <MessageSquare className="w-4 h-4 text-blue-500" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
