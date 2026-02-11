import { Link } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { PostsTable } from '@components/posts/PostsTable';
import { PostsCardsView } from '@components/posts/PostsCardsView';
import { QueueView } from '@components/posts/QueueView';
import { CSVModal } from '@components/common/CSVModal';
import { Plus, List, Calendar, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@hooks/useDevice';
import { PageHeader } from '@components/common/PageHeader';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import type { PostStatus } from '../../types/index';

export function PostsPage() {
  const { user } = useAuthStore();
  const { fetchPostsByClient, fetchAllPosts } = usePostStore();
  const { clients } = useClientStore();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'table' | 'queue'>('table');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showCSVModal, setShowCSVModal] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  // Sincronizar posts del cliente seleccionado (o todos)
  useEffect(() => {
    if (selectedClientId) {
      const unsubscribe = fetchPostsByClient(selectedClientId);
      return () => unsubscribe();
    } else {
      const unsubscribe = fetchAllPosts();
      return () => unsubscribe();
    }
  }, [selectedClientId, fetchPostsByClient, fetchAllPosts]);

  const canCreate = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'creative';
  const canViewQueue = user?.role === 'admin' || user?.role === 'manager';
  const defaultStatusFilter: PostStatus | '' = user?.role === 'production' ? 'approved' : '';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Contenido"
        description="Gestiona posts y contenido para tus clientes"
      >
        <div className="flex items-center gap-3">
          {/* Selector de Cliente */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Todos los clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          {!isMobile && (
            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${viewMode === 'table'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                title="Vista tabla"
              >
                <List className="h-4 w-4" />
              </button>
              {canViewQueue && (
                <button
                  onClick={() => setViewMode('queue')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'queue'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Vista cola"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {canManage && (
            <Button variant="outline" onClick={() => setShowCSVModal(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
          )}

          {canCreate && (
            <Link to="/posts/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Post
              </Button>
            </Link>
          )}
        </div>
      </PageHeader>

      <Card className="overflow-hidden min-h-[500px]">
        {isMobile ? (
          <div className="p-4">
            <PostsCardsView clientId={selectedClientId} defaultStatusFilter={defaultStatusFilter} />
          </div>
        ) : viewMode === 'table' ? (
          <div className="p-0">
            <PostsTable clientId={selectedClientId} defaultStatusFilter={defaultStatusFilter} />
          </div>
        ) : (
          <div className="p-0">
            <QueueView clientId={selectedClientId} />
          </div>
        )}
      </Card>

      {/* CSV Import/Export Modal */}
      <CSVModal isOpen={showCSVModal} onClose={() => setShowCSVModal(false)} />
    </div>
  );
}
