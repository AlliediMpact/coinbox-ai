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
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, getFirestore, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { paystackService } from '@/lib/paystack-service';
import { getMembershipTier } from '@/lib/membership-tiers';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  validatePayment: (reference: string) => Promise<boolean>;
  initiateSignUp: (email: string, password: string, additionalData?: any) => Promise<void>;
  completeSignUp: (userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  sendPasswordResetLink: (email: string) => Promise<void>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<void>;
  verifyEmail: (oobCode: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
}

interface UserProfile {
  fullName: string;
  phone: string;
  membershipTier: 'Basic' | 'Ambassador' | 'Business';
  emailVerified: boolean;
  referralCode?: string;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  kycSubmittedAt?: Date;
  kycVerifiedAt?: Date;
}

const PERSISTENCE_KEY = 'auth_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_RENEWAL_THRESHOLD = 24 * 60 * 60 * 1000; // 1 day

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
  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();
  const googleProvider = new GoogleAuthProvider();
  const [emailVerificationTimer, setEmailVerificationTimer] = useState<NodeJS.Timeout | null>(null);

  // Session Management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get new ID token and refresh session cookie if needed
          const sessionStr = localStorage.getItem(PERSISTENCE_KEY);
          let session = sessionStr ? JSON.parse(sessionStr) : null;
          const now = Date.now();
          let shouldRenew = false;
          if (session) {
            // Expire session if too old
            if (now - session.timestamp > SESSION_DURATION) {
              await signOutUser();
              setUser(null);
              setLoading(false);
              return;
            }
            // Renew session if close to expiry
            if (now - session.timestamp > SESSION_DURATION - SESSION_RENEWAL_THRESHOLD) {
              shouldRenew = true;
            }
          } else {
            shouldRenew = true;
          }
          if (shouldRenew) {
            const idToken = await user.getIdToken(true);
            await createSessionCookie(idToken);
            session = { uid: user.uid, timestamp: now };
            localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(session));
          }

          // Check if email is verified
          if (!user.emailVerified) {
            toast({
              title: "Email Not Verified",
              description: "Please verify your email to access all features.",
              variant: "destructive",
            });
          }

          // Check if profile is completed
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.profileCompleted && window.location.pathname !== '/dashboard/profile') {
              router.push('/dashboard/profile');
            }
          }

          setUser(user);
        } catch (error) {
          console.error('Session refresh error:', error);
          await signOutUser();
        }
      } else {
        // Check for existing session
        const sessionStr = localStorage.getItem(PERSISTENCE_KEY);
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (Date.now() - session.timestamp < SESSION_DURATION) {
            // Session is still valid
            const userDoc = await getDoc(doc(db, "users", session.uid));
            if (userDoc.exists()) {
              // Revalidate session
              session.timestamp = Date.now();
              localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(session));
            } else {
              localStorage.removeItem(PERSISTENCE_KEY);
            }
          } else {
            localStorage.removeItem(PERSISTENCE_KEY);
          }
        }
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, toast, router]);

  // Invalidate session on suspicious activity or password change
  const invalidateSession = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      localStorage.removeItem(PERSISTENCE_KEY);
      setUser(null);
      router.push('/auth');
    } catch (error) {
      console.error('Session invalidation error:', error);
    }
  };

  // Optionally, poll for flagged status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      const db = getFirestore();
      const checkFlagged = async () => {
        const flaggedDoc = await getDoc(doc(db, 'flaggedUsers', user.uid));
        if (flaggedDoc.exists()) {
          toast({
            title: 'Account Flagged',
            description: 'Your account has been flagged for suspicious activity. Please contact support.',
            variant: 'destructive',
          });
          await invalidateSession();
        }
      };
      checkFlagged();
      interval = setInterval(checkFlagged, 5 * 60 * 1000); // Check every 5 minutes
    }
    return () => interval && clearInterval(interval);
  }, [user]);

  const createSessionCookie = async (idToken: string) => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  };

  const validatePayment = async (reference: string) => {
    try {
      // Verify payment with Paystack
      const verificationResult = await paystackService.verifyPayment(reference);
      
      if (!verificationResult.success) {
        throw new Error('Payment verification failed');
      }

      // Get the pending signup data
      const pendingSignupStr = localStorage.getItem('pending_signup');
      if (!pendingSignupStr) {
        throw new Error('No pending signup found');
      }

      const pendingSignup = JSON.parse(pendingSignupStr);
      const selectedTier = getMembershipTier(pendingSignup.membershipTier);

      // Validate payment amount against membership tier
      if (verificationResult.data.amount < selectedTier.securityFee * 100) { // Paystack amounts are in kobo/cents
        throw new Error('Payment amount does not match selected membership tier');
      }

      return true;
    } catch (error: any) {
      console.error('Payment validation error:', error.message);
      toast({
        title: "Payment Validation Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const initiateSignUp = async (email: string, password: string, additionalData = {}) => {
    try {
      const selectedTier = getMembershipTier(additionalData.membershipTier);
      
      // Initialize Paystack payment with proper amount
      const response = await paystackService.initializePayment(
        email,
        selectedTier.securityFee,
        {
          fullName: additionalData.fullName,
          phone: additionalData.phone,
          referralCode: additionalData.referralCode,
          membershipTier: additionalData.membershipTier,
          metadata: {
            securityFee: selectedTier.securityFee,
            refundableAmount: selectedTier.refundableAmount,
            administrationFee: selectedTier.administrationFee
          }
        }
      );

      // Store signup data with membership details
      localStorage.setItem('pending_signup', JSON.stringify({
        email,
        password,
        ...additionalData,
        membershipDetails: {
          tier: selectedTier.name,
          securityFee: selectedTier.securityFee,
          refundableAmount: selectedTier.refundableAmount,
          administrationFee: selectedTier.administrationFee
        }
      }));

      window.location.href = response.data.authorization_url;
    } catch (error: any) {
      console.error('Payment initialization error:', error.message);
      throw error;
    }
  };

  const completeSignUp = async (userData: any) => {
    try {
      // Validate payment status first
      const paymentValid = await validatePayment(userData.paymentReference);
      if (!paymentValid) {
        throw new Error('Payment validation failed');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const { user } = userCredential;

      // Send email verification immediately
      await sendEmailVerification(user);
      startEmailVerificationCheck(user);

      // Update user profile
      await updateProfile(user, {
        displayName: userData.fullName || null,
      });

      // Generate unique referral code
      const referralCode = await generateUniqueReferralCode(userData.fullName);

      // Create user document in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        fullName: userData.fullName || null,
        phone: userData.phone || null,
        email: userData.email,
        emailVerified: false,
        membershipTier: userData.membershipTier || 'Basic',
        kycStatus: 'none',
        paymentVerified: true,
        paymentReference: userData.paymentReference,
        paymentDetails: {
          securityFee: userData.membershipDetails?.securityFee,
          refundableAmount: userData.membershipDetails?.refundableAmount,
          administrationFee: userData.membershipDetails?.administrationFee,
          paidAt: new Date()
        },
        referralCode: referralCode,
        referralBy: null,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        profileCompleted: false
      });

      // Create wallet document with proper structure
      const walletDocRef = doc(db, "wallets", user.uid);
      await setDoc(walletDocRef, {
        mainBalance: 0,
        commissionBalance: 0,
        lockedBalance: userData.membershipDetails?.refundableAmount || 0,
        currency: 'ZAR',
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        transactions: []
      });

      // Handle referral if code exists
      if (userData.referralCode) {
        await processReferral(userData.referralCode, user.uid);
      }

      // Clear pending signup data
      localStorage.removeItem('pending_signup');

      toast({
        title: "Account Created Successfully",
        description: "Please check your email to verify your account.",
      });

      // Redirect to profile completion
      router.push('/dashboard/profile');

      return user;
    } catch (error: any) {
      console.error('Signup completion error:', error.message);
      throw error;
    }
  };

  const processReferral = async (referralCode: string, newUserId: string) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("referralCode", "==", referralCode));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const referrerDoc = querySnapshot.docs[0];
        const referrerData = referrerDoc.data();
        const referrerTier = getMembershipTier(referrerData.membershipTier);

        // Update new user's referral information
        await updateDoc(doc(db, "users", newUserId), {
          referralBy: referrerDoc.id
        });

        // Create referral record
        await addDoc(collection(db, "referrals"), {
          referrerId: referrerDoc.id,
          referredId: newUserId,
          status: 'active',
          commissionRate: referrerTier.commissionRate,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  };

  const generateUniqueReferralCode = async (name: string): Promise<string> => {
    const baseCode = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase();
    
    let referralCode = `${baseCode}${Math.floor(1000 + Math.random() * 9000)}`;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const existingUser = await getDocs(
        query(collection(db, "users"), where("referralCode", "==", referralCode))
      );

      if (existingUser.empty) {
        isUnique = true;
      } else {
        referralCode = `${baseCode}${Math.floor(1000 + Math.random() * 9000)}`;
        attempts++;
      }
    }

    return referralCode;
  };

  const startEmailVerificationCheck = (user: User) => {
    if (emailVerificationTimer) {
      clearTimeout(emailVerificationTimer);
    }

    const timer = setInterval(async () => {
      try {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(timer);
          await updateDoc(doc(db, "users", user.uid), {
            emailVerified: true
          });
          toast({
            title: "Email Verified",
            description: "Your email has been successfully verified.",
          });
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
        clearInterval(timer);
      }
    }, 10000); // Check every 10 seconds

    setEmailVerificationTimer(timer);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      await createSessionCookie(idToken);
      
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (userDoc.exists()) {
        await updateDoc(doc(db, "users", result.user.uid), {
          lastLoginAt: new Date(),
        });
      }

      return result.user;
    } catch (error: any) {
      console.error('Signin error:', error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await createSessionCookie(idToken);
      
      const { user } = result;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Create new user document for Google sign-in
        await setDoc(doc(db, "users", user.uid), {
          fullName: user.displayName,
          email: user.email,
          emailVerified: user.emailVerified,
          membershipTier: 'Basic',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        // Create wallet document
        await setDoc(doc(db, "wallets", user.uid), {
          balance: 0,
          pendingBalance: 0,
          currency: 'ZAR',
          createdAt: new Date(),
        });
      } else {
        // Update last login
        await updateDoc(doc(db, "users", user.uid), {
          lastLoginAt: new Date(),
        });
      }

      return user;
    } catch (error: any) {
      console.error('Google sign-in error:', error.message);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // Clear session cookie
      await fetch('/api/auth/session', { method: 'DELETE' });
      localStorage.removeItem(PERSISTENCE_KEY);
      router.push('/auth');
    } catch (error: any) {
      console.error('Signout error:', error.message);
      throw error;
    }
  };

  const sendPasswordResetLink = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error.message);
      throw error;
    }
  };

  const resetPassword = async (oobCode: string, newPassword: string) => {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast({
        title: "Password Reset",
        description: "Your password has been successfully reset.",
      });
      await invalidateSession();
    } catch (error: any) {
      console.error('Password reset confirmation error:', error.message);
      throw error;
    }
  };

  const verifyEmail = async (oobCode: string) => {
    try {
      await applyActionCode(auth, oobCode);
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          emailVerified: true,
        });
      }
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified.",
      });
    } catch (error: any) {
      console.error('Email verification error:', error.message);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date(),
      });

      if (data.fullName) {
        await updateProfile(user, {
          displayName: data.fullName,
        });
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Profile update error:', error.message);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in');
    try {
      await sendEmailVerification(user);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error: any) {
      console.error('Email verification resend error:', error.message);
      throw error;
    }
  };

  const checkEmailVerification = async () => {
    if (!user) return false;
    try {
      await user.reload();
      return user.emailVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  const value: AuthContextProps = {
    user,
    loading,
    validatePayment,
    initiateSignUp,
    completeSignUp,
    signIn,
    signInWithGoogle,
    signOutUser,
    sendPasswordResetLink,
    resetPassword,
    verifyEmail,
    updateUserProfile,
    resendVerificationEmail,
    checkEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
