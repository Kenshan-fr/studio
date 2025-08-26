"use client";

import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, signInAnonymously, type User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (user: User) => {
    if (user && !user.isAnonymous) {
      const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/user_data`, user.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const userProfileData = { uid: user.uid, ...docSnap.data() } as UserProfile;
        
        // Also fetch user's uploaded photos from the public collection
        const photosRef = collection(db, `artifacts/${appId}/public/data/public_photos`);
        const q = query(photosRef, where("uploaderId", "==", user.uid));
        const photosSnapshot = await getDocs(q);
        userProfileData.uploadedPhotos = photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setProfile(userProfileData);
      } else {
        setProfile(null); 
      }
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchProfile(user);
      } else {
        await signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed:", error);
        });
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const signUp = async (email: string, pass: string, username: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: Omit<UserProfile, 'uploadedPhotos' | 'uid'> = {
      username,
      hasAcceptedDisclaimer: false,
    };
    await setDoc(doc(db, `artifacts/${appId}/users/${cred.user.uid}/user_data`, cred.user.uid), newProfile);
    setProfile({ ...newProfile, uid: cred.user.uid, uploadedPhotos: [] });
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
    await refreshProfile();
  };

  const updateUserPassword = async (newPass: string) => {
    if (!user) throw new Error("User not logged in");
    await updatePassword(user, newPass);
  };

  const acceptDisclaimer = async () => {
     if (!user) return;
     await updateUserProfile({ hasAcceptedDisclaimer: true });
  }
  
  const refreshProfile = async () => {
    if (user) {
        await fetchProfile(user);
    }
  };

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
    refreshProfile,
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
