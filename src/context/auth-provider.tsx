"use client";

import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, signInAnonymously, type User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "default-app-id";

interface UserProfile {
  uid: string;
  username: string;
  hasAcceptedDisclaimer: boolean;
  uploadedPhotos: any[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, pass: string, username: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateUserPassword: (newPass: string) => Promise<void>;
  acceptDisclaimer: () => Promise<void>;
  updateProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/user_data`, user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
        } else if (!user.isAnonymous) {
          // Create profile if it doesn't exist for a non-anonymous user
           const newProfile: UserProfile = {
            uid: user.uid,
            username: `User_${user.uid.slice(0, 5)}`,
            hasAcceptedDisclaimer: false,
            uploadedPhotos: [],
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        await signInAnonymously(auth).catch(console.error);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const signUp = async (email: string, pass: string, username: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      username,
      hasAcceptedDisclaimer: false,
      uploadedPhotos: [],
    };
    await setDoc(doc(db, `artifacts/${appId}/users/${cred.user.uid}/user_data`, cred.user.uid), newProfile);
    setProfile(newProfile);
  };

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };
  
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/user_data`, user.uid);
    await updateDoc(userDocRef, data);
    setProfile(prev => prev ? {...prev, ...data} : null);
  };

  const updateUserPassword = async (newPass: string) => {
    if (!user) throw new Error("User not logged in");
    await updatePassword(user, newPass);
  };

  const acceptDisclaimer = async () => {
     if (!user) return;
     await updateUserProfile({ hasAcceptedDisclaimer: true });
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOutUser,
    updateUserProfile,
    updateUserPassword,
    acceptDisclaimer,
    updateProfile: setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
