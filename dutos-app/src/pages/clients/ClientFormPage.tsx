import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientStore } from '@stores/clientStore';
import { ArrowLeft, Plus, X } from 'lucide-react';
import type { DriveLinks, SocialLinks } from '../../types/index';

const DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/.+/;

const emptyDriveLinks: DriveLinks = {
  root: '',
  strategy_00: '',
  branding_01: '',
  raw_02: '',
  raw_03: '',
  final_04: '',
  material_05: '',
};

const DRIVE_LINK_ORDER: (keyof DriveLinks)[] = [
  'root',
  'strategy_00',
  'branding_01',
  'raw_02',
  'raw_03',
  'final_04',
  'material_05',
];

const DRIVE_LINK_LABELS: Record<keyof DriveLinks, string> = {
  root: 'Root',
  strategy_00: '00 - Estrategia',
  branding_01: '01 - Identidad',
  raw_02: '02 - Fotos en bruto',
  raw_03: '03 - Videos en bruto',
  final_04: '04 - Entregables',
  material_05: '05 - Material del cliente',
};

export function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, addClient, updateClient } = useClientStore();
  const isEditing = !!id && id !== 'new';

  const [name, setName] = useState('');
  const [weeklyCapacity, setWeeklyCapacity] = useState(3);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [driveLinks, setDriveLinks] = useState<DriveLinks>(emptyDriveLinks);
  const [pillars, setPillars] = useState<string[]>([]);
  const [newPillar, setNewPillar] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Nuevos campos
  const [contactName, setContactName] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (isEditing) {
      const client = clients.find(c => c.id === id);
      if (client) {
        setName(client.name || '');
        setWeeklyCapacity(client.weekly_capacity ?? 3);
        setStatus(client.status || 'active');
        setDriveLinks(client.drive_links || emptyDriveLinks);
        setPillars(client.strategy_pillars || []);
        setContactName(client.contact_name || '');
        setContactWhatsapp(client.contact_whatsapp || '');
        setAddress(client.address || '');
        setWebsite(client.website || '');
        setSocialLinks(client.social_links || {});
        setObservations(client.observations || '');
      }
    }
  }, [id, clients, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (weeklyCapacity < 1 || weeklyCapacity > 20) {
      newErrors.weeklyCapacity = 'La capacidad debe estar entre 1 y 20';
    }

    // Validar links de Drive
    Object.entries(driveLinks || {}).forEach(([key, link]) => {
      if (link && !DRIVE_REGEX.test(link)) {
        newErrors[`drive_${key}`] = 'URL de Google Drive inválida';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const clientData = {
      name: name.trim(),
      weekly_capacity: weeklyCapacity,
      status,
      drive_links: driveLinks,
      strategy_pillars: pillars,
      contact_name: contactName.trim(),
      contact_whatsapp: contactWhatsapp.trim(),
      address: address.trim(),
      website: website.trim(),
      social_links: socialLinks,
      observations: observations.trim(),
    };

    if (isEditing && id) {
      updateClient(id, clientData);
    } else {
      addClient(clientData);
    }

    navigate('/clients');
  };

  const handleAddPillar = () => {
    if (newPillar.trim() && !pillars.includes(newPillar.trim())) {
      setPillars([...pillars, newPillar.trim()]);
      setNewPillar('');
    }
  };

  const handleRemovePillar = (pillarToRemove: string) => {
    setPillars(pillars.filter(p => p !== pillarToRemove));
  };

  const handleDriveLinkChange = (key: keyof DriveLinks, value: string) => {
    setDriveLinks(prev => ({ ...prev, [key]: value }));
    // Limpiar error si existe
    if (errors[`drive_${key}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`drive_${key}`];
        return newErrors;
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a clientes
        </button>
      </div>

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información Básica
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Ej: DUTS Agency"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad Semanal (posts) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={weeklyCapacity}
                    onChange={(e) => setWeeklyCapacity(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.weeklyCapacity ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.weeklyCapacity && (
                    <p className="mt-1 text-sm text-red-600">{errors.weeklyCapacity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Contacto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable (Nombre y Apellido)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+54 9 351 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Ubicación y Web */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ubicación y Web
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domicilio
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Av. Colón 1234, Córdoba"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://www.ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Redes Sociales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                    Instagram
                  </span>
                </label>
                <input
                  type="url"
                  value={socialLinks.instagram || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    Facebook
                  </span>
                </label>
                <input
                  type="url"
                  value={socialLinks.facebook || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                    TikTok
                  </span>
                </label>
                <input
                  type="url"
                  value={socialLinks.tiktok || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://tiktok.com/@..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    YouTube
                  </span>
                </label>
                <input
                  type="url"
                  value={socialLinks.youtube || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://youtube.com/@..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    LinkedIn
                  </span>
                </label>
                <input
                  type="url"
                  value={socialLinks.linkedin || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Observaciones
            </h2>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Notas internas sobre el cliente, preferencias, datos adicionales..."
            />
          </div>

          {/* Pilares Estratégicos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pilares Estratégicos
            </h2>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPillar())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Agregar pilar (ej: Branding)"
                />
                <button
                  type="button"
                  onClick={handleAddPillar}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(pillars || []).map((pillar) => (
                  <span
                    key={pillar}
                    className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {pillar}
                    <button
                      type="button"
                      onClick={() => handleRemovePillar(pillar)}
                      className="ml-2 text-primary-400 hover:text-primary-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {(pillars?.length || 0) === 0 && (
                <p className="text-sm text-gray-500">
                  Agrega al menos un pilar estratégico
                </p>
              )}
            </div>
          </div>

          {/* Links de Google Drive */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Links de Google Drive
            </h2>
            <div className="space-y-4">
              {DRIVE_LINK_ORDER.map((key) => {
                const link = driveLinks?.[key] || '';
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {DRIVE_LINK_LABELS[key]}
                    </label>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => handleDriveLinkChange(key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[`drive_${key}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="https://drive.google.com/..."
                    />
                    {errors[`drive_${key}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`drive_${key}`]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
