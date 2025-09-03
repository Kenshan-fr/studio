import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace the following placeholder values with your new Firebase project's configuration.
// You can find this configuration in your Firebase project settings under "General".
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY_ICI", // Replace with your actual API Key
  authDomain: "VOTRE_AUTH_DOMAIN_ICI", // e.g., votre-projet.firebaseapp.com
  projectId: "VOTRE_PROJECT_ID_ICI", // Replace with your actual Project ID
  storageBucket: "VOTRE_STORAGE_BUCKET_ICI", // e.g., votre-projet.appspot.com
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID_ICI",
  appId: "VOTRE_APP_ID_ICI"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// We need to provide the appId to the rest of the application.
// We'll read it from the config object.
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = firebaseConfig.appId;


export { app, auth, db, storage };
