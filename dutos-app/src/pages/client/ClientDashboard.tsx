import { useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';
import { usePostStore } from '@stores/postStore';
import { useContentRequestStore } from '@stores/contentRequestStore';
import { useClientStore } from '@stores/clientStore';
import { Link } from 'react-router-dom';
import { Card } from '@components/common/Card';
import { RequestStatsCard } from '@components/common/RequestStatsCard';
import {
    Clock,
    CheckCircle,
    FileText,
    MessageSquarePlus,
    ArrowRight,
    Calendar
} from 'lucide-react';

export function ClientDashboard() {
    const { user } = useAuthStore();
    const { posts, fetchPostsByClient } = usePostStore();
    const { requests, fetchRequestsByClient, getStats } = useContentRequestStore();
    const { getClientById } = useClientStore();

    const clientId = user?.assigned_client_id;
    const client = clientId ? getClientById(clientId) : null;

    useEffect(() => {
        if (clientId) {
            const unsubPosts = fetchPostsByClient(clientId);
            const unsubRequests = fetchRequestsByClient(clientId);
            return () => {
                unsubPosts();
                unsubRequests();
            };
        }
    }, [clientId, fetchPostsByClient, fetchRequestsByClient]);

    // Stats
    const pendingApproval = posts.filter(p => p.status === 'pending_approval').length;
    const approved = posts.filter(p => p.status === 'approved').length;
    const published = posts.filter(p => p.status === 'published').length;
    const totalPosts = posts.length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;

    // Recent posts for timeline
    const recentPosts = [...posts]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Bienvenido, {user?.name?.split(' ')[0]}
                </h1>
                <p className="text-gray-600 mt-1">
                    Portal de contenidos de {client?.name}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingApproval}</p>
                            <p className="text-xs text-gray-500">Por aprobar</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{approved}</p>
                            <p className="text-xs text-gray-500">Aprobados</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{published}</p>
                            <p className="text-xs text-gray-500">Publicados</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <MessageSquarePlus className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
                            <p className="text-xs text-gray-500">Solicitudes</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Pending Approvals CTA */}
                {pendingApproval > 0 && (
                    <Link to="/client/posts">
                        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-400">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Contenido pendiente</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Tienes {pendingApproval} {pendingApproval === 1 ? 'post' : 'posts'} esperando tu aprobación
                                    </p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </Card>
                    </Link>
                )}

                {/* New Request CTA */}
                <Link to="/client/requests">
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-primary-50 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">Nueva solicitud</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    ¿Necesitas contenido fuera de agenda?
                                </p>
                            </div>
                            <MessageSquarePlus className="w-5 h-5 text-primary-500" />
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Request Stats (if they have requests) */}
            {requests.length > 0 && (
                <RequestStatsCard
                    stats={getStats(clientId)}
                    title="Mis Solicitudes"
                    compact
                />
            )}

            {/* Recent Activity */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
                    <Link to="/client/posts" className="text-sm text-primary-600 hover:underline">
                        Ver todo
                    </Link>
                </div>

                {recentPosts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay actividad reciente</p>
                ) : (
                    <div className="space-y-3">
                        {recentPosts.map((post) => (
                            <div key={post.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className={`w-2 h-2 rounded-full ${post.status === 'published' ? 'bg-green-500' :
                                    post.status === 'approved' ? 'bg-blue-500' :
                                        post.status === 'pending_approval' ? 'bg-amber-500' :
                                            post.status === 'rejected' ? 'bg-red-500' :
                                                'bg-gray-400'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {post.pillar}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {post.content.script?.slice(0, 50) || post.content.caption?.slice(0, 50) || 'Sin contenido'}...
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {new Date(post.updatedAt).toLocaleDateString('es-ES')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Calendar Preview */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Próximas publicaciones</h3>
                    <Link to="/client/calendar" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Ver calendario
                    </Link>
                </div>
                <p className="text-gray-500 text-sm">
                    Tienes {totalPosts - published} posts programados en cola
                </p>
            </Card>
        </div>
    );
}
