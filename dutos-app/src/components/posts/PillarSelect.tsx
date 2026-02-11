import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface PillarSelectProps {
  pillars: string[];
  selected: string;
  onChange: (pillar: string) => void;
  disabled?: boolean;
}

export function PillarSelect({ pillars, selected, onChange, disabled }: PillarSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isOpen) return;

      const target = event.target as Node;
      const clickedRoot = rootRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedRoot && !clickedMenu) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const desiredMax = 240;
    const available = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(120, Math.min(desiredMax, available - 12));

    const menuWidth = Math.max(rect.width, 240);

    const base: React.CSSProperties = {
      position: 'fixed',
      left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
      width: menuWidth,
      maxHeight,
      zIndex: 9999,
    };

    if (openUp) {
      setMenuStyle({
        ...base,
        bottom: window.innerHeight - rect.top + 4,
      });
    } else {
      setMenuStyle({
        ...base,
        top: rect.bottom + 4,
      });
    }
  };

  const toggleOpen = () => {
    if (disabled) return;

    const nextOpen = !isOpen;
    if (nextOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUp(spaceBelow < 260 && spaceAbove > spaceBelow);
    }
    setIsOpen(nextOpen);
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openUp]);

  useEffect(() => {
    if (!isOpen) return;
    const onAnyScroll = () => updatePosition();
    const onResize = () => updatePosition();

    window.addEventListener('scroll', onAnyScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onAnyScroll, true);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openUp]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        disabled={disabled}
        className={`w-full text-left px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
        }`}
      >
        {selected || 'Seleccionar...'}
      </button>

      {isOpen && !disabled &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="rounded-md bg-white border border-gray-200 shadow-lg overflow-y-auto overflow-x-hidden"
            role="listbox"
            aria-label="Pilares"
          >
            {pillars.map((pillar) => (
              <button
                key={pillar}
                onClick={() => {
                  onChange(pillar);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                  pillar === selected ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
                type="button"
                role="option"
                aria-selected={pillar === selected}
              >
                <span className="block truncate">{pillar}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
