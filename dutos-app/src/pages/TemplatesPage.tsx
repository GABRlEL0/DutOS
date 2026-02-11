import { useEffect, useState } from 'react';
import { useTemplateStore } from '@stores/templateStore';
import { useClientStore } from '@stores/clientStore';
import { useAuthStore } from '@stores/authStore';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { useToast } from '@components/common/Toast';
import {
    FileText,
    Plus,
    Edit2,
    Trash2,
    Tag,
    Building2,
    Globe,
    X,
    TrendingUp
} from 'lucide-react';
import type { ContentTemplate } from '../types/index';

export function TemplatesPage() {
    const { user } = useAuthStore();
    const { templates, fetchAllTemplates, addTemplate, updateTemplate, deleteTemplate } = useTemplateStore();
    const { clients, getClientById } = useClientStore();
    const toast = useToast();

    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
    const [filterClient, setFilterClient] = useState<string>('');

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [clientId, setClientId] = useState<string>('');
    const [pillarSuggestion, setPillarSuggestion] = useState('');
    const [scriptTemplate, setScriptTemplate] = useState('');
    const [captionTemplate, setCaptionTemplate] = useState('');
    const [tags, setTags] = useState('');

    useEffect(() => {
        const unsub = fetchAllTemplates();
        return () => unsub();
    }, [fetchAllTemplates]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setClientId('');
        setPillarSuggestion('');
        setScriptTemplate('');
        setCaptionTemplate('');
        setTags('');
        setEditingTemplate(null);
    };

    const openEditModal = (template: ContentTemplate) => {
        setEditingTemplate(template);
        setName(template.name);
        setDescription(template.description);
        setClientId(template.client_id || '');
        setPillarSuggestion(template.pillar_suggestion || '');
        setScriptTemplate(template.script_template);
        setCaptionTemplate(template.caption_template);
        setTags(template.tags.join(', '));
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !user) return;

        const templateData = {
            name,
            description,
            client_id: clientId || undefined,
            pillar_suggestion: pillarSuggestion || undefined,
            script_template: scriptTemplate,
            caption_template: captionTemplate,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            created_by: user.id,
        };

        try {
            if (editingTemplate) {
                await updateTemplate(editingTemplate.id, templateData);
                toast.success('Template actualizado');
            } else {
                await addTemplate(templateData);
                toast.success('Template creado');
            }
            setShowModal(false);
            resetForm();
        } catch {
            toast.error('Error al guardar template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este template?')) return;
        try {
            await deleteTemplate(id);
            toast.success('Template eliminado');
        } catch {
            toast.error('Error al eliminar');
        }
    };

    // Filter templates
    const filteredTemplates = filterClient
        ? templates.filter(t => t.client_id === filterClient || !t.client_id)
        : templates;

    const globalTemplates = filteredTemplates.filter(t => !t.client_id);
    const clientTemplates = filteredTemplates.filter(t => t.client_id);

    const canManage = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'creative';

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Templates de Contenido"
                description="Estructuras reutilizables para crear posts"
            >
                <div className="flex items-center gap-3">
                    <select
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    >
                        <option value="">Todos</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {canManage && (
                        <Button onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Template
                        </Button>
                    )}
                </div>
            </PageHeader>

            {/* Global Templates */}
            {globalTemplates.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Templates Globales</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {globalTemplates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onEdit={canManage ? () => openEditModal(template) : undefined}
                                onDelete={canManage ? () => handleDelete(template.id) : undefined}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Client Templates */}
            {clientTemplates.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Templates por Cliente</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clientTemplates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                clientName={getClientById(template.client_id!)?.name}
                                onEdit={canManage ? () => openEditModal(template) : undefined}
                                onDelete={canManage ? () => handleDelete(template.id) : undefined}
                            />
                        ))}
                    </div>
                </div>
            )}

            <EmptyState
                icon={<FileText className="w-12 h-12 text-gray-300" />}
                title="No hay templates"
                description="Crea tu primer template para acelerar la creación de posts"
                action={canManage ? (
                    <Button onClick={() => { resetForm(); setShowModal(true); }}>
                        Crear Template
                    </Button>
                ) : undefined}
            />

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
                    <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Ej: Post Promocional"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cliente (opcional)
                                    </label>
                                    <select
                                        value={clientId}
                                        onChange={e => setClientId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Global (todos los clientes)</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Breve descripción del template"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pilar sugerido
                                    </label>
                                    <input
                                        type="text"
                                        value={pillarSuggestion}
                                        onChange={e => setPillarSuggestion(e.target.value)}
                                        placeholder="Ej: Promoción"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags (separados por coma)
                                    </label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={e => setTags(e.target.value)}
                                        placeholder="promo, venta, urgente"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Script Template
                                </label>
                                <textarea
                                    value={scriptTemplate}
                                    onChange={e => setScriptTemplate(e.target.value)}
                                    placeholder="Estructura del script... Usa {{variable}} para placeholders"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Caption Template
                                </label>
                                <textarea
                                    value={captionTemplate}
                                    onChange={e => setCaptionTemplate(e.target.value)}
                                    placeholder="Estructura del caption... Usa {{variable}} para placeholders"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {editingTemplate ? 'Guardar Cambios' : 'Crear Template'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Template Card Component
interface TemplateCardProps {
    template: ContentTemplate;
    clientName?: string;
    onEdit?: () => void;
    onDelete?: () => void;
}

function TemplateCard({ template, clientName, onEdit, onDelete }: TemplateCardProps) {
    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary-100 rounded-lg">
                        <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {clientName && (
                            <span className="text-xs text-gray-500">{clientName}</span>
                        )}
                    </div>
                </div>
                {(onEdit || onDelete) && (
                    <div className="flex gap-1">
                        {onEdit && (
                            <button onClick={onEdit} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {template.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap mb-3">
                {template.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                    </span>
                ))}
                {template.tags.length > 3 && (
                    <span className="text-xs text-gray-400">+{template.tags.length - 3}</span>
                )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Usado {template.usage_count}x</span>
                </div>
                <span>{new Date(template.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
        </Card>
    );
}
