import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import firebaseAppletConfig from "../../firebase-applet-config.json";

export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  databaseURL: (firebaseAppletConfig as any).databaseURL,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
  measurementId: firebaseAppletConfig.measurementId
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

const dbId = (firebaseAppletConfig as any).firestoreDatabaseId;
export const db = dbId && dbId !== "(default)"
  ? getFirestore(app, dbId)
  : getFirestore(app);

export const storage = getStorage(app);

export let messaging: any = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch((err) => {
    console.warn("FCM initialization skipped:", err);
  });

  async function testConnection() {
    try {
      await getDocFromServer(doc(db, "config", "connection_test"));
    } catch (error) {
      if (error instanceof Error && (error.message.includes("offline") || error.message.includes("Could not reach Cloud Firestore backend"))) {
        console.warn("Firestore backend connection test: running in offline mode.");
      }
    }
  }
  testConnection();
}

