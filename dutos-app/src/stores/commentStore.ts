import { create } from 'zustand';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    Timestamp,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { PostComment, UserRole } from '../types/index';

interface CommentState {
    comments: PostComment[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchComments: (postId: string) => Unsubscribe;
    addComment: (
        postId: string,
        userId: string,
        userName: string,
        userRole: UserRole,
        message: string,
        mentions?: string[]
    ) => Promise<string>;
    deleteComment: (postId: string, commentId: string) => Promise<void>;
    clearComments: () => void;
}

export const useCommentStore = create<CommentState>()((set) => ({
    comments: [],
    isLoading: false,
    error: null,

    fetchComments: (postId: string) => {
        set({ isLoading: true, error: null });

        // Comments are stored as a subcollection of posts
        const commentsRef = collection(db, 'posts', postId, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'asc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const comments = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as PostComment[];

                set({ comments, isLoading: false });
            },
            (error) => {
                console.error('Error fetching comments:', error);
                set({ error: error.message, isLoading: false });
            }
        );
    },

    addComment: async (postId, userId, userName, userRole, message, mentions) => {
        try {
            const commentsRef = collection(db, 'posts', postId, 'comments');
            const docRef = await addDoc(commentsRef, {
                post_id: postId,
                user_id: userId,
                user_name: userName,
                user_role: userRole,
                message,
                mentions: mentions || [],
                createdAt: Timestamp.now(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },

    deleteComment: async (postId, commentId) => {
        try {
            await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    },

    clearComments: () => {
        set({ comments: [], isLoading: false, error: null });
    },
}));

/**
 * Extract @mentions from a message
 * Returns array of usernames mentioned
 */
export function extractMentions(message: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = message.match(mentionRegex);
    return matches ? matches.map((m) => m.slice(1)) : [];
}
