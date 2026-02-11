import { useState } from 'react';
import { auth, db } from '../../services/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export function SetupPage() {
    const [status, setStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSetup = async () => {
        setIsLoading(true);
        setStatus('Iniciando setup...');
        try {
            const email = 'admin_qa@dutos.com';
            const password = 'password123';

            setStatus(`Creando usuario Auth: ${email}...`);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            setStatus('Creando documento Firestore para el admin...');
            await setDoc(doc(db, 'users', uid), {
                id: uid,
                email,
                name: 'QA Admin',
                role: 'admin',
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setStatus('✅ Setup completado con éxito. Ahora puedes loguearte con admin@dutos.com / password123');
        } catch (error) {
            console.error(error);
            setStatus(`❌ Error: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="max-w-md w-full p-6 space-y-4">
                <h1 className="text-xl font-bold">QA Test Setup</h1>
                <p className="text-sm text-gray-600">
                    Este componente creará un usuario administrador inicial en Firebase para poder ejecutar las pruebas de QA.
                </p>
                <Button
                    onClick={handleSetup}
                    isLoading={isLoading}
                    className="w-full"
                >
                    Inicializar Admin
                </Button>
                {status && (
                    <div className={`p-3 rounded text-sm ${status.includes('❌') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {status}
                    </div>
                )}
            </Card>
        </div>
    );
}
