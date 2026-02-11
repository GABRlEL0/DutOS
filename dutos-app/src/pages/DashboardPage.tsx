
import { useAuthStore } from '@stores/authStore';
import { useClientStore } from '@stores/clientStore';
import { usePostStore } from '@stores/postStore';
import {
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { isStaleContent } from '../utils/slotCalculator';
import { PageHeader } from '@components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@components/common/Card';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

// Skeleton component for loading state
function WidgetSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 flex items-center animate-pulse">
        <div className="p-4 rounded-full bg-gray-200 w-14 h-14" />
        <div className="ml-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { clients, isLoading: clientsLoading } = useClientStore();
  const { posts, getCalculatedSlots, isLoading: postsLoading } = usePostStore();

  const isLoading = clientsLoading || postsLoading;

  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalPosts = posts.length;

  // Contadores de posts por estado
  const pendingApproval = posts.filter(p => p.status === 'pending_approval').length;
  const myDrafts = posts.filter(p => p.status === 'draft' && p.createdBy === user?.id).length;
  const rejectedPosts = posts.filter(p => p.status === 'rejected' && p.createdBy === user?.id).length;
  const approvedTasks = posts.filter(p => p.status === 'approved').length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;

  // Calcular contenido stale
  let staleCount = 0;
  if (user?.role === 'admin' || user?.role === 'manager') {
    clients.forEach(client => {
      const slots = getCalculatedSlots(client.id, client);
      slots.forEach(({ post, visualDate }) => {
        if (isStaleContent(post, visualDate)) {
          staleCount++;
        }
      });
    });
  }

  // Actividad Reciente (basada en posts)
  const recentActivity = [...posts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente desconocido';
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Manager';
      case 'creative': return 'Creativo';
      case 'production': return 'Producción';
      default: return 'Usuario';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      pending_approval: 'Pendiente',
      rejected: 'Rechazado',
      approved: 'Aprobado',
      finished: 'Terminado',
      published: 'Publicado'
    };
    return labels[status] || status;
  };

  // Widgets por rol
  const renderWidgets = () => {
    if (isLoading) {
      return (
        <>
          <WidgetSkeleton />
          <WidgetSkeleton />
          <WidgetSkeleton />
        </>
      );
    }

    switch (user?.role) {
      case 'admin':
      case 'manager':
        return (
          <>
            <Link to="/clients">
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-center">
                  <div className="p-4 rounded-full bg-primary-100/50 text-primary-600 ring-4 ring-primary-50 group-hover:ring-primary-100 transition-all">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                    <p className="text-3xl font-bold text-gray-900 font-display">{activeClients}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/posts">
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-center">
                  <div className="p-4 rounded-full bg-yellow-100/50 text-yellow-600 ring-4 ring-yellow-50 group-hover:ring-yellow-100 transition-all">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendientes Aprobación</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900 font-display">{pendingApproval}</p>
                      {pendingApproval > 0 && (
                        <span className="text-xs text-yellow-600 font-medium">requieren revisión</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-4 rounded-full bg-orange-100/50 text-orange-600 ring-4 ring-orange-50">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Contenido Estancado</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900 font-display">{staleCount}</p>
                    {staleCount > 0 && (
                      <span className="text-xs text-orange-600 font-medium">≥4 semanas</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-4 rounded-full bg-blue-100/50 text-blue-600 ring-4 ring-blue-50">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-3xl font-bold text-gray-900 font-display">{totalPosts}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-4 rounded-full bg-green-100/50 text-green-600 ring-4 ring-green-50">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Publicados</p>
                  <p className="text-3xl font-bold text-gray-900 font-display">{publishedPosts}</p>
                </div>
              </CardContent>
            </Card>

            <Link to="/queue">
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-center">
                  <div className="p-4 rounded-full bg-purple-100/50 text-purple-600 ring-4 ring-purple-50 group-hover:ring-purple-100 transition-all">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cola de Contenido</p>
                    <p className="text-3xl font-bold text-gray-900 font-display">{approvedTasks}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </>
        );

      case 'creative':
        return (
          <>
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-4 rounded-full bg-gray-100/50 text-gray-600 ring-4 ring-gray-50">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Mis Borradores</p>
                  <p className="text-3xl font-bold text-gray-900 font-display">{myDrafts}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-4 rounded-full bg-red-100/50 text-red-600 ring-4 ring-red-50">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rechazados</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900 font-display">{rejectedPosts}</p>
                    {rejectedPosts > 0 && (
                      <span className="text-xs text-red-600 font-medium">revisar feedback</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-4 rounded-full bg-yellow-100/50 text-yellow-600 ring-4 ring-yellow-50">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En Revisión</p>
                  <p className="text-3xl font-bold text-gray-900 font-display">
                    {posts.filter(p => p.status === 'pending_approval' && p.createdBy === user?.id).length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        );

      case 'production':
        return (
          <>
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-4 rounded-full bg-green-100/50 text-green-600 ring-4 ring-green-50">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tareas Pendientes</p>
                  <p className="text-3xl font-bold text-gray-900 font-display">{approvedTasks}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-4 rounded-full bg-blue-100/50 text-blue-600 ring-4 ring-blue-50">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Finalizados</p>
                  <p className="text-3xl font-bold text-gray-900 font-display">
                    {posts.filter(p => p.status === 'finished').length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Bienvenido, ${user?.name}`}
        description={`Panel de control - ${getRoleLabel()}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderWidgets()}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}/edit`}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 block"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${post.status === 'approved' ? 'bg-green-500' :
                    post.status === 'rejected' ? 'bg-red-500' :
                      post.status === 'pending_approval' ? 'bg-yellow-500' :
                        post.status === 'published' ? 'bg-blue-500' :
                          'bg-gray-300'
                    }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {post.content.script?.substring(0, 50) || post.pillar || 'Nuevo post'}...
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-medium text-primary-600">{getClientName(post.client_id)}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true, locale: es })}</span>
                    </p>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${post.status === 'approved' ? 'bg-green-100 text-green-700' :
                      post.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        post.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                          post.status === 'published' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                    }`}>
                    {getStatusLabel(post.status)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">No hay actividad reciente para mostrar</p>
              <Link to="/posts/new" className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block">
                Crear primer post
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}