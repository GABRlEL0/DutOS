import { QueueView } from '@components/posts/QueueView';

export function QueuePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cola de Publicación</h1>
        <p className="text-gray-600 mt-1">
          Visualiza el calendario editorial con fechas calculadas automáticamente
        </p>
      </div>

      <QueueView />
    </div>
  );
}