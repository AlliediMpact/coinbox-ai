'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface AuthContextProps {
  user: User | null;
  signUp: (email: string, password: string, additionalData?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
    const db = getFirestore(app); // Initialize Firestore
    const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

    const signUp = async (email: string, password: string, additionalData = {}) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const { user } = userCredential;

            // Send email verification
            await sendEmailVerification(user);

            // Update user profile with additional data
            await updateProfile(user, {
                displayName: additionalData.fullName || null,
                // You can add more profile properties here if needed
            });

            // Store additional user data in Firestore
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                fullName: additionalData.fullName || null,
                phone: additionalData.phone || null,
                referralCode: additionalData.referralCode || null,
                membershipTier: additionalData.membershipTier || 'Basic', // Default value
                email: email,
                emailVerified: false, // Initial state
                // Add any other relevant information
            });

            // Show toast message for email verification
            toast({
                title: "Verification Email Sent",
                description: "Please check your inbox to verify your email.",
            });

            console.log("Sign up successful:", user);
        } catch (error: any) {
            console.error('Signup error:', error.message);
            throw error;
        }
    };


  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Signin error:', error.message);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Signout error:', error.message);
      throw error;
    }
  };

  const value: AuthContextProps = {
    user,
    signUp,
    signIn,
    signOutUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

