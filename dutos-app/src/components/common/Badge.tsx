import * as React from 'react';
import { cn } from '../../utils/cn';


// Since I don't have cva installed, I'll use a simple map approach or just cn
// Actually, let's just use cn and a map for simplicity as I didn't install cva
// Wait, I should have installed cva given how standard it is. 
// But I can do it without cva easily.

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
    default: 'border-transparent bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'text-gray-950 border-gray-200',
    destructive: 'border-transparent bg-red-100 text-red-700 hover:bg-red-200',
    success: 'border-transparent bg-green-100 text-green-700 hover:bg-green-200',
    warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    info: 'border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200',
};

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2',
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    );
}

export { Badge };
