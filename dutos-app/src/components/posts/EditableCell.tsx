import { useEffect, useState } from 'react';
import { Edit2, ExternalLink } from 'lucide-react';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'url';
  placeholder?: string;
  multiline?: boolean;
  onOpenModal?: () => void;
  disabled?: boolean;
}

export function EditableCell({
  value,
  onChange,
  type = 'text',
  placeholder,
  multiline = false,
  onOpenModal,
  disabled = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    if (!isEditing) setEditValue(value);
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
  };

  if (isEditing) {
    return (
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full px-2 py-1 text-sm border border-primary-500 rounded focus:outline-none"
        placeholder={placeholder}
      />
    );
  }

  const displayValue = value || placeholder || '-';
  const isUrl = type === 'url' && value;

  return (
    <div
      onClick={() => {
        if (!disabled) setIsEditing(true);
      }}
      className={`group flex items-center justify-between rounded px-2 py-1 -mx-2 -my-1 min-h-[28px] ${
        disabled ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'
      }`}
    >
      <span className={`text-sm truncate ${!value ? 'text-gray-400 italic' : 'text-gray-900'}`}>
        {isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary-600 hover:text-primary-700 flex items-center"
          >
            {displayValue}
            <ExternalLink className="h-3 w-3 ml-1 inline" />
          </a>
        ) : (
          displayValue
        )}
      </span>
      {onOpenModal && (
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!disabled && <Edit2 className="h-3 w-3 text-gray-400" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal();
            }}
            className="text-xs text-primary-600 hover:text-primary-700"
            type="button"
          >
            Expandir
          </button>
        </div>
      )}
    </div>
  );
}
