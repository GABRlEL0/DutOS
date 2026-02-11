import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import {
    requestNotificationPermission,
    onForegroundMessage,
    getNotificationPermission,
    isNotificationSupported
} from '../services/firebase/messaging';

// Notification types
export type NotificationType =
    | 'post_pending_approval'   // Post needs client approval
    | 'post_approved'           // Post was approved
    | 'post_rejected'           // Post was rejected
    | 'request_new'             // New content request submitted
    | 'request_responded'       // Request was responded to
    | 'post_reminder'           // Post is due soon
    | 'general';                // General notification

export interface AppNotification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: {
        postId?: string;
        requestId?: string;
        clientId?: string;
        url?: string;
    };
    read: boolean;
    createdAt: Date;
}

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    fcmToken: string | null;
    permissionStatus: NotificationPermission | 'unsupported';

    // Actions
    fetchNotifications: (userId: string) => Unsubscribe;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    requestPermission: () => Promise<boolean>;
    saveFcmToken: (userId: string, token: string) => Promise<void>;
    initializeForegroundListener: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isLoading: false,
            fcmToken: null,
            permissionStatus: getNotificationPermission(),

            fetchNotifications: (userId: string) => {
                set({ isLoading: true });

                const q = query(
                    collection(db, 'notifications'),
                    where('user_id', '==', userId),
                    orderBy('createdAt', 'desc')
                );

                return onSnapshot(q, (snapshot) => {
                    const notifications = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                    })) as AppNotification[];

                    const unreadCount = notifications.filter(n => !n.read).length;

                    set({
                        notifications,
                        unreadCount,
                        isLoading: false
                    });
                }, (error) => {
                    console.error('Error fetching notifications:', error);
                    set({ isLoading: false });
                });
            },

            markAsRead: async (id: string) => {
                try {
                    await updateDoc(doc(db, 'notifications', id), {
                        read: true
                    });
                } catch (error) {
                    console.error('Error marking notification as read:', error);
                }
            },

            markAllAsRead: async () => {
                const { notifications } = get();
                const unreadNotifications = notifications.filter(n => !n.read);

                try {
                    await Promise.all(
                        unreadNotifications.map(n =>
                            updateDoc(doc(db, 'notifications', n.id), { read: true })
                        )
                    );
                } catch (error) {
                    console.error('Error marking all as read:', error);
                }
            },

            requestPermission: async () => {
                if (!isNotificationSupported()) {
                    set({ permissionStatus: 'unsupported' });
                    return false;
                }

                const token = await requestNotificationPermission();

                if (token) {
                    set({
                        fcmToken: token,
                        permissionStatus: 'granted'
                    });
                    return true;
                }

                set({ permissionStatus: Notification.permission });
                return false;
            },

            saveFcmToken: async (userId: string, token: string) => {
                try {
                    // Store token in user_tokens collection for Cloud Functions
                    await addDoc(collection(db, 'user_tokens'), {
                        user_id: userId,
                        token,
                        platform: 'web',
                        createdAt: Timestamp.now(),
                    });
                } catch (error) {
                    console.error('Error saving FCM token:', error);
                }
            },

            initializeForegroundListener: () => {
                onForegroundMessage((payload) => {
                    // Show toast or in-app notification for foreground messages
                    console.log('Foreground message:', payload);

                    // If browser supports it, show a notification even in foreground
                    if (Notification.permission === 'granted') {
                        new Notification(payload.notification?.title || 'DUTOS', {
                            body: payload.notification?.body,
                            icon: '/icons/icon-192x192.png',
                            tag: payload.data?.tag || 'dutos-foreground',
                        });
                    }
                });
            },
        }),
        {
            name: 'notification-storage',
            partialize: (state) => ({
                fcmToken: state.fcmToken,
                permissionStatus: state.permissionStatus
            }),
        }
    )
);

/**
 * Helper function to create a notification (for use in other stores)
 */
export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: AppNotification['data']
): Promise<string> {
    const docRef = await addDoc(collection(db, 'notifications'), {
        user_id: userId,
        type,
        title,
        body,
        data: data || {},
        read: false,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}
