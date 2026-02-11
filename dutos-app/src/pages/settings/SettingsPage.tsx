import { useState, useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import {
    User, Building2, Languages, Bell, Save, RotateCcw,
    Check, AlertCircle
} from 'lucide-react';

// Default labels dictionary
const DEFAULT_LABELS: Record<string, { key: string; label: string; value: string; category: string }> = {
    // Posts
    post_script: { key: 'post_script', label: 'Campo "Guion"', value: 'Guion', category: 'Contenido' },
    post_caption: { key: 'post_caption', label: 'Campo "Caption"', value: 'Caption', category: 'Contenido' },
    post_asset: { key: 'post_asset', label: 'Campo "Asset"', value: 'Asset', category: 'Contenido' },
    post_pillar: { key: 'post_pillar', label: 'Campo "Pilar"', value: 'Pilar', category: 'Contenido' },
    post_priority: { key: 'post_priority', label: 'Campo "Prioridad"', value: 'Prioridad', category: 'Contenido' },
    post_type_flow: { key: 'post_type_flow', label: 'Tipo "Flow"', value: 'Flow', category: 'Contenido' },
    post_type_pinned: { key: 'post_type_pinned', label: 'Tipo "Pinned"', value: 'Pinned', category: 'Contenido' },
    // Status
    status_draft: { key: 'status_draft', label: 'Estado "Borrador"', value: 'Borrador', category: 'Estados' },
    status_pending: { key: 'status_pending', label: 'Estado "Pendiente"', value: 'Pendiente de Aprobación', category: 'Estados' },
    status_approved: { key: 'status_approved', label: 'Estado "Aprobado"', value: 'Aprobado', category: 'Estados' },
    status_rejected: { key: 'status_rejected', label: 'Estado "Rechazado"', value: 'Rechazado', category: 'Estados' },
    status_finished: { key: 'status_finished', label: 'Estado "Terminado"', value: 'Terminado', category: 'Estados' },
    status_published: { key: 'status_published', label: 'Estado "Publicado"', value: 'Publicado', category: 'Estados' },
    // Roles
    role_admin: { key: 'role_admin', label: 'Rol "Admin"', value: 'Administrador', category: 'Roles' },
    role_manager: { key: 'role_manager', label: 'Rol "Manager"', value: 'Manager', category: 'Roles' },
    role_creative: { key: 'role_creative', label: 'Rol "Creative"', value: 'Creativo', category: 'Roles' },
    role_production: { key: 'role_production', label: 'Rol "Production"', value: 'Producción', category: 'Roles' },
    role_client: { key: 'role_client', label: 'Rol "Client"', value: 'Cliente', category: 'Roles' },
    // Sections
    section_clients: { key: 'section_clients', label: 'Menú "Clientes"', value: 'Clientes', category: 'Navegación' },
    section_content: { key: 'section_content', label: 'Menú "Contenido"', value: 'Contenido', category: 'Navegación' },
    section_queue: { key: 'section_queue', label: 'Menú "Cola"', value: 'Cola', category: 'Navegación' },
    section_requests: { key: 'section_requests', label: 'Menú "Solicitudes"', value: 'Solicitudes', category: 'Navegación' },
    section_dashboard: { key: 'section_dashboard', label: 'Menú "Inicio"', value: 'Inicio', category: 'Navegación' },
};

type SettingsTab = 'profile' | 'agency' | 'labels' | 'notifications';

export function SettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Profile state
    const [displayName, setDisplayName] = useState(user?.name || '');

    // Agency state
    const [agencyName, setAgencyName] = useState('');
    const [agencyTimezone, setAgencyTimezone] = useState('America/Argentina/Buenos_Aires');
    const [agencyEmail, setAgencyEmail] = useState('');

    // Labels dictionary state  
    const [labels, setLabels] = useState<Record<string, { key: string; label: string; value: string; category: string }>>(DEFAULT_LABELS);
    const [labelFilter, setLabelFilter] = useState('');
    const [labelCategory, setLabelCategory] = useState('');

    // Notification preferences state
    const [notifPostStatus, setNotifPostStatus] = useState(true);
    const [notifFeedback, setNotifFeedback] = useState(true);
    const [notifNewPost, setNotifNewPost] = useState(true);
    const [notifReminders, setNotifReminders] = useState(true);
    const [notifEmail, setNotifEmail] = useState(false);

    // Load settings from Firestore
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
                if (settingsDoc.exists()) {
                    const data = settingsDoc.data();
                    if (data.agency_name) setAgencyName(data.agency_name);
                    if (data.agency_timezone) setAgencyTimezone(data.agency_timezone);
                    if (data.agency_email) setAgencyEmail(data.agency_email);
                    if (data.labels) {
                        setLabels({ ...DEFAULT_LABELS, ...data.labels });
                    }
                }

                // Load user-level notification prefs
                if (user?.id) {
                    const userPrefsDoc = await getDoc(doc(db, 'user_preferences', user.id));
                    if (userPrefsDoc.exists()) {
                        const prefs = userPrefsDoc.data();
                        if (prefs.notif_post_status !== undefined) setNotifPostStatus(prefs.notif_post_status);
                        if (prefs.notif_feedback !== undefined) setNotifFeedback(prefs.notif_feedback);
                        if (prefs.notif_new_post !== undefined) setNotifNewPost(prefs.notif_new_post);
                        if (prefs.notif_reminders !== undefined) setNotifReminders(prefs.notif_reminders);
                        if (prefs.notif_email !== undefined) setNotifEmail(prefs.notif_email);
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        loadSettings();
    }, [user?.id]);

    const showSaveSuccess = () => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setSaveStatus('saving');
        try {
            await setDoc(doc(db, 'users', user.id), { name: displayName }, { merge: true });
            showSaveSuccess();
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveStatus('error');
        }
    };

    const handleSaveAgency = async () => {
        setSaveStatus('saving');
        try {
            await setDoc(doc(db, 'settings', 'general'), {
                agency_name: agencyName,
                agency_timezone: agencyTimezone,
                agency_email: agencyEmail,
            }, { merge: true });
            showSaveSuccess();
        } catch (error) {
            console.error('Error saving agency settings:', error);
            setSaveStatus('error');
        }
    };

    const handleSaveLabels = async () => {
        setSaveStatus('saving');
        try {
            await setDoc(doc(db, 'settings', 'general'), {
                labels: labels,
            }, { merge: true });
            showSaveSuccess();
        } catch (error) {
            console.error('Error saving labels:', error);
            setSaveStatus('error');
        }
    };

    const handleResetLabels = () => {
        setLabels(DEFAULT_LABELS);
    };

    const handleSaveNotifications = async () => {
        if (!user?.id) return;
        setSaveStatus('saving');
        try {
            await setDoc(doc(db, 'user_preferences', user.id), {
                notif_post_status: notifPostStatus,
                notif_feedback: notifFeedback,
                notif_new_post: notifNewPost,
                notif_reminders: notifReminders,
                notif_email: notifEmail,
            }, { merge: true });
            showSaveSuccess();
        } catch (error) {
            console.error('Error saving notification prefs:', error);
            setSaveStatus('error');
        }
    };

    const updateLabel = (key: string, newValue: string) => {
        setLabels(prev => ({
            ...prev,
            [key]: { ...prev[key], value: newValue }
        }));
    };

    const categories = [...new Set(Object.values(labels).map(l => l.category))];
    const filteredLabels = Object.values(labels).filter(l => {
        const matchesFilter = !labelFilter || l.label.toLowerCase().includes(labelFilter.toLowerCase()) || l.value.toLowerCase().includes(labelFilter.toLowerCase());
        const matchesCategory = !labelCategory || l.category === labelCategory;
        return matchesFilter && matchesCategory;
    });

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile', label: 'Mi Perfil', icon: <User className="w-4 h-4" /> },
        { id: 'agency', label: 'Agencia', icon: <Building2 className="w-4 h-4" /> },
        { id: 'labels', label: 'Diccionario', icon: <Languages className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notificaciones', icon: <Bell className="w-4 h-4" /> },
    ];

    const roleNames: Record<string, string> = {
        admin: 'Administrador',
        manager: 'Manager',
        creative: 'Creativo',
        production: 'Producción',
        client: 'Cliente',
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                <p className="mt-1 text-gray-500">Administra tu perfil, la agencia y personaliza la aplicación</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar tabs */}
                <div className="lg:w-56 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content area */}
                <div className="flex-1 min-w-0">
                    {/* Profile */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Mi Perfil</h2>
                                    <p className="text-sm text-gray-500">Información personal y de acceso</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Avatar */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                        {(user?.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user?.name}</p>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                        <span className="inline-flex mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                                            {roleNames[user?.role || ''] || user?.role}
                                        </span>
                                    </div>
                                </div>

                                <hr />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rol
                                        </label>
                                        <input
                                            type="text"
                                            value={roleNames[user?.role || ''] || user?.role || ''}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ID de Usuario
                                        </label>
                                        <input
                                            type="text"
                                            value={user?.id || ''}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-xs cursor-not-allowed font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <SaveButton status={saveStatus} onClick={handleSaveProfile} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Agency */}
                    {activeTab === 'agency' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Información de la Agencia</h2>
                                    <p className="text-sm text-gray-500">Datos generales del workspace</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre de la Agencia
                                        </label>
                                        <input
                                            type="text"
                                            value={agencyName}
                                            onChange={(e) => setAgencyName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="DUT Agency"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email de Contacto
                                        </label>
                                        <input
                                            type="email"
                                            value={agencyEmail}
                                            onChange={(e) => setAgencyEmail(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="hola@dutagency.com"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Zona Horaria
                                        </label>
                                        <select
                                            value={agencyTimezone}
                                            onChange={(e) => setAgencyTimezone(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                                            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                                            <option value="America/Bogota">Bogotá (GMT-5)</option>
                                            <option value="America/Santiago">Santiago (GMT-4)</option>
                                            <option value="America/Lima">Lima (GMT-5)</option>
                                            <option value="Europe/Madrid">Madrid (GMT+1)</option>
                                            <option value="America/New_York">New York (GMT-5)</option>
                                            <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <SaveButton status={saveStatus} onClick={handleSaveAgency} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Labels Dictionary */}
                    {activeTab === 'labels' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Languages className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Diccionario de Etiquetas</h2>
                                        <p className="text-sm text-gray-500">Personaliza los nombres de campos, estados y secciones</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleResetLabels}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Restaurar valores por defecto"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Resetear
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                <input
                                    type="text"
                                    value={labelFilter}
                                    onChange={(e) => setLabelFilter(e.target.value)}
                                    placeholder="Buscar etiqueta..."
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto flex-1 min-w-[200px]"
                                />
                                <select
                                    value={labelCategory}
                                    onChange={(e) => setLabelCategory(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Todas las categorías</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Labels table */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-24">Categoría</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Campo</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Nombre Personalizado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredLabels.map((item) => (
                                            <tr key={item.key} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs font-medium text-gray-400">{item.category}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-sm text-gray-700">{item.label}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <input
                                                        type="text"
                                                        value={item.value}
                                                        onChange={(e) => updateLabel(item.key, e.target.value)}
                                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-300"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <p className="text-xs text-gray-400">
                                    {filteredLabels.length} de {Object.keys(labels).length} etiquetas
                                </p>
                                <SaveButton status={saveStatus} onClick={handleSaveLabels} />
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
                                    <p className="text-sm text-gray-500">Controla qué notificaciones recibís</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <ToggleItem
                                    label="Cambios de estado en posts"
                                    description="Cuando un post cambia de estado (aprobado, rechazado, etc.)"
                                    checked={notifPostStatus}
                                    onChange={setNotifPostStatus}
                                />
                                <ToggleItem
                                    label="Feedback y comentarios"
                                    description="Cuando alguien deja feedback en un post"
                                    checked={notifFeedback}
                                    onChange={setNotifFeedback}
                                />
                                <ToggleItem
                                    label="Nuevos posts asignados"
                                    description="Cuando se crea un nuevo post en un cliente asignado"
                                    checked={notifNewPost}
                                    onChange={setNotifNewPost}
                                />
                                <ToggleItem
                                    label="Recordatorios de deadlines"
                                    description="Alertas cuando una fecha de entrega se acerca"
                                    checked={notifReminders}
                                    onChange={setNotifReminders}
                                />

                                <hr className="my-4" />

                                <ToggleItem
                                    label="Notificaciones por email"
                                    description="Recibir un resumen diario por email además de las notificaciones push"
                                    checked={notifEmail}
                                    onChange={setNotifEmail}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <SaveButton status={saveStatus} onClick={handleSaveNotifications} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Toggle switch component
function ToggleItem({ label, description, checked, onChange }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="pr-4">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

// Save button with status
function SaveButton({ status, onClick }: { status: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            disabled={status === 'saving'}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${status === 'saved'
                    ? 'bg-green-100 text-green-700'
                    : status === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                }`}
        >
            {status === 'saving' ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                </>
            ) : status === 'saved' ? (
                <>
                    <Check className="w-4 h-4" />
                    Guardado
                </>
            ) : status === 'error' ? (
                <>
                    <AlertCircle className="w-4 h-4" />
                    Error al guardar
                </>
            ) : (
                <>
                    <Save className="w-4 h-4" />
                    Guardar cambios
                </>
            )}
        </button>
    );
}
