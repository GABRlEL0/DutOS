import { useState, useRef } from 'react';
import { usePostStore } from '@stores/postStore';
import { useClientStore } from '@stores/clientStore';
import { useAuthStore } from '@stores/authStore';
import { useToast } from './Toast';
import {
    Upload,
    Download,
    FileSpreadsheet,
    X,
    AlertCircle,
    CheckCircle,
    FileDown
} from 'lucide-react';
import { Button } from './Button';
import {
    exportPostsToCSV,
    parsePostsFromCSV,
    downloadCSV,
    generateTemplateCSV
} from '../../utils/csvUtils';

interface CSVModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CSVModal({ isOpen, onClose }: CSVModalProps) {
    const { posts, addPost } = usePostStore();
    const { clients } = useClientStore();
    const { user } = useAuthStore();
    const toast = useToast();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<'export' | 'import'>('export');
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [importResult, setImportResult] = useState<{
        valid: number;
        errors: { row: number; message: string }[];
    } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingImport, setPendingImport] = useState<ReturnType<typeof parsePostsFromCSV> | null>(null);

    if (!isOpen) return null;

    const handleExport = () => {
        const postsToExport = selectedClient
            ? posts.filter(p => p.client_id === selectedClient)
            : posts;

        if (postsToExport.length === 0) {
            toast.warning('No hay posts para exportar');
            return;
        }

        const csv = exportPostsToCSV(postsToExport, clients);
        const clientName = selectedClient
            ? clients.find(c => c.id === selectedClient)?.name || 'cliente'
            : 'todos';
        const filename = `dutos_posts_${clientName}_${new Date().toISOString().split('T')[0]}.csv`;

        downloadCSV(csv, filename);
        toast.success(`Exportados ${postsToExport.length} posts`);
        onClose();
    };

    const handleDownloadTemplate = () => {
        const template = generateTemplateCSV(clients);
        downloadCSV(template, 'dutos_template.csv');
        toast.success('Plantilla descargada');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);

        try {
            const text = await file.text();
            const result = parsePostsFromCSV(text, clients);

            setImportResult({
                valid: result.valid.length,
                errors: result.errors
            });
            setPendingImport(result);
        } catch {
            toast.error('Error al leer el archivo');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!pendingImport || !user) return;

        setIsProcessing(true);

        try {
            const clientNameMap = new Map(clients.map(c => [c.name.toLowerCase(), c]));

            for (const post of pendingImport.valid) {
                const client = clientNameMap.get(post.client_name.toLowerCase());
                if (!client) continue;

                await addPost({
                    client_id: client.id,
                    type: post.type,
                    pillar: post.pillar,
                    pinned_date: post.pinned_date,
                    status: post.status,
                    content: {
                        script: post.script,
                        caption: post.caption,
                        asset_link: post.asset_link
                    },
                    feedback_history: [],
                    createdBy: user.id
                });
            }

            toast.success(`Importados ${pendingImport.valid.length} posts`);
            onClose();
        } catch {
            toast.error('Error al importar posts');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetImport = () => {
        setImportResult(null);
        setPendingImport(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-6 h-6 text-primary-500" />
                        <h2 className="text-xl font-bold text-gray-900">Importar / Exportar CSV</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => { setMode('export'); resetImport(); }}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${mode === 'export'
                                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Download className="w-4 h-4 inline mr-2" />
                        Exportar
                    </button>
                    <button
                        onClick={() => { setMode('import'); resetImport(); }}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${mode === 'import'
                                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Importar
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    {mode === 'export' ? (
                        <>
                            <p className="text-sm text-gray-600">
                                Exporta tus posts a un archivo CSV para backup, reporting o edición masiva.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filtrar por cliente (opcional)
                                </label>
                                <select
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Todos los clientes</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.name} ({posts.filter(p => p.client_id === client.id).length} posts)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">
                                    <strong>Posts a exportar:</strong>{' '}
                                    {selectedClient
                                        ? posts.filter(p => p.client_id === selectedClient).length
                                        : posts.length}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {!importResult ? (
                                <>
                                    <p className="text-sm text-gray-600">
                                        Importa posts desde un archivo CSV. Descarga la plantilla para ver el formato requerido.
                                    </p>

                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        Descargar plantilla con ejemplos
                                    </button>

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer"
                                    >
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-gray-700">
                                            Click para seleccionar archivo
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Archivos .csv
                                        </p>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {/* Summary */}
                                    <div className={`rounded-lg p-4 ${importResult.valid > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div className="flex items-center gap-2">
                                            {importResult.valid > 0 ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                            )}
                                            <span className={`font-medium ${importResult.valid > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                {importResult.valid} posts válidos para importar
                                            </span>
                                        </div>
                                    </div>

                                    {/* Errors */}
                                    {importResult.errors.length > 0 && (
                                        <div className="bg-red-50 rounded-lg p-4">
                                            <p className="text-sm font-medium text-red-700 mb-2">
                                                {importResult.errors.length} errores encontrados:
                                            </p>
                                            <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                                                {importResult.errors.map((err, i) => (
                                                    <li key={i}>
                                                        Fila {err.row}: {err.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        onClick={resetImport}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        ← Seleccionar otro archivo
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>

                    {mode === 'export' ? (
                        <Button onClick={handleExport} isLoading={isProcessing}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                    ) : importResult && importResult.valid > 0 ? (
                        <Button onClick={handleConfirmImport} isLoading={isProcessing}>
                            <Upload className="w-4 h-4 mr-2" />
                            Importar {importResult.valid} posts
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
