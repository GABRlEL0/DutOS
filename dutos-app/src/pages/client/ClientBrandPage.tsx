import { useAuthStore } from '@stores/authStore';
import { useClientStore } from '@stores/clientStore';
import { BrandKit } from '@components/clients/BrandKit';
import { PageHeader } from '@components/common/PageHeader';

export function ClientBrandPage() {
    const { user } = useAuthStore();
    const { clients } = useClientStore();

    // In client portal, we show the brand kit of the logged-in client
    // The user.clientId should match one of the clients (or we filter by it)
    const client = clients.find(c => c.id === user?.assigned_client_id);

    if (!client) {
        return <div>Cliente no encontrado</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Brand Kit"
                description="Recursos y guías de estilo de tu marca"
            />

            <BrandKit client={client} readOnly={true} />
        </div>
    );
}
