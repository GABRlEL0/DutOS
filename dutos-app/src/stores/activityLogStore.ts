import { create } from 'zustand';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    writeBatch,
    Timestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { ClientActivityLog, ClientActivityType } from '../types/index';

interface ActivityLogState {
    activities: ClientActivityLog[];
    isLoading: boolean;
    error: string | null;
    fetchActivitiesByClient: (clientId: string, maxResults?: number) => Unsubscribe;
    getActivitiesByClient: (clientId: string) => Promise<ClientActivityLog[]>;
    deleteActivitiesByClient: (clientId: string) => Promise<void>;
    logActivity: (
        clientId: string,
        userId: string,
        userName: string,
        action: ClientActivityType,
        description: string,
        metadata?: Record<string, string>
    ) => Promise<void>;
}

export const useActivityLogStore = create<ActivityLogState>((set) => ({
    activities: [],
    isLoading: false,
    error: null,

    fetchActivitiesByClient: (clientId: string, maxResults = 50) => {
        set({ isLoading: true, error: null });

        const q = query(
            collection(db, 'client_activity_logs'),
            where('client_id', '==', clientId),
            orderBy('createdAt', 'desc'),
            limit(maxResults)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const activities: ClientActivityLog[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as ClientActivityLog[];

                set({ activities, isLoading: false });
            },
            (error) => {
                console.error('Error fetching activity logs:', error);
                set({ error: error.message, isLoading: false });
            }
        );

        return unsubscribe;
    },

    getActivitiesByClient: async (clientId: string) => {
        try {
            const q = query(
                collection(db, 'client_activity_logs'),
                where('client_id', '==', clientId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as ClientActivityLog[];
        } catch (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
    },

    deleteActivitiesByClient: async (clientId: string) => {
        try {
            const q = query(
                collection(db, 'client_activity_logs'),
                where('client_id', '==', clientId)
            );
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        } catch (error) {
            console.error('Error deleting activities:', error);
            throw error;
        }
    },

    logActivity: async (clientId, userId, userName, action, description, metadata) => {
        try {
            await addDoc(collection(db, 'client_activity_logs'), {
                client_id: clientId,
                user_id: userId,
                user_name: userName,
                action,
                description,
                metadata: metadata || {},
                createdAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    },
}));
