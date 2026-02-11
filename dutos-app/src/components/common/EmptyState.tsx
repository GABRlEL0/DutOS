import type { ReactNode } from 'react';
import { FileText, Users, Search, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'posts' | 'clients' | 'search' | 'inbox' | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
}

const iconMap: Record<string, ReactNode> = {
  posts: <FileText className="h-12 w-12 text-gray-400" aria-hidden="true" />,
  clients: <Users className="h-12 w-12 text-gray-400" aria-hidden="true" />,
  search: <Search className="h-12 w-12 text-gray-400" aria-hidden="true" />,
  inbox: <Inbox className="h-12 w-12 text-gray-400" aria-hidden="true" />,
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  const iconElement = typeof icon === 'string' ? iconMap[icon] : icon;

  return (
    <div className="text-center py-12 px-4" role="status" aria-live="polite">
      <div className="mx-auto h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        {iconElement}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}