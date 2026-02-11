// Service Worker for Firebase Cloud Messaging
// This must be in the public folder for FCM to work

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config - these will be replaced at build time or you can hardcode them
const firebaseConfig = {
    apiKey: self.FIREBASE_API_KEY || '',
    authDomain: self.FIREBASE_AUTH_DOMAIN || '',
    projectId: self.FIREBASE_PROJECT_ID || '',
    storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: self.FIREBASE_APP_ID || ''
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'DUTOS';
    const notificationOptions = {
        body: payload.notification?.body || 'Tienes una nueva notificación',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: payload.data?.tag || 'dutos-notification',
        data: payload.data,
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'dismiss', title: 'Descartar' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Navigate to the appropriate URL
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // Open new window if none exists
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
