import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';
import type { User, UserRole } from '../types/index';

// Helper: buscar perfil de usuario por UID (soporta ambos formatos de document ID)
async function findUserProfile(uid: string) {
  // Intentar primero por document ID (nuevo formato)
  const directDoc = await getDoc(doc(db, 'users', uid));
  if (directDoc.exists()) {
    return directDoc.data();
  }
  // Fallback: buscar por campo 'id' (formato legacy con addDoc)
  const q = query(collection(db, 'users'), where('id', '==', uid));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].data();
  }
  return null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          const userData = await findUserProfile(firebaseUser.uid);

          if (userData) {
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || 'Usuario',
              role: userData.role as UserRole,
              status: userData.status || 'active',
              assigned_client_id: userData.assigned_client_id || undefined,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            };
            set({ user, isAuthenticated: true, isLoading: false });
            return true;
          } else {
            await signOut(auth);
            set({ user: null, isAuthenticated: false, isLoading: false });
            throw new Error('Usuario sin perfil configurado');
          }
        } catch (error) {
          console.error('Login error:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        }
      },

      logout: async () => {
        await signOut(auth);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Listener para cambios de estado de autenticación
onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
  const store = useAuthStore.getState();

  if (firebaseUser) {
    try {
      const userData = await findUserProfile(firebaseUser.uid);
      if (userData) {
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData.name || 'Usuario',
          role: userData.role as UserRole,
          status: userData.status || 'active',
          assigned_client_id: userData.assigned_client_id || undefined,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        };
        store.setUser(user);
      } else {
        store.setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      store.setUser(null);
    }
  } else {
    store.setUser(null);
  }
});

// Helper para verificar permisos
export const checkPermission = (userRole: UserRole, requiredRole: UserRole[]): boolean => {
  return requiredRole.includes(userRole);
};