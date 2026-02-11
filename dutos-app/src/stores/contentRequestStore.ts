import { create } from 'zustand';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { ContentRequest, ContentRequestStatus, ContentRequestStats } from '../types/index';

interface ContentRequestState {
    requests: ContentRequest[];
    isLoading: boolean;
    error: string | null;
    fetchRequestsByClient: (clientId: string) => Unsubscribe;
    fetchAllRequests: () => Unsubscribe;
    addRequest: (request: Omit<ContentRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateRequest: (id: string, updates: Partial<ContentRequest>) => Promise<void>;
    respondToRequest: (id: string, response: string, respondedBy: string, newStatus: ContentRequestStatus) => Promise<void>;
    convertToPost: (id: string, postId: string) => Promise<void>;
    deleteRequest: (id: string) => Promise<void>;
    getStats: (clientId?: string) => ContentRequestStats;
}

export const useContentRequestStore = create<ContentRequestState>((set, get) => ({
    requests: [],
    isLoading: false,
    error: null,

    fetchRequestsByClient: (clientId: string) => {
        set({ isLoading: true, error: null });

        const q = query(
            collection(db, 'content_requests'),
            where('client_id', '==', clientId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const requests = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                    preferred_date: doc.data().preferred_date ? doc.data().preferred_date.toDate() : null,
                })) as ContentRequest[];

                set({ requests, isLoading: false });
            },
            (error) => {
                console.error('Error fetching requests:', error);
                set({ error: error.message, isLoading: false });
            }
        );

        return unsubscribe;
    },

    fetchAllRequests: () => {
        set({ isLoading: true, error: null });

        const q = query(
            collection(db, 'content_requests'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const requests = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                    preferred_date: doc.data().preferred_date ? doc.data().preferred_date.toDate() : null,
                })) as ContentRequest[];

                set({ requests, isLoading: false });
            },
            (error) => {
                console.error('Error fetching all requests:', error);
                set({ error: error.message, isLoading: false });
            }
        );

        return unsubscribe;
    },

    addRequest: async (request) => {
        try {
            const docRef = await addDoc(collection(db, 'content_requests'), {
                ...request,
                requested_by_name: request.requested_by_name || '',
                preferred_date: request.preferred_date ? Timestamp.fromDate(request.preferred_date) : null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding request:', error);
            throw error;
        }
    },

    updateRequest: async (id, updates) => {
        try {
            const docRef = doc(db, 'content_requests', id);

            const firestoreUpdates: Record<string, unknown> = {
                ...updates,
                updatedAt: Timestamp.now(),
            };

            // Permitir setear/limpiar preferred_date de forma explícita
            if ('preferred_date' in updates) {
                firestoreUpdates.preferred_date = updates.preferred_date
                    ? Timestamp.fromDate(updates.preferred_date as Date)
                    : null;
            }

            await updateDoc(docRef, firestoreUpdates);
        } catch (error) {
            console.error('Error updating request:', error);
            throw error;
        }
    },

    respondToRequest: async (id, response, respondedBy, newStatus) => {
        try {
            const docRef = doc(db, 'content_requests', id);
            await updateDoc(docRef, {
                response,
                responded_by: respondedBy,
                respondedAt: Timestamp.now(),
                status: newStatus,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error responding to request:', error);
            throw error;
        }
    },

    convertToPost: async (id, postId) => {
        try {
            const docRef = doc(db, 'content_requests', id);
            await updateDoc(docRef, {
                status: 'converted',
                converted_post_id: postId,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error converting request:', error);
            throw error;
        }
    },

    deleteRequest: async (id) => {
        try {
            await deleteDoc(doc(db, 'content_requests', id));
        } catch (error) {
            console.error('Error deleting request:', error);
            throw error;
        }
    },

    getStats: (clientId?: string) => {
        const { requests } = get();
        const filtered = clientId
            ? requests.filter(r => r.client_id === clientId)
            : requests;

        const total = filtered.length;
        const pending = filtered.filter(r => r.status === 'pending').length;
        const approved = filtered.filter(r => r.status === 'approved').length;
        const inProgress = filtered.filter(r => r.status === 'in_progress').length;
        const converted = filtered.filter(r => r.status === 'converted').length;
        const rejected = filtered.filter(r => r.status === 'rejected').length;

        // Calculate average response time
        const respondedRequests = filtered.filter(r => r.respondedAt && r.createdAt);
        let avgResponseTimeHours: number | null = null;

        if (respondedRequests.length > 0) {
            const totalHours = respondedRequests.reduce((acc, r) => {
                const created = r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt);
                const responded = r.respondedAt instanceof Date ? r.respondedAt : new Date(r.respondedAt!);
                const diffMs = responded.getTime() - created.getTime();
                return acc + (diffMs / (1000 * 60 * 60)); // convert to hours
            }, 0);
            avgResponseTimeHours = Math.round(totalHours / respondedRequests.length * 10) / 10;
        }

        // Fulfillment rate: converted / (total - pending)
        const resolvedCount = total - pending;
        const fulfillmentRate = resolvedCount > 0
            ? Math.round((converted / resolvedCount) * 100)
            : 0;

        return {
            total,
            pending,
            approved,
            inProgress,
            converted,
            rejected,
            avgResponseTimeHours,
            fulfillmentRate,
        };
    },
}));
