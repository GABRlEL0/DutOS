import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onSave?: (value: string) => Promise<void> | void;
  placeholder?: string;
  readOnly?: boolean;
}

export function TextModal({ isOpen, onClose, title, value, onSave, placeholder, readOnly = false }: TextModalProps) {
  const [text, setText] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const initialValueRef = useRef(value);
  const latestTextRef = useRef(text);
  const didAutoSaveRef = useRef(false);

  latestTextRef.current = text;

  const isDirty = useMemo(() => {
    if (readOnly) return false;
    return (text ?? '') !== (initialValueRef.current ?? '');
  }, [text, readOnly]);

  useEffect(() => {
    if (!isOpen) return;
    // Sync current/initial values each time the modal opens
    initialValueRef.current = value ?? '';
    didAutoSaveRef.current = false;
    setText(value ?? '');
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        void handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isDirty]);

  useEffect(() => {
    // Safety net: if the user navigates away or changes menu while dirty,
    // persist the latest text.
    return () => {
      if (readOnly) return;
      if (!isDirty || didAutoSaveRef.current) return;
      didAutoSaveRef.current = true;
      try {
        if (onSave) void onSave(latestTextRef.current);
      } catch {
        // best-effort
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, readOnly, onSave]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (readOnly) {
      onClose();
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (onSave) await onSave(text);
      initialValueRef.current = text;
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async () => {
    if (isSaving) return;

    if (readOnly) {
      onClose();
      return;
    }

    // Auto-save on close if there are unsaved changes
    if (isDirty) {
      setIsSaving(true);
      try {
        if (onSave) await onSave(text);
        initialValueRef.current = text;
        didAutoSaveRef.current = true;
      } catch {
        // If save fails, keep the modal open so the user doesn't lose changes.
        return;
      } finally {
        setIsSaving(false);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => void handleClose()} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={() => void handleClose()} className="text-gray-400 hover:text-gray-600" disabled={isSaving}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                readOnly ? 'bg-gray-50 text-gray-800' : ''
              }`}
              placeholder={placeholder}
              readOnly={readOnly}
              disabled={isSaving}
            />
          </div>
          <div className="flex justify-end space-x-3 p-4 border-t">
            {readOnly ? (
              <button
                onClick={() => void handleClose()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                disabled={isSaving}
              >
                Cerrar
              </button>
            ) : (
              <>
                <button
                  onClick={() => void handleClose()}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
