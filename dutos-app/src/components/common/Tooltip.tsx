import { useState, useRef, useEffect, type ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 300 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setIsMounted(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
    setTimeout(() => setIsMounted(false), 200);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-gray-900',
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isMounted && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap transition-opacity duration-200 ${positionClasses[position]} ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {content}
          <span className={`absolute w-0 h-0 ${arrowClasses[position]}`} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}