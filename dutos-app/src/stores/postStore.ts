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
  writeBatch,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { arrayMove } from '@dnd-kit/sortable';
import { db } from '../services/firebase/config';
import type { Post, PostStatus, FeedbackEntry, Client } from '../types/index';
import { calculateVisualDates, isStaleContent, hasPinnedConflict } from '../utils/slotCalculator';

interface PostState {
  posts: Post[];
  selectedPost: Post | null;
  isLoading: boolean;
  error: string | null;
  fetchPostsByClient: (clientId: string) => Unsubscribe;
  fetchAllPosts: () => Unsubscribe;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'priority_index'> & { priority_index?: number }) => Promise<void>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  selectPost: (post: Post | null) => void;
  getCalculatedSlots: (clientId: string, client: Client) => ReturnType<typeof calculateVisualDates>;
  isPostStale: (post: Post, client: Client) => boolean;
  checkPinnedConflict: (date: Date, clientId: string, client: Client) => boolean;

  // FASE 3: Drag & Drop y reordenamiento
  reorderPosts: (clientId: string, oldIndex: number, newIndex: number) => Promise<void>;
  addFeedback: (postId: string, feedback: Omit<FeedbackEntry, 'timestamp'>) => Promise<void>;
  changePostStatus: (postId: string, newStatus: PostStatus, feedback?: string, userName?: string) => Promise<void>;
}

// Validar transiciones de estado permitidas
// Regla: se permiten "saltos" hacia adelante en el flujo (ej. draft -> published)
// para cubrir casos donde el post se resuelve en un solo paso.
const forwardFlow: PostStatus[] = ['draft', 'pending_approval', 'approved', 'finished', 'published'];

function buildValidTransitions(): Record<PostStatus, PostStatus[]> {
  const transitions: Record<PostStatus, PostStatus[]> = {
    draft: [],
    pending_approval: [],
    rejected: [],
    approved: [],
    finished: [],
    published: [],
  };

  // Permitir avanzar a cualquier estado posterior del flujo
  forwardFlow.forEach((from, idx) => {
    const next = forwardFlow.slice(idx + 1);
    transitions[from].push(...next);
  });

  // Rechazo/iteracion
  transitions.draft.push('rejected');
  transitions.pending_approval.push('rejected', 'draft');
  transitions.approved.push('rejected', 'draft');
  transitions.finished.push('approved'); // permitir reabrir si se necesita
  transitions.published.push('draft'); // permitir reiniciar

  // Desde rechazado, volver al flujo
  transitions.rejected.push('draft', 'pending_approval');

  // Dedupe, mantener orden
  (Object.keys(transitions) as PostStatus[]).forEach((k) => {
    transitions[k] = Array.from(new Set(transitions[k]));
  });

  return transitions;
}

export const validTransitions: Record<PostStatus, PostStatus[]> = buildValidTransitions();

export const usePostStore = create<PostState>()((set, get) => ({
  posts: [],
  selectedPost: null,
  isLoading: false,
  error: null,

  fetchPostsByClient: (clientId) => {
    set({ isLoading: true });
    const q = query(
      collection(db, 'posts'),
      where('client_id', '==', clientId),
      orderBy('priority_index', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
        pinned_date: (doc.data().pinned_date as Timestamp)?.toDate() || null,
        feedback_history: (doc.data().feedback_history || []).map((f: FeedbackEntry & { timestamp: Timestamp }) => ({
          ...f,
          timestamp: (f.timestamp as Timestamp)?.toDate() || new Date()
        }))
      })) as Post[];

      set({ posts, isLoading: false, error: null });
    }, (error) => {
      console.error('Error fetching posts:', error);
      set({ error: (error as Error).message, isLoading: false });
    });

    return unsubscribe;
  },

  fetchAllPosts: () => {
    set({ isLoading: true });
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
        pinned_date: (doc.data().pinned_date as Timestamp)?.toDate() || null,
        feedback_history: (doc.data().feedback_history || []).map((f: FeedbackEntry & { timestamp: Timestamp }) => ({
          ...f,
          timestamp: (f.timestamp as Timestamp)?.toDate() || new Date()
        }))
      })) as Post[];

      set({ posts, isLoading: false, error: null });
    }, (error) => {
      console.error('Error fetching all posts:', error);
      set({ error: (error as Error).message, isLoading: false });
    });

    return unsubscribe;
  },

  addPost: async (postData) => {
    try {
      const nextPriority = get().posts.length + 1;
      await addDoc(collection(db, 'posts'), {
        ...postData,
        priority_index: nextPriority,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  },

  updatePost: async (id, updates) => {
    try {
      const postRef = doc(db, 'posts', id);

      // Flatten nested content updates to use Firestore dot-notation
      // This prevents replacing the entire 'content' object and losing sibling fields
      const firestoreUpdates: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'content' && typeof value === 'object' && value !== null) {
          // Use dot notation for each content sub-field
          Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
            firestoreUpdates[`content.${subKey}`] = subValue;
          });
        } else {
          firestoreUpdates[key] = value;
        }
      });

      await updateDoc(postRef, firestoreUpdates);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  deletePost: async (id) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  selectPost: (post) => set({ selectedPost: post }),

  getCalculatedSlots: (clientId, client) => {
    const clientPosts = get().posts.filter(p => p.client_id === clientId);
    return calculateVisualDates(clientPosts, client);
  },

  isPostStale: (post, client) => {
    const slots = get().getCalculatedSlots(post.client_id, client);
    const slot = slots.find(s => s.post.id === post.id);
    if (!slot) return false;
    return isStaleContent(post, slot.visualDate);
  },

  checkPinnedConflict: (date, clientId, client) => {
    const clientPosts = get().posts.filter(p => p.client_id === clientId);
    return hasPinnedConflict(date, clientPosts, client.weekly_capacity);
  },

  reorderPosts: async (clientId, oldIndex, newIndex) => {
    const clientPosts = get().posts.filter(p => p.client_id === clientId);
    const flowPosts = clientPosts.filter(p => p.type === 'flow');
    const pinnedPosts = clientPosts.filter(p => p.type === 'pinned');

    const reorderedFlowPosts = arrayMove(flowPosts, oldIndex, newIndex);

    // Batch update para prioridades
    const batch = writeBatch(db);

    // Actualizar Pinned (mantener orden inicial)
    pinnedPosts.forEach((post, index) => {
      const postRef = doc(db, 'posts', post.id);
      batch.update(postRef, { priority_index: index + 1 });
    });

    // Actualizar Flow
    reorderedFlowPosts.forEach((post, index) => {
      const postRef = doc(db, 'posts', post.id);
      batch.update(postRef, { priority_index: pinnedPosts.length + index + 1 });
    });

    await batch.commit();
  },

  addFeedback: async (postId, feedback) => {
    const post = get().posts.find(p => p.id === postId);
    if (!post) return;

    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      feedback_history: [
        ...post.feedback_history,
        { ...feedback, timestamp: Timestamp.now() }
      ],
      updatedAt: Timestamp.now()
    });
  },

  changePostStatus: async (postId, newStatus, feedback, userName) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;

    // No-op: avoids invalid transitions like draft -> draft
    if (newStatus === post.status) return;

    if (!validTransitions[post.status].includes(newStatus)) {
      throw new Error(`Transición no válida: ${post.status} -> ${newStatus}`);
    }

    if (newStatus === 'rejected' && !feedback) {
      throw new Error('Rechazo requiere comentario obligatorio');
    }

    const postRef = doc(db, 'posts', postId);
    const updates: Partial<Post> = {
      status: newStatus,
      updatedAt: new Date()
    };

    if (feedback && userName) {
      updates.feedback_history = [
        ...post.feedback_history,
        {
          user: userName,
          comment: feedback,
          timestamp: new Date()
        }
      ];
    }

    await updateDoc(postRef, updates);
  },
}));
