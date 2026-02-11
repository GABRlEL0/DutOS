import { useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { useActivityLogStore } from '@stores/activityLogStore';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { EmptyState } from '@components/common/EmptyState';
import { StatusBadge } from '@components/posts/StatusBadge';
import { useToast } from '@components/common/Toast';
import { FileText, CheckCircle, XCircle, Calendar, AlertTriangle } from 'lucide-react';
import type { Post } from '../../types/index';
import { useState } from 'react';

export function ClientPostsPage() {
    const { user } = useAuthStore();
    const { posts, fetchPostsByClient, changePostStatus, getCalculatedSlots } = usePostStore();
    const { getClientById } = useClientStore();
    const { logActivity } = useActivityLogStore();
    const toast = useToast();

    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; post: Post | null }>({ isOpen: false, post: null });
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const clientId = user?.assigned_client_id;
    const client = clientId ? getClientById(clientId) : null;

    useEffect(() => {
        if (clientId) {
            const unsub = fetchPostsByClient(clientId);
            return () => unsub();
        }
    }, [clientId, fetchPostsByClient]);

    // Calculate visual dates
    const calculatedSlots = client ? getCalculatedSlots(clientId!, client) : [];
    const visualDatesMap = new Map(calculatedSlots.map(s => [s.post.id, s.visualDate]));

    // Filter and sort
    const pendingPosts = posts.filter(p => p.status === 'pending_approval');
    const otherPosts = posts.filter(p => p.status !== 'pending_approval');

    const handleApprove = async (post: Post) => {
        setIsSubmitting(true);
        try {
            await changePostStatus(post.id, 'approved', undefined, user?.name || 'Cliente');
            toast.success('✅ Post aprobado');

            // Log activity for traceability
            if (clientId && user) {
                await logActivity(
                    clientId,
                    user.id,
                    user.name,
                    'post_approved',
                    `Aprobó post: "${post.pillar}"`,
                    { post_id: post.id }
                );
            }
        } catch {
            toast.error('Error al aprobar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openReject = (post: Post) => {
        setRejectModal({ isOpen: true, post });
        setRejectFeedback('');
    };

    const handleReject = async () => {
        if (!rejectModal.post) return;
        if (rejectFeedback.trim().length < 10) {
            toast.error('El comentario debe tener al menos 10 caracteres');
            return;
        }

        setIsSubmitting(true);
        try {
            await changePostStatus(rejectModal.post.id, 'rejected', rejectFeedback, user?.name || 'Cliente');
            toast.success('Post rechazado con feedback');

            // Log activity for traceability
            if (clientId && user) {
                await logActivity(
                    clientId,
                    user.id,
                    user.name,
                    'post_rejected',
                    `Rechazó post: "${rejectModal.post.pillar}" — ${rejectFeedback.slice(0, 80)}`,
                    { post_id: rejectModal.post.id }
                );
            }

            setRejectModal({ isOpen: false, post: null });
        } catch {
            toast.error('Error al rechazar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const PostCard = ({ post, isPending }: { post: Post; isPending: boolean }) => {
        const visualDate = visualDatesMap.get(post.id);

        return (
            <Card className={`p-4 ${isPending ? 'border-l-4 border-l-amber-400' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            {post.type === 'pinned' ? (
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">📌 Fijo</span>
                            ) : (
                                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">🌊 Flow</span>
                            )}
                            <StatusBadge status={post.status} size="sm" />
                        </div>

                        <p className="font-medium text-gray-900">{post.pillar}</p>

                        {post.content.script && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{post.content.script}</p>
                        )}
                        {post.content.caption && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2 italic">{post.content.caption}</p>
                        )}

                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                            {visualDate && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {visualDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                            )}
                        </div>

                        {/* Feedback history */}
                        {post.feedback_history.length > 0 && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-1">Último feedback:</p>
                                <p className="text-sm text-gray-600">{post.feedback_history[post.feedback_history.length - 1].comment}</p>
                            </div>
                        )}
                    </div>

                    {isPending && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                                size="sm"
                                onClick={() => handleApprove(post)}
                                disabled={isSubmitting}
                                className="bg-green-500 hover:bg-green-600"
                            >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprobar
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReject(post)}
                                disabled={isSubmitting}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rechazar
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Contenido</h1>
                <p className="text-gray-600 mt-1">Revisa y aprueba el contenido de tu marca</p>
            </div>

            {/* Reject Modal */}
            {rejectModal.isOpen && rejectModal.post && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setRejectModal({ isOpen: false, post: null })} />
                    <Card className="relative w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Rechazar contenido</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Por favor, indica el motivo del rechazo para que el equipo pueda corregirlo.
                        </p>
                        <textarea
                            value={rejectFeedback}
                            onChange={(e) => setRejectFeedback(e.target.value)}
                            placeholder="Escribe tu feedback (mínimo 10 caracteres)..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">{rejectFeedback.length}/10 caracteres</p>
                        <div className="flex gap-3 mt-4">
                            <Button variant="outline" onClick={() => setRejectModal({ isOpen: false, post: null })} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleReject}
                                isLoading={isSubmitting}
                                className="flex-1 bg-red-500 hover:bg-red-600"
                            >
                                Rechazar
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Pending Approvals */}
            {pendingPosts.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Pendientes de aprobación ({pendingPosts.length})</h2>
                    </div>
                    <div className="space-y-3">
                        {pendingPosts.map(post => (
                            <PostCard key={post.id} post={post} isPending={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* Other Posts */}
            {otherPosts.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Historial</h2>
                    <div className="space-y-3">
                        {otherPosts.map(post => (
                            <PostCard key={post.id} post={post} isPending={false} />
                        ))}
                    </div>
                </div>
            )}

            {posts.length === 0 && (
                <EmptyState
                    icon={<FileText className="w-12 h-12 text-gray-400" />}
                    title="Sin contenido"
                    description="Aún no hay contenido para mostrar"
                />
            )}
        </div>
    );
}
