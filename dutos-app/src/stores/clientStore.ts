import { create } from 'zustand';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { Client } from '../types/index';

interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  fetchClients: () => () => void; // Retorna función de unsubscribe
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  selectClient: (client: Client | null) => void;
  getClientById: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientState>()((set, get) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,

  fetchClients: () => {
    set({ isLoading: true });
    const q = query(collection(db, 'clients'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convertir Timestamps de Firebase a Date
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      })) as Client[];

      set({ clients, isLoading: false, error: null });
    }, (error) => {
      console.error('Error fetching clients:', error);
      set({ error: (error as Error).message, isLoading: false });
    });

    return unsubscribe;
  },

  addClient: async (clientData) => {
    try {
      await addDoc(collection(db, 'clients'), {
        ...clientData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },

  updateClient: async (id, updates) => {
    try {
      const clientRef = doc(db, 'clients', id);
      await updateDoc(clientRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  deleteClient: async (id) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  selectClient: (client) => {
    set({ selectedClient: client });
  },

  getClientById: (id) => {
    return get().clients.find((client) => client.id === id);
  },
}));