import type { PostStatus } from '../../types/index';

interface StatusBadgeProps {
  status: PostStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<PostStatus, { label: string; color: string; bg: string }> = {
  draft: {
    label: 'Borrador',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
  },
  pending_approval: {
    label: 'Pendiente',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
  },
  rejected: {
    label: 'Rechazado',
    color: 'text-red-700',
    bg: 'bg-red-100',
  },
  approved: {
    label: 'Aprobado',
    color: 'text-green-700',
    bg: 'bg-green-100',
  },
  finished: {
    label: 'Terminado',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
  },
  published: {
    label: 'Publicado',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.color} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}