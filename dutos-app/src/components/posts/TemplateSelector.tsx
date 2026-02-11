import { useState } from 'react';
import { useTemplateStore } from '@stores/templateStore';
import { FileText, ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';
import type { ContentTemplate } from '../../types/index';

interface TemplateSelectorProps {
    clientId?: string;
    onSelect: (template: ContentTemplate) => void;
}

export function TemplateSelector({ clientId, onSelect }: TemplateSelectorProps) {
    const { templates, incrementUsage } = useTemplateStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Filter templates for this client + global templates
    const relevantTemplates = templates.filter(t =>
        !t.client_id || t.client_id === clientId
    );

    if (relevantTemplates.length === 0) {
        return null;
    }

    const handleSelect = async (template: ContentTemplate) => {
        setSelectedId(template.id);
        await incrementUsage(template.id);
        onSelect(template);

        // Auto-collapse after selection
        setTimeout(() => {
            setIsExpanded(false);
            setSelectedId(null);
        }, 500);
    };

    return (
        <div className="mb-6">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50 to-transparent border border-primary-100 rounded-lg hover:bg-primary-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-gray-900">
                        Usar Template
                    </span>
                    <span className="text-sm text-gray-500">
                        ({relevantTemplates.length} disponibles)
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isExpanded && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                    {relevantTemplates.map(template => (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => handleSelect(template)}
                            className={`flex items-start gap-3 p-4 rounded-lg border transition-all text-left ${selectedId === template.id
                                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${template.client_id ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                <FileText className={`w-4 h-4 ${template.client_id ? 'text-blue-600' : 'text-gray-600'
                                    }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900 truncate">
                                        {template.name}
                                    </h4>
                                    {selectedId === template.id && (
                                        <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                    )}
                                </div>
                                {template.description && (
                                    <p className="text-sm text-gray-500 truncate mt-0.5">
                                        {template.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    {template.pillar_suggestion && (
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                            {template.pillar_suggestion}
                                        </span>
                                    )}
                                    {!template.client_id && (
                                        <span className="text-xs text-gray-400">
                                            Global
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
