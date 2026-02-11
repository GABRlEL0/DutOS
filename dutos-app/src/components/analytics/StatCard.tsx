import { Card } from '@components/common/Card';
import { type LucideIcon, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        direction: 'up' | 'down' | 'neutral';
    };
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    description?: string;
}

export function StatCard({ title, value, icon: Icon, trend, color = 'blue', description }: StatCardProps) {
    const getColorClasses = () => {
        switch (color) {
            case 'green': return 'bg-green-100 text-green-600';
            case 'purple': return 'bg-purple-100 text-purple-600';
            case 'orange': return 'bg-orange-100 text-orange-600';
            case 'red': return 'bg-red-100 text-red-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${getColorClasses()}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm font-medium ${trend.direction === 'up' ? 'text-green-600' :
                        trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                        {trend.direction === 'up' && <ArrowUp className="w-4 h-4 mr-1" />}
                        {trend.direction === 'down' && <ArrowDown className="w-4 h-4 mr-1" />}
                        {trend.direction === 'neutral' && <Minus className="w-4 h-4 mr-1" />}
                        {trend.value}%
                    </div>
                )}
            </div>

            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                {description && (
                    <span className="text-sm text-gray-400 mb-1">{description}</span>
                )}
            </div>
            {trend && (
                <p className="text-xs text-gray-400 mt-2">{trend.label}</p>
            )}
        </Card>
    );
}
