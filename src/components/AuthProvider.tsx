'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  reload,
  sendEmailVerification,
  MultiFactorError,
  RecaptchaVerifier,
  UserCredential
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
// Import the auth logger and MFA service
import { authLogger, AuthEventType } from '@/lib/auth-logger';
import { mfaService } from '@/lib/mfa-service';

// paystackService and membership-tiers are no longer directly used in AuthProvider's core auth logic

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  // Removed signUp as it's handled server-side via API route
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<void>;
  verifyEmail: (oobCode: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>; // Still useful for manual checks
  
  // MFA related functions
  enrollMfa: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier, displayName?: string) => Promise<string>;
  verifyMfaCode: (verificationId: string, verificationCode: string) => Promise<boolean>;
  isMfaEnabled: () => Promise<boolean>;
  getMfaPhone: () => Promise<string | null>;
  disableMfa: (factorUid: string) => Promise<boolean>;
}

// Removed SignUpData interface as signup is handled server-side

interface UserProfile {
  fullName: string;
  phone: string;
  membershipTier: 'Basic' | 'Ambassador' | 'Business';
  emailVerified: boolean;
  referralCode?: string;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  kycSubmittedAt?: Date;
  kycVerifiedAt?: Date;
  // Add other profile fields as needed
}

// Removed client-side password validation (now server-side authoritative)
// const PASSWORD_REQUIREMENTS = { ... };
// const validatePassword = (password: string) => { ... };

// Removed email verification polling constants and logic
// const EMAIL_VERIFICATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
// const MAX_VERIFICATION_ATTEMPTS = 12; // 1 hour total (12 * 5 minutes)

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
  // Removed email verification polling states
  // const [verificationAttempts, setVerificationAttempts] = useState(0);
  // const [emailVerificationTimer, setEmailVerificationTimer] = useState<NodeJS.Timeout | null>(null);

  const auth = getAuth(app);
  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();

  // Removed startEmailVerificationCheck function

  useEffect(() => {
    // Firebase Auth handles session persistence by default
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check for account flagging using a real-time listener
        const userDocRef = doc(db, 'flaggedUsers', currentUser.uid);
        const unsubscribeFlagged = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            toast({
              title: 'Account Flagged',
              description: 'Your account has been flagged for suspicious activity. Please contact support.',
              variant: 'destructive',
              duration: 10000, // Keep toast visible longer
            });
            // Invalidate session locally if flagged
            signOutUser(); // Call the internal sign out function
          } else {
             // User is not flagged or flagging was removed
             // You might want to dismiss a previous flag toast if implemented
          }
        }, (error) => {
             console.error('Error listening to flagged user status:', error);
             // Handle potential errors with listener (e.g., permission denied)
             // Maybe sign out user or show a generic error
             toast({
                title: 'Security Alert',
                description: 'Could not retrieve account status. Please log in again.',
                variant: 'destructive',
                duration: 10000,
            });
            signOutUser();
        });

         // Update last login time whenever auth state changes and user is present
         // Use a try-catch block to prevent auth state observer from breaking on Firestore errors
         try {
            const userProfileRef = doc(db, "users", currentUser.uid);
            // Check if the user document exists before attempting to update
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                await updateDoc(userProfileRef, {
                    lastLoginAt: new Date(),
                    // Consider updating emailVerified status here based on currentUser.emailVerified
                    emailVerified: currentUser.emailVerified, // Ensure Firestore reflects Auth status
                });
            } else {
                console.warn(`User document not found for UID: ${currentUser.uid}`);
                // Potentially handle case where auth user exists but no Firestore doc (e.g., incomplete signup)
                // You might want to sign out the user and redirect to signup or an error page
                 toast({
                    title: "Profile Missing",
                    description: "Your user profile could not be loaded. Please contact support.",
                    variant: "destructive",
                    duration: 10000,
                 });
                 signOutUser();
            }
         } catch (error) {
             console.error('Error updating last login time or email verified status:', error);
             // Decide how to handle Firestore write errors here (e.g., log, show toast, don't block login)
         }

        // Log the auth event
        authLogger.logEvent(AuthEventType.LOGIN, {
          uid: currentUser.uid,
          email: currentUser.email,
          providerData: currentUser.providerData,
        });

        // Set loading to false after all initial checks/listeners are set up
        setLoading(false);

        return () => {
            // Cleanup the flagged user listener
            unsubscribeFlagged();
        };

      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
        // Ensure no pending timers or listeners are active for a signed-out user
        // (The flagged listener cleanup is handled in the 'if (currentUser)' block return)
      }
    });

    return () => {
      // Cleanup the auth state observer
      unsubscribeAuth();
      // The flagged listener cleanup is handled inside the onAuthStateChanged effect
    };
  }, [auth, db, toast, router]); // Added db, toast, router to dependencies

  // Renamed to signOut to match interface and removed custom session invalidation
  const signOutUser = async () => {
    try {
      await signOut(auth);
      // No need to clear custom session in localStorage or call /api/auth/session DELETE
      // localStorage.removeItem(PERSISTENCE_KEY);
      // await fetch('/api/auth/session', { method: 'DELETE' });

      // Firebase Auth state change listener will handle setting user to null and redirect
      // setUser(null);
      // router.push('/auth'); // This redirect should happen in onAuthStateChanged or a dedicated handler
      toast({
         title: "Signed Out",
         description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
         title: "Sign Out Failed",
         description: error.message || 'Could not sign out.',
         variant: "destructive",
      });
      throw error; // Re-throw error to calling code
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true); // Indicate loading during sign-in process
    try {
      // Log the sign-in attempt (without including the password)
      await authLogger.logEvent(
        AuthEventType.SIGN_IN_SUCCESS,
        null, // No userId yet
        { email }
      );
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified 
      if (!userCredential.user.emailVerified) {
        // Sign out the user immediately if email is not verified
        await signOut(auth);
        setLoading(false);
        
        // Log the failed verification
        await authLogger.logEvent(
          AuthEventType.AUTH_ERROR,
          userCredential.user.uid,
          { 
            email,
            reason: 'email_not_verified',
            errorType: 'email_verification_required' 
          }
        );
        
        // Generate a new verification email before showing error
        try {
          await sendEmailVerification(userCredential.user);
          console.log('New verification email sent');
          
          // Log the verification email sending
          await authLogger.logEvent(
            AuthEventType.EMAIL_VERIFICATION_SENT,
            userCredential.user.uid,
            { email }
          );
          
          throw new Error('Please verify your email before logging in. A new verification link has been sent.');
        } catch (verificationError) {
          console.error('Failed to send verification email:', verificationError);
          throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
        }
      }
      
      // If email is verified, user will be set by onAuthStateChanged
      // Navigation will be handled by onAuthStateChanged or directly by the component
      
      // setLoading(false) will be handled by onAuthStateChanged

    } catch (error: any) {
      setLoading(false); // Stop loading on error
      console.error('Sign in error:', error);
      
      // Check if this is an MFA error that needs to be handled
      if (error.code === 'auth/multi-factor-auth-required') {
        // This is handled at the page level with MfaVerification component
        // The component will use mfaService to complete the verification
        
        // Log the MFA challenge
        await authLogger.logEvent(
          AuthEventType.MFA_VERIFICATION_SUCCESS,
          null,
          { 
            email,
            step: 'mfa_required'
          }
        );
        
        // Return the error so it can be handled by the auth page
        throw error;
      }
      
      // Log other sign-in failures
      await authLogger.logEvent(
        AuthEventType.SIGN_IN_FAILURE,
        null, // No user ID in case of failure
        { 
          email, 
          errorMessage: error.message,
          errorCode: error.code || 'unknown'
        }
      );
      
      // Re-throw the error so the calling component (e.g., auth/page.tsx) can handle displaying the toast
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      
      // Log the password reset request
      await authLogger.logEvent(
        AuthEventType.PASSWORD_RESET_REQUEST,
        null, // No user ID at this point
        { email }
      );
      
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for reset instructions.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Log the password reset failure
      await authLogger.logEvent(
        AuthEventType.AUTH_ERROR,
        null, // No user ID at this point
        { 
          email,
          action: 'password_reset_request',
          errorMessage: error.message,
          errorCode: error.code || 'unknown'
        }
      );
      
      // Re-throw error for calling component to handle
      throw error;
    }
  };

  const resetPassword = async (oobCode: string, newPassword: string) => {
    // Client-side validation is removed from AuthProvider; rely on server-side or client component
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      // Log the password reset completion
      await authLogger.logEvent(
        AuthEventType.PASSWORD_RESET_COMPLETE,
        null, // We don't have the user ID at this point
        { 
          success: true,
          // Don't include the new password in logs
        }
      );
      
      toast({
        title: "Password Reset Success",
        description: "Your password has been successfully reset.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Log the password reset failure
      await authLogger.logEvent(
        AuthEventType.AUTH_ERROR,
        null,
        { 
          action: 'password_reset_complete',
          errorMessage: error.message,
          errorCode: error.code || 'unknown'
        }
      );
      
      // Re-throw error for calling component to handle
      throw error;
    }
  };

  const verifyEmail = async (oobCode: string) => {
    try {
      await applyActionCode(auth, oobCode);
      
      // Log the email verification
      await authLogger.logEvent(
        AuthEventType.EMAIL_VERIFIED,
        user?.uid || null,
        { 
          email: user?.email || null
        }
      );
      
      // emailVerified status will be updated by onAuthStateChanged listener upon reload
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified.",
      });
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      // Log the email verification failure
      await authLogger.logEvent(
        AuthEventType.AUTH_ERROR,
        user?.uid || null,
        { 
          action: 'verify_email',
          email: user?.email || null,
          errorMessage: error.message,
          errorCode: error.code || 'unknown'
        }
      );
      
      // Re-throw error for calling component to handle
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
       toast({
          title: "Update Failed",
          description: "No user logged in.",
          variant: "destructive",
       });
       throw new Error('No user logged in');
    }
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
       toast({
          title: "Update Failed",
          description: error.message || 'Could not update profile.',
          variant: "destructive",
       });
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (!user) {
        toast({
            title: "Failed to Send",
            description: "No user logged in.",
            variant: "destructive",
         });
        throw new Error('No user logged in');
    }
    try {
      // Firebase client SDK sendEmailVerification uses the user's current state
      await sendEmailVerification(user);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error: any) {
      console.error('Email verification resend error:', error);
       toast({
          title: "Failed to Send",
          description: error.message || 'Could not resend verification email.',
          variant: "destructive",
       });
      throw error;
    }
  };

  const checkEmailVerification = async () => {
    if (!user) return false;
    try {
      // Force a reload to get the latest emailVerified status
      await reload(user);
      setUser(auth.currentUser); // Update user state in provider after reload
      return auth.currentUser?.emailVerified || false;
    } catch (error) {
      console.error('Email verification check error:', error);
      toast({
         title: "Verification Check Failed",
         description: error.message || 'Could not check verification status.',
         variant: "destructive",
      });
      return false;
    }
  };

  // MFA related functions
  const enrollMfa = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier, displayName?: string) => {
    if (!user) {
      toast({
        title: "MFA Enrollment Failed",
        description: "You must be logged in to enable two-factor authentication.",
        variant: "destructive",
      });
      throw new Error("Not authenticated");
    }

    try {
      // Start the enrollment process
      const verificationId = await mfaService.startEnrollment(phoneNumber, recaptchaVerifier);
      
      return verificationId;
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      toast({
        title: "MFA Enrollment Failed",
        description: error.message || "Failed to start MFA enrollment.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const verifyMfaCode = async (verificationId: string, verificationCode: string) => {
    if (!user) {
      toast({
        title: "MFA Verification Failed",
        description: "You must be logged in to complete two-factor authentication setup.",
        variant: "destructive",
      });
      throw new Error("Not authenticated");
    }

    try {
      // Complete the enrollment with the verification code
      await mfaService.completeEnrollment(verificationId, verificationCode);
      
      toast({
        title: "MFA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });
      
      return true;
    } catch (error: any) {
      console.error('MFA verification error:', error);
      toast({
        title: "MFA Verification Failed",
        description: error.message || "Failed to verify MFA code.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const isMfaEnabled = async () => {
    try {
      const enrolledFactors = await mfaService.listEnrolledFactors();
      return enrolledFactors.length > 0;
    } catch (error) {
      console.error('Error checking MFA status:', error);
      return false;
    }
  };
  
  const getMfaPhone = async () => {
    try {
      const enrolledFactors = await mfaService.listEnrolledFactors();
      if (enrolledFactors.length > 0) {
        // Using displayName since the phone number might not be directly accessible
        return enrolledFactors[0].displayName || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting MFA phone:', error);
      return null;
    }
  };
  
  const disableMfa = async (factorUid: string) => {
    if (!user) {
      toast({
        title: "MFA Disable Failed",
        description: "You must be logged in to disable two-factor authentication.",
        variant: "destructive",
      });
      throw new Error("Not authenticated");
    }

    try {
      await mfaService.unenrollFactor(factorUid);
      
      toast({
        title: "MFA Disabled",
        description: "Two-factor authentication has been successfully disabled for your account.",
      });
      
      return true;
    } catch (error: any) {
      console.error('MFA disable error:', error);
      toast({
        title: "MFA Disable Failed",
        description: error.message || "Failed to disable MFA.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Use the renamed signOutUser internally
  const signOut = signOutUser; // Assign internal function to the exported name

  // Removed validatePayment function

  // Return context with all required functions
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      // Removed signUp from context value
      signIn,
      signOut,
      sendPasswordReset,
      resetPassword,
      verifyEmail,
      updateUserProfile,
      resendVerificationEmail,
      checkEmailVerification,
      enrollMfa,
      verifyMfaCode,
      isMfaEnabled,
      getMfaPhone,
      disableMfa,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
