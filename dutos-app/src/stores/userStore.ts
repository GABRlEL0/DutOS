import { create } from 'zustand';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    query,
    orderBy,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { db, firebaseConfig } from '../services/firebase/config';
import type { User, UserRole } from '../types/index';

// Inicializar app secundaria para creación de usuarios (evita desloguear al admin)
const secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

interface UserState {
    users: User[];
    isLoading: boolean;
    error: string | null;
    fetchUsers: () => () => void;
    createUser: (email: string, password: string, name: string, role: UserRole, assignedClientId?: string) => Promise<boolean>;
    updateUser: (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<boolean>;
    toggleUserStatus: (id: string, currentStatus: 'active' | 'inactive') => Promise<boolean>;
    deleteUser: (id: string) => Promise<boolean>;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>()((set) => ({
    users: [],
    isLoading: false,
    error: null,

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    fetchUsers: () => {
        set({ isLoading: true, error: null });

        const usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            usersQuery,
            (snapshot) => {
                const users: User[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        email: data.email || '',
                        name: data.name || '',
                        role: data.role as UserRole,
                        status: data.status || 'active',
                        assigned_client_id: data.assigned_client_id || undefined,
                        createdAt: data.createdAt instanceof Timestamp
                            ? data.createdAt.toDate()
                            : new Date(),
                        updatedAt: data.updatedAt instanceof Timestamp
                            ? data.updatedAt.toDate()
                            : new Date(),
                    };
                });
                set({ users, isLoading: false });
            },
            (error) => {
                console.error('Error fetching users:', error);
                set({ error: error.message, isLoading: false });
            }
        );

        return unsubscribe;
    },

    createUser: async (email, password, name, role, assignedClientId) => {
        try {
            set({ isLoading: true, error: null });

            // Crear usuario en Firebase Auth usando la instancia secundaria
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const uid = userCredential.user.uid;

            // Desloguear de la cuenta secundaria inmediatamente (para no mantener estado ahí)
            await signOut(secondaryAuth);

            // Crear documento de perfil en Firestore con UID como document ID
            const userData: Record<string, unknown> = {
                id: uid,
                email,
                name,
                role,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            if (assignedClientId) {
                userData.assigned_client_id = assignedClientId;
            }

            await setDoc(doc(db, 'users', uid), userData);

            // NOTA: Esto desloguea al admin actual porque Firebase cambia el auth context
            // En producción, esto debería hacerse vía Cloud Functions para evitar este problema

            set({ isLoading: false });
            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            set({ error: (error as Error).message, isLoading: false });
            return false;
        }
    },

    updateUser: async (id, data) => {
        try {
            set({ isLoading: true, error: null });

            await updateDoc(doc(db, 'users', id), {
                ...data,
                updatedAt: serverTimestamp(),
            });

            set({ isLoading: false });
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            set({ error: (error as Error).message, isLoading: false });
            return false;
        }
    },

    toggleUserStatus: async (id: string, currentStatus: 'active' | 'inactive') => {
        try {
            set({ isLoading: true, error: null });

            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await updateDoc(doc(db, 'users', id), {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });

            set({ isLoading: false });
            return true;
        } catch (error) {
            console.error('Error toggling user status:', error);
            set({ error: (error as Error).message, isLoading: false });
            return false;
        }
    },

    deleteUser: async (id: string) => {
        try {
            set({ isLoading: true, error: null });
            await deleteDoc(doc(db, 'users', id));
            set({ isLoading: false });
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            set({ error: (error as Error).message, isLoading: false });
            return false;
        }
    },
}));
