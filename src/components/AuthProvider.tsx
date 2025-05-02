'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MEMBERSHIP_TIERS } from '@/lib/membership-tiers';
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
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  DocumentData 
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { paystackService } from '@/lib/paystack-service';
import { getMembershipTier } from '@/lib/membership-tiers';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;  // change signOutUser to signOut in interface
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<void>;
  verifyEmail: (oobCode: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
}

interface SignUpData {
  fullName: string;
  phone: string;
  referralCode?: string;
  membershipTier: 'Basic' | 'Ambassador' | 'VIP' | 'Business';
  paymentReference?: string;
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

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { isValid: false, error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long` };
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }
  return { isValid: true };
};

const EMAIL_VERIFICATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_VERIFICATION_ATTEMPTS = 12; // 1 hour total (12 * 5 minutes)

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
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [emailVerificationTimer, setEmailVerificationTimer] = useState<NodeJS.Timeout | null>(null);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();

  const startEmailVerificationCheck = () => {
    if (emailVerificationTimer) {
      clearInterval(emailVerificationTimer);
    }

    const timer = setInterval(async () => {
      if (!user || user.emailVerified || verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        clearInterval(timer);
        setEmailVerificationTimer(null);
        return;
      }

      try {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(timer);
          setEmailVerificationTimer(null);
          await updateDoc(doc(db, "users", user.uid), {
            emailVerified: true,
            updatedAt: new Date()
          });
          toast({
            title: "Email Verified",
            description: "Your email has been verified successfully.",
          });
        } else {
          setVerificationAttempts(prev => prev + 1);
          if (verificationAttempts >= MAX_VERIFICATION_ATTEMPTS - 1) {
            clearInterval(timer);
            setEmailVerificationTimer(null);
            toast({
              title: "Verification Timeout",
              description: "Please try verifying your email again or contact support.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Email verification check error:', error);
      }
    }, EMAIL_VERIFICATION_INTERVAL);

    setEmailVerificationTimer(timer);
  };

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
              await signOut(auth);
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

          setUser(user);

          // Start email verification check if needed
          if (!user.emailVerified) {
            startEmailVerificationCheck();
          }

          // Check for suspicious activity
          const flaggedDoc = await getDoc(doc(db, 'flaggedUsers', user.uid));
          if (flaggedDoc.exists()) {
            await invalidateSession();
            toast({
              title: "Account Flagged",
              description: "Your account has been flagged for suspicious activity. Please contact support.",
              variant: "destructive",
            });
            return;
          }
        } catch (error) {
          console.error('Session refresh error:', error);
          await invalidateSession();
        }
      } else {
        // Clear verification timer if exists
        if (emailVerificationTimer) {
          clearInterval(emailVerificationTimer);
          setEmailVerificationTimer(null);
        }
        setVerificationAttempts(0);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (emailVerificationTimer) {
        clearInterval(emailVerificationTimer);
      }
    };
  }, [auth, db, router, toast, emailVerificationTimer]);

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

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
      }

      // Validate membership tier
      const tierConfig = MEMBERSHIP_TIERS[userData.membershipTier];
      if (!tierConfig) {
        throw new Error('Invalid membership tier selected');
      }

      // Enforce Paystack payment before user creation
      if (!userData.paymentReference) {
        throw new Error('Payment reference is required');
      }
      const paymentValid = await validatePayment(userData.paymentReference);
      if (!paymentValid) {
        throw new Error('Payment validation failed');
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document with membership details
      await setDoc(doc(db, "users", user.uid), {
        fullName: userData.fullName,
        email: user.email,
        phone: userData.phone,
        membershipTier: userData.membershipTier,
        membershipDetails: {
          securityFee: tierConfig.securityFee,
          refundableAmount: tierConfig.refundable,
          adminFee: tierConfig.adminFee,
          loanLimit: tierConfig.loanLimit,
          investmentLimit: tierConfig.investmentLimit,
          commission: tierConfig.commission
        },
        referralCode: userData.referralCode || "",
        emailVerified: false,
        kycStatus: 'none',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      // Initialize wallet with locked security deposit
      await setDoc(doc(db, "wallets", user.uid), {
        availableBalance: 0,
        lockedBalance: tierConfig.refundable,
        totalBalance: tierConfig.refundable,
        lastUpdated: new Date()
      });

      await sendEmailVerification(user);

      // Instead of signing out, redirect to profile page
      toast({
        title: "Account Created",
        description: "Please verify your email to activate your account.",
      });

      router.push('/profile');
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before logging in.');
      }

      await updateDoc(doc(db, "users", user.uid), {
        lastLoginAt: new Date(),
      });

      // Create session
      const idToken = await user.getIdToken();
      await createSessionCookie(idToken);
      localStorage.setItem(PERSISTENCE_KEY, JSON.stringify({
        uid: user.uid,
        timestamp: Date.now()
      }));

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for reset instructions.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const resetPassword = async (oobCode: string, newPassword: string) => {
    try {
      // Validate password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
      }

      await confirmPasswordReset(auth, oobCode, newPassword);
      toast({
        title: "Password Reset Success",
        description: "Your password has been successfully reset.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
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
      console.error('Email verification error:', error);
      throw error;
    }
  };

  // Add missing functions
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...data,
        updatedAt: new Date()
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
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
      console.error('Email verification resend error:', error);
      throw error;
    }
  };

  const checkEmailVerification = async () => {
    if (!user) return false;
    try {
      await user.reload();
      return user.emailVerified;
    } catch (error) {
      console.error('Email verification check error:', error);
      return false;
    }
  };

  // Implement signOut for context
  const signOutUser = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem(PERSISTENCE_KEY);
      setUser(null);
      router.push('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Return context with all required functions
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut: signOutUser,
      sendPasswordReset,
      resetPassword,
      verifyEmail,
      updateUserProfile,
      resendVerificationEmail,
      checkEmailVerification,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
