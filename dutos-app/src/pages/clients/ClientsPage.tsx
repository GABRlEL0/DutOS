import { useAuthStore } from '@stores/authStore';
import { useClientStore } from '@stores/clientStore';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { useToast } from '@components/common/Toast';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Plus,
  Building2
} from 'lucide-react';
import { PageHeader } from '@components/common/PageHeader';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Card, CardContent } from '@components/common/Card';
import { Badge } from '@components/common/Badge';

export function ClientsPage() {
  const { clients, deleteClient } = useClientStore();
  const { user } = useAuthStore();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
  }>({
    isOpen: false,
    clientId: '',
    clientName: ''
  });

  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      clientId: id,
      clientName: name
    });
  };

  const confirmDelete = () => {
    deleteClient(deleteConfirm.clientId);
    setDeleteConfirm({ isOpen: false, clientId: '', clientName: '' });
    toast.success('Cliente eliminado correctamente');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes y sus configuraciones"
      >
        {canEdit && (
          <Link to="/clients/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </Link>
        )}
      </PageHeader>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 font-display leading-tight">
                        {client.name}
                      </h2>
                      <Badge variant={client.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                        {client.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Capacidad semanal</span>
                    <span className="font-semibold text-gray-900">{client.weekly_capacity} posts</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Pilares estratégicos</span>
                    <span className="font-semibold text-gray-900">{client.strategy_pillars?.length || 0}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                  {(client.strategy_pillars || []).slice(0, 3).map((pillar) => (
                    <span
                      key={pillar}
                      className="px-2 py-1 bg-white border border-gray-100 text-gray-600 text-xs rounded-md shadow-sm"
                    >
                      {pillar}
                    </span>
                  ))}
                  {(client.strategy_pillars?.length || 0) > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
                      +{(client.strategy_pillars?.length || 0) - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Link
                    to={`/clients/${client.id}`}
                  >
                    <Button variant="ghost" size="sm" className="-ml-3 text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                      Ver detalles
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </Link>

                  {canEdit && (
                    <div className="flex space-x-1">
                      <Link to={`/clients/${client.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(client.id, client.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="clients"
          title={searchTerm ? "No se encontraron clientes" : "No hay clientes aún"}
          description={searchTerm
            ? "Intenta con otro término de búsqueda"
            : "Comienza agregando tu primer cliente al sistema"
          }
          action={canEdit && !searchTerm ? (
            <Link to="/clients/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer cliente
              </Button>
            </Link>
          ) : searchTerm ? (
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Limpiar búsqueda
            </Button>
          ) : undefined}
        />
      )}

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar el cliente "${deleteConfirm.clientName}"? Esta acción eliminará todos los posts asociados y no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, clientId: '', clientName: '' })}
      />
    </div>
  );
}