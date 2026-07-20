import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import firebaseAppletConfig from "../../firebase-applet-config.json";

export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
  measurementId: firebaseAppletConfig.measurementId
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with correct database ID from config
const dbId = (firebaseAppletConfig as any).firestoreDatabaseId;
export const db = dbId && dbId !== "(default)"
  ? getFirestore(app, dbId)
  : getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Messaging safely
export let messaging: any = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    })
    .catch((err) => {
      console.warn("FCM is not supported or blocked in this browser:", err);
    });
}

