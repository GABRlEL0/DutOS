import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { useAuthStore } from '@stores/authStore';
import { SwipeablePostCard } from '@components/posts/SwipeablePostCard';
import { EmptyState } from '@components/common/EmptyState';
import { useToast } from '@components/common/Toast';
import { CheckCircle, Clock, FileText } from 'lucide-react';
import type { Post } from '../types/index';

export function MisTareasPage() {
    const navigate = useNavigate();
    const { posts, changePostStatus } = usePostStore();
    const { getClientById } = useClientStore();
    const { user } = useAuthStore();
    const toast = useToast();

    const canApprove = user?.role === 'admin' || user?.role === 'manager';

    // Filter posts based on user role
    const myTasks = useMemo(() => {
        if (!user) return [];

        // Admin/Manager: See pending approval posts
        if (user.role === 'admin' || user.role === 'manager') {
            return posts.filter(p => p.status === 'pending_approval');
        }

        // Creative: See rejected posts (need revision)
        if (user.role === 'creative') {
            return posts.filter(p => p.status === 'rejected');
        }

        // Production: See approved posts (need finishing)
        if (user.role === 'production') {
            return posts.filter(p => p.status === 'approved');
        }

        return [];
    }, [posts, user]);

    const handleApprove = async (post: Post) => {
        try {
            await changePostStatus(post.id, 'approved', undefined, user?.name);
            toast.success('✅ Post aprobado');
        } catch (error) {
            console.error(error);
            toast.error((error as Error).message || 'Error al aprobar');
        }
    };

    const handleReject = async (post: Post, feedback: string) => {
        try {
            await changePostStatus(post.id, 'rejected', feedback, user?.name);
            toast.warning('❌ Post rechazado con feedback');
        } catch (error) {
            console.error(error);
            toast.error((error as Error).message || 'Error al rechazar');
        }
    };

    const handleTap = (postId: string) => {
        navigate(`/posts/${postId}`);
    };

    const getTaskTitle = () => {
        switch (user?.role) {
            case 'admin':
            case 'manager':
                return 'Pendientes de Aprobación';
            case 'creative':
                return 'Posts Rechazados';
            case 'production':
                return 'En Producción';
            default:
                return 'Mis Tareas';
        }
    };

    const getEmptyMessage = () => {
        switch (user?.role) {
            case 'admin':
            case 'manager':
                return 'No hay posts pendientes de aprobación';
            case 'creative':
                return 'No tienes posts rechazados que revisar';
            case 'production':
                return 'No hay posts en producción';
            default:
                return 'No tienes tareas pendientes';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{getTaskTitle()}</h1>
                    <p className="text-gray-600 mt-1">
                        {myTasks.length} {myTasks.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                    </p>
                </div>
                {myTasks.length > 0 && canApprove && (
                    <div className="hidden md:block text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                        <span className="text-green-600">→ Aprobar</span>
                        <span className="mx-2">|</span>
                        <span className="text-red-600">← Rechazar</span>
                    </div>
                )}
            </div>

            {/* Mobile swipe hint */}
            {myTasks.length > 0 && canApprove && (
                <div className="md:hidden bg-gradient-to-r from-green-50 to-red-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Desliza</span>:
                        <span className="text-green-600 mx-1">→ Aprobar</span>
                        |
                        <span className="text-red-600 mx-1">← Rechazar</span>
                    </p>
                </div>
            )}

            {/* Tasks list */}
            {myTasks.length === 0 ? (
                <EmptyState
                    icon={<CheckCircle className="w-12 h-12 text-green-400" />}
                    title="¡Todo al día!"
                    description={getEmptyMessage()}
                />
            ) : (
                <div className="space-y-3">
                    {myTasks.map((post) => {
                        const client = getClientById(post.client_id);
                        const pillarName = client?.strategy_pillars?.find(() => true) === post.pillar
                            ? post.pillar
                            : post.pillar || 'Sin pilar';

                        return (
                            <SwipeablePostCard
                                key={post.id}
                                post={post}
                                pillarName={pillarName}
                                onApprove={() => handleApprove(post)}
                                onReject={(feedback) => handleReject(post, feedback)}
                                onTap={() => handleTap(post.id)}
                                canApprove={canApprove}
                            />
                        );
                    })}
                </div>
            )}

            {/* Quick stats */}
            {myTasks.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-amber-700">{myTasks.length}</p>
                        <p className="text-xs text-amber-600">Pendientes</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-700">{posts.length}</p>
                        <p className="text-xs text-gray-500">Total Posts</p>
                    </div>
                </div>
            )}
        </div>
    );
}
