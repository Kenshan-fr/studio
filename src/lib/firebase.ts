
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// This configuration is now directly managed by the build process.
const firebaseConfig = {
  "projectId": "surdice-rate",
  "appId": "1:946797933867:web:148ae8a716bae2dd7f416e",
  "storageBucket": "surdice-rate.appspot.com",
  "apiKey": "AIzaSyCt3FZRSCEOqOPqHAYSL26hs_v7kmYaRfk",
  "authDomain": "surdice-rate.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "946797933867"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

process.env.NEXT_PUBLIC_FIREBASE_APP_ID = firebaseConfig.appId;

export { app, auth, db, storage };
