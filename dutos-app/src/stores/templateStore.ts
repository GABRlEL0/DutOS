import { create } from 'zustand';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    increment,
    Timestamp,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { ContentTemplate } from '../types/index';

interface TemplateState {
    templates: ContentTemplate[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchTemplates: (clientId?: string) => Unsubscribe;
    fetchAllTemplates: () => Unsubscribe;
    addTemplate: (template: Omit<ContentTemplate, 'id' | 'usage_count' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateTemplate: (id: string, updates: Partial<ContentTemplate>) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    incrementUsage: (id: string) => Promise<void>;
    getTemplatesByClient: (clientId: string) => ContentTemplate[];
    getGlobalTemplates: () => ContentTemplate[];
}

export const useTemplateStore = create<TemplateState>()((set, get) => ({
    templates: [],
    isLoading: false,
    error: null,

    fetchTemplates: (clientId?: string) => {
        set({ isLoading: true, error: null });

        // Fetch templates for a specific client + global templates
        const q = clientId
            ? query(
                collection(db, 'templates'),
                where('client_id', 'in', [clientId, null]),
                orderBy('usage_count', 'desc')
            )
            : query(
                collection(db, 'templates'),
                orderBy('usage_count', 'desc')
            );

        return onSnapshot(
            q,
            (snapshot) => {
                const templates = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                })) as ContentTemplate[];

                set({ templates, isLoading: false });
            },
            (error) => {
                console.error('Error fetching templates:', error);
                set({ error: error.message, isLoading: false });
            }
        );
    },

    fetchAllTemplates: () => {
        set({ isLoading: true, error: null });

        const q = query(
            collection(db, 'templates'),
            orderBy('usage_count', 'desc')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const templates = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                })) as ContentTemplate[];

                set({ templates, isLoading: false });
            },
            (error) => {
                console.error('Error fetching templates:', error);
                set({ error: error.message, isLoading: false });
            }
        );
    },

    addTemplate: async (template) => {
        try {
            const docRef = await addDoc(collection(db, 'templates'), {
                ...template,
                usage_count: 0,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding template:', error);
            throw error;
        }
    },

    updateTemplate: async (id, updates) => {
        try {
            await updateDoc(doc(db, 'templates', id), {
                ...updates,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error updating template:', error);
            throw error;
        }
    },

    deleteTemplate: async (id) => {
        try {
            await deleteDoc(doc(db, 'templates', id));
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    },

    incrementUsage: async (id) => {
        try {
            await updateDoc(doc(db, 'templates', id), {
                usage_count: increment(1),
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error incrementing usage:', error);
        }
    },

    getTemplatesByClient: (clientId) => {
        return get().templates.filter(t => t.client_id === clientId);
    },

    getGlobalTemplates: () => {
        return get().templates.filter(t => !t.client_id);
    },
}));
