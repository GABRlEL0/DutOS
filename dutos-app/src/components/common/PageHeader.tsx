import * as React from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    children,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8", className)}>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-display">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-gray-500">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
