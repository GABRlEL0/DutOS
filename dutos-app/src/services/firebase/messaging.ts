import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import app from './config';

// Initialize Firebase Cloud Messaging
let messaging: ReturnType<typeof getMessaging> | null = null;

// Only initialize if supported
if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
        messaging = getMessaging(app);
    } catch (error) {
        console.warn('Firebase Messaging not supported:', error);
    }
}

// VAPID Key from Firebase Console -> Project Settings -> Cloud Messaging
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
    if (!messaging) {
        console.warn('Messaging not available');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Register service worker for FCM
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // Get FCM token
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (token) {
            console.log('FCM Token:', token);
            return token;
        } else {
            console.log('No registration token available');
            return null;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | undefined {
    if (!messaging) {
        return undefined;
    }

    return onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
    });
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
    return typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }
    return Notification.permission;
}

export { messaging };
