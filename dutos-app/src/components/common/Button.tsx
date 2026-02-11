import * as React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    // Base styles
                    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 select-none shadow-sm',

                    // Variants
                    variant === 'primary' && 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-md shadow-primary-500/20',
                    variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
                    variant === 'outline' && 'border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 text-gray-700',
                    variant === 'ghost' && 'hover:bg-gray-100 hover:text-gray-900 text-gray-600 shadow-none',
                    variant === 'danger' && 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20',

                    // Sizes
                    size === 'sm' && 'h-8 px-3 text-xs',
                    size === 'md' && 'h-10 px-4 py-2 text-sm',
                    size === 'lg' && 'h-12 px-8 text-base',
                    size === 'icon' && 'h-10 w-10 p-0',

                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
