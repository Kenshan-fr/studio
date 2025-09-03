import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace the following placeholder values with your new Firebase project's configuration.
// You can find this configuration in your Firebase project settings under "General".
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

// We need to provide the appId to the rest of the application.
// We'll read it from the config object.
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = firebaseConfig.appId;


export { app, auth, db, storage };
