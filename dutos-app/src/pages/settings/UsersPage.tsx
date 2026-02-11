import { useEffect, useState } from 'react';
import { useAuthStore } from '@stores/authStore';
import { useUserStore } from '@stores/userStore';
import { useClientStore } from '@stores/clientStore';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { useToast } from '@components/common/Toast';
import {
    Search,
    Edit,
    Trash2,
    Plus,
    UserCheck,
    X,
    Check,
    UserX,
} from 'lucide-react';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Card, CardContent } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import type { UserRole, User } from '../../types/index';

interface UserFormData {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    assigned_client_id: string;
}

export function UsersPage() {
    const { user: currentUser } = useAuthStore();
    const { users, isLoading, fetchUsers, createUser, updateUser, toggleUserStatus, deleteUser } = useUserStore();
    const { clients, fetchClients } = useClientStore();
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        email: '',
        password: '',
        name: '',
        role: 'creative',
        assigned_client_id: '',
    });
    const [statusConfirm, setStatusConfirm] = useState<{
        isOpen: boolean;
        userId: string;
        userName: string;
        currentStatus: 'active' | 'inactive';
    }>({
        isOpen: false,
        userId: '',
        userName: '',
        currentStatus: 'active',
    });

    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        userId: string;
        userName: string;
    }>({
        isOpen: false,
        userId: '',
        userName: '',
    });

    // Solo admin puede acceder a esta página
    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        if (!isAdmin) return;
        const unsubscribe = fetchUsers();
        fetchClients();
        return () => unsubscribe();
    }, [isAdmin, fetchUsers, fetchClients]);

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ email: '', password: '', name: '', role: 'creative', assigned_client_id: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            name: user.name,
            role: user.role,
            assigned_client_id: user.assigned_client_id || '',
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({ email: '', password: '', name: '', role: 'creative', assigned_client_id: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            // Actualizar usuario existente
            const updateData: Record<string, unknown> = {
                name: formData.name,
                role: formData.role,
            };
            if (formData.role === 'client') {
                updateData.assigned_client_id = formData.assigned_client_id || null;
            }
            const success = await updateUser(editingUser.id, updateData as Partial<Omit<User, 'id' | 'createdAt'>>);
            if (success) {
                toast.success('Usuario actualizado correctamente');
                handleCloseModal();
            } else {
                toast.error('Error al actualizar usuario');
            }
        } else {
            // Crear nuevo usuario
            if (!formData.password || formData.password.length < 6) {
                toast.error('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            const success = await createUser(
                formData.email,
                formData.password,
                formData.name,
                formData.role,
                formData.role === 'client' ? formData.assigned_client_id || undefined : undefined
            );
            if (success) {
                toast.success('Usuario creado correctamente');
                handleCloseModal();
            } else {
                // Get error from store or use generic message
                const error = useUserStore.getState().error;
                if (error && error.includes('email-already-in-use')) {
                    toast.error('El correo electrónico ya está en uso');
                } else {
                    toast.error(error || 'Error al crear usuario');
                }
            }
        }
    };

    const handleToggleStatus = (user: User) => {
        setStatusConfirm({
            isOpen: true,
            userId: user.id,
            userName: user.name,
            currentStatus: user.status
        });
    };

    const confirmToggleStatus = async () => {
        const success = await toggleUserStatus(statusConfirm.userId, statusConfirm.currentStatus);
        if (success) {
            toast.success(
                `Usuario ${statusConfirm.currentStatus === 'active' ? 'desactivado' : 'reactivado'} correctamente`
            );
        } else {
            toast.error('Error al cambiar estado del usuario');
        }
        setStatusConfirm({ ...statusConfirm, isOpen: false });
    };

    const handleDeleteClick = (user: User) => {
        setDeleteConfirm({
            isOpen: true,
            userId: user.id,
            userName: user.name,
        });
    };

    const confirmDelete = async () => {
        const success = await deleteUser(deleteConfirm.userId);
        if (success) {
            toast.success('Usuario eliminado permanentemente');
        } else {
            toast.error('Error al eliminar usuario');
        }
        setDeleteConfirm({ ...deleteConfirm, isOpen: false });
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">No tienes permisos para ver esta página.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Usuarios</h1>
                    <p className="text-sm text-gray-500">Administra los accesos y permisos del sistema</p>
                </div>
                <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm w-full max-w-md">
                <Search className="h-5 w-5 text-gray-400 ml-2" />
                <Input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none focus:ring-0"
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((u) => (
                        <Card key={u.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold ${u.status === 'active' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 line-clamp-1">{u.name}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-1">{u.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <Badge variant="outline" className="capitalize">
                                        {u.role}
                                    </Badge>
                                    <Badge variant={u.status === 'active' ? 'success' : 'secondary'}>
                                        {u.status === 'active' ? (
                                            <>
                                                <UserCheck className="h-3 w-3 mr-1" />
                                                Activo
                                            </>
                                        ) : (
                                            'Inactivo'
                                        )}
                                    </Badge>
                                </div>

                                {u.role === 'client' && u.assigned_client_id && (
                                    <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-600 font-medium">Cliente asignado</p>
                                        <p className="text-sm text-blue-900 font-semibold">
                                            {clients.find(c => c.id === u.assigned_client_id)?.name || 'Cliente no encontrado'}
                                        </p>
                                        {(() => {
                                            const siblingCount = users.filter(
                                                sibling => sibling.role === 'client' &&
                                                    sibling.assigned_client_id === u.assigned_client_id &&
                                                    sibling.id !== u.id
                                            ).length;
                                            return siblingCount > 0 ? (
                                                <p className="text-xs text-blue-500 mt-1">
                                                    +{siblingCount} {siblingCount === 1 ? 'usuario más' : 'usuarios más'} asignados
                                                </p>
                                            ) : null;
                                        })()}
                                    </div>
                                )}

                                <div className="flex items-center justify-end pt-4 border-t border-gray-100 space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-primary-600"
                                        onClick={() => handleOpenEdit(u)}
                                        title="Editar"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>

                                    {u.id !== currentUser?.id && (
                                        <>
                                            {/* Si está activo: Mostrar Desactivar (UserX) */}
                                            {u.status === 'active' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                                                    onClick={() => handleToggleStatus(u)}
                                                    title="Desactivar"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                /* Si está inactivo: Mostrar Reactivar (Check) y Eliminar (Trash) */
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-green-50"
                                                        onClick={() => handleToggleStatus(u)}
                                                        title="Reactivar"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDeleteClick(u)}
                                                        title="Eliminar permanentemente"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="users"
                    title={searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios aún'}
                    description={
                        searchTerm
                            ? 'Intenta con otro término de búsqueda'
                            : 'Comienza agregando tu primer usuario al sistema'
                    }
                    action={
                        !searchTerm ? (
                            <Button onClick={handleOpenCreate}>
                                <Plus className="h-4 w-4 mr-2" />
                                Crear primer usuario
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => setSearchTerm('')}>
                                Limpiar búsqueda
                            </Button>
                        )
                    }
                />
            )}

            {/* Modal para Crear/Editar Usuario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    {/* ... modal content ... */}
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre completo
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="juan@empresa.com"
                                    disabled={!!editingUser} // No permitir cambiar email al editar
                                />
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña
                                    </label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        placeholder="Min. 6 caracteres"
                                        minLength={6}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rol
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="creative">Creativo</option>
                                    <option value="production">Producción</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Administrador</option>
                                    <option value="client">Cliente</option>
                                </select>
                            </div>

                            {/* Selector de Cliente (Solo si el rol es 'client') */}
                            {formData.role === 'client' && (
                                <div className="animate-fade-in p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <label className="block text-sm font-medium text-blue-900 mb-2">
                                        Asignar a Cliente
                                    </label>
                                    <select
                                        value={formData.assigned_client_id}
                                        onChange={(e) =>
                                            setFormData({ ...formData, assigned_client_id: e.target.value })
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-blue-200 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">— Seleccionar cliente —</option>
                                        {clients
                                            .filter(c => c.status === 'active')
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                    </select>
                                    <p className="mt-2 text-xs text-blue-600">
                                        Esto vincula al usuario con el portal de un cliente específico.
                                        El usuario solo verá la información de este cliente.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleCloseModal}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" isLoading={isLoading}>
                                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Diálogo de confirmación cambio de estado */}
            <ConfirmDialog
                isOpen={statusConfirm.isOpen}
                title={statusConfirm.currentStatus === 'active' ? 'Desactivar Usuario' : 'Reactivar Usuario'}
                message={`¿Estás seguro que deseas ${statusConfirm.currentStatus === 'active' ? 'desactivar' : 'reactivar'
                    } al usuario "${statusConfirm.userName}"? ${statusConfirm.currentStatus === 'active'
                        ? 'El usuario perderá acceso al sistema inmediatamente.'
                        : 'El usuario volverá a tener acceso al sistema.'
                    }`}
                confirmLabel={statusConfirm.currentStatus === 'active' ? 'Desactivar' : 'Reactivar'}
                cancelLabel="Cancelar"
                onConfirm={confirmToggleStatus}
                onCancel={() => setStatusConfirm({ ...statusConfirm, isOpen: false })}
                type={statusConfirm.currentStatus === 'active' ? 'danger' : 'info'}
            />

            {/* Diálogo de confirmación eliminación PERMANENTE */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Eliminar Usuario Permanentemente"
                message={`¿Estás seguro que deseas eliminar DEFINITIVAMENTE al usuario "${deleteConfirm.userName}"? Esta acción no se puede deshacer y se perderán todos los datos asociados.`}
                confirmLabel="Eliminar Definitivamente"
                cancelLabel="Cancelar"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                type="danger"
            />
        </div>
    );
}
