/**
 * Firebase Cloud Messaging Service Worker
 * Serves background notifications.
 */

// Import and configure the Firebase SDK
// These scripts are loaded in the service worker context
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyB-nriYaSapmZA9fMsVt2WgVJIB__tPbgI",
  authDomain: "ansinhxahoi.firebaseapp.com",
  projectId: "ansinhxahoi",
  storageBucket: "ansinhxahoi.firebasestorage.app",
  messagingSenderId: "142962188183",
  appId: "1:142962188183:web:fa7f50731578e57b716ed2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message: ", payload);

  const notificationTitle = payload.notification?.title || "Phường Phú Lợi An Sinh Số";
  const notificationOptions = {
    body: payload.notification?.body || "Cập nhật trạng thái mới nhất từ UBND Phường.",
    icon: "/assets/logo.png", // fallback or default logo
    badge: "/assets/logo.png",
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
