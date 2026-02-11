import { useState } from 'react';
import { useClientStore } from '@stores/clientStore';
import { useAuthStore } from '@stores/authStore';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { useToast } from '@components/common/Toast';
import {
    Palette,
    Type,
    Image as ImageIcon,
    Mic2,
    Plus,
    Trash2,
    ExternalLink,
    Save
} from 'lucide-react';
import type { Client, BrandKit, BrandColor, BrandTypography, BrandAsset } from '../../types/index';

interface BrandKitProps {
    client: Client;
    readOnly?: boolean;
}

export function BrandKit({ client, readOnly = false }: BrandKitProps) {
    const { updateClient } = useClientStore();
    const { user } = useAuthStore();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);

    // Initial state from client or defaults
    const [colors, setColors] = useState<BrandColor[]>(client.brand_kit?.colors || []);
    const [typography, setTypography] = useState<BrandTypography[]>(client.brand_kit?.typography || []);
    const [assets, setAssets] = useState<BrandAsset[]>(client.brand_kit?.assets || []);
    const [voiceTone, setVoiceTone] = useState(client.brand_kit?.voice_tone || '');

    const canEdit = !readOnly && (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'creative');

    const handleSave = async () => {
        try {
            const updatedBrandKit: BrandKit = {
                colors,
                typography,
                assets,
                voice_tone: voiceTone
            };

            await updateClient(client.id, { brand_kit: updatedBrandKit });
            toast.success('Brand Kit actualizado');
            setIsEditing(false);
        } catch {
            toast.error('Error al actualizar Brand Kit');
        }
    };

    const addColor = () => {
        setColors([...colors, { id: crypto.randomUUID(), name: 'Nuevo Color', hex: '#000000' }]);
    };

    const addTypography = () => {
        setTypography([...typography, { id: crypto.randomUUID(), family: 'Open Sans', usage: 'body' }]);
    };

    const addAsset = () => {
        // In a real app, this would be an upload. For now, we'll just add a placeholder or simple link input
        const url = prompt('URL del asset (logo/imagen):');
        if (url) {
            setAssets([...assets, { id: crypto.randomUUID(), name: 'Nuevo Asset', url, type: 'logo' }]);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Brand Kit</h2>
                    <p className="text-gray-500">Identidad visual y recursos de la marca</p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                <Button onClick={handleSave}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Guardar Cambios
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>Editar Brand Kit</Button>
                        )}
                    </div>
                )}
            </div>

            {/* Colors Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-pink-500" />
                        <h3 className="text-lg font-semibold text-gray-900">Paleta de Colores</h3>
                    </div>
                    {isEditing && (
                        <Button variant="outline" size="sm" onClick={addColor}>
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Color
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {colors.map((color, index) => (
                        <div key={color.id} className="group relative">
                            <div
                                className="w-full h-24 rounded-lg shadow-sm border border-gray-100 flex items-center justify-center mb-2 transition-transform group-hover:scale-105"
                                style={{ backgroundColor: color.hex }}
                            >
                                {isEditing && (
                                    <button
                                        onClick={() => setColors(colors.filter(c => c.id !== color.id))}
                                        className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <div className="space-y-1">
                                {isEditing ? (
                                    <>
                                        <input
                                            type="text"
                                            value={color.name}
                                            onChange={(e) => {
                                                const newColors = [...colors];
                                                newColors[index].name = e.target.value;
                                                setColors(newColors);
                                            }}
                                            className="w-full text-sm font-medium border-none p-0 focus:ring-0"
                                            placeholder="Nombre"
                                        />
                                        <input
                                            type="text"
                                            value={color.hex}
                                            onChange={(e) => {
                                                const newColors = [...colors];
                                                newColors[index].hex = e.target.value;
                                                setColors(newColors);
                                            }}
                                            className="w-full text-xs text-gray-500 border-none p-0 focus:ring-0"
                                            placeholder="#HEX"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium text-sm text-gray-900">{color.name}</p>
                                        <p className="text-xs text-uppercase text-gray-500">{color.hex}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {colors.length === 0 && !isEditing && (
                        <p className="text-sm text-gray-500 col-span-full italic">No hay colores definidos.</p>
                    )}
                </div>
            </Card>

            {/* Typography Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900">Tipografía</h3>
                    </div>
                    {isEditing && (
                        <Button variant="outline" size="sm" onClick={addTypography}>
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Fuente
                        </Button>
                    )}
                </div>
                <div className="space-y-4">
                    {typography.map((font, index) => (
                        <div key={font.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={font.family}
                                            onChange={(e) => {
                                                const newTypo = [...typography];
                                                newTypo[index].family = e.target.value;
                                                setTypography(newTypo);
                                            }}
                                            className="text-lg font-medium bg-transparent border-b border-gray-300 focus:border-primary-500 focus:outline-none"
                                            placeholder="Nombre de la fuente"
                                        />
                                        <select
                                            value={font.usage}
                                            onChange={(e) => {
                                                const newTypo = [...typography];
                                                newTypo[index].usage = e.target.value as any;
                                                setTypography(newTypo);
                                            }}
                                            className="text-sm bg-transparent border-b border-gray-300 focus:border-primary-500 focus:outline-none"
                                        >
                                            <option value="header">Títulos / Header</option>
                                            <option value="body">Cuerpo / Body</option>
                                            <option value="accent">Acento / Detalles</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900" style={{ fontFamily: font.family }}>{font.family}</h4>
                                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full capitalize">
                                            {font.usage}
                                        </span>
                                    </div>
                                )}
                                {font.url && (
                                    <a href={font.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-500 mt-1 hover:underline">
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Ver fuente
                                    </a>
                                )}
                            </div>
                            {isEditing && (
                                <button
                                    onClick={() => setTypography(typography.filter(t => t.id !== font.id))}
                                    className="p-2 text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {typography.length === 0 && !isEditing && (
                        <p className="text-sm text-gray-500 italic">No hay tipografías definidas.</p>
                    )}
                </div>
            </Card>

            {/* Assets Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-semibold text-gray-900">Logos y Recursos</h3>
                    </div>
                    {isEditing && (
                        <Button variant="outline" size="sm" onClick={addAsset}>
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Asset
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {assets.map((asset, index) => (
                        <div key={asset.id} className="relative group p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-gray-50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                {asset.type === 'logo' || asset.type === 'icon' || asset.type === 'pattern' || asset.type === 'image' ? (
                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                )}
                            </div>
                            <div className="text-center">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={asset.name}
                                        onChange={(e) => {
                                            const newAssets = [...assets];
                                            newAssets[index].name = e.target.value;
                                            setAssets(newAssets);
                                        }}
                                        className="w-full text-sm font-medium text-center border-none p-0 focus:ring-0"
                                    />
                                ) : (
                                    <p className="font-medium text-sm text-gray-900 truncate">{asset.name}</p>
                                )}
                                <span className="text-xs text-gray-500 capitalize">{asset.type}</span>
                            </div>
                            {isEditing && (
                                <button
                                    onClick={() => setAssets(assets.filter(a => a.id !== asset.id))}
                                    className="absolute top-2 right-2 p-1.5 bg-white shadow-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-500"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    {assets.length === 0 && !isEditing && (
                        <p className="text-sm text-gray-500 col-span-full italic">No hay assets definidos.</p>
                    )}
                </div>
            </Card>

            {/* Voice & Tone Section */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Mic2 className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Voz y Tono</h3>
                </div>
                {isEditing ? (
                    <textarea
                        value={voiceTone}
                        onChange={(e) => setVoiceTone(e.target.value)}
                        placeholder="Describe la personalidad de la marca, tono de comunicación, palabras clave..."
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                ) : (
                    <div className="prose prose-sm max-w-none text-gray-700">
                        {voiceTone ? (
                            <p className="whitespace-pre-wrap">{voiceTone}</p>
                        ) : (
                            <p className="italic text-gray-500">No hay descripción de voz y tono definida.</p>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
